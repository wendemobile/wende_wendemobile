import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { TelegramService } from './telegram.service';

export interface StockAdjustmentInput {
  itemId: string;
  locationId: string;
  quantity: number;
  reason: string;
  userId?: string;
}

export interface StockDeductionResult {
  success: boolean;
  deductedLocations: { locationId: string; amount: number }[];
  error?: string;
}

// Error codes for stock operations
export const StockErrorCodes = {
  VERSION_CONFLICT: 'STOCK_VERSION_CONFLICT',
  INSUFFICIENT_STOCK: 'STOCK_INSUFFICIENT',
  NEGATIVE_STOCK: 'STOCK_NEGATIVE',
  MAX_RETRIES: 'STOCK_MAX_RETRIES',
} as const;

export class StockService {
  /**
   * Get available stock for an item across specified locations
   */
  static async getAvailableStock(itemId: string, locationIds?: string[]): Promise<number> {
    const where: Prisma.StockWhereInput = { itemId };
    if (locationIds && locationIds.length > 0) {
      where.locationId = { in: locationIds };
    }

    const stocks = await prisma.stock.findMany({ where });
    return stocks.reduce((sum, s) => sum + Number(s.qty) - Number(s.reservedQty), 0);
  }

  /**
   * Get stock breakdown by location for an item
   */
  static async getStockByLocation(itemId: string) {
    const stocks = await prisma.stock.findMany({
      where: { itemId },
      include: { location: true },
    });

    return stocks.map(s => ({
      locationId: s.locationId,
      locationName: s.location.name,
      locationType: s.location.type,
      quantity: Number(s.qty),
      reservedQuantity: Number(s.reservedQty),
      availableQuantity: Number(s.qty) - Number(s.reservedQty),
    }));
  }

  /**
   * Deduct stock from prioritized locations atomically with optimistic locking
   * Priority: sale location first, then showroom, store, basement, warehouse
   * Uses version checks to prevent race conditions and retries on conflicts
   */
  static async deductStock(
    itemId: string,
    quantity: number,
    locationPriority: string[],
    tx?: Prisma.TransactionClient
  ): Promise<StockDeductionResult> {
    const result = await this.deductStockWithRetry(itemId, quantity, locationPriority, 3, tx);
    if (!result.success) {
      throw new Error(result.error || 'Stock deduction failed');
    }
    return result;
  }

  /**
   * Deduct stock with optimistic locking and retry mechanism
   * Prevents overselling in concurrent scenarios
   */
  static async deductStockWithRetry(
    itemId: string,
    quantity: number,
    locationPriority: string[],
    maxRetries: number = 3,
    externalTx?: Prisma.TransactionClient
  ): Promise<StockDeductionResult> {
    // Validate quantity
    if (quantity <= 0) {
      return { success: false, deductedLocations: [], error: 'Quantity must be positive' };
    }

    // If external transaction is provided, use it directly without retries (retries handled by caller or impossible inside tx)
    if (externalTx) {
      try {
        return await this.executeDeduction(externalTx, itemId, quantity, locationPriority);
      } catch (error: any) {
        return {
          success: false,
          deductedLocations: [],
          error: error.message || 'Stock deduction failed in transaction'
        };
      }
    }

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          return this.executeDeduction(tx, itemId, quantity, locationPriority);
        }, {
          timeout: 10000, // 10 second timeout
        });
        return result;
      } catch (error: any) {
        const errorMessage = error.message || '';

        // Retry on version conflict
        if (errorMessage === StockErrorCodes.VERSION_CONFLICT) {
          if (attempt < maxRetries - 1) {
            // Exponential backoff: 50ms, 100ms, 150ms
            await new Promise(r => setTimeout(r, 50 * (attempt + 1)));
            continue;
          } else {
            return {
              success: false,
              deductedLocations: [],
              error: 'Max retries exceeded due to concurrent modifications',
            };
          }
        }

        // Parse insufficient stock error
        if (errorMessage.startsWith(StockErrorCodes.INSUFFICIENT_STOCK)) {
          const shortage = errorMessage.split(':')[1] || 'unknown';
          return {
            success: false,
            deductedLocations: [],
            error: `Insufficient stock. Short by ${shortage} units.`,
          };
        }

        // Negative stock error
        if (errorMessage === StockErrorCodes.NEGATIVE_STOCK) {
          return {
            success: false,
            deductedLocations: [],
            error: 'Operation would result in negative stock',
          };
        }

        // Other errors
        return {
          success: false,
          deductedLocations: [],
          error: errorMessage || 'Stock deduction failed',
        };
      }
    }

    return {
      success: false,
      deductedLocations: [],
      error: 'Stock deduction failed',
    };
  }

  /**
   * Internal helper to execute deduction logic within a transaction
   */
  private static async executeDeduction(
    tx: Prisma.TransactionClient,
    itemId: string,
    quantity: number,
    locationPriority: string[]
  ): Promise<StockDeductionResult> {
    let remainingQty = quantity;
    const deducted: { locationId: string; amount: number }[] = [];

    for (const locationId of locationPriority) {
      if (remainingQty <= 0) break;

      const stock = await tx.stock.findUnique({
        where: { itemId_locationId: { itemId, locationId } },
      });

      if (!stock) continue;

      const available = Number(stock.qty) - Number(stock.reservedQty);
      if (available <= 0) continue;

      const deductAmount = Math.min(available, remainingQty);

      // Validate deduction won't result in negative stock
      if (Number(stock.qty) - deductAmount < 0) {
        throw new Error(StockErrorCodes.NEGATIVE_STOCK);
      }

      // Optimistic lock: update only if version matches
      const updated = await tx.stock.updateMany({
        where: {
          id: stock.id,
          version: stock.version, // Version check for optimistic locking
        },
        data: {
          qty: { decrement: deductAmount },
          version: { increment: 1 },
        },
      });

      // If no rows updated, version conflict occurred
      if (updated.count === 0) {
        throw new Error(StockErrorCodes.VERSION_CONFLICT);
      }

      deducted.push({ locationId, amount: deductAmount });
      remainingQty -= deductAmount;
    }

    if (remainingQty > 0) {
      throw new Error(`${StockErrorCodes.INSUFFICIENT_STOCK}:${remainingQty}`);
    }

    return { success: true, deductedLocations: deducted };
  }

  /**
   * Add stock to a location
   */
  static async addStock(
    itemId: string,
    locationId: string,
    quantity: number,
    userId?: string
  ): Promise<void> {
    // Check if location is active
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location || !location.isActive) {
      throw new Error('Cannot add stock to inactive location');
    }

    await prisma.$transaction(async (tx) => {
      const stock = await tx.stock.upsert({
        where: { itemId_locationId: { itemId, locationId } },
        update: {
          qty: { increment: quantity },
          version: { increment: 1 },
        },
        create: {
          itemId,
          locationId,
          qty: quantity,
          reservedQty: 0,
        },
        include: { item: true, location: true },
      });

      // Log the addition
      await tx.auditLog.create({
        data: {
          action: 'STOCK_ADDITION',
          entityType: 'Stock',
          entityId: stock.id,
          userId: userId || undefined,
          newValues: {
            qty: Number(stock.qty),
            itemId,
            locationId,
            itemName: stock.item.name,
            itemSku: stock.item.sku,
            locationName: stock.location.name,
            adjustmentAmount: quantity,
          },
        },
      });
      
      TelegramService.sendMessage(
        `🟢 <b>Stock Added</b>\nItem: ${stock.item.name}\nLocation: ${stock.location.name}\nQuantity Added: +${quantity}\nNew Total: ${stock.qty}`
      ).catch(err => console.error('Telegram notification error:', err));
    });
  }

  /**
   * Reserve stock for a pending operation (like transfer)
   */
  static async reserveStock(
    itemId: string,
    locationId: string,
    quantity: number
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const stock = await tx.stock.findUnique({
        where: { itemId_locationId: { itemId, locationId } },
      });

      if (!stock) {
        throw new Error('Stock record not found');
      }

      const available = Number(stock.qty) - Number(stock.reservedQty);
      if (available < quantity) {
        throw new Error(`Insufficient stock. Available: ${available}, Requested: ${quantity}`);
      }

      await tx.stock.update({
        where: { id: stock.id },
        data: {
          reservedQty: { increment: quantity },
          version: { increment: 1 },
        },
      });
    });
  }

  /**
   * Release reserved stock
   */
  static async releaseReservedStock(
    itemId: string,
    locationId: string,
    quantity: number
  ): Promise<void> {
    await prisma.stock.update({
      where: { itemId_locationId: { itemId, locationId } },
      data: {
        reservedQty: { decrement: quantity },
        version: { increment: 1 },
      },
    });
  }

  /**
   * Adjust stock (for inventory corrections)
   */
  static async adjustStock(input: StockAdjustmentInput): Promise<void> {
    const { itemId, locationId, quantity, reason, userId } = input;

    if (!reason || reason.trim() === '') {
      throw new Error('Reason is required for stock adjustment');
    }

    // Check if location is active for positive adjustments
    if (quantity > 0) {
      const location = await prisma.location.findUnique({
        where: { id: locationId },
      });

      if (!location || !location.isActive) {
        throw new Error('Cannot add stock to inactive location');
      }
    }

    await prisma.$transaction(async (tx) => {
      const stock = await tx.stock.findUnique({
        where: { itemId_locationId: { itemId, locationId } },
        include: { item: true, location: true },
      });

      const oldQty = stock ? Number(stock.qty) : 0;
      const newQty = oldQty + quantity;

      if (quantity < 0 && newQty < 0) {
        throw new Error('Cannot reduce stock below zero');
      }

      let stockId: string;

      if (stock) {
        await tx.stock.update({
          where: { id: stock.id },
          data: {
            qty: { increment: quantity },
            version: { increment: 1 },
          },
        });
        stockId = stock.id;
      } else if (quantity > 0) {
        const newStock = await tx.stock.create({
          data: {
            itemId,
            locationId,
            qty: quantity,
            reservedQty: 0,
          },
        });
        stockId = newStock.id;
      } else {
        throw new Error('Cannot create stock with negative quantity');
      }

      // Get item and location details for the audit log
      const item = stock?.item || await tx.item.findUnique({ where: { id: itemId } });
      const location = stock?.location || await tx.location.findUnique({ where: { id: locationId } });

      // Log the adjustment with proper old and new values for reporting
      await tx.auditLog.create({
        data: {
          action: 'STOCK_ADJUSTMENT',
          entityType: 'Stock',
          entityId: stockId,
          userId: userId || undefined,
          oldValues: {
            qty: oldQty,
            itemId,
            locationId,
            itemName: item?.name,
            itemSku: item?.sku,
            locationName: location?.name,
          },
          newValues: {
            qty: newQty,
            itemId,
            locationId,
            reason,
            adjustmentAmount: quantity,
            itemName: item?.name,
            itemSku: item?.sku,
            locationName: location?.name,
          },
        },
      });

      const emoji = quantity > 0 ? '🟢' : '🔴';
      TelegramService.sendMessage(
        `${emoji} <b>Stock Adjusted</b>\nItem: ${item?.name}\nLocation: ${location?.name}\nAdjustment: ${quantity > 0 ? '+' : ''}${quantity}\nNew Total: ${newQty}\nReason: ${reason}`
      ).catch(err => console.error('Telegram notification error:', err));
    });
  }

  /**
   * Transfer stock between locations
   */
  static async transferStock(
    itemId: string,
    fromLocationId: string,
    toLocationId: string,
    quantity: number,
    userId?: string
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Deduct from source
      const sourceStock = await tx.stock.findUnique({
        where: { itemId_locationId: { itemId, locationId: fromLocationId } },
        include: { item: true, location: true },
      });

      if (!sourceStock || Number(sourceStock.qty) - Number(sourceStock.reservedQty) < quantity) {
        throw new Error('Insufficient stock at source location');
      }

      await tx.stock.update({
        where: { id: sourceStock.id },
        data: {
          qty: { decrement: quantity },
          version: { increment: 1 },
        },
      });

      // Add to destination
      const destStock = await tx.stock.upsert({
        where: { itemId_locationId: { itemId, locationId: toLocationId } },
        update: {
          qty: { increment: quantity },
          version: { increment: 1 },
        },
        create: {
          itemId,
          locationId: toLocationId,
          qty: quantity,
          reservedQty: 0,
        },
        include: { location: true },
      });

      // Log the transfer
      await tx.auditLog.create({
        data: {
          action: 'STOCK_TRANSFER',
          entityType: 'Stock',
          entityId: sourceStock.id,
          userId: userId || undefined,
          oldValues: {
            fromLocationId,
            fromLocationName: sourceStock.location.name,
            qty: Number(sourceStock.qty),
          },
          newValues: {
            toLocationId,
            toLocationName: destStock.location.name,
            qty: quantity,
            itemId,
            itemName: sourceStock.item.name,
            itemSku: sourceStock.item.sku,
          },
        },
      });
      
      TelegramService.sendMessage(
        `📦 <b>Stock Transferred</b>\nItem: ${sourceStock.item.name}\nQuantity: ${quantity}\nFrom: ${sourceStock.location.name}\nTo: ${destStock.location.name}`
      ).catch(err => console.error('Telegram notification error:', err));
    });
  }

  /**
   * Get stock by location
   */
  static async getStockByLocationId(locationId: string) {
    return prisma.stock.findMany({
      where: { locationId },
      include: {
        item: true,
        location: true,
      },
    });
  }

  /**
   * Get low stock items
   */
  static async getLowStockItems() {
    const items = await prisma.item.findMany({
      where: { isActive: true },
      include: {
        stocks: true,
      },
    });

    return items.filter(item => {
      const totalStock = item.stocks.reduce(
        (sum, s) => sum + Number(s.qty) - Number(s.reservedQty),
        0
      );
      return totalStock <= Number(item.minStock);
    });
  }
  /**
   * Get stock with flexible filters
   */
  static async getStock(filters: { itemId?: string; locationId?: string }) {
    const where: Prisma.StockWhereInput = {};
    if (filters.itemId) where.itemId = filters.itemId;
    if (filters.locationId) where.locationId = filters.locationId;

    return prisma.stock.findMany({
      where,
      include: {
        item: true,
        location: true,
      },
    });
  }
}

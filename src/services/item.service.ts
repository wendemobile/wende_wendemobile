import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { generateBarcode } from '@/lib/utils';
import { TelegramService } from './telegram.service';

export interface CreateItemInput {
  sku: string;
  name: string;
  brand?: string;
  itemType?: string;
  unitOfMeasure?: string;
  unitPrice: number;
  costPrice: number;
  category?: string;
  subcategory?: string;
  barcode?: string;
  minStock?: number;
  initialStock?: number;
  locationId?: string;
  specifications?: Record<string, any>;
  supplierId?: string | null;
}

export interface UpdateItemInput {
  sku?: string;
  barcode?: string;
  name?: string;
  brand?: string;
  itemType?: string;
  unitOfMeasure?: string;
  unitPrice?: number;
  costPrice?: number;
  category?: string;
  subcategory?: string;
  minStock?: number;
  specifications?: Record<string, any>;
  supplierId?: string | null;
  vendorId?: string | null;
  isActive?: boolean;
}

export interface ItemSearchParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  brand?: string;
  supplierId?: string;
  locationId?: string;
  isActive?: boolean;
  lowStock?: boolean;
  stockStatus?: 'low' | 'out' | 'normal'; // Filter by stock status
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ItemService {
  /**
   * Create a new item
   */
  static async createItem(input: CreateItemInput, userId?: string) {
    // Generate barcode if not provided
    let barcode = input.barcode;
    let barcodeGenerated = false;

    if (!barcode) {
      barcode = generateBarcode();
      barcodeGenerated = true;

      // Ensure uniqueness
      let attempts = 0;
      while (attempts < 10) {
        const existing = await prisma.item.findUnique({ where: { barcode } });
        if (!existing) break;
        barcode = generateBarcode();
        attempts++;
      }
    }

    // Use transaction to create item and initial stock together
    return prisma.$transaction(async (tx) => {
      const item = await tx.item.create({
        data: {
          sku: input.sku,
          name: input.name,
          brand: input.brand,
          itemType: input.itemType,
          unitOfMeasure: input.unitOfMeasure || 'PIECE',
          unitPrice: input.unitPrice,
          costPrice: input.costPrice,
          category: input.category,
          subcategory: input.subcategory,
          barcode,
          barcodeGenerated,
          minStock: input.minStock || 0,
          specifications: input.specifications ? JSON.parse(JSON.stringify(input.specifications)) : undefined,
          supplierId: input.supplierId,
          vendorId: input.supplierId,
        },
      });

      // Create initial stock if provided
      if (input.initialStock && input.initialStock > 0 && input.locationId) {
        const initialStockQty = Number(input.initialStock);
        const stock = await tx.stock.create({
          data: {
            itemId: item.id,
            locationId: input.locationId,
            qty: initialStockQty,
            reservedQty: 0,
          },
          include: { location: true },
        });

        // Log the initial stock addition for the ledger report
        await tx.auditLog.create({
          data: {
            action: 'STOCK_ADDITION',
            entityType: 'Stock',
            entityId: stock.id,
            userId: userId || undefined,
            newValues: {
              qty: initialStockQty,
              itemId: item.id,
              locationId: input.locationId,
              itemName: item.name,
              itemSku: item.sku,
              locationName: stock.location.name,
              adjustmentAmount: initialStockQty,
              reason: 'Initial Stock',
            },
          },
        });
      }

      // Create audit log for item creation
      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entityType: 'Item',
          entityId: item.id,
          userId: userId || undefined,
          oldValues: Prisma.JsonNull,
          newValues: {
            name: item.name,
            sku: item.sku,
            unitPrice: Number(item.unitPrice),
            costPrice: Number(item.costPrice),
            category: item.category,
            brand: item.brand,
            barcode: item.barcode,
            minStock: item.minStock,
            initialStock: input.initialStock || 0,
          },
        },
      });

      // Return item with stocks and image
      const createdItem = await tx.item.findUnique({
        where: { id: item.id },
        include: {
          supplier: true,
          stocks: {
            include: { location: true },
          },
          image: true,
        },
      });

      if (createdItem) {
        TelegramService.sendMessage(
          `🟢 <b>New Product Added</b>\nName: ${createdItem.name}\nSKU: <code>${createdItem.sku}</code>\nPrice: $${createdItem.unitPrice}`
        ).catch(err => console.error('Telegram notification error:', err));
      }

      return createdItem;
    });
  }

  /**
   * Update an item
   */
  static async updateItem(id: string, input: UpdateItemInput, userId?: string) {
    // Fetch old item for audit log comparison
    const oldItem = await prisma.item.findUnique({ where: { id } });

    const updateData: any = { ...input };
    if (input.supplierId !== undefined) {
      updateData.vendorId = input.supplierId;
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data: updateData,
      include: {
        supplier: true,
        stocks: {
          include: { location: true },
        },
        image: true,
      },
    });

    // Create audit log for item update
    if (oldItem) {
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entityType: 'Item',
          entityId: id,
          userId: userId || undefined,
          oldValues: {
            name: oldItem.name,
            sku: oldItem.sku,
            unitPrice: Number(oldItem.unitPrice),
            costPrice: Number(oldItem.costPrice),
            category: oldItem.category,
            brand: oldItem.brand,
            minStock: oldItem.minStock,
            isActive: oldItem.isActive,
          },
          newValues: {
            name: updatedItem.name,
            sku: updatedItem.sku,
            unitPrice: Number(updatedItem.unitPrice),
            costPrice: Number(updatedItem.costPrice),
            category: updatedItem.category,
            brand: updatedItem.brand,
            minStock: updatedItem.minStock,
            isActive: updatedItem.isActive,
          },
        },
      });
    }

    return updatedItem;
  }

  /**
   * Get item by ID
   */
  static async getItemById(id: string) {
    return prisma.item.findUnique({
      where: { id },
      include: {
        supplier: true,
        stocks: {
          include: { location: true },
        },
        image: true,
      },
    });
  }

  /**
   * Get item by SKU
   */
  static async getItemBySku(sku: string) {
    return prisma.item.findUnique({
      where: { sku },
      include: {
        supplier: true,
        stocks: {
          include: { location: true },
        },
        image: true,
      },
    });
  }

  /**
   * Get item by barcode
   */
  static async getItemByBarcode(barcode: string) {
    return prisma.item.findUnique({
      where: { barcode },
      include: {
        supplier: true,
        stocks: {
          include: { location: true },
        },
        image: true,
      },
    });
  }

  /**
   * Search items with pagination and filters - optimized for large datasets (2000+ items)
   */
  static async searchItems(params: ItemSearchParams) {
    const {
      page = 1,
      pageSize = 20,
      search,
      category,
      brand,
      supplierId,
      locationId,
      isActive,
      lowStock,
      stockStatus,
      sortBy = 'name',
      sortOrder = 'asc',
    } = params;

    // Allow unlimited pageSize for single-page display (no limit for inventory view)
    const limitedPageSize = pageSize;
    const skip = (page - 1) * limitedPageSize;

    const where: Prisma.ItemWhereInput = {};

    // Use indexed search for better performance
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (brand) {
      where.brand = brand;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Filter by location - only show items that have stock in this location
    if (locationId) {
      where.stocks = {
        some: {
          locationId: locationId,
        },
      };
    }

    // For low stock, use a more efficient database-level approach
    if (lowStock) {
      // Get low stock item IDs using raw aggregation for performance
      const lowStockItems = await prisma.$queryRaw<{ id: string }[]>`
        SELECT i.id 
        FROM items i
        LEFT JOIN (
          SELECT "item_id", SUM(qty - "reserved_qty") as total_stock
          FROM stocks
          ${locationId ? Prisma.sql`WHERE "location_id" = ${locationId}` : Prisma.empty}
          GROUP BY "item_id"
        ) s ON i.id = s."item_id"
        WHERE i."is_active" = true 
          AND COALESCE(s.total_stock, 0) > 0 
          AND COALESCE(s.total_stock, 0) <= i."min_stock"
        ${category ? Prisma.sql`AND i.category = ${category}` : Prisma.empty}
        ${brand ? Prisma.sql`AND i.brand = ${brand}` : Prisma.empty}
        ${search ? Prisma.sql`AND (
          i.name ILIKE ${`%${search}%`} OR 
          i.sku ILIKE ${`%${search}%`} OR 
          i.barcode ILIKE ${`%${search}%`}
        )` : Prisma.empty}
      `;

      const lowStockIds = lowStockItems.map(item => item.id);

      if (lowStockIds.length === 0) {
        return {
          items: [],
          total: 0,
          page,
          pageSize: limitedPageSize,
          totalPages: 0,
        };
      }

      where.id = { in: lowStockIds };
    }

    // Filter by stock status (low, out, normal)
    if (stockStatus) {
      let stockCondition: string;
      if (stockStatus === 'out') {
        stockCondition = 'COALESCE(s.total_stock, 0) <= 0';
      } else if (stockStatus === 'low') {
        stockCondition = 'COALESCE(s.total_stock, 0) > 0 AND COALESCE(s.total_stock, 0) <= i."min_stock"';
      } else {
        // normal - stock > minStock
        stockCondition = 'COALESCE(s.total_stock, 0) > i."min_stock"';
      }

      const filteredItems = await prisma.$queryRaw<{ id: string }[]>`
        SELECT i.id 
        FROM items i
        LEFT JOIN (
          SELECT "item_id", SUM(qty - "reserved_qty") as total_stock
          FROM stocks
          ${locationId ? Prisma.sql`WHERE "location_id" = ${locationId}` : Prisma.empty}
          GROUP BY "item_id"
        ) s ON i.id = s."item_id"
        WHERE i."is_active" = true 
          AND ${Prisma.raw(stockCondition)}
        ${category ? Prisma.sql`AND i.category = ${category}` : Prisma.empty}
        ${brand ? Prisma.sql`AND i.brand = ${brand}` : Prisma.empty}
        ${search ? Prisma.sql`AND (
          i.name ILIKE ${`%${search}%`} OR 
          i.sku ILIKE ${`%${search}%`} OR 
          i.barcode ILIKE ${`%${search}%`}
        )` : Prisma.empty}
      `;

      const filteredIds = filteredItems.map(item => item.id);

      if (filteredIds.length === 0) {
        return {
          items: [],
          total: 0,
          page,
          pageSize: limitedPageSize,
          totalPages: 0,
        };
      }

      where.id = { in: filteredIds };
    }

    // Use select to only fetch needed fields for list view (performance optimization)
    const [rawItems, total] = await Promise.all([
      prisma.item.findMany({
        where,
        skip,
        take: limitedPageSize,
        select: {
          id: true,
          sku: true,
          name: true,
          brand: true,
          category: true,
          unitPrice: true,
          costPrice: true,
          minStock: true,
          unitOfMeasure: true,
          isActive: true,
          image: {
            select: { id: true, path: true },
          },
          stocks: {
            where: locationId ? { locationId } : undefined,
            select: {
              qty: true,
              reservedQty: true,
              location: {
                select: { id: true, name: true, type: true },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.item.count({ where }),
    ]);

    // Transform items to include stock breakdown by location
    const items = rawItems.map(item => {
      // Include all stocks (even with 0 quantity) for transfer purposes
      const allStocks = item.stocks.map(s => ({
        locationId: s.location.id,
        locationName: s.location.name,
        locationType: s.location.type,
        qty: Number(s.qty),
        reservedQty: Number(s.reservedQty),
        quantity: Number(s.qty),
        reservedQuantity: Number(s.reservedQty),
        availableQuantity: Number(s.qty) - Number(s.reservedQty),
      }));

      // stocksByLocation only includes locations with stock > 0 (for display)
      const stocksByLocation = allStocks
        .filter(s => s.quantity > 0)
        .sort((a, b) => b.availableQuantity - a.availableQuantity);

      // If locationId is provided, allStocks contains ONLY that location's stock due to the `where` filter above.
      // However, if the item is "out of stock" at that location (i.e. we found no stock row), allStocks will be empty.
      // Therefore, if we filtered by location and allStocks is empty, the totalStock for that location is explicitly 0.
      const totalStock = allStocks.reduce((sum, s) => sum + s.availableQuantity, 0);

      return {
        ...item,
        stocks: allStocks, // Include all stocks for transfer lookups
        stocksByLocation,
        totalStock,
      };
    });

    return {
      items,
      total,
      page,
      pageSize: limitedPageSize,
      totalPages: Math.ceil(total / limitedPageSize),
    };
  }

  /**
   * Get all categories
   */
  static async getCategories() {
    const items = await prisma.item.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
    });
    return items.map(i => i.category).filter(Boolean) as string[];
  }

  /**
   * Get all brands
   */
  static async getBrands() {
    const items = await prisma.item.findMany({
      where: { isActive: true },
      select: { brand: true },
      distinct: ['brand'],
    });
    return items.map(i => i.brand).filter(Boolean) as string[];
  }

  /**
   * Deactivate item
   */
  static async deactivateItem(id: string) {
    return prisma.item.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Get low stock items - OPTIMIZED with database-level aggregation
   * Uses raw SQL for efficient filtering on large datasets (2000+ items)
   */
  static async getLowStockItems() {
    return this.getLowStockItemsOptimized({});
  }

  /**
   * Get low stock items with pagination and filters - OPTIMIZED
   * Uses database-level aggregation instead of application-level filtering
   */
  static async getLowStockItemsOptimized(params: {
    category?: string;
    brand?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { category, brand, search, page = 1, pageSize = 50 } = params;
    const limitedPageSize = Math.min(pageSize, 100); // Enforce max page size
    const offset = (page - 1) * limitedPageSize;

    // Use raw query for efficient database-level aggregation
    const lowStockItems = await prisma.$queryRaw<any[]>`
      SELECT 
        i.id, i.sku, i.name, i.brand, i.category,
        i."unit_price" as "unitPrice",
        i."cost_price" as "costPrice",
        i."min_stock" as "minStock",
        i."is_active" as "isActive",
        COALESCE(SUM(s.qty - s."reserved_qty"), 0)::float as "currentStock"
      FROM items i
      LEFT JOIN stocks s ON i.id = s."item_id"
      WHERE i."is_active" = true
        ${category ? Prisma.sql`AND i.category = ${category}` : Prisma.empty}
        ${brand ? Prisma.sql`AND i.brand = ${brand}` : Prisma.empty}
        ${search ? Prisma.sql`AND (
          i.name ILIKE ${`%${search}%`} OR 
          i.sku ILIKE ${`%${search}%`} OR
          i.barcode ILIKE ${`%${search}%`}
        )` : Prisma.empty}
      GROUP BY i.id
      HAVING COALESCE(SUM(s.qty - s."reserved_qty"), 0) <= i."min_stock"
      ORDER BY COALESCE(SUM(s.qty - s."reserved_qty"), 0) ASC
      LIMIT ${limitedPageSize}
      OFFSET ${offset}
    `;

    // Get total count efficiently
    const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM (
        SELECT i.id
        FROM items i
        LEFT JOIN stocks s ON i.id = s."item_id"
        WHERE i."is_active" = true
          ${category ? Prisma.sql`AND i.category = ${category}` : Prisma.empty}
          ${brand ? Prisma.sql`AND i.brand = ${brand}` : Prisma.empty}
          ${search ? Prisma.sql`AND (
            i.name ILIKE ${`%${search}%`} OR 
            i.sku ILIKE ${`%${search}%`} OR
            i.barcode ILIKE ${`%${search}%`}
          )` : Prisma.empty}
        GROUP BY i.id
        HAVING COALESCE(SUM(s.qty - s."reserved_qty"), 0) <= i."min_stock"
      ) subquery
    `;

    const total = Number(countResult[0].count);

    return {
      items: lowStockItems.map(item => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        brand: item.brand,
        category: item.category,
        unitPrice: Number(item.unitPrice),
        costPrice: Number(item.costPrice),
        minStock: Number(item.minStock),
        currentStock: Number(item.currentStock),
        isActive: item.isActive,
      })),
      total,
      page,
      pageSize: limitedPageSize,
      totalPages: Math.ceil(total / limitedPageSize),
    };
  }

  /**
   * Get total stock for an item across all locations
   */
  static async getTotalStock(itemId: string): Promise<number> {
    const stocks = await prisma.stock.findMany({
      where: { itemId },
    });
    return stocks.reduce((sum, s) => sum + Number(s.qty) - Number(s.reservedQty), 0);
  }
}

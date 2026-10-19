import { prisma } from '@/lib/prisma';
import { StockService } from './stock.service';
import { Prisma } from '@prisma/client';
import { TelegramService } from './telegram.service';

// Define enums as constants
const SaleStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED',
} as const;

const PaymentMethod = {
  CASH: 'CASH',
  MOBILE_TRANSFER: 'MOBILE_TRANSFER',
  CREDIT: 'CREDIT',
  CARD: 'CARD',
  BANK: 'BANK',
  SPLIT_PAYMENT: 'SPLIT_PAYMENT',
} as const;

type SaleStatus = typeof SaleStatus[keyof typeof SaleStatus];
type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export interface CreateSaleInput {
  customerId?: string;
  locationId: string;
  cashierId: string;
  salesmanId?: string;
  sessionId?: string;
  notes?: string;
}

export interface SaleItemInput {
  itemId: string;
  qty: number;
  unitPrice: number;
  costPrice: number;
  locationId?: string;
}

export interface PaymentInput {
  method: PaymentMethod;
  amount: number;
  bankAccountId?: string;
  reference?: string;
  dueDate?: string;
  customerName?: string;
  customerPhone?: string;
}

export class SaleService {
  static async create(data: CreateSaleInput) {
    const receiptNumber = await this.generateReceiptNumber();

    return prisma.sale.create({
      data: {
        receiptNumber,
        customerId: data.customerId,
        locationId: data.locationId,
        cashierId: data.cashierId,
        salesmanId: data.salesmanId,
        sessionId: data.sessionId,
        notes: data.notes,
        status: SaleStatus.PENDING,
        paymentMethod: PaymentMethod.CASH,
        totalAmount: 0,
        actualAmountPaid: 0,
        totalCost: 0,
        discount: 0,
      },
      include: {
        customer: true,
        items: { include: { item: true } },
        payments: true,
      },
    });
  }

  static async getById(id: string) {
    return prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        cashier: { select: { id: true, fullName: true, email: true } },
        salesman: { select: { id: true, fullName: true } },
        location: true,
        items: { include: { item: true } },
        payments: true,
        returns: {
          include: {
            items: true,
            payments: { include: { bankAccount: { select: { bankName: true } } } },
          }
        },
      },
    });
  }


  static async getAll(params: {
    locationId?: string;
    customerId?: string;
    status?: SaleStatus;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { locationId, customerId, status, startDate, endDate, page = 1, limit = 20 } = params;

    const where: {
      locationId?: string;
      customerId?: string;
      status?: SaleStatus;
      createdAt?: { gte?: Date; lte?: Date };
    } = {};
    if (locationId) where.locationId = locationId;
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          customer: true,
          cashier: { select: { id: true, fullName: true } },
          items: { include: { item: true } },
          payments: true,
          returns: {
            include: {
              items: true,
              payments: { include: { bankAccount: { select: { bankName: true } } } },
            }
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sale.count({ where }),
    ]);

    return { sales, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async addItem(saleId: string, item: SaleItemInput) {
    if (item.qty <= 0) {
      throw new Error('Quantity must be greater than zero');
    }
    if (item.unitPrice < 0) {
      throw new Error('Unit price cannot be negative');
    }

    const lineTotal = Math.round(item.qty * item.unitPrice * 100) / 100;

    const saleItem = await prisma.saleItem.create({
      data: {
        saleId,
        itemId: item.itemId,
        qty: item.qty,
        unitPrice: item.unitPrice,
        lineTotal,
        costPrice: item.costPrice,
        locationId: item.locationId,
      },
      include: { item: true },
    });

    await this.recalculateTotals(saleId);
    return saleItem;
  }

  static async removeItem(saleId: string, saleItemId: string) {
    await prisma.saleItem.delete({ where: { id: saleItemId } });
    await this.recalculateTotals(saleId);
  }

  static async updateItemQuantity(saleItemId: string, qty: number) {
    if (qty <= 0) {
      throw new Error('Quantity must be greater than zero');
    }

    const saleItem = await prisma.saleItem.findUnique({ where: { id: saleItemId } });
    if (!saleItem) throw new Error('Sale item not found');

    const lineTotal = Math.round(qty * Number(saleItem.unitPrice) * 100) / 100;

    const updated = await prisma.saleItem.update({
      where: { id: saleItemId },
      data: { qty, lineTotal },
      include: { item: true },
    });

    await this.recalculateTotals(saleItem.saleId);
    return updated;
  }

  static async addPayment(saleId: string, payment: PaymentInput, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;

    // Create the payment record
    const paymentRecord = await client.payment.create({
      data: {
        saleId,
        method: payment.method,
        amount: payment.amount,
        bankAccountId: payment.bankAccountId,
        reference: payment.reference,
      },
    });

    // If payment has a bank account (MOBILE_TRANSFER, BANK, or CARD payment), update bank balance and create transaction
    if (payment.bankAccountId && (payment.method === 'MOBILE_TRANSFER' || payment.method === 'BANK' || payment.method === 'CARD')) {
      // Get the sale to include receipt number in description
      const sale = await client.sale.findUnique({
        where: { id: saleId },
        select: { receiptNumber: true },
      });

      // Update bank account balance
      await client.bankAccount.update({
        where: { id: payment.bankAccountId },
        data: {
          currentBalance: { increment: payment.amount },
        },
      });

      // Create bank transaction record for tracking
      await client.bankTransaction.create({
        data: {
          toAccountId: payment.bankAccountId,
          amount: payment.amount,
          transactionType: 'SALE_PAYMENT',
          reference: payment.reference || sale?.receiptNumber || null,
          description: `Sale payment - ${sale?.receiptNumber || saleId}`,
        },
      });
    }

    return paymentRecord;
  }


  static async finalize(
    saleId: string,
    locationId: string,
    paymentMethod: PaymentMethod,
    tx?: Prisma.TransactionClient
  ) {
    const finalizeInTransaction = async (tx: Prisma.TransactionClient) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: {
          items: { include: { item: true } },
          payments: true,
          location: true
        },
      });

      if (!sale) throw new Error('Sale not found');
      if (sale.status !== SaleStatus.PENDING) {
        throw new Error('Sale is not in pending status');
      }

      if (sale.items.length === 0) {
        throw new Error('Cannot finalize sale with no items');
      }

      const totalPaid = sale.payments.reduce((sum: number, p: { amount: unknown }) => sum + Number(p.amount), 0);
      const saleTotal = Number(sale.totalAmount) - Number(sale.discount);
      if (totalPaid < saleTotal - 0.001) {
        throw new Error('Insufficient payment');
      }

      // Deduct stock using StockService which handles optimistic locking and validation
      // We no longer split item rows across multiple locations since we strictly deduct from a single location
      for (const saleItem of sale.items) {
        try {
          // Determine the specific location for deduction, prioritizing saleItem's locationId
          const deductionLocationId = saleItem.locationId || sale.locationId;

          const deductionResult = await StockService.deductStock(
            saleItem.itemId,
            Number(saleItem.qty),
            [deductionLocationId], // Strictly deduct from this location, no fallback
            tx
          );

          // Always ensure the locationId is set correctly on the SaleItem (either it was already set, or we update it to sale's location)
          if (!saleItem.locationId && deductionResult.deductedLocations.length > 0) {
            await tx.saleItem.update({
              where: { id: saleItem.id },
              data: { locationId: deductionResult.deductedLocations[0].locationId }
            });
          }
        } catch (error: any) {
          throw new Error(`Failed to deduct stock for item ${saleItem.item?.name || saleItem.itemId}: ${error.message}`);
        }
      }

      // Calculate and Record Commissions
      // Use net sale amount (after discount) rather than totalPaid to avoid
      // inflating commission when customer overpays and receives change
      const profit = saleTotal - Number(sale.totalCost);

      if (profit > 0) {
        // Salesman Commission
        if (sale.salesmanId) {
          const salesman = await tx.user.findUnique({ where: { id: sale.salesmanId } });
          const rate = Number(salesman?.commissionRate || 0);
          if (rate > 0 && salesman) {
            const amount = (profit * rate) / 100;
            await tx.commission.create({
              data: {
                userId: salesman.id,
                saleId: sale.id,
                amount,
                rate,
                profitSnapshot: profit,
              },
            });
          }
        }

        // Cashier Commission
        if (sale.cashierId) {
          const cashier = await tx.user.findUnique({ where: { id: sale.cashierId } });
          const rate = Number(cashier?.commissionRate || 0);
          if (rate > 0 && cashier) {
            const amount = (profit * rate) / 100;
            await tx.commission.create({
              data: {
                userId: cashier.id,
                saleId: sale.id,
                amount,
                rate,
                profitSnapshot: profit,
              },
            });
          }
        }
      }

      // Update sale status
      return tx.sale.update({
        where: { id: saleId },
        data: {
          status: SaleStatus.COMPLETED,
          paymentMethod,
          actualAmountPaid: totalPaid,
        },
        include: {
          customer: true,
          items: { include: { item: true } },
          payments: true,
        },
      });

    };

    if (tx) {
      return finalizeInTransaction(tx);
    }

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => finalizeInTransaction(tx));
  }

  static async cancel(saleId: string) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Cancel the sale
      const updatedSale = await tx.sale.update({
        where: { id: saleId },
        data: { status: SaleStatus.CANCELLED },
        include: { cashier: true }
      });

      TelegramService.sendMessage(
        `⚠️ <b>Pending Sale Cancelled</b>\nReceipt: <code>${updatedSale.receiptNumber}</code>\nTotal: <b>$${updatedSale.totalAmount}</b>\nCancelled By: ${updatedSale.cashier?.fullName || 'System'}`
      ).catch(err => console.error('Telegram notification error:', err));

      // Cancel associated commissions
      await tx.commission.updateMany({
        where: { saleId },
        data: { status: 'CANCELLED' },
      });

      return updatedSale;
    });
  }

  static async list(params: {
    page?: number;
    pageSize?: number;
    status?: SaleStatus | string;
    startDate?: Date;
    endDate?: Date;
    sessionOnly?: boolean;
    searchQuery?: string;
  }) {
    const { page = 1, pageSize = 20, status, startDate, endDate, sessionOnly, searchQuery } = params;

    // Build where clause
    const where: Prisma.SaleWhereInput = {};

    if (searchQuery) {
      where.receiptNumber = { contains: searchQuery, mode: 'insensitive' };
    }

    // Handle status filter (can be comma-separated)
    if (status) {
      const statuses = status.split(',').map(s => s.trim());
      if (statuses.length === 1) {
        where.status = statuses[0] as any;
      } else {
        where.status = { in: statuses as any };
      }
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    // Session-only filter - get current session and filter by session start time
    if (sessionOnly) {
      const currentSession = await prisma.dailySession.findFirst({
        where: { status: 'OPEN' },
        orderBy: { openedAt: 'desc' },
      });

      if (currentSession) {
        where.createdAt = {
          ...where.createdAt,
          gte: currentSession.openedAt,
        };
      } else {
        // No active session - return empty
        return { sales: [], total: 0, page, pageSize, totalPages: 0 };
      }
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          customer: true,
          cashier: { select: { id: true, fullName: true } },
          salesman: { select: { id: true, fullName: true } },
          items: { include: { item: true } },
          payments: { include: { bankAccount: { select: { bankName: true } } } },
          returns: {
            include: {
              items: true,
              payments: { include: { bankAccount: { select: { bankName: true } } } },
            }
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.sale.count({ where }),
    ]);

    return { sales, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  /**
   * Cancel a completed sale with refund and stock restoration
   */
  static async cancelSale(params: {
    saleId: string;
    refundAmount: number;
    refundMethod: string;
    cancelledById: string;
    bankAccountId?: string;
  }) {
    const { saleId, refundAmount, refundMethod, cancelledById, bankAccountId } = params;

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Get the sale with items
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: {
          items: { include: { item: true } },
          payments: true,
        },
      });

      if (!sale) {
        throw new Error('Sale not found');
      }

      if (sale.status !== SaleStatus.COMPLETED) {
        throw new Error('Only completed sales can be cancelled');
      }

      const saleTotal = Number(sale.totalAmount);
      if (refundAmount <= 0 || refundAmount > saleTotal) {
        throw new Error(`Refund amount must be between 0 and ${saleTotal}`);
      }

      // Restore stock for each item
      for (const saleItem of sale.items) {
        const qty = Number(saleItem.qty);
        const locationId = saleItem.locationId || sale.locationId;

        if (locationId) {
          // Try to find existing stock record
          const existingStock = await tx.stock.findUnique({
            where: { itemId_locationId: { itemId: saleItem.itemId, locationId } },
          });

          if (existingStock) {
            // Increment existing stock
            await tx.stock.update({
              where: { id: existingStock.id },
              data: {
                qty: { increment: qty },
                version: { increment: 1 },
              },
            });
          } else {
            // Create new stock record
            await tx.stock.create({
              data: {
                itemId: saleItem.itemId,
                locationId,
                qty,
                reservedQty: 0,
              },
            });
          }
        }
      }

      // Update sale status to cancelled
      const updatedSale = await tx.sale.update({
        where: { id: saleId },
        data: {
          status: SaleStatus.CANCELLED,
          refundAmount,
          refundMethod,
          refundBankAccountId: bankAccountId,
          cancelledAt: new Date(),
          cancelledById,
        },
        include: {
          customer: true,
          items: { include: { item: true } },
          payments: true,
        },
      });

      // Cancel associated commissions
      await tx.commission.updateMany({
        where: { saleId },
        data: { status: 'CANCELLED' },
      });

      // Cancel associated credits (prevent phantom debts)
      await tx.credit.updateMany({
        where: { saleId, status: { in: ['OPEN', 'OVERDUE'] } },
        data: {
          status: 'CLOSED',
          balance: 0,
          closedAt: new Date(),
        },
      });

      // If a bank refund is specified, deduct the refund amount from the selected bank account
      if (bankAccountId && (refundMethod === 'MOBILE_TRANSFER' || refundMethod === 'BANK' || refundMethod === 'CARD')) {
        // Decrement the bank account balance
        await tx.bankAccount.update({
          where: { id: bankAccountId },
          data: {
            currentBalance: { decrement: Number(refundAmount) },
          },
        });

        // Create reversal bank transaction record for audit trail
        await tx.bankTransaction.create({
          data: {
            fromAccountId: bankAccountId,
            amount: Number(refundAmount),
            transactionType: 'SALE_REVERSAL',
            reference: updatedSale.receiptNumber,
            description: `Sale cancelled - refund for ${updatedSale.receiptNumber}`,
          },
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: 'SALE_CANCELLED',
          entityType: 'Sale',
          entityId: saleId,
          userId: cancelledById,
          newValues: {
            refundAmount,
            refundMethod,
            cancelledAt: new Date().toISOString(),
          },
        },
      });

      // Fetch active session to tie the expense correctly
      const currentSession = await tx.dailySession.findFirst({
        where: { status: 'OPEN' },
        orderBy: { openedAt: 'desc' },
      });

      // Automatically register the refund as an Expense for the Expense Ledger
      await tx.expense.create({
        data: {
          category: 'REFUND',
          amount: refundAmount,
          paymentMethod: refundMethod,
          bankAccountId: bankAccountId,
          description: `Full refund for cancelled receipt ${sale.receiptNumber}`,
          expenseDate: new Date(),
          createdById: cancelledById,
          sessionId: currentSession?.id || null,
        },
      });

      // Trigger Telegram Notification
      const cancelledByMessage = updatedSale.cancelledBy ? `\nCancelled By: ${updatedSale.cancelledBy}` : '';
      TelegramService.sendMessage(
        `❌ <b>Sale Cancelled</b>\nReceipt: <code>${updatedSale.receiptNumber}</code>\nRefund: <b>$${refundAmount}</b> via ${refundMethod}${cancelledByMessage}`
      ).catch(err => console.error('Telegram notification error:', err));

      return updatedSale;
    });
  }

  static async startSale(
    cashierId: string,
    locationId: string,
    customerId?: string,
    salesmanId?: string
  ) {
    // Get current session
    const session = await prisma.dailySession.findFirst({
      where: { status: 'OPEN' },
    });

    if (!session) {
      throw new Error('No active session found. Please open a session before processing a sale.');
    }

    return this.create({
      cashierId,
      locationId,
      customerId,
      salesmanId,
      sessionId: session.id,
    });
  }

  static async finalizeSale(
    saleId: string,
    payments: PaymentInput[],
    discount?: number
  ) {
    try {
      const sale = await prisma.sale.findUnique({
        where: { id: saleId },
        include: { items: true, location: true, salesman: true, cashier: true },
      });

      if (!sale) {
        return { success: false, error: 'Sale not found' };
      }

      if (sale.status !== SaleStatus.PENDING) {
        return { success: false, error: 'Sale is not in pending status' };
      }

      // Check if there's a credit payment - requires customer info
      const creditPayments = payments.filter(p => p.method === PaymentMethod.CREDIT);

      // Validate credit payments have required info
      for (const cp of creditPayments) {
        if (!cp.customerName || !cp.customerPhone) {
          return { success: false, error: 'Customer name and phone are required for credit sales' };
        }
        if (!cp.dueDate) {
          return { success: false, error: 'Due date is required for credit payments' };
        }
      }

      return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const currentSession = await tx.dailySession.findFirst({
          where: { status: 'OPEN' },
        });

        if (!currentSession) {
          throw new Error('No active session found. Please open a session before finalizing the sale.');
        }

        // Apply discount if provided, and ensure the sale is attributed to the current active session
        const updateData: any = { sessionId: currentSession.id };
        if (discount && discount > 0) {
          updateData.discount = discount;
        }

        await tx.sale.update({
          where: { id: saleId },
          data: updateData,
        });

        // Add payments
        for (const payment of payments) {
          await this.addPayment(saleId, payment, tx);
        }

        // Determine payment method
        const paymentMethod = payments.length > 1
          ? PaymentMethod.SPLIT_PAYMENT
          : payments[0].method;

        // Finalize the sale
        const finalizedSale = await this.finalize(saleId, sale.locationId || '', paymentMethod, tx);

        // Create Credit records for credit payments
        for (const creditPayment of creditPayments) {
          await tx.credit.create({
            data: {
              saleId: saleId,
              customerId: sale.customerId || undefined,
              customerName: creditPayment.customerName,
              customerPhone: creditPayment.customerPhone,
              principal: creditPayment.amount,
              balance: creditPayment.amount,
              dueDate: new Date(creditPayment.dueDate!),
              status: 'OPEN',
              notes: `Credit sale from receipt ${finalizedSale.receiptNumber}`,
            },
          });
        }

        // Trigger Telegram Notification
        const profit = Number(finalizedSale.totalAmount) - Number(finalizedSale.totalCost);
        const itemNames = finalizedSale.items.map(i => `${i.item.name} (${i.qty})`).join(', ');
        const salesmanName = sale.salesman?.fullName || sale.cashier?.fullName || 'Walk-in';
        
        TelegramService.sendMessage(
          `🔵 <b>New Sale Finalized</b>\nReceipt: <code>${finalizedSale.receiptNumber}</code>\nLocation: ${sale.location?.name || 'Unknown'}\nSalesman: ${salesmanName}\nItems: ${itemNames}\nTotal Price: <b>$${finalizedSale.totalAmount}</b>\nProfit: <b>$${profit.toFixed(2)}</b>`
        ).catch(err => console.error('Telegram notification error:', err));

        return { success: true, sale: finalizedSale };
      });
    } catch (error: any) {
      return { success: false, error: error.message, errorCode: 'FINALIZE_ERROR' };
    }
  }

  private static async recalculateTotals(saleId: string) {
    const items = await prisma.saleItem.findMany({ where: { saleId } });

    const totalAmount = items.reduce((sum: number, item: { lineTotal: unknown }) => sum + Number(item.lineTotal), 0);
    const totalCost = items.reduce((sum: number, item: { costPrice: unknown; qty: unknown }) => sum + (Number(item.costPrice) * Number(item.qty)), 0);

    // Apply decimal formatting to avoid float precision errors
    // Note: formatDecimal is not imported yet, so we will use Math.round locally or import it.
    // Better to import it relative to this file
    const formattedTotal = Math.round(totalAmount * 100) / 100;
    const formattedCost = Math.round(totalCost * 100) / 100;

    await prisma.sale.update({
      where: { id: saleId },
      data: { totalAmount: formattedTotal, totalCost: formattedCost },
    });
  }

  /**
   * Generate unique receipt number using atomic database sequence
   * Prevents collisions under high concurrency
   */
  private static async generateReceiptNumber(): Promise<string> {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const prefix = `RCP-${dateStr}-`;

    try {
      // Use atomic upsert to get next sequence number
      // This prevents race conditions when multiple sales are created simultaneously
      const result = await prisma.$queryRaw<[{ last_value: bigint }]>`
        INSERT INTO receipt_sequences (date_prefix, last_value, created_at)
        VALUES (${prefix}, 1, NOW())
        ON CONFLICT (date_prefix) 
        DO UPDATE SET last_value = receipt_sequences.last_value + 1
        RETURNING last_value
      `;

      const nextNum = Number(result[0].last_value);
      return `${prefix}${nextNum.toString().padStart(6, '0')}`;
    } catch (error) {
      // Fallback to original method if sequence table doesn't exist
      console.warn('Receipt sequence table not available, using fallback method');
      return this.generateReceiptNumberFallback(prefix);
    }
  }

  /**
   * Fallback receipt number generation (less safe for concurrency)
   */
  private static async generateReceiptNumberFallback(prefix: string): Promise<string> {
    const lastSale = await prisma.sale.findFirst({
      where: { receiptNumber: { startsWith: prefix } },
      orderBy: { receiptNumber: 'desc' },
    });

    if (lastSale) {
      const lastSeq = lastSale.receiptNumber.slice(-6);
      const nextNum = parseInt(lastSeq, 10) + 1;
      return `${prefix}${nextNum.toString().padStart(6, '0')}`;
    }

    return `${prefix}000001`;
  }
}

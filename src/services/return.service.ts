import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { StockService } from './stock.service';
import { TelegramService } from './telegram.service';

export interface ReturnItemInput {
  saleItemId: string;
  qty: number;
}

export interface ReturnPaymentInput {
  method: string;
  amount: number;
  bankAccountId?: string;
  reference?: string;
}

export interface ProcessReturnInput {
  saleId: string;
  items: ReturnItemInput[]; // specific items to return
  payments: ReturnPaymentInput[]; // how the refund is given back
  returnType?: 'REFUND' | 'EXCHANGE' | 'STORE_CREDIT';
  notes?: string;
  processedById: string;
}

export class ReturnService {
  /**
   * Generates a unique return number
   */
  private static async generateReturnNumber(tx: any): Promise<string> {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const prefix = `RET-${dateStr}-`;

    try {
      // Use atomic upsert to prevent duplicate numbers under concurrency
      const result = await tx.$queryRaw`
        INSERT INTO receipt_sequences (date_prefix, last_value, created_at)
        VALUES (${prefix}, 1, NOW())
        ON CONFLICT (date_prefix)
        DO UPDATE SET last_value = receipt_sequences.last_value + 1
        RETURNING last_value
      `;
      const nextNum = Number(result[0].last_value);
      return `${prefix}${nextNum.toString().padStart(6, '0')}`;
    } catch {
      // Fallback if sequence table not available
      const lastReturn = await tx.return.findFirst({
        where: { returnNumber: { startsWith: prefix } },
        orderBy: { returnNumber: 'desc' },
      });
      if (lastReturn) {
        const lastSeq = lastReturn.returnNumber.replace(prefix, '');
        const nextNum = parseInt(lastSeq, 10) + 1;
        return `${prefix}${nextNum.toString().padStart(6, '0')}`;
      }
      return `${prefix}000001`;
    }
  }

  /**
   * Process a partial or full return of a sale
   */
  static async processReturn(data: ProcessReturnInput) {
    if (data.items.length === 0) {
      throw new Error("Cannot process a return without items.");
    }

    if (data.payments.length === 0) {
      throw new Error("Must specify at least one refund payment method.");
    }

    // Pre-fetch sale OUTSIDE the transaction to reduce lock time
    const sale = await prisma.sale.findUnique({
      where: { id: data.saleId },
      include: {
        items: true,
        payments: true,
        returns: {
          include: { items: true }
        }
      }
    });

    if (!sale) {
      throw new Error("Sale not found.");
    }

    if (sale.status === 'CANCELLED') {
      throw new Error("Cannot return items from an already cancelled sale.");
    }

    return prisma.$transaction(async (tx) => {
      // 2. Validate Items and Calculate the Total Value being Refunded
      let totalRefundValue = 0;
      const returnItemsData: Prisma.ReturnItemCreateManyReturnInput[] = [];
      const stockUpdates: { itemId: string; locationId: string; qty: number }[] = [];

      for (const inputItem of data.items) {
        if (inputItem.qty <= 0) continue;

        const saleItem = sale.items.find(i => i.id === inputItem.saleItemId);
        if (!saleItem) {
          throw new Error(`Sale item ${inputItem.saleItemId} not found in this sale.`);
        }

        // Calculate how many of this item have already been returned
        let alreadyReturnedQty = 0;
        for (const previousReturn of sale.returns) {
          const retItem = previousReturn.items.find(i => i.itemId === saleItem.itemId); // Note: assumes one ReturnItem per Item ID per Return
          if (retItem) {
            alreadyReturnedQty += Number(retItem.qty);
          }
        }

        const maxReturnable = Number(saleItem.qty) - alreadyReturnedQty;
        if (inputItem.qty > maxReturnable) {
          throw new Error(`Cannot return ${inputItem.qty} of item ${saleItem.itemId}. Only ${maxReturnable} available to return.`);
        }

        const lineTotalRefund = Number(saleItem.unitPrice) * inputItem.qty;
        totalRefundValue += lineTotalRefund;

        returnItemsData.push({
          itemId: saleItem.itemId,
          qty: inputItem.qty,
          unitPrice: saleItem.unitPrice,
          lineTotal: lineTotalRefund,
          isResellable: true // By default, assume items are resellable.
        });

        stockUpdates.push({
          itemId: saleItem.itemId,
          locationId: saleItem.locationId || sale.locationId!,
          qty: inputItem.qty
        });
      }

      if (totalRefundValue === 0) {
        throw new Error("Total refund value is zero.");
      }

      // 3. Validate Payments Match Total Refund Value
      const totalPaymentAmount = data.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      
      // Allow for a slight floating point difference, but mathematically they should match
      if (Math.abs(totalPaymentAmount - totalRefundValue) > 0.05) {
        throw new Error(`Total refund payment (${totalPaymentAmount}) does not match the value of items being returned (${totalRefundValue}).`);
      }

      // 4. Create the Return Record
      const returnNumber = await this.generateReturnNumber(tx);
      
      const newReturn = await tx.return.create({
        data: {
          returnNumber,
          saleId: sale.id,
          customerId: sale.customerId,
          returnType: data.returnType || 'REFUND',
          totalAmount: totalRefundValue,
          notes: data.notes,
          
          // Legacy fields on Return model (optional depending on schema requirements, 
          // but we populate with the primary payment method for backwards compatibility)
          refundMethod: data.payments[0].method,
          bankAccountId: data.payments[0].bankAccountId,

          items: {
            createMany: {
              data: returnItemsData
            }
          },
          payments: {
            createMany: {
              data: data.payments.map(p => ({
                amount: p.amount,
                paymentMethod: p.method,
                bankAccountId: p.bankAccountId,
                reference: p.reference
              }))
            }
          }
        },
        include: {
          items: { include: { item: true } },
          payments: { include: { bankAccount: true } }
        }
      });

      // 5. Restore Stock and Modify Bank Accounts where applicable
      
      // Restore Stock
      for (const update of stockUpdates) {
        const existingStock = await tx.stock.findUnique({
          where: { itemId_locationId: { itemId: update.itemId, locationId: update.locationId } },
        });

        if (existingStock) {
          await tx.stock.update({
            where: { id: existingStock.id },
            data: { 
              qty: { increment: update.qty },
              version: { increment: 1 }
            },
          });
        } else {
           await tx.stock.create({
             data: {
               itemId: update.itemId,
               locationId: update.locationId,
               qty: update.qty,
               reservedQty: 0
             }
           });
        }
      }

      // Deduct From Bank Accounts
      for (const payment of data.payments) {
        if (payment.bankAccountId && (payment.method === 'MOBILE_TRANSFER' || payment.method === 'BANK' || payment.method === 'CARD')) {
          await tx.bankAccount.update({
             where: { id: payment.bankAccountId },
             data: {
               currentBalance: { decrement: payment.amount }
             }
          });

          await tx.bankTransaction.create({
             data: {
               fromAccountId: payment.bankAccountId,
               amount: payment.amount,
               transactionType: 'SALE_REVERSAL',
               reference: newReturn.returnNumber,
               description: `Refund for return ${newReturn.returnNumber}`
             }
          });
        }
      }

      // 6. Update Sale Status
      // If ALL items have been fully returned, mark the sale as CANCELLED or REFUNDED.
      let allFullyReturned = true;
      for (const saleItem of sale.items) {
         let itemReturnedQty = 0;
         // Check old returns
         for (const pr of sale.returns) {
            const retItemMatch = pr.items.find(i => i.itemId === saleItem.itemId);
            if (retItemMatch) itemReturnedQty += Number(retItemMatch.qty);
         }
         // Check current return
         const currentRetItemMatch = returnItemsData.find(i => i.itemId === saleItem.itemId);
         if (currentRetItemMatch) itemReturnedQty += Number(currentRetItemMatch.qty);

         if (itemReturnedQty < Number(saleItem.qty)) {
            allFullyReturned = false;
            break;
         }
      }

      if (allFullyReturned) {
         await tx.sale.update({
           where: { id: sale.id },
           data: {
             status: 'REFUNDED',
             cancelledAt: new Date(),
             cancelledById: data.processedById
           }
         });

         // Reverse Commissions
         await tx.commission.updateMany({
           where: { saleId: sale.id },
           data: { status: 'CANCELLED' }
         });

         // Ensure credits are closed
         await tx.credit.updateMany({
            where: { saleId: sale.id, status: { in: ['OPEN', 'OVERDUE'] } },
            data: {
              status: 'CLOSED',
              balance: 0,
              closedAt: new Date(),
            },
         });
      } else {
         // The sale was partially refunded. We can update its status to 'REFUNDED' if not already.
         // Or keep it 'COMPLETED' and rely on the UI to calculate net actual vs returned.
         // In this implementation, let's keep it 'COMPLETED' unless strictly fully returned.
         // (Alternatively, you could add a 'PARTIAL_REFUND' state).
      }

      // 7. Create Audit Log
      await tx.auditLog.create({
        data: {
          action: 'PARTIAL_SALE_REFUND',
          entityType: 'Sale',
          entityId: sale.id,
          userId: data.processedById,
          newValues: {
            returnId: newReturn.id,
            returnNumber: newReturn.returnNumber,
            totalRefunded: totalRefundValue,
            itemsCount: data.items.length
          }
        }
      });

      // Fetch active session to tie the expense correctly
      const currentSession = await tx.dailySession.findFirst({
        where: { status: 'OPEN' },
        orderBy: { openedAt: 'desc' },
      });

      // Register refunds in the Expense ledger to satisfy dashboard explicitly
      for (const payment of data.payments) {
        if (Number(payment.amount) > 0) {
          await tx.expense.create({
            data: {
              category: 'REFUND',
              amount: payment.amount,
              paymentMethod: payment.method,
              bankAccountId: payment.bankAccountId || null,
              description: `Partial refund for return ${newReturn.returnNumber} on receipt ${sale.receiptNumber}`,
              expenseDate: new Date(),
              createdById: data.processedById,
              sessionId: currentSession?.id || null,
            },
          });
        }
      }

      // Trigger Telegram Notification
      TelegramService.sendMessage(
        `🔄 <b>Return Processed</b>\nReturn Number: <code>${newReturn.returnNumber}</code>\nOriginal Receipt: <code>${sale.receiptNumber}</code>\nRefunded: <b>$${totalRefundValue}</b>\nItems Returned: ${data.items.length}`
      ).catch(err => console.error('Telegram notification error:', err));

      return newReturn;
    });
  }
}

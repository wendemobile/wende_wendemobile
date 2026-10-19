import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type CreditStatus = 'OPEN' | 'OVERDUE' | 'CLOSED';
type PaymentMethod = 'CASH' | 'MOBILE_TRANSFER' | 'CREDIT' | 'CARD' | 'SPLIT_PAYMENT';

/**
 * Precise decimal arithmetic helper to avoid floating-point errors
 * Uses integer arithmetic (cents) for precision
 */
function preciseSubtract(a: Prisma.Decimal | number | string, b: number): number {
  // Convert to cents/smallest unit, do integer math, convert back
  const aNum = typeof a === 'object' ? Number(a.toString()) : Number(a);
  const aCents = Math.round(aNum * 100);
  const bCents = Math.round(b * 100);
  return (aCents - bCents) / 100;
}

function preciseEquals(a: number, b: number): boolean {
  // Compare with small epsilon for floating point
  return Math.abs(a - b) < 0.001;
}

export interface CreateCreditInput {
  customerId: string;
  saleId: string;
  principal: number;
  dueDate: Date;
  notes?: string;
}

export interface CreditPaymentInput {
  amount: number;
  paymentMethod: PaymentMethod;
  bankAccountId?: string;
  reference?: string;
  notes?: string;
}

export interface CreditSearchParams {
  status?: CreditStatus;
  customerId?: string;
  page?: number;
  pageSize?: number;
}

export const creditService = {
  async create(data: CreateCreditInput) {
    return prisma.credit.create({
      data: {
        customerId: data.customerId,
        saleId: data.saleId,
        principal: data.principal,
        balance: data.principal,
        dueDate: data.dueDate,
        notes: data.notes,
        status: 'OPEN',
      },
    });
  },

  async findById(id: string) {
    return prisma.credit.findUnique({
      where: { id },
      include: {
        customer: true,
        sale: true,
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  },

  async search(params: CreditSearchParams) {
    const { status, customerId, page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.CreditWhereInput = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const [items, total] = await Promise.all([
      prisma.credit.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          customer: true,
          sale: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.credit.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  /**
   * Add payment to credit with precise decimal arithmetic
   * Prevents floating-point errors and ensures atomic status updates
   */
  async addPayment(creditId: string, payment: CreditPaymentInput) {
    return prisma.$transaction(async (tx) => {
      const credit = await tx.credit.findUnique({
        where: { id: creditId },
      });

      if (!credit) {
        throw new Error('Credit not found');
      }

      if (credit.status === 'CLOSED') {
        throw new Error('Credit is already closed');
      }

      if (payment.amount <= 0) {
        throw new Error('Payment amount must be greater than zero');
      }

      // Use precise decimal arithmetic to avoid floating-point errors
      const currentBalance = Number(credit.balance.toString());
      const paymentAmount = payment.amount;

      // Strict validation: payment cannot exceed balance
      if (paymentAmount > currentBalance + 0.001) { // Small epsilon for floating point
        throw new Error(`Payment amount ${paymentAmount.toFixed(2)} exceeds remaining balance ${currentBalance.toFixed(2)}`);
      }

      // Calculate new balance with precision
      const newBalance = preciseSubtract(credit.balance, paymentAmount);

      // Ensure balance doesn't go negative due to floating point
      const finalBalance = Math.max(0, newBalance);

      // Create payment record
      const creditPayment = await tx.creditPayment.create({
        data: {
          creditId,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          bankAccountId: payment.bankAccountId,
          reference: payment.reference,
          notes: payment.notes,
        },
      });

      // Update bank account if payment has a bank account (mobile transfer or card)
      if ((payment.paymentMethod === 'MOBILE_TRANSFER' || payment.paymentMethod === 'CARD') && payment.bankAccountId) {
        await tx.bankAccount.update({
          where: { id: payment.bankAccountId },
          data: {
            currentBalance: { increment: payment.amount },
          },
        });

        await tx.bankTransaction.create({
          data: {
            toAccountId: payment.bankAccountId,
            amount: payment.amount,
            transactionType: 'CREDIT',
            reference: payment.reference,
            description: `Credit payment for credit ${creditId}`,
          },
        });
      }

      // Determine status: CLOSED if balance is zero (or effectively zero)
      const isFullyPaid = preciseEquals(finalBalance, 0);
      const newStatus: CreditStatus = isFullyPaid ? 'CLOSED' : (credit.status as CreditStatus);

      // Update credit balance and status atomically
      await tx.credit.update({
        where: { id: creditId },
        data: {
          balance: finalBalance,
          status: newStatus,
          closedAt: newStatus === 'CLOSED' ? new Date() : null,
        },
      });

      return creditPayment;
    }, {
      timeout: 10000, // 10 second timeout
    });
  },

  async getOverdueCredits() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.credit.findMany({
      where: {
        status: { in: ['OPEN', 'OVERDUE'] },
        dueDate: { lt: today },
        balance: { gt: 0 },
      },
      include: {
        customer: true,
        sale: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  },

  async updateOverdueStatus() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.credit.updateMany({
      where: {
        status: 'OPEN',
        dueDate: { lt: today },
        balance: { gt: 0 },
      },
      data: {
        status: 'OVERDUE',
      },
    });
  },

  async getAgingReport() {
    const today = new Date();
    const credits = await prisma.credit.findMany({
      where: {
        status: { in: ['OPEN', 'OVERDUE'] },
      },
      include: {
        customer: true,
      },
    });

    const aging = {
      current: [] as typeof credits,
      days30: [] as typeof credits,
      days60: [] as typeof credits,
      days90: [] as typeof credits,
      over90: [] as typeof credits,
    };

    credits.forEach((credit) => {
      const dueDate = new Date(credit.dueDate);
      const daysPastDue = Math.floor(
        (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysPastDue <= 0) {
        aging.current.push(credit);
      } else if (daysPastDue <= 30) {
        aging.days30.push(credit);
      } else if (daysPastDue <= 60) {
        aging.days60.push(credit);
      } else if (daysPastDue <= 90) {
        aging.days90.push(credit);
      } else {
        aging.over90.push(credit);
      }
    });

    return aging;
  },
};


// Class-style export for API routes
export const CreditService = {
  list: creditService.search,
  findById: creditService.findById,
  create: creditService.create,
  addPayment: creditService.addPayment,
  getOverdue: creditService.getOverdueCredits,
  updateOverdueStatus: creditService.updateOverdueStatus,
  getAgingReport: creditService.getAgingReport,
};

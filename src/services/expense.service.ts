import { prisma } from '@/lib/prisma';
import { TelegramService } from './telegram.service';

const PaymentMethod = {
  CASH: 'CASH',
  MOBILE_TRANSFER: 'MOBILE_TRANSFER',
  CREDIT: 'CREDIT',
  CARD: 'CARD',
  SPLIT_PAYMENT: 'SPLIT_PAYMENT',
} as const;

type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export interface CreateExpenseInput {
  amount: number;
  category: string;
  payee?: string;
  description?: string;
  paymentMethod: PaymentMethod;
  bankAccountId?: string;
  reference?: string;
  sessionId?: string;
  createdById: string;
  expenseDate: Date;
}

export interface ExpenseSearchParams {
  category?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

export const expenseService = {
  async create(data: CreateExpenseInput) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return prisma.$transaction(async (tx: any) => {
      const expense = await tx.expense.create({
        data: {
          amount: data.amount,
          category: data.category,
          payee: data.payee,
          description: data.description,
          paymentMethod: data.paymentMethod,
          bankAccountId: data.bankAccountId,
          reference: data.reference,
          sessionId: data.sessionId,
          createdById: data.createdById,
          expenseDate: data.expenseDate,
        },
      });

      // Debit bank account if payment is via bank-backed method
      if ((data.paymentMethod === 'MOBILE_TRANSFER' || data.paymentMethod === 'CARD' || data.paymentMethod === 'BANK') && data.bankAccountId) {
        await tx.bankAccount.update({
          where: { id: data.bankAccountId },
          data: {
            currentBalance: { decrement: data.amount },
          },
        });

        await tx.bankTransaction.create({
          data: {
            fromAccountId: data.bankAccountId,
            amount: data.amount,
            transactionType: 'DEBIT',
            reference: data.reference,
            description: `Expense: ${data.category} - ${data.description || ''}`,
          },
        });
      }

      // Trigger Telegram Notification
      const descText = data.description ? `\nDescription: ${data.description}` : '';
      TelegramService.sendMessage(
        `💸 <b>New Expense Recorded</b>\nCategory: ${data.category}\nAmount: <b>$${data.amount}</b> via ${data.paymentMethod}${descText}`
      ).catch(err => console.error('Telegram notification error:', err));

      return expense;
    });
  },

  async findById(id: string) {
    return prisma.expense.findUnique({
      where: { id },
      include: {
        bankAccount: true,
        createdBy: true,
        session: true,
      },
    });
  },

  async search(params: ExpenseSearchParams) {
    const { category, startDate, endDate, page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;

    const where: {
      category?: string;
      expenseDate?: { gte?: Date; lte?: Date };
    } = {};
    if (category) where.category = category;
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = startDate;
      if (endDate) where.expenseDate.lte = endDate;
    }

    const [items, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          bankAccount: true,
          createdBy: true,
        },
        orderBy: { expenseDate: 'desc' },
      }),
      prisma.expense.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  async getCategories() {
    const expenses = await prisma.expense.groupBy({
      by: ['category'],
      _sum: { amount: true },
      _count: true,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return expenses.map((e: any) => ({
      category: e.category,
      total: Number(e._sum.amount || 0),
      count: e._count,
    }));
  },

  async getTotalByDateRange(startDate: Date, endDate: Date) {
    const result = await prisma.expense.aggregate({
      where: {
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { amount: true },
    });

    return Number(result._sum.amount || 0);
  },

  async getByCategory(startDate: Date, endDate: Date) {
    return prisma.expense.groupBy({
      by: ['category'],
      where: {
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { amount: true },
      _count: true,
    });
  },
};


// Class-style export for API routes
export const ExpenseService = {
  list: expenseService.search,
  findById: expenseService.findById,
  create: expenseService.create,
  getCategories: expenseService.getCategories,
  getTotalByDateRange: expenseService.getTotalByDateRange,
  getByCategory: expenseService.getByCategory,
};

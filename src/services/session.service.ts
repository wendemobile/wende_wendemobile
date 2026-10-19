import { prisma } from '@/lib/prisma';
import { TelegramService } from './telegram.service';

const SessionStatus = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  RECONCILED: 'RECONCILED',
} as const;

type SessionStatus = typeof SessionStatus[keyof typeof SessionStatus];

export interface OpenSessionInput {
  userId: string;
  businessDate: Date;
  openingCashBalance: number;
  notes?: string;
}

export interface CloseSessionInput {
  sessionId: string;
  closedById: string;
  actualCashCount: number;
  notes?: string;
}

export class SessionService {
  static async open(userId: string, openingCashBalance: number, notes?: string) {
    // Check if there's already an open session
    const existingSession = await prisma.dailySession.findFirst({
      where: {
        status: SessionStatus.OPEN,
      },
    });

    if (existingSession) {
      return { success: false, error: 'There is already an open session' };
    }

    const session = await prisma.dailySession.create({
      data: {
        businessDate: new Date(),
        openedById: userId,
        openingCashBalance: openingCashBalance,
        status: SessionStatus.OPEN,
        openedAt: new Date(),
        notes: notes,
      },
      include: {
        openedBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    TelegramService.sendMessage(
      `🟢 <b>Session Opened</b>\nOpened By: ${session.openedBy?.fullName || 'Unknown'}\nOpening Cash: <b>$${openingCashBalance.toFixed(2)}</b>\nTime: ${new Date().toLocaleString()}`
    ).catch(err => console.error('Telegram notification error:', err));

    return { success: true, session };
  }

  static async close(userId: string, actualCashCount: number, notes?: string) {
    // Find the current open session with all related cash transactions
    const session = await prisma.dailySession.findFirst({
      where: { status: SessionStatus.OPEN },
      include: {
        sales: {
          include: { payments: true }
        },
        expenses: true,
        fundTransfers: true,
        specialIncomes: true,
      },
    });

    if (!session) {
      return { success: false, error: 'No open session found' };
    }

    // Calculate cash from sales
    let cashFromSales = 0;
    for (const sale of session.sales) {
      for (const payment of sale.payments) {
        if (payment.method === 'CASH') {
          cashFromSales += Number(payment.amount);
        }
      }
    }

    // Calculate CASH expenses only (bank transfers don't affect cash balance, and explicitly exclude refunds as they are counted separately)
    const totalCashExpenses = session.expenses
      .filter(e => e.paymentMethod === 'CASH' && e.category !== 'REFUND')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    // Calculate special income (all special income is cash)
    const totalSpecialIncome = session.specialIncomes
      .reduce((sum, i) => sum + Number(i.amount), 0);

    // Calculate fund transfers affecting cash
    let cashToBank = 0;
    let bankToCash = 0;
    for (const transfer of session.fundTransfers) {
      if (transfer.type === 'CASH_TO_BANK') {
        cashToBank += Number(transfer.amount);
      } else if (transfer.type === 'BANK_TO_CASH') {
        bankToCash += Number(transfer.amount);
      }
    }

    // Get layaway, credit payments, and cash refunds for this session (cash only)
    const [layawayPayments, creditPayments, cancelledSales, partialReturnRefunds] = await Promise.all([
      prisma.layawayPayment.findMany({
        where: {
          createdAt: { gte: session.openedAt },
          paymentMethod: 'CASH',
        },
      }),
      prisma.creditPayment.findMany({
        where: {
          createdAt: { gte: session.openedAt },
          paymentMethod: 'CASH',
        },
      }),
      // Full sale cancellation cash refunds
      prisma.sale.findMany({
        where: {
          status: 'CANCELLED',
          refundMethod: 'CASH',
          cancelledAt: { gte: session.openedAt },
          refundAmount: { gt: 0 }
        }
      }),
      // Partial return cash refunds (logged as expenses with category 'REFUND')
      prisma.expense.aggregate({
        where: {
          sessionId: session.id,
          category: 'REFUND',
          paymentMethod: 'CASH',
        },
        _sum: { amount: true },
      }),
    ]);

    const totalLayawayCash = layawayPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalCreditCash = creditPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalFullCancelRefunds = cancelledSales.reduce((sum, s) => sum + Number(s.refundAmount), 0);
    const totalPartialReturnRefunds = Number(partialReturnRefunds._sum.amount || 0);
    const totalCashRefunds = totalFullCancelRefunds + totalPartialReturnRefunds;

    // Calculate closing cash balance
    const closingCashBalance = Number(session.openingCashBalance)
      + cashFromSales
      + totalSpecialIncome
      + totalLayawayCash
      + totalCreditCash
      + bankToCash
      - totalCashExpenses
      - totalCashRefunds
      - cashToBank;

    const cashVariance = actualCashCount - closingCashBalance;

    const updatedSession = await prisma.dailySession.update({
      where: { id: session.id },
      data: {
        status: SessionStatus.CLOSED,
        closedAt: new Date(),
        closedById: userId,
        closingCashBalance,
        actualCashCount: actualCashCount,
        cashVariance,
        notes: notes,
      },
      include: {
        openedBy: { select: { id: true, fullName: true, email: true } },
        closedBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    TelegramService.sendMessage(
      `🔴 <b>Session Closed</b>\nClosed By: ${updatedSession.closedBy?.fullName || 'Unknown'}\nExpected Cash: <b>$${closingCashBalance.toFixed(2)}</b>\nActual Cash: <b>$${actualCashCount.toFixed(2)}</b>\nVariance: <b>$${cashVariance.toFixed(2)}</b>\nTime: ${new Date().toLocaleString()}`
    ).catch(err => console.error('Telegram notification error:', err));

    return { success: true, session: updatedSession };
  }

  static async getCurrent() {
    return prisma.dailySession.findFirst({
      where: { status: SessionStatus.OPEN },
      include: {
        openedBy: { select: { id: true, fullName: true, email: true } },
        sales: {
          where: { status: 'COMPLETED' },
          include: { payments: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { openedAt: 'desc' },
    });
  }

  static async getById(id: string) {
    return prisma.dailySession.findUnique({
      where: { id },
      include: {
        openedBy: { select: { id: true, fullName: true, email: true } },
        closedBy: { select: { id: true, fullName: true, email: true } },
        sales: { include: { payments: true, items: true } },
        expenses: true,
      },
    });
  }

  static async getAll(params: {
    status?: SessionStatus;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { status, startDate, endDate, page = 1, limit = 20 } = params;

    const where: {
      status?: SessionStatus;
      businessDate?: { gte?: Date; lte?: Date };
    } = {};

    if (status) where.status = status;
    if (startDate || endDate) {
      where.businessDate = {};
      if (startDate) where.businessDate.gte = startDate;
      if (endDate) where.businessDate.lte = endDate;
    }

    const [sessions, total] = await Promise.all([
      prisma.dailySession.findMany({
        where,
        include: {
          openedBy: { select: { id: true, fullName: true } },
          closedBy: { select: { id: true, fullName: true } },
        },
        orderBy: { businessDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.dailySession.count({ where }),
    ]);

    return { sessions, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async list(params: { page?: number; pageSize?: number }) {
    const { page = 1, pageSize = 20 } = params;
    return this.getAll({ page, limit: pageSize });
  }
}

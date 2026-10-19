import { prisma } from '@/lib/prisma';

export type FundTransferType = 'CASH_TO_BANK' | 'BANK_TO_CASH' | 'BANK_TO_BANK';

export interface CreateFundTransferInput {
  type: FundTransferType;
  amount: number;
  sourceBankId?: string;
  destBankId?: string;
  reference?: string;
  notes?: string;
  userId: string;
  sessionId?: string;
}

export interface FundTransferFilters {
  type?: FundTransferType;
  startDate?: Date;
  endDate?: Date;
  bankAccountId?: string;
  userId?: string;
}

export class FundTransferService {
  /**
   * Get all fund transfers with optional filters
   */
  static async getAll(filters: FundTransferFilters = {}) {
    const where: Record<string, unknown> = {};

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        (where.createdAt as Record<string, Date>).gte = filters.startDate;
      }
      if (filters.endDate) {
        (where.createdAt as Record<string, Date>).lte = filters.endDate;
      }
    }

    if (filters.bankAccountId) {
      where.OR = [
        { sourceBankId: filters.bankAccountId },
        { destBankId: filters.bankAccountId },
      ];
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    return prisma.fundTransfer.findMany({
      where,
      include: {
        sourceBank: { select: { id: true, bankName: true, accountNumber: true } },
        destBank: { select: { id: true, bankName: true, accountNumber: true } },
        user: { select: { id: true, fullName: true } },
        session: { select: { id: true, businessDate: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single fund transfer by ID
   */
  static async getById(id: string) {
    return prisma.fundTransfer.findUnique({
      where: { id },
      include: {
        sourceBank: true,
        destBank: true,
        user: { select: { id: true, fullName: true } },
        session: true,
      },
    });
  }

  /**
   * Calculate actual cash in hand for a session
   * Formula: Opening + Cash Sales + Layaway + Credit Payments + Special Income + Bank-to-Cash - Expenses - Cash-to-Bank
   */
  private static async calculateCashInHand(sessionId: string, sessionStart: Date): Promise<number> {
    const [
      session,
      cashSalesResult,
      cashLayawayPayments,
      cashCreditPayments,
      specialIncomeResult,
      cashExpensesResult,
      fundTransfers,
    ] = await Promise.all([
      prisma.dailySession.findUnique({
        where: { id: sessionId },
        select: { openingCashBalance: true },
      }),
      prisma.payment.aggregate({
        where: {
          method: 'CASH',
          sale: { status: { in: ['COMPLETED', 'REFUNDED', 'CANCELLED'] }, sessionId: sessionId },
        },
        _sum: { amount: true },
      }),
      prisma.layawayPayment.aggregate({
        where: { paymentMethod: 'CASH', createdAt: { gte: sessionStart } },
        _sum: { amount: true },
      }),
      prisma.creditPayment.aggregate({
        where: { paymentMethod: 'CASH', createdAt: { gte: sessionStart } },
        _sum: { amount: true },
      }),
      prisma.specialIncome.aggregate({
        where: {
          sessionId: sessionId,
          OR: [{ paymentMethod: 'CASH' }, { paymentMethod: null }],
        },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { sessionId: sessionId, paymentMethod: 'CASH' },
        _sum: { amount: true },
      }),
      prisma.fundTransfer.findMany({
        where: { sessionId: sessionId },
        select: { type: true, amount: true },
      }),
    ]);

    const openingBalance = Number(session?.openingCashBalance || 0);
    const cashSales = Number(cashSalesResult._sum.amount || 0);
    const cashLayaway = Number(cashLayawayPayments._sum.amount || 0);
    const cashCredit = Number(cashCreditPayments._sum.amount || 0);
    const specialIncome = Number(specialIncomeResult._sum.amount || 0);
    const cashExpenses = Number(cashExpensesResult._sum.amount || 0);

    let cashToBank = 0;
    let bankToCash = 0;
    for (const transfer of fundTransfers) {
      if (transfer.type === 'CASH_TO_BANK') {
        cashToBank += Number(transfer.amount);
      } else if (transfer.type === 'BANK_TO_CASH') {
        bankToCash += Number(transfer.amount);
      }
    }

    return openingBalance + cashSales + cashLayaway + cashCredit + specialIncome + bankToCash - cashExpenses - cashToBank;
  }

  /**
   * Cash to Bank Transfer
   * Deducts from session cash balance and credits bank account
   */
  static async cashToBank(input: {
    amount: number;
    destBankId: string;
    reference?: string;
    notes?: string;
    userId: string;
    sessionId: string;
  }) {
    const { amount, destBankId, reference, notes, userId, sessionId } = input;

    // Validate amount
    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    // Get current session
    const session = await prisma.dailySession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== 'OPEN') {
      throw new Error('Session is not open');
    }

    // Calculate actual cash in hand (not closingCashBalance which is only set when session closes)
    const currentCash = await this.calculateCashInHand(sessionId, session.openedAt);
    if (currentCash < amount) {
      throw new Error(`Insufficient cash balance. Available: ${currentCash.toFixed(2)}, Requested: ${amount}`);
    }

    // Get bank account
    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id: destBankId },
    });

    if (!bankAccount) {
      throw new Error('Bank account not found');
    }

    if (!bankAccount.isActive) {
      throw new Error('Bank account is not active');
    }

    // Perform atomic transfer
    return prisma.$transaction(async (tx) => {
      // Credit bank account
      await tx.bankAccount.update({
        where: { id: destBankId },
        data: {
          currentBalance: { increment: amount },
        },
      });

      // Create bank transaction record
      await tx.bankTransaction.create({
        data: {
          toAccountId: destBankId,
          amount,
          transactionType: 'CASH_DEPOSIT',
          reference,
          description: `Cash to bank transfer${notes ? ': ' + notes : ''}`,
        },
      });

      // Create fund transfer record
      const transfer = await tx.fundTransfer.create({
        data: {
          type: 'CASH_TO_BANK',
          amount,
          destBankId,
          reference,
          notes,
          userId,
          sessionId,
        },
        include: {
          destBank: { select: { id: true, bankName: true, accountNumber: true } },
          user: { select: { id: true, fullName: true } },
        },
      });

      return transfer;
    });
  }

  /**
   * Bank to Cash Transfer
   * Debits bank account and adds to session cash balance
   */
  static async bankToCash(input: {
    amount: number;
    sourceBankId: string;
    reference?: string;
    notes?: string;
    userId: string;
    sessionId: string;
  }) {
    const { amount, sourceBankId, reference, notes, userId, sessionId } = input;

    // Validate amount
    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    // Get current session
    const session = await prisma.dailySession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== 'OPEN') {
      throw new Error('Session is not open');
    }

    // Get bank account
    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id: sourceBankId },
    });

    if (!bankAccount) {
      throw new Error('Bank account not found');
    }

    if (!bankAccount.isActive) {
      throw new Error('Bank account is not active');
    }

    // Check if bank has enough balance
    const currentBalance = Number(bankAccount.currentBalance);
    if (currentBalance < amount) {
      throw new Error(`Insufficient bank balance. Available: ${currentBalance}, Requested: ${amount}`);
    }

    // Perform atomic transfer
    return prisma.$transaction(async (tx) => {
      // Debit bank account
      await tx.bankAccount.update({
        where: { id: sourceBankId },
        data: {
          currentBalance: { decrement: amount },
        },
      });

      // Create bank transaction record
      await tx.bankTransaction.create({
        data: {
          fromAccountId: sourceBankId,
          amount,
          transactionType: 'CASH_WITHDRAWAL',
          reference,
          description: `Bank to cash transfer${notes ? ': ' + notes : ''}`,
        },
      });

      // Create fund transfer record
      const transfer = await tx.fundTransfer.create({
        data: {
          type: 'BANK_TO_CASH',
          amount,
          sourceBankId,
          reference,
          notes,
          userId,
          sessionId,
        },
        include: {
          sourceBank: { select: { id: true, bankName: true, accountNumber: true } },
          user: { select: { id: true, fullName: true } },
        },
      });

      return transfer;
    });
  }

  /**
   * Bank to Bank Transfer
   * Debits source bank account and credits destination bank account
   */
  static async bankToBank(input: {
    amount: number;
    sourceBankId: string;
    destBankId: string;
    reference?: string;
    notes?: string;
    userId: string;
    sessionId?: string;
  }) {
    const { amount, sourceBankId, destBankId, reference, notes, userId, sessionId } = input;

    // Validate amount
    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    // Validate different accounts
    if (sourceBankId === destBankId) {
      throw new Error('Source and destination accounts must be different');
    }

    // Get source bank account
    const sourceBank = await prisma.bankAccount.findUnique({
      where: { id: sourceBankId },
    });

    if (!sourceBank) {
      throw new Error('Source bank account not found');
    }

    if (!sourceBank.isActive) {
      throw new Error('Source bank account is not active');
    }

    // Check if source bank has enough balance
    const sourceBalance = Number(sourceBank.currentBalance);
    if (sourceBalance < amount) {
      throw new Error(`Insufficient bank balance. Available: ${sourceBalance}, Requested: ${amount}`);
    }

    // Get destination bank account
    const destBank = await prisma.bankAccount.findUnique({
      where: { id: destBankId },
    });

    if (!destBank) {
      throw new Error('Destination bank account not found');
    }

    if (!destBank.isActive) {
      throw new Error('Destination bank account is not active');
    }

    // Perform atomic transfer
    return prisma.$transaction(async (tx) => {
      // Debit source bank account
      await tx.bankAccount.update({
        where: { id: sourceBankId },
        data: {
          currentBalance: { decrement: amount },
        },
      });

      // Credit destination bank account
      await tx.bankAccount.update({
        where: { id: destBankId },
        data: {
          currentBalance: { increment: amount },
        },
      });

      // Create bank transaction record
      await tx.bankTransaction.create({
        data: {
          fromAccountId: sourceBankId,
          toAccountId: destBankId,
          amount,
          transactionType: 'INTERNAL_TRANSFER',
          reference,
          description: `Bank to bank transfer${notes ? ': ' + notes : ''}`,
        },
      });

      // Create fund transfer record
      const transfer = await tx.fundTransfer.create({
        data: {
          type: 'BANK_TO_BANK',
          amount,
          sourceBankId,
          destBankId,
          reference,
          notes,
          userId,
          sessionId,
        },
        include: {
          sourceBank: { select: { id: true, bankName: true, accountNumber: true } },
          destBank: { select: { id: true, bankName: true, accountNumber: true } },
          user: { select: { id: true, fullName: true } },
        },
      });

      return transfer;
    });
  }

  /**
   * Get transfer history for a specific bank account
   */
  static async getByBankAccount(bankAccountId: string) {
    return prisma.fundTransfer.findMany({
      where: {
        OR: [
          { sourceBankId: bankAccountId },
          { destBankId: bankAccountId },
        ],
      },
      include: {
        sourceBank: { select: { id: true, bankName: true, accountNumber: true } },
        destBank: { select: { id: true, bankName: true, accountNumber: true } },
        user: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get transfer summary for a date range
   */
  static async getSummary(startDate: Date, endDate: Date) {
    const transfers = await prisma.fundTransfer.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const summary = {
      cashToBank: { count: 0, total: 0 },
      bankToCash: { count: 0, total: 0 },
      bankToBank: { count: 0, total: 0 },
    };

    for (const transfer of transfers) {
      const amount = Number(transfer.amount);
      switch (transfer.type) {
        case 'CASH_TO_BANK':
          summary.cashToBank.count++;
          summary.cashToBank.total += amount;
          break;
        case 'BANK_TO_CASH':
          summary.bankToCash.count++;
          summary.bankToCash.total += amount;
          break;
        case 'BANK_TO_BANK':
          summary.bankToBank.count++;
          summary.bankToBank.total += amount;
          break;
      }
    }

    return summary;
  }
}

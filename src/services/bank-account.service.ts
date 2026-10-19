import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface CreateBankAccountInput {
  holderName: string;
  bankName: string;
  accountNumber: string;
  initialBalance: number;
}

export interface BankTransferInput {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  reference?: string;
  description?: string;
}

export const bankAccountService = {
  async create(data: CreateBankAccountInput) {
    return prisma.bankAccount.create({
      data: {
        holderName: data.holderName,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        initialBalance: data.initialBalance,
        currentBalance: data.initialBalance,
      },
    });
  },

  async findById(id: string) {
    return prisma.bankAccount.findUnique({
      where: { id },
    });
  },

  async findAll(includeInactive = false) {
    return prisma.bankAccount.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { bankName: 'asc' },
    });
  },

  async update(id: string, data: Partial<CreateBankAccountInput>) {
    return prisma.bankAccount.update({
      where: { id },
      data,
    });
  },

  async deactivate(id: string) {
    return prisma.bankAccount.update({
      where: { id },
      data: { isActive: false },
    });
  },

  async getTransactions(accountId: string, limit = 50) {
    return prisma.bankTransaction.findMany({
      where: {
        OR: [{ fromAccountId: accountId }, { toAccountId: accountId }],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  async transfer(data: BankTransferInput) {
    return prisma.$transaction(async (tx) => {
      const fromAccount = await tx.bankAccount.findUnique({
        where: { id: data.fromAccountId },
      });

      if (!fromAccount) {
        throw new Error('Source account not found');
      }

      if (Number(fromAccount.currentBalance) < data.amount) {
        throw new Error('Insufficient balance in source account');
      }

      const toAccount = await tx.bankAccount.findUnique({
        where: { id: data.toAccountId },
      });

      if (!toAccount) {
        throw new Error('Destination account not found');
      }

      // Debit source account
      await tx.bankAccount.update({
        where: { id: data.fromAccountId },
        data: {
          currentBalance: { decrement: data.amount },
        },
      });

      // Credit destination account
      await tx.bankAccount.update({
        where: { id: data.toAccountId },
        data: {
          currentBalance: { increment: data.amount },
        },
      });

      // Create transaction record
      const transaction = await tx.bankTransaction.create({
        data: {
          fromAccountId: data.fromAccountId,
          toAccountId: data.toAccountId,
          amount: data.amount,
          transactionType: 'TRANSFER',
          reference: data.reference,
          description: data.description || 'Internal transfer',
        },
      });

      return transaction;
    });
  },

  async credit(accountId: string, amount: number, reference?: string, description?: string) {
    return prisma.$transaction(async (tx) => {
      await tx.bankAccount.update({
        where: { id: accountId },
        data: {
          currentBalance: { increment: amount },
        },
      });

      return tx.bankTransaction.create({
        data: {
          toAccountId: accountId,
          amount,
          transactionType: 'CREDIT',
          reference,
          description,
        },
      });
    });
  },

  async debit(accountId: string, amount: number, reference?: string, description?: string) {
    return prisma.$transaction(async (tx) => {
      const account = await tx.bankAccount.findUnique({
        where: { id: accountId },
      });

      if (!account || Number(account.currentBalance) < amount) {
        throw new Error('Insufficient balance');
      }

      await tx.bankAccount.update({
        where: { id: accountId },
        data: {
          currentBalance: { decrement: amount },
        },
      });

      return tx.bankTransaction.create({
        data: {
          fromAccountId: accountId,
          amount,
          transactionType: 'DEBIT',
          reference,
          description,
        },
      });
    });
  },

  async getTotalBalance() {
    const result = await prisma.bankAccount.aggregate({
      where: { isActive: true },
      _sum: { currentBalance: true },
    });

    return Number(result._sum.currentBalance || 0);
  },
};

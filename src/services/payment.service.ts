import { prisma } from '@/lib/prisma';

const PaymentMethod = {
  CASH: 'CASH',
  MOBILE_TRANSFER: 'MOBILE_TRANSFER',
  CREDIT: 'CREDIT',
  CARD: 'CARD',
  SPLIT_PAYMENT: 'SPLIT_PAYMENT',
} as const;

type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export interface CashPaymentInput {
  saleId: string;
  amount: number;
}

export interface MobileTransferPaymentInput {
  saleId: string;
  amount: number;
  bankAccountId: string;
  reference: string;
}

export interface CreditPaymentInput {
  saleId: string;
  amount: number;
  customerId: string;
  dueDate: Date;
}

export interface SplitPaymentEntry {
  method: PaymentMethod;
  amount: number;
  bankAccountId?: string;
  reference?: string;
}

export class PaymentService {
  /**
   * Record a cash payment
   */
  static async recordCashPayment(input: CashPaymentInput) {
    return prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          saleId: input.saleId,
          method: PaymentMethod.CASH,
          amount: input.amount,
        },
      });

      return payment;
    });
  }

  /**
   * Record a mobile transfer payment
   */
  static async recordMobileTransferPayment(input: MobileTransferPaymentInput) {
    return prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          saleId: input.saleId,
          method: PaymentMethod.MOBILE_TRANSFER,
          amount: input.amount,
          bankAccountId: input.bankAccountId,
          reference: input.reference,
        },
      });

      // Credit the bank account
      await tx.bankAccount.update({
        where: { id: input.bankAccountId },
        data: {
          currentBalance: { increment: input.amount },
        },
      });

      // Create bank transaction record
      await tx.bankTransaction.create({
        data: {
          toAccountId: input.bankAccountId,
          amount: input.amount,
          transactionType: 'SALE_PAYMENT',
          reference: input.reference,
          description: `Payment for sale ${input.saleId}`,
        },
      });

      return payment;
    });
  }

  /**
   * Create a credit payment (deferred payment)
   */
  static async createCreditPayment(input: CreditPaymentInput) {
    return prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          saleId: input.saleId,
          method: PaymentMethod.CREDIT,
          amount: input.amount,
        },
      });

      // Create credit record
      await tx.credit.create({
        data: {
          saleId: input.saleId,
          customerId: input.customerId,
          principal: input.amount,
          balance: input.amount,
          dueDate: input.dueDate,
          status: 'OPEN',
        },
      });

      return payment;
    });
  }

  /**
   * Process split payment with multiple methods
   */
  static async processSplitPayment(saleId: string, payments: SplitPaymentEntry[]) {
    // Validate total equals sale amount (after discount)
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      select: { totalAmount: true, discount: true, customerId: true },
    });

    if (!sale) throw new Error('Sale not found');

    const saleTotal = Number(sale.totalAmount) - Number(sale.discount);
    const totalPayment = payments.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(totalPayment - saleTotal) > 0.01) {
      throw new Error(
        `Payment total (${totalPayment}) does not match sale amount after discount (${saleTotal})`
      );
    }

    return prisma.$transaction(async (tx) => {
      const createdPayments = [];

      for (let i = 0; i < payments.length; i++) {
        const p = payments[i];

        const payment = await tx.payment.create({
          data: {
            saleId,
            method: p.method,
            amount: p.amount,
            bankAccountId: p.bankAccountId,
            reference: p.reference,
            sequenceNumber: i + 1,
          },
        });

        createdPayments.push(payment);

        // Handle bank account credit for mobile transfers
        if (p.method === PaymentMethod.MOBILE_TRANSFER && p.bankAccountId) {
          await tx.bankAccount.update({
            where: { id: p.bankAccountId },
            data: {
              currentBalance: { increment: p.amount },
            },
          });

          await tx.bankTransaction.create({
            data: {
              toAccountId: p.bankAccountId,
              amount: p.amount,
              transactionType: 'SALE_PAYMENT',
              reference: p.reference,
              description: `Split payment for sale ${saleId}`,
            },
          });
        }
      }

      // Update sale payment method to SPLIT_PAYMENT
      await tx.sale.update({
        where: { id: saleId },
        data: { paymentMethod: PaymentMethod.SPLIT_PAYMENT },
      });

      return createdPayments;
    });
  }

  /**
   * Get payments for a sale
   */
  static async getPaymentsBySale(saleId: string) {
    return prisma.payment.findMany({
      where: { saleId },
      include: { bankAccount: true },
      orderBy: { sequenceNumber: 'asc' },
    });
  }

  /**
   * Calculate total paid for a sale
   */
  static async getTotalPaid(saleId: string): Promise<number> {
    const payments = await prisma.payment.findMany({
      where: { saleId },
      select: { amount: true },
    });
    return payments.reduce((sum, p) => sum + Number(p.amount), 0);
  }

  /**
   * Validate payment amount matches sale total
   */
  static async validatePaymentTotal(saleId: string): Promise<boolean> {
    const [sale, totalPaid] = await Promise.all([
      prisma.sale.findUnique({ where: { id: saleId }, select: { totalAmount: true } }),
      this.getTotalPaid(saleId),
    ]);

    if (!sale) return false;
    return Math.abs(totalPaid - Number(sale.totalAmount)) < 0.01;
  }
}

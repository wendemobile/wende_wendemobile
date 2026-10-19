import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const singlePaymentSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.enum(['CASH', 'MOBILE_TRANSFER', 'CARD']),
  bankAccountId: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  // Split payment support: array of payment portions
  payments: z.array(z.object({
    method: z.enum(['CASH', 'MOBILE_TRANSFER', 'CARD']),
    amount: z.number().positive(),
    bankAccountId: z.string().optional(),
    reference: z.string().optional(),
  })).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = singlePaymentSchema.parse(body);

    const layaway = await prisma.layaway.findUnique({
      where: { id: params.id },
      include: { items: true },
    });

    if (!layaway) {
      return NextResponse.json({ error: 'Layaway not found' }, { status: 404 });
    }

    if (layaway.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Layaway is not active' }, { status: 400 });
    }

    const currentBalance = Number(layaway.balanceAmount);
    if (validated.amount > currentBalance) {
      return NextResponse.json({ error: 'Payment amount exceeds balance' }, { status: 400 });
    }

    // Determine payment portions
    let paymentPortions: Array<{
      method: string;
      amount: number;
      bankAccountId?: string;
      reference?: string;
    }> = [];

    if (validated.payments && validated.payments.length > 0) {
      // Split payment: validate portions sum to total amount
      const portionsTotal = validated.payments.reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(portionsTotal - validated.amount) > 0.01) {
        return NextResponse.json(
          { error: 'Split payment amounts must equal the total payment amount' },
          { status: 400 }
        );
      }
      paymentPortions = validated.payments;
    } else {
      // Single payment
      paymentPortions = [{
        method: validated.paymentMethod,
        amount: validated.amount,
        bankAccountId: validated.bankAccountId,
        reference: validated.reference,
      }];
    }

    // Create payment and update layaway
    const newPaidAmount = Number(layaway.paidAmount) + validated.amount;
    const newBalance = Number(layaway.totalAmount) - newPaidAmount;
    const isFullyPaid = newBalance <= 0;

    // Use transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      const createdPayments = [];

      for (const portion of paymentPortions) {
        const payment = await tx.layawayPayment.create({
          data: {
            layawayId: params.id,
            amount: portion.amount,
            paymentMethod: portion.method,
            bankAccountId: portion.bankAccountId || null,
            reference: portion.reference || null,
            notes: paymentPortions.length > 1
              ? `${validated.notes || 'Payment'} (${portion.method.toLowerCase().replace('_', ' ')})`
              : validated.notes || null,
          },
        });
        createdPayments.push(payment);

        // Update bank account balance if mobile transfer, card, or bank
        if ((portion.method === 'MOBILE_TRANSFER' || portion.method === 'CARD' || portion.method === 'BANK') && portion.bankAccountId) {
          await tx.bankAccount.update({
            where: { id: portion.bankAccountId },
            data: { currentBalance: { increment: portion.amount } },
          });

          // Create bank transaction record for tracking
          await tx.bankTransaction.create({
            data: {
              toAccountId: portion.bankAccountId,
              amount: portion.amount,
              transactionType: 'LAYAWAY_PAYMENT',
              reference: portion.reference || layaway.layawayNumber,
              description: `Layaway payment - ${layaway.layawayNumber}`,
            },
          });
        }
      }

      const updatedLayaway = await tx.layaway.update({
        where: { id: params.id },
        data: {
          paidAmount: newPaidAmount,
          balanceAmount: Math.max(0, newBalance),
          ...(isFullyPaid && {
            status: 'COMPLETED',
            completedAt: new Date(),
          }),
        },
      });

      // If fully paid, deduct stock and release reserved using unique constraint
      if (isFullyPaid) {
        for (const item of layaway.items) {
          if (layaway.locationId) {
            await tx.stock.update({
              where: {
                itemId_locationId: {
                  itemId: item.itemId,
                  locationId: layaway.locationId,
                },
              },
              data: {
                qty: { decrement: Number(item.qty) },
                reservedQty: { decrement: Number(item.qty) },
              },
            });
          }
        }
      }

      return { payments: createdPayments, updatedLayaway };
    });

    const { payments, updatedLayaway } = result;

    return NextResponse.json({
      success: true,
      data: { payments, layaway: updatedLayaway, isFullyPaid }
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.flatten().fieldErrors }, { status: 400 });
    }
    console.error('Error making payment:', error);
    return NextResponse.json({ error: 'Failed to make payment' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const paymentSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.string(),
  bankAccountId: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await request.json();
    const validated = paymentSchema.parse(body);

    // Create payment and update vendor balance in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.vendorPayment.create({
        data: {
          vendorId: params.id,
          amount: validated.amount,
          paymentMethod: validated.paymentMethod,
          bankAccountId: validated.bankAccountId,
          reference: validated.reference,
          notes: validated.notes,
        },
      });

      // Update vendor balance (decrease)
      await tx.vendor.update({
        where: { id: params.id },
        data: {
          balance: { decrement: validated.amount },
        },
      });

      // Deduct from bank account if mobile transfer
      if (validated.paymentMethod === 'MOBILE_TRANSFER' && validated.bankAccountId) {
        await tx.bankAccount.update({
          where: { id: validated.bankAccountId },
          data: {
            currentBalance: { decrement: validated.amount },
          },
        });

        // Create bank transaction record
        await tx.bankTransaction.create({
          data: {
            fromAccountId: validated.bankAccountId,
            amount: validated.amount,
            transactionType: 'DEBIT',
            reference: validated.reference,
            description: `Vendor payment to ${params.id}`,
          },
        });
      }

      return payment;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VAL_001', message: 'Validation error', details: error.flatten().fieldErrors } }, { status: 400 });
    }
    console.error('Error making vendor payment:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const depositPaymentSchema = z.object({
  method: z.enum(['CASH', 'MOBILE_TRANSFER', 'CARD']),
  amount: z.number().positive(),
  bankAccountId: z.string().optional(),
  reference: z.string().optional(),
});

const createLayawaySchema = z.object({
  customerId: z.string().min(1),
  items: z.array(z.object({
    itemId: z.string(),
    qty: z.number().positive(),
    unitPrice: z.number().positive(),
  })).min(1),
  depositAmount: z.number().min(0),
  // Single payment method (backward compatible)
  depositPaymentMethod: z.enum(['CASH', 'MOBILE_TRANSFER', 'CARD']).default('CASH'),
  depositBankAccountId: z.string().optional(),
  depositReference: z.string().optional(),
  // Split payment support: array of payment portions
  depositPayments: z.array(depositPaymentSchema).optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  locationId: z.string().min(1, 'Location is required'),
});

async function generateLayawayNumber(tx: any) {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `LAY-${dateStr}-`;

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
    const lastLayaway = await tx.layaway.findFirst({
      where: { layawayNumber: { startsWith: prefix } },
      orderBy: { layawayNumber: 'desc' },
    });
    if (lastLayaway) {
      const lastSeq = lastLayaway.layawayNumber.slice(-6);
      const nextNum = parseInt(lastSeq, 10) + 1;
      return `${prefix}${nextNum.toString().padStart(6, '0')}`;
    }
    return `${prefix}000001`;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const [layaways, total] = await Promise.all([
      prisma.layaway.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          items: { include: { item: { select: { id: true, name: true, sku: true } } } },
          _count: { select: { payments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.layaway.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: { items: layaways, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('Error listing layaways:', error);
    return NextResponse.json({ error: 'Failed to list layaways' }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createLayawaySchema.parse(body);

    // Calculate totals
    const totalAmount = validated.items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
    const balanceAmount = totalAmount - validated.depositAmount;

    // Determine payment portions for the deposit
    // If depositPayments array is provided, use it (split payment)
    // Otherwise, fall back to single payment method (backward compatible)
    let paymentPortions: Array<{
      method: string;
      amount: number;
      bankAccountId?: string;
      reference?: string;
    }> = [];

    if (validated.depositAmount > 0) {
      if (validated.depositPayments && validated.depositPayments.length > 0) {
        // Split payment: validate that portions sum to deposit amount
        const portionsTotal = validated.depositPayments.reduce((sum, p) => sum + p.amount, 0);
        if (Math.abs(portionsTotal - validated.depositAmount) > 0.01) {
          return NextResponse.json(
            { error: 'Split payment amounts must equal the deposit amount' },
            { status: 400 }
          );
        }
        paymentPortions = validated.depositPayments;
      } else {
        // Single payment method
        paymentPortions = [{
          method: validated.depositPaymentMethod,
          amount: validated.depositAmount,
          bankAccountId: validated.depositBankAccountId,
          reference: validated.depositReference,
        }];
      }
    }

    // Use transaction to ensure layaway creation and stock reservation are atomic
    const layaway = await prisma.$transaction(async (tx) => {
      // Generate number inside transaction to prevent duplicates
      const layawayNumber = await generateLayawayNumber(tx);

      const newLayaway = await tx.layaway.create({
        data: {
          layawayNumber,
          customerId: validated.customerId,
          totalAmount,
          depositAmount: validated.depositAmount,
          paidAmount: validated.depositAmount,
          balanceAmount,
          dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
          notes: validated.notes,
          locationId: validated.locationId,
          items: {
            create: validated.items.map(item => ({
              itemId: item.itemId,
              qty: item.qty,
              unitPrice: item.unitPrice,
              lineTotal: item.qty * item.unitPrice,
            })),
          },
        },
        include: {
          customer: true,
          items: { include: { item: true } },
        },
      });

      // Create payment records for each deposit portion
      for (const portion of paymentPortions) {
        await tx.layawayPayment.create({
          data: {
            layawayId: newLayaway.id,
            amount: portion.amount,
            paymentMethod: portion.method,
            bankAccountId: portion.bankAccountId || null,
            reference: portion.reference || null,
            notes: paymentPortions.length > 1
              ? `Initial deposit (${portion.method.toLowerCase().replace('_', ' ')})`
              : 'Initial deposit',
          },
        });

        // Update bank account if mobile transfer, card, or bank
        if ((portion.method === 'MOBILE_TRANSFER' || portion.method === 'CARD' || portion.method === 'BANK') && portion.bankAccountId) {
          await tx.bankAccount.update({
            where: { id: portion.bankAccountId },
            data: { currentBalance: { increment: portion.amount } },
          });
          await tx.bankTransaction.create({
            data: {
              toAccountId: portion.bankAccountId,
              amount: portion.amount,
              transactionType: 'LAYAWAY_PAYMENT',
              reference: portion.reference || newLayaway.layawayNumber,
              description: `Layaway deposit - ${newLayaway.layawayNumber}`,
            },
          });
        }
      }

      // Reserve stock for layaway items using unique constraint
      for (const item of validated.items) {
        await tx.stock.upsert({
          where: {
            itemId_locationId: {
              itemId: item.itemId,
              locationId: validated.locationId,
            },
          },
          create: {
            itemId: item.itemId,
            locationId: validated.locationId,
            qty: 0,
            reservedQty: item.qty,
          },
          update: { reservedQty: { increment: item.qty } },
        });
      }

      // Re-fetch with payments included
      return tx.layaway.findUnique({
        where: { id: newLayaway.id },
        include: {
          customer: true,
          items: { include: { item: true } },
          payments: true,
        },
      });
    });

    return NextResponse.json({ success: true, data: layaway }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.flatten().fieldErrors }, { status: 400 });
    }
    console.error('Error creating layaway:', error);
    return NextResponse.json({ error: 'Failed to create layaway' }, { status: 500 });
  }
}

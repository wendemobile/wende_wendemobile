import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const layaway = await prisma.layaway.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        items: { include: { item: { include: { image: true } } } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!layaway) {
      return NextResponse.json({ error: 'Layaway not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: layaway });
  } catch (error) {
    console.error('Error fetching layaway:', error);
    return NextResponse.json({ error: 'Failed to fetch layaway' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    const layaway = await prisma.layaway.findUnique({
      where: { id: params.id },
      include: { items: true },
    });

    if (!layaway) {
      return NextResponse.json({ error: 'Layaway not found' }, { status: 404 });
    }

    const updateData: any = {};

    // Use transaction to ensure data consistency
    const updated = await prisma.$transaction(async (tx) => {
      if (status === 'CANCELLED') {
        updateData.status = 'CANCELLED';
        updateData.cancelledAt = new Date();

        // Release reserved stock using unique constraint
        for (const item of layaway.items) {
          if (layaway.locationId) {
            await tx.stock.update({
              where: {
                itemId_locationId: {
                  itemId: item.itemId,
                  locationId: layaway.locationId,
                },
              },
              data: { reservedQty: { decrement: Number(item.qty) } },
            });
          }
        }

        // Reverse bank account deposits for mobile transfer payments
        const payments = await tx.layawayPayment.findMany({
          where: { layawayId: layaway.id },
        });
        for (const payment of payments) {
          if (payment.bankAccountId && (payment.paymentMethod === 'MOBILE_TRANSFER' || payment.paymentMethod === 'CARD' || payment.paymentMethod === 'BANK')) {
            await tx.bankAccount.update({
              where: { id: payment.bankAccountId },
              data: { currentBalance: { decrement: Number(payment.amount) } },
            });
            await tx.bankTransaction.create({
              data: {
                fromAccountId: payment.bankAccountId,
                amount: Number(payment.amount),
                transactionType: 'LAYAWAY_REVERSAL',
                reference: layaway.layawayNumber,
                description: `Layaway cancelled - reversal for ${layaway.layawayNumber}`,
              },
            });
          }
        }
      } else if (status === 'COMPLETED') {
        // Check if fully paid
        if (Number(layaway.balanceAmount) > 0) {
          throw new Error('Cannot complete layaway with outstanding balance');
        }
        updateData.status = 'COMPLETED';
        updateData.completedAt = new Date();

        // Deduct from actual stock and release reserved using unique constraint
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

      return tx.layaway.update({
        where: { id: params.id },
        data: updateData,
      });
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating layaway:', error);
    return NextResponse.json({ error: 'Failed to update layaway' }, { status: 500 });
  }
}

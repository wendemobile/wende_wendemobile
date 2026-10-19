import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateTransferSchema = z.object({
  status: z.enum(['SENT', 'RECEIVED', 'CANCELLED']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } }, { status: 401 });
    }

    const transfer = await prisma.transfer.findUnique({
      where: { id: params.id },
      include: {
        items: { include: { item: true } },
        fromLocation: true,
        toLocation: true,
        createdBy: { select: { id: true, fullName: true, username: true } },
      },
    });

    if (!transfer) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Transfer not found' } }, { status: 404 });
    }

    // Fetch assigned user and received by user separately if fields exist
    let assignedTo = null;
    let receivedBy = null;
    
    try {
      const extendedTransfer = transfer as any;
      if (extendedTransfer.assignedToId) {
        assignedTo = await prisma.user.findUnique({
          where: { id: extendedTransfer.assignedToId },
          select: { id: true, fullName: true, username: true },
        });
      }
      if (extendedTransfer.receivedById) {
        receivedBy = await prisma.user.findUnique({
          where: { id: extendedTransfer.receivedById },
          select: { id: true, fullName: true, username: true },
        });
      }
    } catch (e) {
      // Fields may not exist yet
    }

    return NextResponse.json({ 
      success: true, 
      data: { ...transfer, assignedTo, receivedBy } 
    });
  } catch (error) {
    console.error('Error fetching transfer:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await request.json();
    const { status } = updateTransferSchema.parse(body);

    const transfer = await prisma.transfer.findUnique({
      where: { id: params.id },
      include: { items: true },
    });

    if (!transfer) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Transfer not found' } }, { status: 404 });
    }

    let updatedTransfer: any;
    const extTransfer = transfer as any;

    if (status === 'SENT') {
      // Stock is already reserved at transfer creation time in TransferService.create
      updatedTransfer = await prisma.transfer.update({
        where: { id: params.id },
        data: { status: 'SENT', sentAt: new Date() },
        include: {
          items: { include: { item: true } },
          fromLocation: true,
          toLocation: true,
        },
      });
    } else if (status === 'RECEIVED') {
      // Move stock from source to destination
      await prisma.$transaction(async (tx) => {
        for (const item of transfer.items) {
          // Deduct from source
          await tx.stock.update({
            where: {
              itemId_locationId: {
                itemId: item.itemId,
                locationId: transfer.fromLocationId,
              },
            },
            data: {
              qty: { decrement: Number(item.qty) },
              reservedQty: { decrement: Number(item.qty) },
            },
          });

          // Add to destination
          await tx.stock.upsert({
            where: {
              itemId_locationId: {
                itemId: item.itemId,
                locationId: transfer.toLocationId,
              },
            },
            create: {
              itemId: item.itemId,
              locationId: transfer.toLocationId,
              qty: item.qty,
              reservedQty: 0,
            },
            update: {
              qty: { increment: Number(item.qty) },
            },
          });
        }

        // Build update data - handle new fields gracefully
        const updateData: any = { 
          status: 'RECEIVED', 
          receivedAt: new Date(),
        };
        
        // Try to set receivedById if the field exists
        try {
          updateData.receivedById = session.user.id;
        } catch (e) {}

        updatedTransfer = await tx.transfer.update({
          where: { id: params.id },
          data: updateData,
          include: {
            items: { include: { item: true } },
            fromLocation: true,
            toLocation: true,
          },
        });
      });
    } else if (status === 'CANCELLED') {
      // Release reserved stock if transfer was created or sent
      await prisma.$transaction(async (tx) => {
        if (transfer.status === 'SENT' || transfer.status === 'CREATED') {
          for (const item of transfer.items) {
            await tx.stock.update({
              where: {
                itemId_locationId: {
                  itemId: item.itemId,
                  locationId: transfer.fromLocationId,
                },
              },
              data: {
                reservedQty: { decrement: Number(item.qty) },
              },
            });
          }
        }

        updatedTransfer = await tx.transfer.update({
          where: { id: params.id },
          data: { status: 'CANCELLED' },
          include: {
            items: { include: { item: true } },
            fromLocation: true,
            toLocation: true,
          },
        });
      });
    }

    // Determine redirect based on purpose
    const purpose = extTransfer.purpose || 'STOCK_MOVE';
    const redirectTo = status === 'RECEIVED' && purpose === 'FOR_SALE' ? '/pos' : null;

    return NextResponse.json({ 
      success: true, 
      data: { 
        ...updatedTransfer, 
        purpose,
        redirectTo,
      } 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VAL_001', message: 'Validation error' } }, { status: 400 });
    }
    console.error('Error updating transfer:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}

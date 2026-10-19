import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Check permission
    if (!hasPermission(session.user.role, 'transfers:receive')) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_002', message: 'Forbidden' } },
        { status: 403 }
      );
    }

    const transfer = await prisma.transfer.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            item: true,
          },
        },
        toLocation: true,
      },
    });

    if (!transfer) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Transfer not found' } },
        { status: 404 }
      );
    }

    // Check if transfer is in SENT status
    if (transfer.status !== 'SENT') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: 'Transfer is not in SENT status' } },
        { status: 400 }
      );
    }

    // Check if this transfer is assigned to the current user (if assignedToId exists)
    const extTransfer = transfer as any;
    if (extTransfer.assignedToId && extTransfer.assignedToId !== session.user.id) {
      // Allow if user is admin
      if (session.user.role !== 'ADMIN') {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_ASSIGNED', message: 'This transfer is not assigned to you' } },
          { status: 403 }
        );
      }
    }

    // Receive the transfer - move stock from source to destination
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

      // Update transfer status
      const updateData: any = {
        status: 'RECEIVED',
        receivedAt: new Date(),
      };

      // Try to set receivedById if the field exists
      try {
        updateData.receivedById = session.user.id;
      } catch (e) {}

      await tx.transfer.update({
        where: { id: params.id },
        data: updateData,
      });
    });

    // Prepare cart items for POS
    const cartItems = transfer.items.map((transferItem) => ({
      itemId: transferItem.item.id,
      name: transferItem.item.name,
      sku: transferItem.item.sku,
      qty: Number(transferItem.qty),
      unitPrice: Number(transferItem.item.unitPrice),
      costPrice: Number(transferItem.item.costPrice),
      locationId: transfer.toLocationId,
      locationName: transfer.toLocation.name,
      barcode: transferItem.item.barcode,
    }));

    return NextResponse.json({
      success: true,
      data: {
        transferId: transfer.id,
        transferNumber: (transfer as any).transferNumber,
        cartItems,
        toLocationId: transfer.toLocationId,
        toLocationName: transfer.toLocation.name,
      },
    });
  } catch (error) {
    console.error('Error receiving transfer for sale:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SRV_001', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

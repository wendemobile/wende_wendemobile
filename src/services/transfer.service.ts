import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type TransferStatus = 'CREATED' | 'SENT' | 'RECEIVED' | 'COMPLETED' | 'CANCELLED';

export interface TransferItemInput {
  itemId: string;
  qty: number;
}

export interface CreateTransferInput {
  fromLocationId: string;
  toLocationId: string;
  salesmanId?: string;
  assignedToId?: string;
  purpose?: 'STOCK_MOVE' | 'FOR_SALE' | 'SHOWROOM' | 'RETURN_TO_WAREHOUSE';
  items: TransferItemInput[];
  notes?: string;
  createdById: string;
}

export interface TransferSearchParams {
  status?: TransferStatus;
  fromLocationId?: string;
  toLocationId?: string;
  page?: number;
  pageSize?: number;
}

async function generateTransferNumber(tx: any): Promise<string> {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `TRF-${dateStr}-`;

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
    const lastTransfer = await tx.transfer.findFirst({
      where: { transferNumber: { startsWith: prefix } },
      orderBy: { transferNumber: 'desc' },
    });
    if (lastTransfer) {
      const lastSeq = lastTransfer.transferNumber.slice(-6);
      const nextNum = parseInt(lastSeq, 10) + 1;
      return `${prefix}${nextNum.toString().padStart(6, '0')}`;
    }
    return `${prefix}000001`;
  }
}

export const transferService = {
  async create(data: CreateTransferInput) {
    return prisma.$transaction(async (tx) => {
      // Validate source and destination are different
      if (data.fromLocationId === data.toLocationId) {
        throw new Error('Source and destination locations must be different');
      }

      // Validate items array is not empty
      if (!data.items || data.items.length === 0) {
        throw new Error('Transfer must include at least one item');
      }

      // Validate stock availability at source location
      for (const item of data.items) {
        if (item.qty <= 0) {
          throw new Error('Item quantity must be greater than zero');
        }

        const stock = await tx.stock.findUnique({
          where: {
            itemId_locationId: {
              itemId: item.itemId,
              locationId: data.fromLocationId,
            },
          },
        });

        const available = stock ? Number(stock.qty) - Number(stock.reservedQty) : 0;
        if (available < item.qty) {
          const itemInfo = await tx.item.findUnique({ where: { id: item.itemId } });
          throw new Error(
            `Insufficient stock for ${itemInfo?.name || item.itemId}. Available: ${available}`
          );
        }

        // Immediately reserve stock to prevent overselling while in CREATED state
        await tx.stock.update({
          where: { id: stock!.id },
          data: {
            reservedQty: { increment: Number(item.qty) },
            version: { increment: 1 },
          },
        });
      }

      // Create transfer
      const transfer = await tx.transfer.create({
        data: {
          transferNumber: await generateTransferNumber(tx),
          fromLocationId: data.fromLocationId,
          toLocationId: data.toLocationId,
          salesmanId: data.salesmanId,
          assignedToId: data.assignedToId,
          purpose: data.purpose || 'STOCK_MOVE',
          notes: data.notes,
          createdById: data.createdById,
          status: 'CREATED',
          items: {
            create: data.items.map((item) => ({
              itemId: item.itemId,
              qty: item.qty,
            })),
          },
        },
        include: {
          items: { include: { item: true } },
          fromLocation: true,
          toLocation: true,
          assignedTo: { select: { id: true, fullName: true } },
        },
      });

      return { success: true, transfer };
    });
  },

  async findById(id: string) {
    return prisma.transfer.findUnique({
      where: { id },
      include: {
        items: { include: { item: true } },
        fromLocation: true,
        toLocation: true,
        createdBy: true,
      },
    });
  },

  async search(params: TransferSearchParams) {
    const { status, fromLocationId, toLocationId, page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.TransferWhereInput = {};
    if (status) where.status = status;
    if (fromLocationId) where.fromLocationId = fromLocationId;
    if (toLocationId) where.toLocationId = toLocationId;

    const [items, total] = await Promise.all([
      prisma.transfer.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          items: { include: { item: true } },
          fromLocation: true,
          toLocation: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transfer.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  async send(id: string) {
    return prisma.$transaction(async (tx) => {
      const transfer = await tx.transfer.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!transfer) {
        throw new Error('Transfer not found');
      }

      if (transfer.status !== 'CREATED') {
        throw new Error('Transfer can only be sent from CREATED status');
      }

      // Stock is already reserved during creation, so no need to reserve it here again.

      return tx.transfer.update({
        where: { id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
        include: {
          items: { include: { item: true } },
          fromLocation: true,
          toLocation: true,
        },
      });
    });
  },

  async receive(id: string) {
    return prisma.$transaction(async (tx) => {
      const transfer = await tx.transfer.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!transfer) {
        throw new Error('Transfer not found');
      }

      if (transfer.status !== 'SENT') {
        throw new Error('Transfer can only be received from SENT status');
      }

      for (const item of transfer.items) {
        // Deduct from source (and release reservation) with version tracking
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
            version: { increment: 1 },
          },
        });

        // Add to destination with version tracking
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
            version: 0,
          },
          update: {
            qty: { increment: Number(item.qty) },
            version: { increment: 1 },
          },
        });
      }

      return tx.transfer.update({
        where: { id },
        data: {
          status: 'RECEIVED',
          receivedAt: new Date(),
        },
        include: {
          items: { include: { item: true } },
          fromLocation: true,
          toLocation: true,
        },
      });
    });
  },

  async cancel(id: string) {
    return prisma.$transaction(async (tx) => {
      const transfer = await tx.transfer.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!transfer) {
        throw new Error('Transfer not found');
      }

      if (transfer.status === 'COMPLETED' || transfer.status === 'RECEIVED') {
        throw new Error('Cannot cancel a received transfer');
      }

      // Release reserved stock if transfer was created or sent (but not completed)
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
              version: { increment: 1 }, // Track version for concurrency
            },
          });
        }
      }

      return tx.transfer.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date(),
        },
        include: {
          items: { include: { item: true } },
          fromLocation: true,
          toLocation: true,
        },
      });
    });
  },
};


// Class-style export for API routes
export const TransferService = {
  list: transferService.search,
  findById: transferService.findById,
  create: transferService.create,
  send: transferService.send,
  receive: transferService.receive,
  cancel: transferService.cancel,
};

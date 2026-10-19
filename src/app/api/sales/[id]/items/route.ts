import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SaleService } from '@/services/sale.service';
import { z } from 'zod';

const addItemSchema = z.object({
  itemId: z.string().uuid(),
  qty: z.number().positive(),
  unitPrice: z.number().positive(),
  locationId: z.string().uuid().optional(),
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
    const validated = addItemSchema.parse(body);

    // Get item to get cost price
    const { prisma } = await import('@/lib/prisma');
    const item = await prisma.item.findUnique({ where: { id: validated.itemId } });
    if (!item) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } }, { status: 404 });
    }

    const saleItem = await SaleService.addItem(params.id, {
      itemId: validated.itemId,
      qty: validated.qty,
      unitPrice: validated.unitPrice,
      costPrice: Number(item.costPrice),
      locationId: validated.locationId,
    });

    return NextResponse.json({ success: true, data: saleItem });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VAL_001', message: 'Validation error', details: error.flatten().fieldErrors } }, { status: 400 });
    }
    console.error('Error adding item to sale:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}

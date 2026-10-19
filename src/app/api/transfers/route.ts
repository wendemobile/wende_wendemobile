import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TransferService } from '@/services/transfer.service';
import { z } from 'zod';

const transferItemSchema = z.object({
  itemId: z.string().uuid(),
  qty: z.number().positive(),
});

const createTransferSchema = z.object({
  fromLocationId: z.string().uuid(),
  toLocationId: z.string().uuid(),
  salesmanId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
  purpose: z.enum(['STOCK_MOVE', 'FOR_SALE', 'SHOWROOM', 'RETURN_TO_WAREHOUSE']).default('STOCK_MOVE'),
  items: z.array(transferItemSchema).min(1),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status') || undefined;

    const result = await TransferService.list({ page, pageSize, status: status as any });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error listing transfers:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await request.json();
    const validated = createTransferSchema.parse(body);

    const result = await TransferService.create({
      ...validated,
      createdById: session.user.id,
    });

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: { code: 'CONF_001', message: (result as any).error || 'Failed to create transfer' } 
      }, { status: 409 });
    }

    return NextResponse.json({ success: true, data: (result as any).transfer }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VAL_001', message: 'Validation error', details: error.flatten().fieldErrors } }, { status: 400 });
    }
    console.error('Error creating transfer:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}

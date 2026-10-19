import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { StockService } from '@/services/stock.service';
import { z } from 'zod';

const adjustStockSchema = z.object({
  itemId: z.string().uuid(),
  locationId: z.string().uuid(),
  qty: z.number(),
  reason: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await request.json();
    const validated = adjustStockSchema.parse(body);

    await StockService.adjustStock({
      itemId: validated.itemId,
      locationId: validated.locationId,
      quantity: validated.qty,
      reason: validated.reason,
      userId: session.user.id,
    });

    const result = { message: 'Stock adjusted successfully' };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VAL_001', message: 'Validation error', details: error.flatten().fieldErrors } }, { status: 400 });
    }
    console.error('Error adjusting stock:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}

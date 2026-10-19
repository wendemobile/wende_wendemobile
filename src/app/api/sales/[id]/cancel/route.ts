import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SaleService } from '@/services/sale.service';
import { z } from 'zod';

const cancelSaleSchema = z.object({
  refundAmount: z.number().positive('Refund amount must be positive'),
  refundMethod: z.enum(['CASH', 'MOBILE_TRANSFER', 'CARD']),
  bankAccountId: z.string().uuid().optional(),
});

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

    const body = await request.json();
    const validated = cancelSaleSchema.parse(body);

    const result = await SaleService.cancelSale({
      saleId: params.id,
      refundAmount: validated.refundAmount,
      refundMethod: validated.refundMethod,
      cancelledById: session.user.id,
      bankAccountId: validated.bankAccountId,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VAL_001', message: 'Validation error', details: error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    console.error('Error cancelling sale:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SRV_001', message: error.message || 'Failed to cancel sale' } },
      { status: 500 }
    );
  }
}

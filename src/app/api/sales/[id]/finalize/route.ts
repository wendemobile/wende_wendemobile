import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SaleService } from '@/services/sale.service';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';

const PaymentMethodEnum = z.enum(['CASH', 'MOBILE_TRANSFER', 'CREDIT', 'CARD', 'SPLIT_PAYMENT']);

const paymentSchema = z.object({
  method: PaymentMethodEnum,
  amount: z.number().positive(),
  bankAccountId: z.string().uuid().optional(),
  reference: z.string().optional(),
  dueDate: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
});

const finalizeSchema = z.object({
  payments: z.array(paymentSchema).min(1),
  discount: z.number().min(0).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'sales:write')) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_003', message: 'Forbidden: You do not have permission to finalize sales.' } }, { status: 403 });
    }

    const body = await request.json();
    const validated = finalizeSchema.parse(body);

    const result = await SaleService.finalizeSale(
      params.id,
      validated.payments,
      validated.discount
    );

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: {
          code: result.errorCode || 'CONF_001',
          message: result.error || 'Failed to finalize sale'
        }
      }, { status: 409 });
    }

    return NextResponse.json({ success: true, data: result.sale });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VAL_001', message: 'Validation error', details: error.flatten().fieldErrors } }, { status: 400 });
    }
    console.error('Error finalizing sale:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}

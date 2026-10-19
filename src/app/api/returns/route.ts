import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ReturnService } from '@/services/return.service';
import { z } from 'zod';

const returnPaymentSchema = z.object({
  method: z.enum(['CASH', 'MOBILE_TRANSFER', 'CARD', 'BANK']),
  amount: z.number().positive('Refund amount must be positive'),
  bankAccountId: z.string().uuid().optional().nullable(),
  reference: z.string().optional().nullable(),
});

const returnItemSchema = z.object({
  saleItemId: z.string().uuid(),
  qty: z.number().positive('Quantity must be greater than zero'),
});

const createReturnSchema = z.object({
  saleId: z.string().uuid(),
  items: z.array(returnItemSchema).min(1, 'At least one item must be returned'),
  payments: z.array(returnPaymentSchema).min(1, 'At least one refund payment method is required'),
  returnType: z.enum(['REFUND', 'EXCHANGE', 'STORE_CREDIT']).optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
       return NextResponse.json(
        { success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } },
        { status: 401 }
       );
    }

    // Role-based Access Control: Only ADMIN or CASHIER can process returns
    if (session.user.role !== 'ADMIN' && session.user.role !== 'CASHIER') {
       return NextResponse.json(
        { success: false, error: { code: 'AUTH_003', message: 'Forbidden: Insufficient permissions to process returns' } },
        { status: 403 }
       );
    }

    const body = await request.json();
    
    // Normalize nulls to undefined to satisfy validation if needed, or zod handles it
    const validated = createReturnSchema.parse(body);

    const result = await ReturnService.processReturn({
      saleId: validated.saleId,
      items: validated.items.map(i => ({ saleItemId: i.saleItemId, qty: i.qty })),
      payments: validated.payments.map(p => ({
         method: p.method,
         amount: p.amount,
         bankAccountId: p.bankAccountId || undefined,
         reference: p.reference || undefined
      })),
      returnType: validated.returnType,
      notes: validated.notes,
      processedById: session.user.id
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VAL_001', message: 'Validation error', details: error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    console.error('Error processing return:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SRV_001', message: error.message || 'Failed to process return' } },
      { status: 400 } // using 400 for business logic errors thrown by the service
    );
  }
}

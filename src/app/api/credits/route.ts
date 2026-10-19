import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CreditService } from '@/services/credit.service';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createCreditSchema = z.object({
  customerId: z.string().uuid(),
  principal: z.number().positive(),
  dueDate: z.string().transform(s => new Date(s)),
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
    const customerId = searchParams.get('customerId') || undefined;

    const result = await CreditService.list({ page, pageSize, status: status as any, customerId });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error listing credits:', error);
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
    const validated = createCreditSchema.parse(body);

    // Validate customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: validated.customerId },
    });

    if (!customer) {
      return NextResponse.json({ 
        success: false, 
        error: { code: 'CRD_001', message: 'Customer not found' } 
      }, { status: 400 });
    }

    // Validate due date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (validated.dueDate < today) {
      return NextResponse.json({ 
        success: false, 
        error: { code: 'CRD_002', message: 'Due date cannot be in the past' } 
      }, { status: 400 });
    }

    // Get current active session
    const activeSession = await prisma.dailySession.findFirst({
      where: { status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
    });

    // For manual credits, we need to create a placeholder sale record
    // since the Credit model requires a saleId
    const credit = await prisma.$transaction(async (tx) => {
      // Create a placeholder sale for manual credit
      const placeholderSale = await tx.sale.create({
        data: {
          receiptNumber: `MANUAL-CREDIT-${Date.now()}`,
          customerId: validated.customerId,
          cashierId: session.user.id,
          totalAmount: validated.principal,
          actualAmountPaid: 0, // No payment made yet for credit
          totalCost: 0,
          discount: 0,
          paymentMethod: 'CREDIT',
          status: 'COMPLETED',
          sessionId: activeSession?.id,
          notes: 'Manual credit entry',
        },
      });

      // Create the credit record linked to the placeholder sale
      return tx.credit.create({
        data: {
          customerId: validated.customerId,
          saleId: placeholderSale.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          principal: validated.principal,
          balance: validated.principal, // Initially, balance equals principal
          dueDate: validated.dueDate,
          notes: validated.notes ? `[Manual Credit] ${validated.notes}` : '[Manual Credit]',
          status: 'OPEN',
        },
        include: {
          customer: true,
        },
      });
    });

    return NextResponse.json({ success: true, data: credit }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false, 
        error: { code: 'VAL_001', message: 'Validation error', details: error.flatten().fieldErrors } 
      }, { status: 400 });
    }
    console.error('Error creating credit:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}

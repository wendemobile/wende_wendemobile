import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ExpenseService } from '@/services/expense.service';
import { DashboardService } from '@/services/dashboard.service';
import { z } from 'zod';

const PaymentMethodEnum = z.enum(['CASH', 'MOBILE_TRANSFER', 'CREDIT', 'CARD', 'SPLIT_PAYMENT']);

const createExpenseSchema = z.object({
  amount: z.number().positive(),
  category: z.string().min(1),
  payee: z.string().optional(),
  description: z.string().optional(),
  paymentMethod: PaymentMethodEnum,
  bankAccountId: z.string().uuid().optional(),
  reference: z.string().optional(),
  expenseDate: z.string().transform(s => new Date(s)),
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
    const category = searchParams.get('category') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const result = await ExpenseService.list({
      page,
      pageSize,
      category,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error listing expenses:', error);
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
    const validated = createExpenseSchema.parse(body);

    // Get current active session to link expense
    const { prisma } = await import('@/lib/prisma');
    const activeSession = await prisma.dailySession.findFirst({
      where: { status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
    });

    // Validate cash expenses against available cash balance
    if (validated.paymentMethod === 'CASH') {
      if (!activeSession) {
        return NextResponse.json({ 
          success: false, 
          error: { code: 'EXP_002', message: 'No active session. Please open a session first.' } 
        }, { status: 400 });
      }

      // Get current cash in hand
      const sessionFinancials = await DashboardService.getSessionFinancials();
      const availableCash = sessionFinancials.cashInHand;

      if (validated.amount > availableCash) {
        return NextResponse.json({ 
          success: false, 
          error: { 
            code: 'EXP_001', 
            message: `Insufficient cash balance. Available: $${availableCash.toFixed(2)}, Requested: $${validated.amount.toFixed(2)}` 
          } 
        }, { status: 400 });
      }
    }

    const expense = await ExpenseService.create({
      ...validated,
      createdById: session.user.id,
      sessionId: activeSession?.id, // Link to current session
    });

    return NextResponse.json({ success: true, data: expense }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VAL_001', message: 'Validation error', details: error.flatten().fieldErrors } }, { status: 400 });
    }
    console.error('Error creating expense:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}

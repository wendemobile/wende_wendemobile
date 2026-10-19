import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createIncomeSchema = z.object({
  amount: z.number().positive(),
  category: z.enum(['GIFT', 'REFUND', 'ADJUSTMENT', 'OTHER']),
  description: z.string().optional(),
  reference: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    const where: any = {};
    if (sessionId) where.sessionId = sessionId;

    const incomes = await (prisma as any).specialIncome.findMany({
      where,
      include: { createdBy: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: incomes });
  } catch (error) {
    console.error('Error fetching special incomes:', error);
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
    const validated = createIncomeSchema.parse(body);

    // Get current session
    const currentSession = await prisma.dailySession.findFirst({
      where: { status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
    });

    const income = await (prisma as any).specialIncome.create({
      data: {
        ...validated,
        sessionId: currentSession?.id,
        createdById: session.user.id,
      },
    });

    return NextResponse.json({ success: true, data: income }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VAL_001', message: 'Validation error' } }, { status: 400 });
    }
    console.error('Error creating special income:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDateRange } from '@/lib/utils';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } }, { status: 401 });
    }

    // Get all sales for this session with their payments
    const salesWithPayments = await prisma.sale.findMany({
      where: {
        sessionId: params.id,
        status: { in: ['COMPLETED', 'REFUNDED'] },
      },
      include: { payments: true },
    });

    // Calculate cash from sales (sum of CASH payments)
    let salesTotal = 0;
    let salesCount = salesWithPayments.length;
    for (const sale of salesWithPayments) {
      for (const payment of sale.payments) {
        if (payment.method === 'CASH') {
          salesTotal += Number(payment.amount);
        }
      }
    }

    // Get expenses total (cash only)
    const expenses = await prisma.expense.aggregate({
      where: {
        sessionId: params.id,
        paymentMethod: 'CASH',
      },
      _sum: { amount: true },
    });

    // Target session dates instead of today
    const targetSession = await prisma.dailySession.findUnique({
      where: { id: params.id },
      select: { openedAt: true, closedAt: true },
    });
    
    // Use session boundaries
    let sessionStart = new Date(0);
    let sessionEnd = new Date('2099-12-31T23:59:59.999Z');
    
    if (targetSession) {
      sessionStart = targetSession.openedAt;
      if (targetSession.closedAt) {
        sessionEnd = targetSession.closedAt;
      }
    }

    // Get layaway payments (cash only) for this session
    const layawayPayments = await prisma.layawayPayment.aggregate({
      where: {
        paymentMethod: 'CASH',
        createdAt: {
          gte: sessionStart,
          lte: sessionEnd,
        },
      },
      _sum: { amount: true },
    });

    // Get credit payments (cash only) for this session
    const creditPayments = await prisma.creditPayment.aggregate({
      where: {
        paymentMethod: 'CASH',
        createdAt: {
          gte: sessionStart,
          lte: sessionEnd,
        },
      },
      _sum: { amount: true },
    });

    // Get special incomes
    let specialIncomeTotal = 0;
    try {
      const specialIncomes = await (prisma as any).specialIncome.aggregate({
        where: { sessionId: params.id },
        _sum: { amount: true },
      });
      specialIncomeTotal = Number(specialIncomes._sum?.amount || 0);
    } catch (e) {
      // Model may not exist yet
    }

    return NextResponse.json({
      success: true,
      data: {
        salesTotal,
        salesCount,
        expensesTotal: Number(expenses._sum?.amount || 0),
        layawayPayments: Number(layawayPayments._sum?.amount || 0),
        creditPayments: Number(creditPayments._sum?.amount || 0),
        specialIncomeTotal,
      },
    });
  } catch (error) {
    console.error('Error fetching session stats:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}

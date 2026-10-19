import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDateRange } from '@/lib/utils';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryStartDate = searchParams.get('startDate') || undefined;
    const queryEndDate = searchParams.get('endDate') || undefined;

    const { start: startDate, end: endDate } = getDateRange(queryStartDate, queryEndDate);

    const toLocalISO = (d: Date) => {
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().split('T')[0];
    };

    const startDateStr = queryStartDate || toLocalISO(startDate);
    const endDateStr = queryEndDate || toLocalISO(endDate);

    const [salesData, refundsData, expensesData] = await Promise.all([
      prisma.sale.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { totalAmount: true, totalCost: true },
        _count: true,
      }),
      // Calculate total refunds (cancelled sales and partial refunds if any)
      prisma.sale.aggregate({
        where: {
          OR: [
            { status: 'CANCELLED', cancelledAt: { gte: startDate, lte: endDate } },
            { status: 'COMPLETED', refundAmount: { gt: 0 }, updatedAt: { gte: startDate, lte: endDate } }
          ]
        },
        _sum: { refundAmount: true },
      }),
      prisma.expense.aggregate({
        where: {
          expenseDate: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const rawRevenue = salesData._sum.totalAmount?.toNumber() || 0;
    const rawCost = salesData._sum.totalCost?.toNumber() || 0;
    const totalRefunds = refundsData._sum.refundAmount?.toNumber() || 0;

    // Adjusted Revenue = Sales - Refunds
    const revenue = Math.max(0, rawRevenue - totalRefunds);

    // Adjusted Cost (Optional: if we assume returned items go back to stock, we should deduct their cost from COGS)
    // For now, let's keep COGS as is or assume broken items. 
    // If we want to be precise, we'd need to subtract cost of returned items.
    // Given the complexity of tracking specific return items' cost here without a deep query, we'll assume strict cash based profit analysis for now
    // OR: We can approximate cost reduction proportional to revenue reduction, but that's risky.
    // Better approach: Revenue decreased, Cost stays (loss of item) OR Cost decreases (item back in stock).
    // Let's assume item returned to stock (as per cancellation logic).
    // So we should reduce cost. But we don't have exact cost of refunded items easily here in aggregate.
    // We will stick to Revenue deduction for now as it's the most direct financial impact.

    const grossProfit = Math.round((revenue - rawCost) * 100) / 100;
    const expenses = expensesData._sum.amount?.toNumber() || 0;
    const netProfit = Math.round((grossProfit - expenses) * 100) / 100;
    const profitMargin = revenue > 0 ? Math.round((grossProfit / revenue) * 100 * 100) / 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        period: { startDate: startDateStr, endDate: endDateStr },
        revenue,
        cost: rawCost,
        grossProfit,
        expenses,
        netProfit,
        profitMargin: profitMargin.toFixed(2),
        transactionCount: salesData._count,
        expenseCount: expensesData._count,
        totalRefunds,
      },
    });
  } catch (error) {
    console.error('Error generating profit analysis:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}

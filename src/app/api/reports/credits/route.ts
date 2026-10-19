import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDateRange } from '@/lib/utils';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryStartDate = searchParams.get('startDate');
    const queryEndDate = searchParams.get('endDate');

    const dateFilter: any = {};
    if (queryStartDate || queryEndDate) {
      const { start, end } = getDateRange(queryStartDate || undefined, queryEndDate || undefined);
      dateFilter.gte = start;
      dateFilter.lte = end;
    }

    // Get all credits with their payments
    const credits = await prisma.credit.findMany({
      where: dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {},
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        sale: { select: { receiptNumber: true, totalAmount: true } },
        payments: {
          include: {
            bankAccount: { select: { bankName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate summary
    // NOTE: Database uses OPEN/OVERDUE/CLOSED (not ACTIVE/PAID)
    const summary = {
      totalCredits: credits.length,
      totalCreditAmount: credits.reduce((sum, c) => sum + Number(c.principal), 0),
      totalPaid: credits.reduce((sum, c) => sum + (Number(c.principal) - Number(c.balance)), 0),
      totalOutstanding: credits.reduce((sum, c) => sum + Number(c.balance), 0),
      activeCredits: credits.filter(c => c.status === 'OPEN').length,
      overdueCredits: credits.filter(c => c.status === 'OVERDUE').length,
      paidCredits: credits.filter(c => c.status === 'CLOSED').length,
    };

    // Format credits for display
    const formattedCredits = credits.map(credit => ({
      id: credit.id,
      customerName: credit.customer?.name || 'Unknown',
      customerPhone: credit.customer?.phone || '-',
      receiptNumber: credit.sale?.receiptNumber || '-',
      totalAmount: Number(credit.principal),
      paidAmount: Number(credit.principal) - Number(credit.balance),
      balance: Number(credit.balance),
      status: credit.status,
      dueDate: credit.dueDate,
      createdAt: credit.createdAt,
      payments: credit.payments.map(p => ({
        id: p.id,
        amount: Number(p.amount),
        paymentMethod: p.paymentMethod,
        bankName: p.bankAccount?.bankName || null,
        createdAt: p.createdAt,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: {
        summary,
        credits: formattedCredits,
      },
    });
  } catch (error) {
    console.error('Credits report error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to generate credits report' } },
      { status: 500 }
    );
  }
}

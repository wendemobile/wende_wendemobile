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

    // Get all layaways with their payments and items
    const layaways = await prisma.layaway.findMany({
      where: dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {},
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        items: {
          include: {
            item: { select: { name: true, sku: true } },
          },
        },
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
    const summary = {
      totalLayaways: layaways.length,
      totalLayawayAmount: layaways.reduce((sum, l) => sum + Number(l.totalAmount), 0),
      totalPaid: layaways.reduce((sum, l) => sum + Number(l.paidAmount), 0),
      totalOutstanding: layaways.reduce((sum, l) => sum + Number(l.balanceAmount), 0),
      activeLayaways: layaways.filter(l => l.status === 'ACTIVE').length,
      completedLayaways: layaways.filter(l => l.status === 'COMPLETED').length,
      cancelledLayaways: layaways.filter(l => l.status === 'CANCELLED').length,
    };

    // Format layaways for display
    const formattedLayaways = layaways.map(layaway => ({
      id: layaway.id,
      layawayNumber: layaway.layawayNumber,
      customerName: layaway.customer?.name || 'Unknown',
      customerPhone: layaway.customer?.phone || '-',
      totalAmount: Number(layaway.totalAmount),
      paidAmount: Number(layaway.paidAmount),
      balance: Number(layaway.balanceAmount),
      status: layaway.status,
      createdAt: layaway.createdAt,
      items: layaway.items.map(i => ({
        name: i.item.name,
        sku: i.item.sku,
        qty: Number(i.qty),
        unitPrice: Number(i.unitPrice),
        lineTotal: Number(i.lineTotal),
      })),
      payments: layaway.payments.map(p => ({
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
        layaways: formattedLayaways,
      },
    });
  } catch (error) {
    console.error('Layaways report error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to generate layaways report' } },
      { status: 500 }
    );
  }
}

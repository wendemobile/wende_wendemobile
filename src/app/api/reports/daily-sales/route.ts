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
    // Support both date range (startDate/endDate) and single date
    const queryStartDate = searchParams.get('startDate') || searchParams.get('date') || undefined;
    const queryEndDate = searchParams.get('endDate') || undefined;

    const { start: startDate, end: endDate } = getDateRange(queryStartDate, queryEndDate);

    // Format dates for response
    // We use the ISO string of the local date we constructed, but stripped of time
    const toLocalISO = (d: Date) => {
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().split('T')[0];
    };

    const startDateStr = queryStartDate || toLocalISO(startDate);
    const endDateStr = queryEndDate || toLocalISO(endDate);

    const sales = await prisma.sale.findMany({
      where: {
        status: { in: ['COMPLETED', 'CANCELLED', 'REFUNDED'] },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: { include: { item: true } },
        payments: { include: { bankAccount: true } },
        cashier: true,
        salesman: true,
        customer: true,
        location: true,
        cancelledBy: true,
        returns: { 
          include: { 
            items: { include: { item: true } }, 
            payments: true 
          } 
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const completedSales = sales.filter(s => s.status !== 'CANCELLED');
    const cancelledSales = sales.filter(s => s.status === 'CANCELLED');

    // To prevent ledger confusion on the PDF, Gross Sales must include all originally rung-up prices.
    const grossCompletedSales = completedSales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const grossCancelledSales = cancelledSales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const strictGrossSales = grossCompletedSales + grossCancelledSales;

    const totalCost = completedSales.reduce((sum, s) => sum + Number(s.totalCost), 0);
    
    // For Cancelled sales, we assume the entire totalAmount is refunded/voided to balance the ledger.
    // For Partial Returns, we sum the actual return table amounts.
    const voidedAmounts = grossCancelledSales;
    const partialRefunds = completedSales.reduce((sum, s) => 
      sum + s.returns.reduce((rSum, r) => rSum + Number(r.totalAmount), 0), 0);

    const totalRefunds = voidedAmounts + partialRefunds;
    const netSales = strictGrossSales - totalRefunds; // Now perfectly mathematically sound!

    // Calculate deductions for partially returned items
    const returnedItemsList = completedSales.flatMap(s => 
      s.returns.flatMap(r => 
        r.items.map(ri => {
          const originalSaleItem = s.items.find(si => si.itemId === ri.itemId);
          return {
            qty: Number(ri.qty),
            costPrice: originalSaleItem ? Number(originalSaleItem.costPrice) : 0
          };
        })
      )
    );
    const returnedItemsCost = returnedItemsList.reduce((sum, item) => sum + (item.qty * item.costPrice), 0);
    const returnedItemsCount = returnedItemsList.reduce((sum, item) => sum + item.qty, 0);

    const netCost = totalCost - returnedItemsCost; 
    
    const grossProfit = netSales - netCost;
    const profitMargin = netSales > 0 ? (grossProfit / netSales * 100) : 0;

    const totalTransactions = sales.length;
    
    // Total Items rung up (Gross)
    const grossCompletedItems = completedSales.reduce((sum, s) => sum + s.items.reduce((is, i) => is + Number(i.qty), 0), 0);
    const grossCancelledItems = cancelledSales.reduce((sum, s) => sum + s.items.reduce((is, i) => is + Number(i.qty), 0), 0);
    const totalGrossItems = grossCompletedItems + grossCancelledItems;
    
    // Net items kept
    const netTotalItems = grossCompletedItems - returnedItemsCount;

    const paymentBreakdown = completedSales.reduce((acc, sale) => {
      sale.payments.forEach((p) => {
        const method = p.method;
        acc[method] = (acc[method] || 0) + Number(p.amount);
      });
      return acc;
    }, {} as Record<string, number>);

    // Calculate payment method totals
    const cashTotal = paymentBreakdown['CASH'] || 0;
    const mobileTotal = paymentBreakdown['MOBILE_TRANSFER'] || 0;
    const creditTotal = paymentBreakdown['CREDIT'] || 0;

    return NextResponse.json({
      success: true,
      data: {
        period: { startDate: startDateStr, endDate: endDateStr },
        summary: {
          totalSales: netSales, // Backward compatibility for UI Net Sales card
          grossSales: strictGrossSales,
          totalRefunds,
          totalCost: netCost,
          grossProfit,
          profitMargin,
          totalTransactions,
          totalItems: netTotalItems,
          avgTransactionValue: completedSales.length > 0 ? netSales / completedSales.length : 0,
          cashTotal,
          mobileTotal,
          creditTotal,
        },
        paymentBreakdown,
        sales: sales.map((s) => {
          const saleReturnsTotal = s.returns?.reduce((sum, r) => sum + Number(r.totalAmount), 0) || 0;
          const saleReturnedItemsCost = s.returns?.reduce((sum, r) => {
            return sum + r.items.reduce((itemSum, ri) => {
               const original = s.items.find(si => si.itemId === ri.itemId);
               return itemSum + (Number(ri.qty) * (original ? Number(original.costPrice) : 0));
            }, 0);
          }, 0) || 0;
          
          const netSaleAmount = s.status === 'CANCELLED' ? 0 : Number(s.totalAmount) - saleReturnsTotal;
          const netSaleCost = s.status === 'CANCELLED' ? 0 : Number(s.totalCost) - saleReturnedItemsCost;
          const trueProfit = netSaleAmount - netSaleCost;

          return {
            id: s.id,
            receiptNumber: s.receiptNumber,
            totalAmount: Number(s.totalAmount),
            netAmount: netSaleAmount,
            totalCost: Number(s.totalCost),
            discount: Number(s.discount),
            profit: trueProfit,
            cashier: s.cashier?.fullName || '-',
            salesman: s.salesman?.fullName || null,
            customer: s.customer?.name || 'Walk-in',
            location: s.location?.name || null,
            status: s.status,
            refundAmount: Number(s.refundAmount || 0),
            refundMethod: s.refundMethod || null,
            cancelledBy: s.cancelledBy?.fullName || null,
            returns: s.returns?.map(r => ({
               returnNumber: r.returnNumber,
               totalAmount: Number(r.totalAmount),
               refundMethod: r.refundMethod || 'CASH',
               items: r.items.map((ri: any) => ({
                  name: ri.item?.name || 'Unknown Item',
                  qty: Number(ri.qty)
               }))
            })) || [],
            createdAt: s.createdAt,
            items: s.items.map((i) => ({
              name: i.item.name,
              qty: Number(i.qty),
              unitPrice: Number(i.unitPrice),
              costPrice: Number(i.costPrice),
              lineTotal: Number(i.lineTotal),
            })),
            payments: s.payments.map((p) => ({
              method: p.method,
              amount: Number(p.amount),
              bankName: p.bankAccount?.bankName || null,
            })),
          };
        }),
      },
    });
  } catch (error) {
    console.error('Error generating daily sales report:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}

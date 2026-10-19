import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDateRange } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate') || undefined;
    const endDateParam = searchParams.get('endDate') || undefined;
    const sessionIdParam = searchParams.get('sessionId') || undefined;

    const isSessionMode = !!sessionIdParam;

    let targetSession: any = null;
    let sessionStart: Date;
    let sessionEnd: Date;
    let openingBalance = 0;

    if (isSessionMode) {
      targetSession = await prisma.dailySession.findUnique({
        where: { id: sessionIdParam },
      });

      if (!targetSession) {
        return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } }, { status: 404 });
      }

      openingBalance = Number(targetSession.openingCashBalance || 0);
      sessionStart = targetSession.openedAt;
      sessionEnd = targetSession.closedAt || new Date('2099-12-31T23:59:59.999Z');
    } else {
      const { start, end: endRange } = getDateRange(startDateParam, endDateParam);
      sessionStart = start;
      sessionEnd = endRange;

      const latestSession = await prisma.dailySession.findFirst({
        where: {
          OR: [
            { openedAt: { gte: start, lte: endRange } },
            { closedAt: { gte: start, lte: endRange } },
            { AND: [{ openedAt: { lte: start } }, { OR: [{ closedAt: { gte: endRange } }, { closedAt: null }] }] },
          ],
        },
        orderBy: { openedAt: 'desc' },
      });

      if (latestSession) {
        openingBalance = Number(latestSession.openingCashBalance || 0);
        targetSession = latestSession;
      }
    }

    // ===================== WHERE CLAUSES =====================
    // For payments: ALL payments created during this timeframe, regardless of current sale status.
    const completedPaymentWhere = { 
      createdAt: { gte: sessionStart!, lte: sessionEnd! } 
    };

    // For cancelled sales: we need to find sales that were physically cancelled during this timeframe
    const cancelledSaleWhere = { 
      cancelledAt: { gte: sessionStart!, lte: sessionEnd! }, 
      status: 'CANCELLED' as const 
    };

    const expenseWhere = isSessionMode
      ? { sessionId: sessionIdParam, category: { not: 'REFUND' } }
      : { createdAt: { gte: sessionStart!, lte: sessionEnd! }, category: { not: 'REFUND' } };

    const specialIncomeWhere = isSessionMode
      ? { sessionId: sessionIdParam }
      : { createdAt: { gte: sessionStart!, lte: sessionEnd! } };

    const fundTransferWhere = isSessionMode
      ? { sessionId: sessionIdParam }
      : { createdAt: { gte: sessionStart!, lte: sessionEnd! } };

    const timeRangeWhere = { createdAt: { gte: sessionStart!, lte: sessionEnd! } };

    // ===================== PARALLEL FETCH =====================
    const [
      completedPayments,
      cancelledSales,
      partialReturns,
      expenses,
      specialIncomes,
      layawayPayments,
      creditPayments,
      fundTransfers
    ] = await Promise.all([
      // 1. INFLOW: Payments from COMPLETED sales ONLY (matches dashboard)
      prisma.payment.findMany({
        where: completedPaymentWhere,
        include: {
          sale: {
            include: {
              customer: { select: { name: true } },
              salesman: { select: { fullName: true } },
              cashier: { select: { fullName: true } },
              location: { select: { name: true } },
              items: {
                include: {
                  item: { select: { name: true } },
                  location: { select: { name: true } }
                }
              },
              payments: {
                include: {
                  bankAccount: { select: { bankName: true } }
                }
              },
            }
          },
          bankAccount: { select: { bankName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // 2. OUTFLOW: Cancelled sales (for display and refund tracking)
      prisma.sale.findMany({
        where: cancelledSaleWhere,
        include: {
          customer: { select: { name: true } },
          salesman: { select: { fullName: true } },
          cashier: { select: { fullName: true } },
          location: { select: { name: true } },
          cancelledBy: { select: { fullName: true } },
          items: {
            include: {
              item: { select: { name: true } },
              location: { select: { name: true } }
            }
          },
          payments: {
            include: {
              bankAccount: { select: { bankName: true } }
            }
          },
        },
        orderBy: { cancelledAt: 'desc' },
      }),

      // 3. OUTFLOW: Partial Returns (from Advanced Return modal)
      prisma.return.findMany({
        where: timeRangeWhere,
        include: {
          sale: { select: { receiptNumber: true } },
          customer: { select: { name: true } },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      }),

      // 4. OUTFLOW: Expenses
      prisma.expense.findMany({
        where: expenseWhere,
        include: {
          bankAccount: true,
          createdBy: { select: { fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // 5. INFLOW: Special Income
      (prisma as any).specialIncome.findMany({
        where: specialIncomeWhere,
        include: { createdBy: { select: { fullName: true } } },
        orderBy: { createdAt: 'desc' },
      }).catch(() => []),

      // 6. INFLOW: Layaway Payments
      prisma.layawayPayment.findMany({
        where: timeRangeWhere,
        include: {
          layaway: { include: { customer: { select: { name: true } } } },
          bankAccount: true,
        },
        orderBy: { createdAt: 'desc' },
      }),

      // 7. INFLOW: Credit Payments
      prisma.creditPayment.findMany({
        where: timeRangeWhere,
        include: {
          credit: { include: { customer: { select: { name: true } } } },
          bankAccount: true,
        },
        orderBy: { createdAt: 'desc' },
      }),

      // 8. TRANSFER: Fund Transfers
      prisma.fundTransfer.findMany({
        where: fundTransferWhere,
        include: {
          sourceBank: { select: { bankName: true } },
          destBank: { select: { bankName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // ===================== AGGREGATION =====================

    // --- SALES REVENUE (only from COMPLETED sales) ---
    let totalCashSales = 0;
    let totalBankSales = 0;
    let totalCreditSales = 0;

    const salesMap = new Map<string, any>();

    completedPayments.forEach((p: any) => {
      const amount = Number(p.amount);
      if (p.method === 'CASH') totalCashSales += amount;
      else if (p.method === 'CREDIT') totalCreditSales += amount;
      else totalBankSales += amount;

      const saleId = p.saleId;
      if (!salesMap.has(saleId)) {
        salesMap.set(saleId, {
          id: saleId,
          receiptNumber: p.sale?.receiptNumber || '-',
          createdAt: p.sale?.createdAt || p.createdAt,
          totalAmount: Number(p.sale?.totalAmount || p.amount),
          salesman: p.sale?.salesman?.fullName || null,
          cashier: p.sale?.cashier?.fullName || null,
          customer: p.sale?.customer?.name || 'Walk-in',
          location: p.sale?.location?.name || null,
          discount: Number(p.sale?.discount || 0),
          status: p.sale?.status || 'COMPLETED',
          items: p.sale?.items?.map((si: any) => ({
            name: si.item?.name || '-',
            qty: Number(si.qty),
            unitPrice: Number(si.unitPrice),
            lineTotal: Number(si.lineTotal),
            originalLocation: si.location?.name || null,
          })) || [],
          payments: [],
        });
      }

      salesMap.get(saleId).payments.push({
        method: p.method,
        amount: amount,
        bankName: p.bankAccount?.bankName || null,
      });
    });

    // Add cancelled sales to the sales list (for display with CANCELLED badge)
    cancelledSales.forEach((sale: any) => {
      salesMap.set(sale.id, {
        id: sale.id,
        receiptNumber: sale.receiptNumber || '-',
        createdAt: sale.createdAt,
        totalAmount: Number(sale.totalAmount),
        salesman: sale.salesman?.fullName || null,
        cashier: sale.cashier?.fullName || null,
        customer: sale.customer?.name || 'Walk-in',
        location: sale.location?.name || null,
        discount: Number(sale.discount || 0),
        status: 'CANCELLED',
        refundAmount: Number(sale.refundAmount || 0),
        refundMethod: sale.refundMethod || null,
        cancelledAt: sale.cancelledAt,
        cancelledBy: sale.cancelledBy?.fullName || null,
        items: sale.items?.map((si: any) => ({
          name: si.item?.name || '-',
          qty: Number(si.qty),
          unitPrice: Number(si.unitPrice),
          lineTotal: Number(si.lineTotal),
          originalLocation: si.location?.name || null,
        })) || [],
        payments: sale.payments?.map((p: any) => ({
          method: p.method,
          amount: Number(p.amount),
          bankName: p.bankAccount?.bankName || null,
        })) || [],
      });
    });

    const formattedSales = Array.from(salesMap.values());

    // --- REFUNDS (outflows) ---
    // IMPORTANT: Because we accurately query INFLOWS by time (even if later cancelled),
    // we must mathematically DEDUCT OUTFLOWS (refunds) when they physically happen (cancelledAt).
    let totalCashRefunds = 0;
    let totalBankRefunds = 0;
    const formattedRefunds: any[] = [];

    // Cancelled sale refunds
    cancelledSales.forEach((sale: any) => {
      const refundAmount = Number(sale.refundAmount || 0);
      if (refundAmount > 0) {
        if (sale.refundMethod === 'CASH') totalCashRefunds += refundAmount;
        else totalBankRefunds += refundAmount;

        formattedRefunds.push({
          id: sale.id,
          receiptNumber: sale.receiptNumber,
          cancelledAt: sale.cancelledAt,
          refundAmount: refundAmount,
          refundMethod: sale.refundMethod || 'CASH',
          customer: sale.customer?.name || 'Walk-in',
          cancelledBy: sale.cancelledBy?.fullName || 'System',
          type: 'FULL_CANCEL',
        });
      }
    });

    // Partial return refunds — these DO affect net cash (sale was COMPLETED, items returned separately)
    partialReturns.forEach((pr: any) => {
      pr.payments.forEach((p: any) => {
        const amount = Number(p.amount);
        if (p.paymentMethod === 'CASH') totalCashRefunds += amount;
        else totalBankRefunds += amount;
      });

      formattedRefunds.push({
        id: pr.id,
        receiptNumber: pr.sale?.receiptNumber || pr.returnNumber,
        cancelledAt: pr.createdAt,
        refundAmount: Number(pr.totalAmount),
        refundMethod: pr.payments[0]?.paymentMethod || 'CASH',
        customer: pr.customer?.name || 'Walk-in',
        cancelledBy: 'Partial Return',
        type: 'PARTIAL_RETURN',
      });
    });

    // --- EXPENSES ---
    let totalCashExpenses = 0;
    let totalBankExpenses = 0;
    expenses.forEach((e: any) => {
      if (e.paymentMethod === 'CASH') totalCashExpenses += Number(e.amount);
      else totalBankExpenses += Number(e.amount);
    });

    // --- OTHER INFLOWS ---
    const totalSpecialIncome = specialIncomes.reduce((sum: number, i: any) => sum + Number(i.amount), 0);

    const totalLayawayPaymentsCash = layawayPayments
      .filter((p: any) => p.paymentMethod === 'CASH')
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    const totalLayawayPaymentsBank = layawayPayments
      .filter((p: any) => p.paymentMethod !== 'CASH')
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    const totalCreditPaymentsCash = creditPayments
      .filter((p: any) => p.paymentMethod === 'CASH')
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    const totalCreditPaymentsBank = creditPayments
      .filter((p: any) => p.paymentMethod !== 'CASH')
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    // --- FUND TRANSFERS ---
    const cashToBank = fundTransfers
      .filter((t: any) => t.type === 'CASH_TO_BANK')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    const bankToCash = fundTransfers
      .filter((t: any) => t.type === 'BANK_TO_CASH')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    // ===================== NET CASH =====================
    // Matches dashboard formula:
    //   Opening + Cash Sales (COMPLETED only) + Special Income + Layaway + Credit + BankToCash
    //   - Cash Expenses - Cash Refunds (cancelled + partial returns) - CashToBank
    const netCashRaw = openingBalance
      + totalCashSales
      + totalSpecialIncome
      + totalLayawayPaymentsCash
      + totalCreditPaymentsCash
      + bankToCash
      - totalCashExpenses
      - totalCashRefunds
      - cashToBank;

    const netCash = Math.round(netCashRaw * 100) / 100;

    // ===================== RESPONSE =====================
    const toLocalISO = (d: Date) => {
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().split('T')[0];
    };

    return NextResponse.json({
      success: true,
      data: {
        period: {
          startDate: startDateParam || toLocalISO(sessionStart!),
          endDate: endDateParam || toLocalISO(sessionEnd!),
        },
        sessionId: targetSession?.id || null,
        sessionMode: isSessionMode,
        sales: formattedSales,
        refunds: formattedRefunds,
        expenses: expenses.map((e: any) => ({
          id: e.id,
          amount: Number(e.amount),
          category: e.category,
          payee: e.payee,
          description: e.description,
          paymentMethod: e.paymentMethod,
          bankName: e.bankAccount?.bankName || null,
          createdBy: e.createdBy.fullName,
          createdAt: e.createdAt,
        })),
        specialIncomes: specialIncomes.map((i: any) => ({
          id: i.id,
          amount: Number(i.amount),
          category: i.category,
          description: i.description,
          createdBy: i.createdBy?.fullName,
          createdAt: i.createdAt,
        })),
        layawayPayments: layawayPayments.map((p: any) => ({
          id: p.id,
          amount: Number(p.amount),
          paymentMethod: p.paymentMethod,
          bankName: p.bankAccount?.bankName || null,
          customerName: p.layaway.customer.name,
          layawayNumber: p.layaway.layawayNumber,
          createdAt: p.createdAt,
        })),
        creditPayments: creditPayments.map((p: any) => ({
          id: p.id,
          amount: Number(p.amount),
          paymentMethod: p.paymentMethod,
          bankName: p.bankAccount?.bankName || null,
          customerName: p.credit?.customerName || p.credit?.customer?.name || 'Unknown',
          createdAt: p.createdAt,
        })),
        fundTransfers: fundTransfers.map((t: any) => ({
          id: t.id,
          type: t.type,
          amount: Number(t.amount),
          sourceBankName: t.sourceBank?.bankName || null,
          destBankName: t.destBank?.bankName || null,
          reference: t.reference,
          createdAt: t.createdAt,
        })),
        summary: {
          openingBalance,
          totalSales: totalCashSales + totalBankSales + totalCreditSales,
          totalCashSales,
          totalBankSales,
          totalCreditSales,
          totalRefunds: totalCashRefunds + totalBankRefunds,
          totalCashRefunds,
          totalBankRefunds,
          totalCancelledSales: cancelledSales.length,
          totalCancelledAmount: cancelledSales.reduce((sum: number, s: any) => sum + Number(s.totalAmount || 0), 0),
          totalRefundedAmount: cancelledSales.reduce((sum: number, s: any) => sum + Number(s.refundAmount || 0), 0)
            + partialReturns.reduce((sum: number, pr: any) => sum + Number(pr.totalAmount || 0), 0),
          totalExpenses: totalCashExpenses + totalBankExpenses,
          totalCashExpenses,
          totalBankExpenses,
          totalSpecialIncome,
          totalLayawayPaymentsCash,
          totalLayawayPaymentsBank,
          totalCreditPaymentsCash,
          totalCreditPaymentsBank,
          cashToBank,
          bankToCash,
          netCash,
        },
      },
    });
  } catch (error) {
    console.error('Error generating reconciliation report:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}

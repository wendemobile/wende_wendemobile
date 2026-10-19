import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DashboardService } from '@/services/dashboard.service';
import { prisma } from '@/lib/prisma';

// GET /api/bank-accounts/[id]/session-transactions - Get session transactions for a bank account
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { id: bankAccountId } = await params;

    // Verify bank account exists
    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
      select: { id: true, bankName: true },
    });

    if (!bankAccount) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Bank account not found' } },
        { status: 404 }
      );
    }

    // Get current active session
    const activeSession = await prisma.dailySession.findFirst({
      where: { status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
    });

    if (!activeSession) {
      // No active session - return empty transactions
      return NextResponse.json({
        success: true,
        data: {
          bankAccountId,
          bankName: bankAccount.bankName,
          hasActiveSession: false,
          transactions: [],
          summary: {
            totalInflow: 0,
            totalOutflow: 0,
            transactionCount: 0,
          },
        },
      });
    }

    // Get session transactions
    const result = await DashboardService.getBankAccountSessionTransactions(
      bankAccountId,
      activeSession.openedAt
    );

    return NextResponse.json({
      success: true,
      data: {
        bankAccountId,
        bankName: bankAccount.bankName,
        hasActiveSession: true,
        sessionStartTime: activeSession.openedAt,
        ...result,
      },
    });
  } catch (error) {
    console.error('Error fetching bank account session transactions:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SRV_001',
          message: 'Failed to fetch session transactions',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}

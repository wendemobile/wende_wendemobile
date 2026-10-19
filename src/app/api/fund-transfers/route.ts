import { NextResponse } from 'next/server';
import { FundTransferService, FundTransferType } from '@/services/fund-transfer.service';
import { withAuth, AuthenticatedRequest } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';

// GET /api/fund-transfers - List fund transfers for current session only (privacy)
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as FundTransferType | null;
    const bankAccountId = searchParams.get('bankAccountId');
    const showAll = searchParams.get('showAll') === 'true'; // For reports only

    // Get current session start time for privacy filtering
    const currentSession = await prisma.dailySession.findFirst({
      where: { status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
    });

    const sessionStart = currentSession?.openedAt || new Date();

    const filters: {
      type?: FundTransferType;
      startDate?: Date;
      endDate?: Date;
      bankAccountId?: string;
    } = {};

    if (type) filters.type = type;
    if (bankAccountId) filters.bankAccountId = bankAccountId;
    
    // Only show current session transfers unless explicitly requesting all (for reports)
    if (!showAll) {
      filters.startDate = sessionStart;
    }

    const transfers = await FundTransferService.getAll(filters);

    return NextResponse.json({
      success: true,
      data: transfers.map((t: { amount: unknown; [key: string]: unknown }) => ({
        ...t,
        amount: Number(t.amount),
      })),
    });
  } catch (error) {
    console.error('Error fetching fund transfers:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SRV_001',
          message: 'Failed to fetch fund transfers',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}, 'finance:read');

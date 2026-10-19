import { NextRequest, NextResponse } from 'next/server';
import { FundTransferService } from '@/services/fund-transfer.service';
import { withAuth, AuthenticatedRequest } from '@/lib/rbac';

// POST /api/fund-transfers/bank-to-bank - Transfer between bank accounts
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    const { amount, sourceBankId, destBankId, reference, notes, sessionId } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VAL_001',
            message: 'Amount must be greater than zero',
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        { status: 400 }
      );
    }

    if (!sourceBankId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VAL_002',
            message: 'Source bank account is required',
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        { status: 400 }
      );
    }

    if (!destBankId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VAL_003',
            message: 'Destination bank account is required',
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        { status: 400 }
      );
    }

    if (sourceBankId === destBankId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VAL_004',
            message: 'Source and destination accounts must be different',
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        { status: 400 }
      );
    }

    const transfer = await FundTransferService.bankToBank({
      amount,
      sourceBankId,
      destBankId,
      reference,
      notes,
      userId: request.user.id,
      sessionId,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...transfer,
        amount: Number(transfer.amount),
      },
    });
  } catch (error) {
    console.error('Error creating bank-to-bank transfer:', error);
    const message = error instanceof Error ? error.message : 'Failed to create transfer';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SRV_001',
          message,
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}, 'finance:write');

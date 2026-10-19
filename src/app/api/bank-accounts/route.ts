import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { bankAccountService } from '@/services/bank-account.service';
import { z } from 'zod';

const createBankAccountSchema = z.object({
  holderName: z.string().min(1),
  bankName: z.string().min(1),
  accountNumber: z.string().min(1),
  initialBalance: z.number().min(0),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } }, { status: 401 });
    }

    const accounts = await bankAccountService.findAll();
    return NextResponse.json({ success: true, data: accounts });
  } catch (error) {
    console.error('Error listing bank accounts:', error);
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
    const validated = createBankAccountSchema.parse(body);

    const account = await bankAccountService.create(validated);
    return NextResponse.json({ success: true, data: account }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VAL_001', message: 'Validation error', details: error.flatten().fieldErrors } }, { status: 400 });
    }
    
    // Handle unique constraint error
    if (error?.code === 'P2002') {
      return NextResponse.json({ success: false, error: { code: 'VAL_002', message: 'Account number already exists' } }, { status: 400 });
    }
    
    console.error('Error creating bank account:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}

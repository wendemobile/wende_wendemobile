import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CreditService } from '@/services/credit.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } }, { status: 401 });
    }

    const overdueCredits = await CreditService.getOverdue();
    return NextResponse.json({ success: true, data: overdueCredits });
  } catch (error) {
    console.error('Error getting overdue credits:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}

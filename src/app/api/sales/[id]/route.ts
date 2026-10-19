import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SaleService } from '@/services/sale.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } }, { status: 401 });
    }

    const sale = await SaleService.getById(params.id);
    if (!sale) {
      return NextResponse.json({ success: false, error: { code: 'NF_001', message: 'Sale not found' } }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: sale });
  } catch (error) {
    console.error('Error getting sale:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}

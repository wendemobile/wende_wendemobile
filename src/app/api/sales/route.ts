import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SaleService } from '@/services/sale.service';
import { z } from 'zod';

const createSaleSchema = z.object({
  locationId: z.string().min(1, 'Location is required'),
  salesmanId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const searchParam = searchParams.get('search') || undefined;
    const sessionOnly = searchParams.get('sessionOnly') === 'true' && !searchParam;

    const result = await SaleService.list({
      page,
      pageSize,
      status: status as any,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      sessionOnly,
      searchQuery: searchParam,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error listing sales:', error);
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
    const validated = createSaleSchema.parse(body);

    const sale = await SaleService.startSale(
      session.user.id,
      validated.locationId,
      validated.salesmanId
    );

    return NextResponse.json({ success: true, data: sale }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VAL_001', message: 'Validation error', details: error.flatten().fieldErrors } }, { status: 400 });
    }
    
    // Handle foreign key constraint error - user session is stale
    if (error?.code === 'P2003' && error?.meta?.field_name?.includes('cashierId')) {
      console.error('Stale session detected - user ID not found in database');
      return NextResponse.json({ 
        success: false, 
        error: { 
          code: 'AUTH_002', 
          message: 'Session expired. Please log out and log back in.' 
        } 
      }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes('No active session found')) {
      return NextResponse.json({ success: false, error: { code: 'NO_SESSION', message: error.message } }, { status: 400 });
    }
    
    console.error('Error creating sale:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}

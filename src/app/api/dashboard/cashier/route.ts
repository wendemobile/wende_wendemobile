import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DashboardService } from '@/services/dashboard.service';
import { withAuth } from '@/lib/rbac';

// GET /api/dashboard/cashier - Get cashier dashboard
export const GET = withAuth(async () => {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { id: userId, defaultLocationId } = session.user;
    const dashboard = await DashboardService.getCashierDashboard(
      userId,
      defaultLocationId || ''
    );

    return NextResponse.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Error fetching cashier dashboard:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SRV_001',
          message: 'Failed to fetch cashier dashboard',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}, 'sales:read');

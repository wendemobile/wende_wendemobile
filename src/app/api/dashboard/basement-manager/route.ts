import { NextResponse } from 'next/server';
import { DashboardService } from '@/services/dashboard.service';
import { withAuth } from '@/lib/rbac';

// GET /api/dashboard/basement-manager - Get basement manager dashboard
export const GET = withAuth(async () => {
  try {
    const dashboard = await DashboardService.getBasementManagerDashboard();

    return NextResponse.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Error fetching basement manager dashboard:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SRV_001',
          message: 'Failed to fetch basement manager dashboard',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}, 'stock:read');

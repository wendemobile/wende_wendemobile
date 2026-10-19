import { NextResponse } from 'next/server';
import { DashboardService } from '@/services/dashboard.service';
import { withAuth } from '@/lib/rbac';

// GET /api/dashboard/admin - Get admin dashboard
export const GET = withAuth(async () => {
  try {
    const dashboard = await DashboardService.getAdminDashboard();

    return NextResponse.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SRV_001',
          message: 'Failed to fetch admin dashboard',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}, 'reports:view');

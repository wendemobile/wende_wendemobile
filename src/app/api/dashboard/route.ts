import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DashboardService } from '@/services/dashboard.service';

// GET /api/dashboard - Get dashboard based on user role
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_001',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        { status: 401 }
      );
    }

    const { role, id: userId, defaultLocationId } = session.user;
    
    // Get session financials for all roles that need financial data
    const sessionFinancials = await DashboardService.getSessionFinancials();
    
    let dashboardData;

    switch (role) {
      case 'ADMIN':
        dashboardData = await DashboardService.getAdminDashboard();
        break;
      case 'CASHIER':
        dashboardData = await DashboardService.getCashierDashboard(
          userId,
          defaultLocationId || ''
        );
        break;
      case 'SALESMAN':
        dashboardData = await DashboardService.getSalesmanDashboard(userId);
        break;
      case 'BASEMENT_MANAGER':
        dashboardData = await DashboardService.getBasementManagerDashboard();
        break;
      default:
        // Default to a minimal dashboard
        dashboardData = { message: 'Dashboard not configured for this role' };
    }

    return NextResponse.json({
      success: true,
      data: {
        role,
        sessionFinancials,
        ...dashboardData,
      },
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30', // Cache for 30 seconds
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SRV_001',
          message: 'Failed to fetch dashboard',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}

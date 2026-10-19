import { NextRequest, NextResponse } from 'next/server';
import { ErrorService } from '@/services/error.service';
import { withAuth, AuthenticatedRequest } from '@/lib/rbac';

// GET /api/error-logs/stats - Get error statistics
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days');

    const stats = await ErrorService.getErrorStats(days ? parseInt(days, 10) : 7);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching error stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SRV_001',
          message: 'Failed to fetch error statistics',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}, 'audit:read');

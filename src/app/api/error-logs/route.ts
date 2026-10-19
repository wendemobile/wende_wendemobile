import { NextRequest, NextResponse } from 'next/server';
import { ErrorService, ErrorSeverity } from '@/services/error.service';
import { withAuth, AuthenticatedRequest } from '@/lib/rbac';

// GET /api/error-logs - List error logs with filters
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity') as ErrorSeverity | null;
    const component = searchParams.get('component');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const resolved = searchParams.get('resolved');
    const limit = searchParams.get('limit');

    const filters: {
      severity?: ErrorSeverity;
      component?: string;
      startDate?: Date;
      endDate?: Date;
      resolved?: boolean;
      limit?: number;
    } = {};

    if (severity) filters.severity = severity;
    if (component) filters.component = component;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (resolved !== null) filters.resolved = resolved === 'true';
    if (limit) filters.limit = parseInt(limit, 10);

    const logs = await ErrorService.getErrorLogs(filters);

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('Error fetching error logs:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SRV_001',
          message: 'Failed to fetch error logs',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}, 'audit:read');

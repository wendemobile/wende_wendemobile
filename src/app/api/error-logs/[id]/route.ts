import { NextRequest, NextResponse } from 'next/server';
import { ErrorService } from '@/services/error.service';
import { withAuth, AuthenticatedRequest } from '@/lib/rbac';

// GET /api/error-logs/[id] - Get error log detail
export const GET = withAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;
    const log = await ErrorService.getErrorLogById(id);

    if (!log) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RES_001',
            message: 'Error log not found',
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error('Error fetching error log:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SRV_001',
          message: 'Failed to fetch error log',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}, 'audit:read');

// PATCH /api/error-logs/[id] - Mark error as resolved
export const PATCH = withAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;
    const resolved = await ErrorService.resolveError(id, request.user.id);

    if (!resolved) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RES_001',
            message: 'Error log not found',
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Error marked as resolved',
    });
  } catch (error) {
    console.error('Error resolving error log:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SRV_001',
          message: 'Failed to resolve error',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}, 'audit:read');

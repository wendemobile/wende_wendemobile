import { NextResponse } from 'next/server';
import { z } from 'zod';
import { LocationService } from '@/services/location.service';
import { withAuth } from '@/lib/rbac';

const updateLocationSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['SHOWROOM', 'BASEMENT', 'WAREHOUSE', 'STORE']).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/locations/[id] - Get location by ID
export const GET = withAuth(async (
  req: Request,
  { params }: { params: { id: string } }
) => {
  try {
    const location = await LocationService.getLocationById(params.id);

    if (!location) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NF_001',
            message: 'Location not found',
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        { status: 404 }
      );
    }

    // Get stats
    const stats = await LocationService.getLocationStats(params.id);

    return NextResponse.json({
      success: true,
      data: { ...location, stats },
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SRV_001',
          message: 'Failed to fetch location',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}, 'locations:read');

// PUT /api/locations/[id] - Update location
export const PUT = withAuth(async (
  req: Request,
  { params }: { params: { id: string } }
) => {
  try {
    const body = await req.json();
    const validatedData = updateLocationSchema.parse(body);

    const location = await LocationService.updateLocation(params.id, validatedData);

    return NextResponse.json({
      success: true,
      data: location,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VAL_001',
            message: 'Validation failed',
            details: error.flatten().fieldErrors,
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        { status: 400 }
      );
    }

    console.error('Error updating location:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SRV_001',
          message: 'Failed to update location',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}, 'locations:write');

// DELETE /api/locations/[id] - Deactivate location
export const DELETE = withAuth(async (
  req: Request,
  { params }: { params: { id: string } }
) => {
  try {
    await LocationService.deactivateLocation(params.id);

    return NextResponse.json({
      success: true,
      data: { message: 'Location deactivated successfully' },
    });
  } catch (error) {
    console.error('Error deactivating location:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SRV_001',
          message: 'Failed to deactivate location',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}, 'locations:delete');

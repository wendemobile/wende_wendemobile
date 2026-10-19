import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Permission check
    const userRole = session.user?.role;
    if (!userRole || !hasPermission(userRole, 'reports:inventory')) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_002', message: 'Forbidden' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId') || undefined;

    // Validate locationId if provided
    if (locationId) {
      const location = await prisma.location.findUnique({
        where: { id: locationId },
      });
      if (!location) {
        return NextResponse.json(
          { success: false, error: { code: 'VAL_001', message: 'Invalid location ID' } },
          { status: 400 }
        );
      }
    }

    // Query items with stock information
    const items = await prisma.item.findMany({
      where: {
        isActive: true,
        stocks: locationId
          ? { some: { locationId, qty: { gt: 0 } } }
          : { some: { qty: { gt: 0 } } },
      },
      include: {
        stocks: locationId
          ? { where: { locationId } }
          : true,
      },
      orderBy: { name: 'asc' },
    });

    // Get location name if filtering by location
    let locationName: string | undefined;
    if (locationId) {
      const location = await prisma.location.findUnique({
        where: { id: locationId },
        select: { name: true },
      });
      locationName = location?.name;
    }

    // Transform items to report format
    const reportItems = items
      .map((item) => {
        const stockQuantity = locationId
          ? item.stocks[0]?.qty.toNumber() || 0
          : item.stocks.reduce((sum, s) => sum + s.qty.toNumber(), 0);

        return {
          id: item.id,
          sku: item.sku,
          name: item.name,
          barcode: item.barcode,
          unitPrice: item.unitPrice.toNumber(),
          unitOfMeasure: item.unitOfMeasure,
          stockQuantity: Math.floor(stockQuantity), // Round down to whole units
        };
      })
      .filter((item) => item.stockQuantity > 0);

    // Calculate total labels
    const totalLabels = reportItems.reduce((sum, item) => sum + item.stockQuantity, 0);

    return NextResponse.json({
      success: true,
      data: {
        items: reportItems,
        totalLabels,
        locationName,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error generating bulk QR labels report:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SRV_001', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

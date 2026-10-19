import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/rbac';

// GET /api/items/brands - Get all unique brands
export const GET = withAuth(async () => {
  try {
    const brands = await prisma.item.findMany({
      where: { isActive: true, brand: { not: null } },
      select: { brand: true },
      distinct: ['brand'],
      orderBy: { brand: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: brands.map(b => b.brand).filter(Boolean),
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SRV_001', message: 'Failed to fetch brands' } },
      { status: 500 }
    );
  }
}, 'items:read');

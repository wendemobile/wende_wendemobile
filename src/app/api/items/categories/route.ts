import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/rbac';

// GET /api/items/categories - Get all unique categories
export const GET = withAuth(async () => {
  try {
    const categories = await prisma.item.findMany({
      where: { isActive: true, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: categories.map(c => c.category).filter(Boolean),
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SRV_001', message: 'Failed to fetch categories' } },
      { status: 500 }
    );
  }
}, 'items:read');

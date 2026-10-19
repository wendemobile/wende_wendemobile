import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } }, { status: 401 });
    }

    const [items, locations, lowStockItems] = await Promise.all([
      prisma.item.findMany({
        where: { isActive: true },
        include: {
          stocks: { include: { location: true } },
        },
      }),
      prisma.location.findMany({
        where: { isActive: true },
        include: {
          stocks: { include: { item: true } },
        },
      }),
      prisma.stock.findMany({
        where: {
          item: { isActive: true },
        },
        include: { item: true, location: true },
      }),
    ]);

    const totalItems = items.length;
    const totalStockValue = items.reduce((sum, item) => {
      const totalQty = item.stocks.reduce((s, stock) => s + stock.qty.toNumber(), 0);
      return sum + totalQty * item.costPrice.toNumber();
    }, 0);

    const lowStock = lowStockItems.filter(
      (s) => s.qty.toNumber() <= s.item.minStock.toNumber()
    );

    const stockByLocation = locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      type: loc.type,
      itemCount: loc.stocks.length,
      totalValue: loc.stocks.reduce(
        (sum, s) => sum + s.qty.toNumber() * s.item.costPrice.toNumber(),
        0
      ),
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalItems,
        totalStockValue,
        lowStockCount: lowStock.length,
        stockByLocation,
        lowStockItems: lowStock.map((s) => ({
          itemId: s.item.id,
          sku: s.item.sku,
          name: s.item.name,
          location: s.location.name,
          currentQty: s.qty.toNumber(),
          minStock: s.item.minStock.toNumber(),
        })),
      },
    });
  } catch (error) {
    console.error('Error generating inventory report:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}

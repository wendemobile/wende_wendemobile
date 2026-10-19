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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, data: { items: [], customers: [], sales: [], transfers: [] } });
    }

    const [items, customers, sales, transfers] = await Promise.all([
      prisma.item.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { sku: { contains: query, mode: 'insensitive' } },
            { barcode: { contains: query, mode: 'insensitive' } },
            { brand: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, name: true, sku: true, barcode: true, unitPrice: true },
      }),
      prisma.customer.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
            { idNumber: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, name: true, phone: true },
      }),
      prisma.sale.findMany({
        where: {
          receiptNumber: { contains: query, mode: 'insensitive' },
        },
        take: 5,
        select: { id: true, receiptNumber: true, totalAmount: true, createdAt: true },
      }),
      prisma.transfer.findMany({
        where: {
          transferNumber: { contains: query, mode: 'insensitive' },
        },
        take: 5,
        include: { fromLocation: true, toLocation: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { items, customers, sales, transfers },
    });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json({ success: false, error: { code: 'SRV_001', message: 'Internal server error' } }, { status: 500 });
  }
}

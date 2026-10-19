import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true';

    // Get all items with their stock levels
    const items = await prisma.item.findMany({
      where: {
        isActive: true,
        ...(category && category !== 'all' ? { category } : {}),
      },
      include: {
        stocks: {
          include: {
            location: true,
          },
        },
        supplier: {
          select: { name: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Process items with stock info
    const inventoryData = items.map((item) => {
      const totalStock = item.stocks.reduce((sum, s) => sum + Number(s.qty), 0);
      const totalReserved = item.stocks.reduce((sum, s) => sum + Number(s.reservedQty), 0);
      const availableStock = totalStock - totalReserved;
      const stockValue = totalStock * Number(item.costPrice);
      const retailValue = totalStock * Number(item.unitPrice);
      const isLowStock = totalStock <= Number(item.minStock);

      return {
        id: item.id,
        sku: item.sku,
        name: item.name,
        brand: item.brand,
        category: item.category,
        barcode: item.barcode,
        unitPrice: Number(item.unitPrice),
        costPrice: Number(item.costPrice),
        minStock: Number(item.minStock),
        totalStock,
        reservedStock: totalReserved,
        availableStock,
        stockValue,
        retailValue,
        isLowStock,
        supplier: item.supplier?.name || '-',
        stockByLocation: item.stocks.map((s) => ({
          location: s.location.name,
          qty: Number(s.qty),
          reserved: Number(s.reservedQty),
        })),
      };
    });

    // Filter low stock if requested
    const filteredData = lowStockOnly 
      ? inventoryData.filter((item) => item.isLowStock)
      : inventoryData;

    // Calculate summary
    const summary = {
      totalItems: filteredData.length,
      totalStockValue: filteredData.reduce((sum, i) => sum + i.stockValue, 0),
      totalRetailValue: filteredData.reduce((sum, i) => sum + i.retailValue, 0),
      lowStockItems: filteredData.filter((i) => i.isLowStock).length,
      outOfStockItems: filteredData.filter((i) => i.totalStock === 0).length,
      potentialProfit: filteredData.reduce((sum, i) => sum + (i.retailValue - i.stockValue), 0),
    };

    // Get categories for filter
    const categories = await prisma.item.groupBy({
      by: ['category'],
      where: { isActive: true, category: { not: null } },
    });

    return NextResponse.json({
      success: true,
      data: {
        summary,
        items: filteredData,
        categories: categories.map((c) => c.category).filter(Boolean),
      },
    });
  } catch (error) {
    console.error('Inventory status report error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate report' }, { status: 500 });
  }
}

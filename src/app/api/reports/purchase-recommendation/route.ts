import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export async function GET() {
  try {
    // Get all active items with their stock and sales data
    const items = await prisma.item.findMany({
      where: { isActive: true },
      include: {
        stocks: true,
        saleItems: {
          include: {
            sale: {
              select: {
                status: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    // Calculate metrics for each item
    const recommendations = items.map((item) => {
      // Calculate total stock
      const totalStock = item.stocks.reduce(
        (sum, s) => sum + Number(s.qty),
        0
      );

      // Calculate profit margin
      const costPrice = Number(item.costPrice);
      const unitPrice = Number(item.unitPrice);
      const profitPerUnit = unitPrice - costPrice;
      const profitMargin = costPrice > 0 ? (profitPerUnit / costPrice) * 100 : 0;

      // Calculate total sold in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentSales = item.saleItems.filter(
        (si) =>
          si.sale.status === 'COMPLETED' &&
          new Date(si.sale.createdAt) >= thirtyDaysAgo
      );

      const totalSold30Days = recentSales.reduce(
        (sum, si) => sum + Number(si.qty),
        0
      );

      // Calculate total profit from sales
      const totalProfit = recentSales.reduce(
        (sum, si) => sum + (Number(si.unitPrice) - Number(si.costPrice)) * Number(si.qty),
        0
      );

      // Determine stock status
      const minStock = Number(item.minStock);
      const isOutOfStock = totalStock === 0;
      const isLowStock = totalStock > 0 && totalStock <= minStock;

      // Priority score: higher profit margin + low/out of stock = higher priority
      const priorityScore =
        (isOutOfStock ? 100 : isLowStock ? 50 : 0) +
        profitMargin +
        (totalSold30Days * 2);

      return {
        id: item.id,
        sku: item.sku,
        name: item.name,
        brand: item.brand,
        category: item.category,
        costPrice,
        unitPrice,
        profitPerUnit,
        profitMargin: Math.round(profitMargin * 100) / 100,
        totalStock,
        minStock,
        isOutOfStock,
        isLowStock,
        totalSold30Days,
        totalProfit: Math.round(totalProfit * 100) / 100,
        priorityScore: Math.round(priorityScore * 100) / 100,
        suggestedOrderQty: Math.max(minStock * 2 - totalStock, minStock),
      };
    });


    // Filter to only show items that need reordering (low stock or out of stock)
    const filteredRecommendations = recommendations
      .filter((r) => r.isOutOfStock || r.isLowStock)
      .sort((a, b) => b.priorityScore - a.priorityScore);

    // Calculate summary
    const summary = {
      totalItems: filteredRecommendations.length,
      outOfStockItems: filteredRecommendations.filter((r) => r.isOutOfStock).length,
      lowStockItems: filteredRecommendations.filter((r) => r.isLowStock).length,
      avgProfitMargin:
        filteredRecommendations.length > 0
          ? Math.round(
            (filteredRecommendations.reduce((sum, r) => sum + r.profitMargin, 0) /
              filteredRecommendations.length) *
            100
          ) / 100
          : 0,
      totalPotentialProfit: Math.round(
        filteredRecommendations.reduce(
          (sum, r) => sum + r.profitPerUnit * r.suggestedOrderQty,
          0
        ) * 100
      ) / 100,
    };

    return NextResponse.json({
      success: true,
      data: {
        summary,
        items: filteredRecommendations,
      },
    });
  } catch (error) {
    console.error('Purchase recommendation report error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to generate report' } },
      { status: 500 }
    );
  }
}

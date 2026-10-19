import { NextResponse, NextRequest } from 'next/server';
import { getDateRange } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_001', message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryStartDate = searchParams.get('startDate') || undefined;
    const queryEndDate = searchParams.get('endDate') || undefined;
    const locationId = searchParams.get('locationId') || undefined;
    const itemId = searchParams.get('itemId') || undefined;

    const { start, end } = getDateRange(queryStartDate, queryEndDate);

    // Get all active items with their sales AND returns data in the date range
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
          where: {
            sale: {
              status: 'COMPLETED',
              createdAt: {
                gte: start,
                lte: end,
              },
            },
          },
        },
        returnItems: {
          include: {
            return: {
              select: {
                createdAt: true,
              }
            }
          },
          where: {
            return: {
              createdAt: {
                gte: start,
                lte: end,
              }
            }
          }
        }
      },
    });

    // Calculate days in range
    const daysInRange = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    // Calculate movement metrics for each item
    const movementData = items.map((item) => {
      // Total stock
      const totalStock = item.stocks.reduce((sum, s) => sum + Number(s.qty), 0);

      // Total quantity sold in the period
      const grossSold = item.saleItems.reduce((sum, si) => sum + Number(si.qty), 0);

      // Total quantity returned in the period
      const totalReturned = item.returnItems.reduce((sum, ri) => sum + Number(ri.qty), 0);

      // Net Sold = Sold - Returned
      const totalSold = Math.max(0, grossSold - totalReturned);

      // Total revenue from sales (Gross)
      const grossRevenue = item.saleItems.reduce((sum, si) => sum + Number(si.lineTotal), 0);

      // Revenue lost from returns (Approximation based on current price if not stored, 
      // but ReturnItem usually stores unitPrice. Let's assume it does as per schema)
      const returnValue = item.returnItems.reduce((sum, ri) => sum + Number(ri.lineTotal), 0);

      const totalRevenue = Math.max(0, grossRevenue - returnValue);

      // Total profit
      // Profit = (Sold * (Price - Cost)) - (Returned * (Price - Cost))
      // Simplified: NetSold * (AvgPrice - Cost) 
      // More accurate: Sum of individual sale profits - Sum of individual return profits

      const saleProfit = item.saleItems.reduce(
        (sum, si) => sum + (Number(si.unitPrice) - Number(si.costPrice)) * Number(si.qty),
        0
      );

      const returnLoss = item.returnItems.reduce(
        (sum, ri) => sum + (Number(ri.unitPrice) - Number(item.costPrice)) * Number(ri.qty),
        0
      );

      const totalProfit = saleProfit - returnLoss;

      // Number of transactions (Sales + Returns)
      const transactionCount = item.saleItems.length + item.returnItems.length;

      // Average daily sales
      const avgDailySales = totalSold / daysInRange;

      // Days of stock remaining (if avgDailySales > 0)
      const daysOfStockRemaining = avgDailySales > 0 ? totalStock / avgDailySales : totalStock > 0 ? 999 : 0;

      // Movement category based on average daily sales
      let movementCategory: 'FAST' | 'NORMAL' | 'SLOW' | 'VERY_SLOW' | 'NO_MOVEMENT';
      if (avgDailySales >= 1) {
        movementCategory = 'FAST';
      } else if (avgDailySales >= 0.5) {
        movementCategory = 'NORMAL';
      } else if (avgDailySales >= 0.1) {
        movementCategory = 'SLOW';
      } else if (totalSold > 0) {
        movementCategory = 'VERY_SLOW';
      } else {
        movementCategory = 'NO_MOVEMENT';
      }

      return {
        id: item.id,
        sku: item.sku,
        name: item.name,
        brand: item.brand,
        category: item.category,
        costPrice: Number(item.costPrice),
        unitPrice: Number(item.unitPrice),
        totalStock,
        minStock: Number(item.minStock),
        totalSold,
        returned: totalReturned,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        transactionCount,
        avgDailySales: Math.round(avgDailySales * 100) / 100,
        daysOfStockRemaining: Math.round(daysOfStockRemaining),
        movementCategory,
      };
    });


    // Sort by total sold (descending)
    movementData.sort((a, b) => b.totalSold - a.totalSold);

    // Group by movement category
    const fastMoving = movementData.filter((i) => i.movementCategory === 'FAST');
    const normalMoving = movementData.filter((i) => i.movementCategory === 'NORMAL');
    const slowMoving = movementData.filter((i) => i.movementCategory === 'SLOW');
    const verySlowMoving = movementData.filter((i) => i.movementCategory === 'VERY_SLOW');
    const noMovement = movementData.filter((i) => i.movementCategory === 'NO_MOVEMENT');

    // Calculate summary
    const summary = {
      totalItems: movementData.length,
      daysInRange,
      fastMovingCount: fastMoving.length,
      normalMovingCount: normalMoving.length,
      slowMovingCount: slowMoving.length,
      verySlowMovingCount: verySlowMoving.length,
      noMovementCount: noMovement.length,
      totalUnitsSold: Math.round(movementData.reduce((sum, i) => sum + i.totalSold, 0) * 100) / 100,
      totalRevenue: Math.round(movementData.reduce((sum, i) => sum + i.totalRevenue, 0) * 100) / 100,
      totalProfit: Math.round(movementData.reduce((sum, i) => sum + i.totalProfit, 0) * 100) / 100,
      avgDailySalesAll: Math.round(
        (movementData.reduce((sum, i) => sum + i.avgDailySales, 0) / Math.max(1, movementData.length)) * 100
      ) / 100,
    };

    return NextResponse.json({
      success: true,
      data: {
        summary,
        fastMoving,
        normalMoving,
        slowMoving,
        verySlowMoving,
        noMovement,
        allItems: movementData,
      },
    });
  } catch (error) {
    console.error('Inventory movement report error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to generate report' } },
      { status: 500 }
    );
  }
}

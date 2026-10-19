import { NextRequest, NextResponse } from 'next/server';
import { getDateRange } from '@/lib/utils';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryStartDate = searchParams.get('startDate') || undefined;
    const queryEndDate = searchParams.get('endDate') || undefined;

    const { start, end } = getDateRange(queryStartDate, queryEndDate);

    // Get item-related audit logs (CREATE, UPDATE actions on Item entity)
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityType: 'Item',
        action: { in: ['CREATE', 'UPDATE'] },
        createdAt: { gte: start, lte: end },
      },
      include: {
        user: {
          select: { fullName: true, username: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Process audit logs to extract meaningful changes
    const adjustments = auditLogs.map((log) => {
      const oldValues = log.oldValues as Record<string, any> | null;
      const newValues = log.newValues as Record<string, any> | null;

      let changes: string[] = [];
      let itemName = String(newValues?.name || oldValues?.name || 'Unknown Item');
      let itemSku = String(newValues?.sku || oldValues?.sku || '-');

      // Helper to safely convert any value to a display string
      const safeVal = (val: any): string => {
        if (val === null || val === undefined) return '-';
        if (typeof val === 'object' && val.toString) return val.toString();
        return String(val);
      };

      if (log.action === 'CREATE') {
        changes.push('Item Created');
        if (newValues?.unitPrice) changes.push(`Price: ${safeVal(newValues.unitPrice)} ETB`);
        if (newValues?.costPrice) changes.push(`Cost: ${safeVal(newValues.costPrice)} ETB`);
      } else if (log.action === 'UPDATE' && oldValues && newValues) {
        // Track specific field changes — use > instead of → (Unicode causes corrupted text in PDF)
        if (safeVal(oldValues.unitPrice) !== safeVal(newValues.unitPrice)) {
          changes.push(`Price: ${safeVal(oldValues.unitPrice)} > ${safeVal(newValues.unitPrice)} ETB`);
        }
        if (safeVal(oldValues.costPrice) !== safeVal(newValues.costPrice)) {
          changes.push(`Cost: ${safeVal(oldValues.costPrice)} > ${safeVal(newValues.costPrice)} ETB`);
        }
        if (safeVal(oldValues.name) !== safeVal(newValues.name)) {
          changes.push(`Name: ${safeVal(oldValues.name)} > ${safeVal(newValues.name)}`);
          itemName = safeVal(newValues.name);
        }
        if (safeVal(oldValues.minStock) !== safeVal(newValues.minStock)) {
          changes.push(`Min Stock: ${safeVal(oldValues.minStock)} > ${safeVal(newValues.minStock)}`);
        }
        if (safeVal(oldValues.category) !== safeVal(newValues.category)) {
          changes.push(`Category: ${safeVal(oldValues.category) || 'None'} > ${safeVal(newValues.category) || 'None'}`);
        }
        if (safeVal(oldValues.brand) !== safeVal(newValues.brand)) {
          changes.push(`Brand: ${safeVal(oldValues.brand) || 'None'} > ${safeVal(newValues.brand) || 'None'}`);
        }
        if (oldValues.isActive !== newValues.isActive) {
          changes.push(newValues.isActive ? 'Activated' : 'Deactivated');
        }
      }

      return {
        id: log.id,
        action: log.action,
        itemId: log.entityId,
        itemName,
        itemSku,
        changes,
        changesText: changes.join(', ') || 'No significant changes',
        user: log.user?.fullName || log.user?.username || 'System',
        createdAt: log.createdAt,
      };
    });

    // Get stock-related audit logs (including STOCK_ADJUSTMENT, UPDATE, CREATE on Stock entity)
    const stockLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { entityType: 'Stock', action: 'STOCK_ADJUSTMENT' },
          { entityType: 'Stock', action: 'UPDATE' },
          { entityType: 'Stock', action: 'CREATE' },
        ],
        createdAt: { gte: start, lte: end },
      },
      include: {
        user: {
          select: { fullName: true, username: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Process stock adjustments
    const stockAdjustments = await Promise.all(
      stockLogs.map(async (log) => {
        const oldValues = log.oldValues as Record<string, any> | null;
        const newValues = log.newValues as Record<string, any> | null;

        // First try to get item/location from the audit log values (more reliable)
        let itemName = newValues?.itemName || oldValues?.itemName || 'Unknown Item';
        let itemSku = newValues?.itemSku || oldValues?.itemSku || '-';
        let locationName = newValues?.locationName || oldValues?.locationName || '-';
        let reason = newValues?.reason || '-';

        // If not in audit log, try to get from database
        if ((itemName === 'Unknown Item' || locationName === '-') && log.entityId) {
          try {
            const stock = await prisma.stock.findUnique({
              where: { id: log.entityId },
              include: { item: true, location: true },
            });
            if (stock) {
              itemName = stock.item.name;
              itemSku = stock.item.sku;
              locationName = stock.location.name;
            }
          } catch {
            // Stock might have been deleted, use values from audit log
          }
        }

        let qtyChange = 0;
        let oldQty = 0;
        let newQty = 0;
        let changeType = log.action;

        if (log.action === 'STOCK_ADJUSTMENT') {
          // For stock adjustments, use the adjustmentAmount or calculate from qty
          oldQty = Number(oldValues?.qty) || 0;
          newQty = Number(newValues?.qty) || 0;
          qtyChange = newValues?.adjustmentAmount || (newQty - oldQty);
          changeType = qtyChange > 0 ? 'STOCK_IN' : qtyChange < 0 ? 'STOCK_OUT' : 'ADJUSTMENT';
        } else if (oldValues && newValues) {
          oldQty = Number(oldValues.qty) || 0;
          newQty = Number(newValues.qty) || 0;
          qtyChange = newQty - oldQty;
          changeType = qtyChange > 0 ? 'STOCK_IN' : qtyChange < 0 ? 'STOCK_OUT' : 'UPDATE';
        } else if (log.action === 'CREATE' && newValues) {
          newQty = Number(newValues.qty) || 0;
          qtyChange = newQty;
          changeType = 'STOCK_IN';
        }

        return {
          id: log.id,
          action: changeType,
          itemName,
          itemSku,
          location: locationName,
          reason,
          oldQty,
          newQty,
          qtyChange,
          user: log.user?.fullName || log.user?.username || 'System',
          createdAt: log.createdAt,
        };
      })
    );

    // Summary
    const summary = {
      totalItemChanges: adjustments.length,
      itemsCreated: adjustments.filter((a) => a.action === 'CREATE').length,
      itemsUpdated: adjustments.filter((a) => a.action === 'UPDATE').length,
      totalStockChanges: stockAdjustments.length,
      stockIn: stockAdjustments.filter((s) => s.qtyChange > 0).reduce((sum, s) => sum + s.qtyChange, 0),
      stockOut: Math.abs(stockAdjustments.filter((s) => s.qtyChange < 0).reduce((sum, s) => sum + s.qtyChange, 0)),
    };

    return NextResponse.json({
      success: true,
      data: {
        summary,
        itemAdjustments: adjustments,
        stockAdjustments: stockAdjustments.filter((s) => s.qtyChange !== 0),
      },
    });
  } catch (error) {
    console.error('Stock adjustment report error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate report' }, { status: 500 });
  }
}

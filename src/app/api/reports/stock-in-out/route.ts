import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!hasPermission(session.user.role, 'reports:view') && !['ADMIN', 'BASEMENT_MANAGER'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        const startDate = startDateParam
            ? new Date(new Date(startDateParam).setHours(0, 0, 0, 0))
            : new Date(new Date().setHours(0, 0, 0, 0));
        const endDate = endDateParam
            ? new Date(new Date(endDateParam).setHours(23, 59, 59, 999))
            : new Date(new Date().setHours(23, 59, 59, 999));

        // 1. Get Sales (Items Out)
        const sales = await prisma.saleItem.findMany({
            where: {
                sale: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                    status: 'COMPLETED',
                },
            },
            include: {
                sale: {
                    select: {
                        createdAt: true,
                        receiptNumber: true,
                        cashier: { select: { fullName: true } },
                        salesman: { select: { fullName: true } },
                    },
                },
                item: { select: { name: true, sku: true, costPrice: true } },
                location: { select: { name: true } },
            },
            orderBy: { sale: { createdAt: 'desc' } },
        });

        const salesMovements = sales.map((si) => ({
            id: `sale-${si.id}`,
            date: si.sale.createdAt,
            type: 'SALE',
            reference: si.sale.receiptNumber,
            item: si.item.name,
            sku: si.item.sku,
            location: si.location?.name || 'Unknown',
            qtyChange: -Number(si.qty),
            unitPrice: Number(si.unitPrice),
            costPrice: Number(si.item.costPrice),
            stockValue: Number(si.qty) * Number(si.item.costPrice),
            user: si.sale.salesman?.fullName || si.sale.cashier?.fullName || 'Unknown',
        }));

        // 2. Get Transfers (Items In / Out)
        const transfers = await prisma.transferItem.findMany({
            where: {
                transfer: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                    status: 'COMPLETED',
                },
            },
            include: {
                transfer: {
                    select: {
                        createdAt: true,
                        transferNumber: true,
                        fromLocation: { select: { name: true } },
                        toLocation: { select: { name: true } },
                        createdBy: { select: { fullName: true } },
                    },
                },
                item: { select: { name: true, sku: true } },
            },
            orderBy: { transfer: { createdAt: 'desc' } },
        });

        const transferMovements: any[] = [];
        transfers.forEach((ti) => {
            // Out movement
            transferMovements.push({
                id: `transfer-out-${ti.id}`,
                date: ti.transfer.createdAt,
                type: 'TRANSFER_OUT',
                reference: ti.transfer.transferNumber,
                item: ti.item.name,
                sku: ti.item.sku,
                location: ti.transfer.fromLocation.name,
                qtyChange: -Number(ti.qty),
                user: ti.transfer.createdBy.fullName,
            });
            // In movement
            transferMovements.push({
                id: `transfer-in-${ti.id}`,
                date: ti.transfer.createdAt,
                type: 'TRANSFER_IN',
                reference: ti.transfer.transferNumber,
                item: ti.item.name,
                sku: ti.item.sku,
                location: ti.transfer.toLocation.name,
                qtyChange: Number(ti.qty),
                user: ti.transfer.createdBy.fullName,
            });
        });

        // 3. Get Stock Movements from AuditLog (Adjustments, Additions, Cancellations)
        const auditLogs = await prisma.auditLog.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
                action: {
                    in: ['STOCK_ADJUSTMENT', 'STOCK_ADDITION', 'SALE_CANCELLED']
                }
            },
            include: {
                user: { select: { fullName: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const auditMovements: any[] = [];
        auditLogs.forEach((log) => {
            const newValues = log.newValues as any;
            const oldValues = log.oldValues as any;

            if (log.action === 'STOCK_ADJUSTMENT' || log.action === 'STOCK_ADDITION') {
                auditMovements.push({
                    id: `audit-${log.id}`,
                    date: log.createdAt,
                    type: log.action === 'STOCK_ADJUSTMENT' ? 'ADJUSTMENT' : 'ADDITION',
                    reference: newValues?.reason || (log.action === 'STOCK_ADDITION' ? 'Stock Entry' : 'Manual'),
                    item: newValues?.itemName || 'Unknown Item',
                    sku: newValues?.itemSku || '',
                    location: newValues?.locationName || 'Unknown',
                    qtyChange: Number(newValues?.adjustmentAmount || 0),
                    user: log.user?.fullName || 'System',
                });
            } else if (log.action === 'SALE_CANCELLED') {
                // Restoration of stock from cancelled sale is also a movement
                // Note: The audit log doesn't store per-item restoration details in its current form in cancelSale,
                // but it's a "SALE_CANCELLED" event. 
                // A better approach would be to log each restoration, but for now we'll mark the event.
                // Actually, the implementation plan said "Pull SALE_CANCELLED movements from AuditLog".
                // In my cancelSale update, I didn't add detailed per-item restoration logging to the audit log,
                // just the main SALE_CANCELLED action. 
                // Let's improve the AuditLog entry in cancelSale if needed, or just note the cancellation here.
                // For a true ledger, we'd want to see each item restored.
            }
        });

        // 4. Get Cancelled Sales (Items In)
        const cancelledSales = await prisma.saleItem.findMany({
            where: {
                sale: {
                    cancelledAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                    status: 'CANCELLED',
                },
            },
            include: {
                sale: {
                    select: {
                        cancelledAt: true,
                        receiptNumber: true,
                        cancelledBy: { select: { fullName: true } },
                    },
                },
                item: { select: { name: true, sku: true, costPrice: true } },
                location: { select: { name: true } },
            },
            orderBy: { sale: { cancelledAt: 'desc' } },
        });

        const cancellationMovements = cancelledSales.map((si) => ({
            id: `cancel-${si.id}`,
            date: si.sale.cancelledAt!,
            type: 'SALE_CANCELLED',
            reference: `${si.sale.receiptNumber} (Cancelled - Stock Restored)`,
            item: si.item.name,
            sku: si.item.sku,
            location: si.location?.name || 'Unknown',
            qtyChange: Number(si.qty),
            unitPrice: Number(si.unitPrice),
            costPrice: Number(si.item.costPrice),
            stockValue: Number(si.qty) * Number(si.item.costPrice),
            user: si.sale.cancelledBy?.fullName || 'Unknown',
        }));

        // 5. Get Returns (Items In)
        const returns = await prisma.returnItem.findMany({
            where: {
                return: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            },
            include: {
                return: {
                    select: {
                        createdAt: true,
                        returnNumber: true,
                        sale: { select: { receiptNumber: true } },
                    },
                },
                item: { select: { name: true, sku: true, costPrice: true } },
            },
            orderBy: { return: { createdAt: 'desc' } },
        });

        const returnMovements = returns.map((ri) => ({
            id: `return-${ri.id}`,
            date: ri.return.createdAt,
            type: 'RETURN',
            reference: `${ri.return.returnNumber} (Ref: ${ri.return.sale.receiptNumber})`,
            item: ri.item.name,
            sku: ri.item.sku,
            location: 'Main Store',
            qtyChange: Number(ri.qty),
            unitPrice: Number(ri.unitPrice),
            costPrice: Number(ri.item.costPrice),
            stockValue: Number(ri.qty) * Number(ri.item.costPrice),
            user: 'System',
        }));

        // 6. Get Completed Layaways (Items Out)
        const layaways = await prisma.layawayItem.findMany({
            where: {
                layaway: {
                    completedAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                    status: 'COMPLETED',
                },
            },
            include: {
                layaway: {
                    select: {
                        completedAt: true,
                        layawayNumber: true,
                        locationId: true,
                    },
                },
                item: { select: { name: true, sku: true } },
            },
            orderBy: { layaway: { completedAt: 'desc' } },
        });

        // Get location names for layaways
        const locationIds = Array.from(new Set(layaways.map(l => l.layaway.locationId).filter(Boolean))) as string[];
        const locations = await prisma.location.findMany({
            where: { id: { in: locationIds } },
            select: { id: true, name: true },
        });
        const locationMap = new Map(locations.map(l => [l.id, l.name]));

        const layawayMovements = layaways.map((li) => ({
            id: `layaway-${li.id}`,
            date: li.layaway.completedAt!,
            type: 'LAYAWAY_COMPLETED',
            reference: li.layaway.layawayNumber,
            item: li.item.name,
            sku: li.item.sku,
            location: (li.layaway.locationId && locationMap.get(li.layaway.locationId)) || 'Unknown',
            qtyChange: -Number(li.qty),
            user: 'System',
        }));

        // Combine and sort
        const allMovements = [
            ...salesMovements,
            ...transferMovements,
            ...auditMovements,
            ...cancellationMovements,
            ...returnMovements,
            ...layawayMovements,
        ].sort((a, b) => b.date.getTime() - a.date.getTime());

        return NextResponse.json({ success: true, data: allMovements });
    } catch (error) {
        console.error('Error fetching stock in/out report:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

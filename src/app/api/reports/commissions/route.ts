import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Parse query params
        const searchParams = request.nextUrl.searchParams;
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        const userId = searchParams.get('userId');

        const where: any = {
            status: { not: 'CANCELLED' }
        };

        // Date filtering on createdAt
        if (startDateParam || endDateParam) {
            where.createdAt = {};
            if (startDateParam) where.createdAt.gte = new Date(startDateParam);
            if (endDateParam) {
                // Set to end of day if only date string provided
                const endDate = new Date(endDateParam);
                if (endDateParam.indexOf('T') === -1) {
                    endDate.setHours(23, 59, 59, 999);
                }
                where.createdAt.lte = endDate;
            }
        }

        // User filtering
        if (userId) {
            where.userId = userId;
        }

        // If not admin, return 403
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Access Denied: Admins only' }, { status: 403 });
        }

        const commissions = await prisma.commission.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true,
                        role: { select: { name: true } }
                    }
                },
                sale: {
                    select: {
                        id: true,
                        receiptNumber: true,
                        totalAmount: true,
                        totalCost: true,
                        createdAt: true,
                        items: {
                            select: {
                                id: true,
                                qty: true,
                                unitPrice: true,
                                costPrice: true,
                                lineTotal: true,
                                item: { select: { name: true } }
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        // Calculate summary stats
        const totalCommission = commissions.reduce((sum: number, c) => sum + Number(c.amount), 0);
        const totalProfitGenerated = commissions.reduce((sum: number, c) => sum + Number(c.profitSnapshot), 0);

        // Group by user
        const userStatsMap = new Map();

        // Process commissions to create flattened item-level list
        const commissionItems: any[] = [];

        commissions.forEach((c) => {
            const userId = c.userId;

            // User Stats Aggregation
            if (!userStatsMap.has(userId)) {
                userStatsMap.set(userId, {
                    userId,
                    userName: c.user.fullName,
                    userRole: c.user.role?.name || 'Unknown',
                    totalCommission: 0,
                    totalProfit: 0,
                    count: 0
                });
            }
            const stats = userStatsMap.get(userId);
            stats.totalCommission += Number(c.amount);
            stats.totalProfit += Number(c.profitSnapshot);
            stats.count += 1;

            // Item-level breakdown
            const sale = c.sale;
            const totalCommissionAmount = Number(c.amount);
            // const totalProfitSnapshot = Number(c.profitSnapshot); // Unused

            if (sale && sale.items && sale.items.length > 0) {
                // Calculate profit contribution for each item
                let totalCalculatedProfit = 0;
                const itemsWithProfit = sale.items.map((item: any) => {
                    const qty = Number(item.qty);
                    const unitPrice = Number(item.unitPrice);
                    const costPrice = Number(item.costPrice);
                    const profit = (unitPrice - costPrice) * qty;
                    totalCalculatedProfit += profit;
                    return { ...item, profit };
                });

                // Distribute commission
                itemsWithProfit.forEach((item: any) => {
                    let allocatedCommission = 0;
                    if (totalCalculatedProfit > 0) {
                        const weight = item.profit / totalCalculatedProfit;
                        allocatedCommission = totalCommissionAmount * weight;
                    } else {
                        // Fallback if profit is 0 or negative (rare): distribute by line total
                        const saleTotal = Number(sale.totalAmount);
                        if (saleTotal > 0) {
                            allocatedCommission = totalCommissionAmount * (Number(item.lineTotal) / saleTotal);
                        }
                    }

                    commissionItems.push({
                        id: c.id + '_' + item.id, // Unique Key
                        date: c.createdAt,
                        receiptNumber: sale.receiptNumber,
                        salesman: c.user.fullName,
                        itemName: item.item.name,
                        qty: Number(item.qty),
                        sellingPrice: Number(item.unitPrice),
                        costPrice: Number(item.costPrice),
                        profit: item.profit,
                        commission: allocatedCommission,
                        rate: Number(c.rate)
                    });
                });

            } else {
                // Fallback if no items found (legacy data?)
                commissionItems.push({
                    id: c.id,
                    date: c.createdAt,
                    receiptNumber: sale?.receiptNumber || 'N/A',
                    salesman: c.user.fullName,
                    itemName: 'Unknown (No Items)',
                    qty: 0,
                    sellingPrice: 0,
                    costPrice: 0,
                    profit: Number(c.profitSnapshot),
                    commission: Number(c.amount),
                    rate: Number(c.rate)
                });
            }
        });

        const userStats = Array.from(userStatsMap.values());

        return NextResponse.json({
            success: true,
            data: {
                commissionItems, // Flattened list
                summary: {
                    totalCommission,
                    totalProfitGenerated,
                    count: commissions.length
                },
                userStats
            }
        });

    } catch (error) {
        console.error('Error fetching commission report:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch commissions' }, { status: 500 });
    }
}

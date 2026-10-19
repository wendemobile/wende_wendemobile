import { prisma } from '@/lib/prisma';

// ==================== SESSION FINANCIALS INTERFACES ====================

export interface SessionFinancials {
  hasActiveSession: boolean;
  sessionId: string | null;
  sessionStartTime: Date | null;

  cashInHand: number;
  cashInHandBreakdown: CashInHandBreakdown;
  totalExpenses: number;
  totalMobileTransfers: number;
  mobileTransferBreakdown: MobileTransferBreakdown;

  bankAccounts: BankAccountSummary[];
}

export interface MobileTransferBreakdown {
  salesPayments: number;
  layawayPayments: number;
  creditPayments: number;
  total: number;
  transactionCount: number;
}

export interface CashInHandBreakdown {
  openingBalance: number;
  cashSales: number;
  cashLayawayPayments: number;
  cashCreditPayments: number;
  specialIncome: number;
  cashExpenses: number;
  cashToBank: number;
  bankToCash: number;
  total: number;
}

export interface BankAccountSummary {
  id: string;
  bankName: string;
  accountNumber: string;
  currentBalance: number;
  sessionTransactionCount: number;
  sessionInflow: number;
  sessionOutflow: number;
}

export interface BankSessionTransactions {
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    reference: string | null;
    description: string | null;
    createdAt: Date;
  }>;
  summary: {
    totalInflow: number;
    totalOutflow: number;
    transactionCount: number;
  };
}

// ==================== DASHBOARD INTERFACES ====================

export interface AdminDashboard {
  totalSales: { today: number; week: number; month: number };
  profitMetrics: { grossProfit: number; netProfit: number; margin: number };
  locationsOverview: Array<{
    id: string;
    name: string;
    type: string;
    itemCount: number;
    stockValue: number;
  }>;
  userActivity: Array<{
    userId: string;
    userName: string;
    action: string;
    timestamp: Date;
  }>;
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    createdAt: Date;
  }>;
  topSellingItems: Array<{
    itemId: string;
    itemName: string;
    totalSold: number;
    revenue: number;
  }>;
  recentTransactions: Array<{
    id: string;
    receiptNumber: string;
    totalAmount: number;
    status: string;
    createdAt: Date;
    items: Array<{ name: string; qty: number }>;
    payments: Array<{ method: string; amount: number; bankName: string | null }>;
  }>;
  lowStockItems: Array<{
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    minStock: number;
  }>;
  pendingTransfers: Array<{
    id: string;
    transferNumber: string;
    fromLocation: string;
    toLocation: string;
    status: string;
  }>;
}

export interface CashierDashboard {
  locationSales: { today: number; transactionCount: number };
  cashBalance: number;
  pendingTransactions: Array<{
    id: string;
    receiptNumber: string;
    totalAmount: number;
    createdAt: Date;
  }>;
  recentSales: Array<{
    id: string;
    receiptNumber: string;
    totalAmount: number;
    customerName: string | null;
    createdAt: Date;
    items: Array<{ name: string; qty: number }>;
    payments: Array<{ method: string; amount: number; bankName: string | null }>;
  }>;
  overdueCredits: Array<{
    id: string;
    customerName: string;
    balance: number;
    dueDate: Date;
  }>;
  pendingTransfers: Array<{
    id: string;
    transferNumber: string;
    fromLocation: string;
    toLocation: string;
    status: string;
    itemCount: number;
    createdAt: Date;
  }>;
  // Normalized fields for frontend consistency
  totalSales: { today: number; week: number; month: number };
  recentTransactions: Array<{
    id: string;
    receiptNumber: string;
    totalAmount: number;
    status: string;
    createdAt: Date;
    items: Array<{ name: string; qty: number }>;
    payments: Array<{ method: string; amount: number; bankName: string | null }>;
  }>;
}

export interface SalesmanDashboard {
  personalSales: { today: number; week: number; month: number };
  commissionEarned: { today: number; month: number };
  transactionCount: number;
  availableItems: Array<{
    id: string;
    name: string;
    sku: string;
    unitPrice: number;
    availableStock: number;
  }>;
  recentTransactions: Array<{
    id: string;
    receiptNumber: string;
    totalAmount: number;
    status?: string;
    createdAt: Date;
    items: Array<{ name: string; qty: number }>;
    payments: Array<{ method: string; amount: number; bankName: string | null }>;
  }>;
  // Normalized fields for frontend consistency
  totalSales: { today: number; week: number; month: number };
}

export interface BasementManagerDashboard {
  inventoryByLocation: Array<{
    locationId: string;
    locationName: string;
    locationType: string;
    itemCount: number;
    totalQuantity: number;
    stockValue: number;
  }>;
  itemsWithImages: Array<{
    id: string;
    name: string;
    sku: string;
    imageUrl: string | null;
    totalStock: number;
  }>;
  lowStockItems: Array<{
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    minStock: number;
  }>;
  pendingTransfers: Array<{
    id: string;
    transferNumber: string;
    fromLocation: string;
    toLocation: string;
    status: string;
    createdAt: Date;
  }>;
  recentStockMovements: Array<{
    itemName: string;
    locationName: string;
    quantity: number;
    type: string;
    timestamp: Date;
  }>;
  // Normalized fields for frontend consistency
  totalSales: { today: number; week: number; month: number };
  recentTransactions: Array<{
    id: string;
    receiptNumber: string;
    totalAmount: number;
    status: string;
    createdAt: Date;
    items: Array<{ name: string; qty: number }>;
    payments: Array<{ method: string; amount: number; bankName: string | null }>;
  }>;
}

export class DashboardService {
  /**
   * Get current session start time for privacy filtering
   * Returns session start time if active, otherwise returns a future date to ensure no data is returned
   */
  private static async getSessionStartTime(): Promise<Date | null> {
    const currentSession = await prisma.dailySession.findFirst({
      where: { status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
    });

    if (currentSession) {
      return currentSession.openedAt;
    }

    // If no session, return null to indicate no active session
    return null;
  }

  /**
   * Check if there's an active session
   */
  private static async hasActiveSession(): Promise<boolean> {
    const session = await this.getSessionStartTime();
    return session !== null;
  }

  /**
   * Get Admin Dashboard - Shows only current session data for privacy
   * Returns zeros/empty when no active session
   */
  static async getAdminDashboard(): Promise<AdminDashboard> {
    const sessionStart = await this.getSessionStartTime();

    // If no active session, return empty/zero dashboard
    if (!sessionStart) {
      // Still get locations, low stock, and pending transfers (these are not session-specific)
      const [locations, allItems, pendingTransfers, notifications] = await Promise.all([
        prisma.location.findMany({
          where: { isActive: true },
          include: { stocks: { include: { item: true } } },
        }),
        prisma.$queryRaw<any[]>`
          SELECT 
            i.id, i.sku, i.name,
            i."min_stock" as "minStock",
            COALESCE(SUM(s.qty - s."reserved_qty"), 0)::float as "currentStock"
          FROM items i
          LEFT JOIN stocks s ON i.id = s."item_id"
          WHERE i."is_active" = true
          GROUP BY i.id
          HAVING COALESCE(SUM(s.qty - s."reserved_qty"), 0) <= i."min_stock"
          ORDER BY COALESCE(SUM(s.qty - s."reserved_qty"), 0) ASC
          LIMIT 20
        `,
        prisma.transfer.findMany({
          where: { status: { in: ['CREATED', 'SENT'] } },
          include: {
            fromLocation: { select: { name: true } },
            toLocation: { select: { name: true } },
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.notification.findMany({
          where: { isRead: false },
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      return {
        totalSales: { today: 0, week: 0, month: 0 },
        profitMetrics: { grossProfit: 0, netProfit: 0, margin: 0 },
        locationsOverview: locations.map((loc) => ({
          id: loc.id,
          name: loc.name,
          type: loc.type,
          itemCount: loc.stocks.length,
          stockValue: loc.stocks.reduce((sum, s) => sum + Number(s.qty) * Number(s.item.costPrice), 0),
        })),
        userActivity: [],
        notifications: notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          createdAt: n.createdAt,
        })),
        topSellingItems: [],
        recentTransactions: [],
        lowStockItems: (allItems as any[]).map((item: any) => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          currentStock: Number(item.currentStock),
          minStock: Number(item.minStock),
        })),
        pendingTransfers: pendingTransfers.map((t) => ({
          id: t.id,
          transferNumber: t.transferNumber,
          fromLocation: t.fromLocation.name,
          toLocation: t.toLocation.name,
          status: t.status,
        })),
      };
    }

    // Run all independent queries in parallel for better performance
    const [
      sessionSales,
      sessionExpenses,
      locations,
      userActivity,
      notifications,
      topItems,
      recentTransactions,
      allItems,
      pendingTransfers,
      sessionRefunds,
    ] = await Promise.all([
      // Get sales totals - ONLY from current session for privacy
      // Include REFUNDED and CANCELLED sales to calculate accurate gross revenue before refunds are subtracted
      prisma.sale.aggregate({
        where: { status: { in: ['COMPLETED', 'REFUNDED', 'CANCELLED'] }, createdAt: { gte: sessionStart } },
        _sum: { totalAmount: true, totalCost: true },
        _count: true,
      }),
      // Get operating expenses for current session only
      prisma.expense.aggregate({
        where: { createdAt: { gte: sessionStart }, category: { not: 'REFUND' } },
        _sum: { amount: true },
      }),
      // Get locations overview
      prisma.location.findMany({
        where: { isActive: true },
        include: {
          stocks: { include: { item: true } },
        },
      }),
      // Get recent user activity
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, fullName: true } } },
      }),
      // Get notifications
      prisma.notification.findMany({
        where: { isRead: false },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      // Get top selling items - current session only (include refunded/cancelled to show total moved items)
      prisma.saleItem.groupBy({
        by: ['itemId'],
        where: { sale: { status: { in: ['COMPLETED', 'REFUNDED', 'CANCELLED'] }, createdAt: { gte: sessionStart } } },
        _sum: { qty: true, lineTotal: true },
        orderBy: { _sum: { lineTotal: 'desc' } },
        take: 5,
      }),
      // Get recent transactions - current session only with items and payments
      prisma.sale.findMany({
        where: { status: { in: ['COMPLETED', 'REFUNDED', 'CANCELLED'] }, createdAt: { gte: sessionStart } },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          receiptNumber: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          items: {
            select: {
              qty: true,
              item: { select: { name: true } },
            },
          },
          payments: {
            select: {
              method: true,
              amount: true,
              bankAccount: { select: { bankName: true } },
            },
          },
        },
      }),
      // Get low stock items using optimized database-level aggregation
      prisma.$queryRaw<any[]>`
        SELECT 
          i.id, i.sku, i.name,
          i."min_stock" as "minStock",
          COALESCE(SUM(s.qty - s."reserved_qty"), 0)::float as "currentStock"
        FROM items i
        LEFT JOIN stocks s ON i.id = s."item_id"
        WHERE i."is_active" = true
        GROUP BY i.id
        HAVING COALESCE(SUM(s.qty - s."reserved_qty"), 0) <= i."min_stock"
        ORDER BY COALESCE(SUM(s.qty - s."reserved_qty"), 0) ASC
        LIMIT 20
      `,
      // Get pending transfers
      prisma.transfer.findMany({
        where: { status: { in: ['CREATED', 'SENT'] } },
        include: {
          fromLocation: { select: { name: true } },
          toLocation: { select: { name: true } },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      // Get refunds processed during the current session
      prisma.expense.aggregate({
        where: { createdAt: { gte: sessionStart }, category: 'REFUND' },
        _sum: { amount: true },
      }),
    ]);

    const grossRevenue = Number(sessionSales._sum.totalAmount || 0);
    const refunds = Number(sessionRefunds._sum.amount || 0);
    const revenue = grossRevenue - refunds; // Net Revenue (Gross - Refunds)
    
    const cost = Number(sessionSales._sum.totalCost || 0);
    const expenses = Number(sessionExpenses._sum.amount || 0); // Operating Expenses
    
    const grossProfit = revenue - cost;
    const netProfit = grossProfit - expenses;
    const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    const locationsOverview = locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      type: loc.type,
      itemCount: loc.stocks.length,
      stockValue: loc.stocks.reduce(
        (sum, s) => sum + Number(s.qty) * Number(s.item.costPrice),
        0
      ),
    }));

    // Get item details for top items
    const itemDetails = topItems.length > 0
      ? await prisma.item.findMany({
        where: { id: { in: topItems.map((t) => t.itemId) } },
      })
      : [];

    const topSellingItems = topItems.map((t) => {
      const item = itemDetails.find((i) => i.id === t.itemId);
      return {
        itemId: t.itemId,
        itemName: item?.name || 'Unknown',
        totalSold: Number(t._sum.qty || 0),
        revenue: Number(t._sum.lineTotal || 0),
      };
    });

    // Process low stock items (already filtered by database query)
    const lowStockItems = (allItems as any[]).map((item: any) => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      currentStock: Number(item.currentStock),
      minStock: Number(item.minStock),
    }));

    return {
      totalSales: {
        today: revenue, // Current session sales
        week: 0, // Hidden for privacy
        month: 0, // Hidden for privacy
      },
      profitMetrics: { grossProfit, netProfit, margin },
      locationsOverview,
      userActivity: userActivity.map((a) => ({
        userId: a.userId || '',
        userName: a.user?.fullName || 'System',
        action: a.action,
        timestamp: a.createdAt,
      })),
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        createdAt: n.createdAt,
      })),
      topSellingItems,
      recentTransactions: recentTransactions.map((s: any) => ({
        id: s.id,
        receiptNumber: s.receiptNumber,
        totalAmount: Number(s.totalAmount),
        status: s.status,
        createdAt: s.createdAt,
        items: s.items.map((i: any) => ({
          name: i.item.name,
          qty: Number(i.qty),
        })),
        payments: s.payments.map((p: any) => ({
          method: p.method,
          amount: Number(p.amount),
          bankName: p.bankAccount?.bankName || null,
        })),
      })),
      lowStockItems,
      pendingTransfers: pendingTransfers.map((t) => ({
        id: t.id,
        transferNumber: t.transferNumber,
        fromLocation: t.fromLocation.name,
        toLocation: t.toLocation.name,
        status: t.status,
      })),
    };
  }

  /**
   * Get Cashier Dashboard - Location-specific sales and cash (current session only for privacy)
   * Returns zeros/empty when no active session
   */
  static async getCashierDashboard(
    _userId: string,
    locationId: string
  ): Promise<CashierDashboard> {
    const sessionStart = await this.getSessionStartTime();

    // If no active session, return empty/zero dashboard
    if (!sessionStart) {
      // Still get overdue credits and pending transfers (these are ongoing, not session-specific)
      const [overdueCredits, pendingTransfers] = await Promise.all([
        prisma.credit.findMany({
          where: {
            status: 'OVERDUE',
            dueDate: { lt: new Date() },
            balance: { gt: 0 },
          },
          take: 10,
          include: { customer: { select: { name: true } } },
        }),
        // Get pending transfers TO this location (SENT status means waiting to be received)
        prisma.transfer.findMany({
          where: {
            toLocationId: locationId,
            status: 'SENT',
          },
          include: {
            fromLocation: { select: { name: true } },
            toLocation: { select: { name: true } },
            items: true,
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      return {
        locationSales: { today: 0, transactionCount: 0 },
        cashBalance: 0,
        pendingTransactions: [],
        recentSales: [],
        overdueCredits: overdueCredits.map((c) => ({
          id: c.id,
          customerName: c.customer?.name || 'Unknown',
          balance: Number(c.balance),
          dueDate: c.dueDate,
        })),
        pendingTransfers: pendingTransfers.map((t) => ({
          id: t.id,
          transferNumber: t.transferNumber,
          fromLocation: t.fromLocation.name,
          toLocation: t.toLocation.name,
          status: t.status,
          itemCount: t.items.length,
          createdAt: t.createdAt,
        })),
        // Normalized fields for frontend consistency
        totalSales: { today: 0, week: 0, month: 0 },
        recentTransactions: [],
      };
    }

    // Run all queries in parallel for better performance
    const [
      currentSession,
      locationSalesData,
      pendingTransactions,
      recentSales,
      overdueCredits,
      pendingTransfers,
    ] = await Promise.all([
      // Get current session cash balance
      prisma.dailySession.findFirst({
        where: { status: 'OPEN' },
        orderBy: { openedAt: 'desc' },
      }),
      // Get current session sales at location
      prisma.sale.aggregate({
        where: {
          locationId,
          status: { in: ['COMPLETED', 'REFUNDED', 'CANCELLED'] },
          createdAt: { gte: sessionStart },
        },
        _sum: { totalAmount: true },
        _count: true,
      }),
      // Get pending transactions (current session only)
      prisma.sale.findMany({
        where: { locationId, status: 'PENDING', createdAt: { gte: sessionStart } },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          receiptNumber: true,
          totalAmount: true,
          createdAt: true,
        },
      }),
      // Get recent sales (current session only) with items and payments
      prisma.sale.findMany({
        where: { locationId, status: { in: ['COMPLETED', 'REFUNDED', 'CANCELLED'] }, createdAt: { gte: sessionStart } },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true } },
          items: {
            select: {
              qty: true,
              item: { select: { name: true } },
            },
          },
          payments: {
            select: {
              method: true,
              amount: true,
              bankAccount: { select: { bankName: true } },
            },
          },
        },
      }),
      // Get overdue credits (these are ongoing, not session-specific)
      prisma.credit.findMany({
        where: {
          status: 'OVERDUE',
          dueDate: { lt: new Date() },
          balance: { gt: 0 },
        },
        take: 10,
        include: { customer: { select: { name: true } } },
      }),
      // Get pending transfers TO this location (SENT status means waiting to be received)
      prisma.transfer.findMany({
        where: {
          toLocationId: locationId,
          status: 'SENT',
        },
        include: {
          fromLocation: { select: { name: true } },
          toLocation: { select: { name: true } },
          items: true,
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      locationSales: {
        today: Number(locationSalesData._sum.totalAmount || 0),
        transactionCount: locationSalesData._count,
      },
      cashBalance: Number(currentSession?.closingCashBalance || 0),
      pendingTransactions: pendingTransactions.map((t) => ({
        id: t.id,
        receiptNumber: t.receiptNumber,
        totalAmount: Number(t.totalAmount),
        createdAt: t.createdAt,
      })),
      recentSales: recentSales.map((s: any) => ({
        id: s.id,
        receiptNumber: s.receiptNumber,
        totalAmount: Number(s.totalAmount),
        customerName: s.customer?.name || null,
        createdAt: s.createdAt,
        items: s.items.map((i: any) => ({
          name: i.item.name,
          qty: Number(i.qty),
        })),
        payments: s.payments.map((p: any) => ({
          method: p.method,
          amount: Number(p.amount),
          bankName: p.bankAccount?.bankName || null,
        })),
      })),
      overdueCredits: overdueCredits.map((c) => ({
        id: c.id,
        customerName: c.customer?.name || 'Unknown',
        balance: Number(c.balance),
        dueDate: c.dueDate,
      })),
      pendingTransfers: pendingTransfers.map((t) => ({
        id: t.id,
        transferNumber: t.transferNumber,
        fromLocation: t.fromLocation.name,
        toLocation: t.toLocation.name,
        status: t.status,
        itemCount: t.items.length,
        createdAt: t.createdAt,
      })),
      // Normalized fields for frontend consistency
      totalSales: {
        today: Number(locationSalesData._sum.totalAmount || 0),
        week: 0,
        month: 0,
      },
      recentTransactions: recentSales.map((s: any) => ({
        id: s.id,
        receiptNumber: s.receiptNumber,
        totalAmount: Number(s.totalAmount),
        status: 'COMPLETED',
        createdAt: s.createdAt,
        items: s.items.map((i: any) => ({
          name: i.item.name,
          qty: Number(i.qty),
        })),
        payments: s.payments.map((p: any) => ({
          method: p.method,
          amount: Number(p.amount),
          bankName: p.bankAccount?.bankName || null,
        })),
      })),
    };
  }

  /**
   * Get Salesman Dashboard - Personal performance (current session only for privacy)
   * Returns zeros/empty when no active session
   */
  static async getSalesmanDashboard(userId: string): Promise<SalesmanDashboard> {
    const sessionStart = await this.getSessionStartTime();
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // If no active session, return empty/zero dashboard (but show monthly stats)
    if (!sessionStart) {
      // Still get available items with stock
      const items = await prisma.item.findMany({
        where: { isActive: true },
        include: { stocks: true },
        take: 20,
      });

      const availableItems = items
        .map((item) => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          unitPrice: Number(item.unitPrice),
          availableStock: item.stocks.reduce(
            (sum, s) => sum + Number(s.qty) - Number(s.reservedQty),
            0
          ),
        }))
        .filter((item) => item.availableStock > 0);

      const [monthlyCommission, monthlySales] = await Promise.all([
        prisma.commission.aggregate({
          where: {
            userId,
            createdAt: { gte: startOfMonth },
          },
          _sum: { amount: true },
        }),
        prisma.sale.aggregate({
          where: {
            salesmanId: userId,
            status: 'COMPLETED',
            createdAt: { gte: startOfMonth },
          },
          _sum: { totalAmount: true },
        })
      ]);

      return {
        personalSales: { today: 0, week: 0, month: Number(monthlySales._sum.totalAmount || 0) },
        commissionEarned: { today: 0, month: Number(monthlyCommission._sum.amount || 0) },
        transactionCount: 0,
        availableItems,
        recentTransactions: [],
        // Normalized fields for frontend consistency
        totalSales: { today: 0, week: 0, month: Number(monthlySales._sum.totalAmount || 0) },
      };
    }

    // Run all independent queries in parallel
    const [
      personalSales,
      commission,
      transactionCount,
      recentTransactions,
      items,
      monthlyStats
    ] = await Promise.all([
      // Get personal sales - ONLY from current session
      prisma.sale.aggregate({
        where: {
          salesmanId: userId,
          status: 'COMPLETED',
          createdAt: { gte: sessionStart },
        },
        _sum: { totalAmount: true },
      }),
      // Get commission - ONLY from current session
      prisma.commission.aggregate({
        where: {
          userId,
          createdAt: { gte: sessionStart },
        },
        _sum: { amount: true },
      }),
      // Get transaction count
      prisma.sale.count({
        where: {
          salesmanId: userId,
          status: 'COMPLETED',
          createdAt: { gte: sessionStart },
        },
      }),
      // Get recent transactions
      prisma.sale.findMany({
        where: {
          salesmanId: userId,
          status: 'COMPLETED',
          createdAt: { gte: sessionStart },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            select: {
              qty: true,
              item: { select: { name: true } },
            },
          },
          payments: {
            select: {
              method: true,
              amount: true,
              bankAccount: { select: { bankName: true } },
            },
          },
        },
      }),
      // Get available items
      prisma.item.findMany({
        where: { isActive: true },
        include: { stocks: true },
        take: 20,
      }),
      // Monthly Stats
      prisma.$transaction([
        prisma.commission.aggregate({
          where: {
            userId,
            createdAt: { gte: startOfMonth },
          },
          _sum: { amount: true },
        }),
        prisma.sale.aggregate({
          where: {
            salesmanId: userId,
            status: 'COMPLETED',
            createdAt: { gte: startOfMonth },
          },
          _sum: { totalAmount: true },
        })
      ])
    ]);

    const sessionTotal = Number(personalSales._sum.totalAmount || 0);

    const availableItems = items
      .map((item) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        unitPrice: Number(item.unitPrice),
        availableStock: item.stocks.reduce(
          (sum, s) => sum + Number(s.qty) - Number(s.reservedQty),
          0
        ),
      }))
      .filter((item) => item.availableStock > 0);

    return {
      personalSales: {
        today: sessionTotal,
        week: 0, // Hidden for privacy
        month: Number(monthlyStats[1]._sum.totalAmount || 0),
      },
      commissionEarned: {
        today: Number(commission._sum.amount || 0),
        month: Number(monthlyStats[0]._sum.amount || 0),
      },
      transactionCount,
      availableItems,
      recentTransactions: recentTransactions.map((s: any) => ({
        id: s.id,
        receiptNumber: s.receiptNumber,
        totalAmount: Number(s.totalAmount),
        status: s.status,
        createdAt: s.createdAt,
        items: s.items.map((i: any) => ({
          name: i.item.name,
          qty: Number(i.qty),
        })),
        payments: s.payments.map((p: any) => ({
          method: p.method,
          amount: Number(p.amount),
          bankName: p.bankAccount?.bankName || null,
        })),
      })),
      // Normalized fields for frontend consistency
      totalSales: {
        today: sessionTotal,
        week: 0,
        month: Number(monthlyStats[1]._sum.totalAmount || 0),
      },
    };
  }

  /**
   * Get Basement Manager Dashboard - Inventory focus with images
   */
  static async getBasementManagerDashboard(): Promise<BasementManagerDashboard> {
    const sessionStart = await this.getSessionStartTime();

    // Run all queries in parallel for better performance
    const [locations, allItems, pendingTransfers, recentMovements, recentTransactions, sessionSales] = await Promise.all([
      // Get inventory by location
      prisma.location.findMany({
        where: { isActive: true },
        include: {
          stocks: { include: { item: true } },
        },
      }),
      // Get all items with stocks (for low stock and items with images)
      prisma.item.findMany({
        where: { isActive: true },
        include: { stocks: true, image: true },
      }),
      // Get pending transfers
      prisma.transfer.findMany({
        where: { status: { in: ['CREATED', 'SENT'] } },
        include: {
          fromLocation: { select: { name: true } },
          toLocation: { select: { name: true } },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      // Get recent stock movements from audit log
      prisma.auditLog.findMany({
        where: {
          action: { in: ['STOCK_ADJUSTMENT', 'STOCK_TRANSFER', 'SALE_COMPLETED'] },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      // Get recent transactions (current session only if active) with items and payments
      sessionStart ? prisma.sale.findMany({
        where: { status: 'COMPLETED', createdAt: { gte: sessionStart } },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          receiptNumber: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          items: {
            select: {
              qty: true,
              item: { select: { name: true } },
            },
          },
          payments: {
            select: {
              method: true,
              amount: true,
              bankAccount: { select: { bankName: true } },
            },
          },
        },
      }) : Promise.resolve([]),
      // Get session sales total
      sessionStart ? prisma.sale.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: sessionStart } },
        _sum: { totalAmount: true },
      }) : Promise.resolve({ _sum: { totalAmount: null } }),
    ]);

    const inventoryByLocation = locations.map((loc) => ({
      locationId: loc.id,
      locationName: loc.name,
      locationType: loc.type,
      itemCount: new Set(loc.stocks.map((s) => s.itemId)).size,
      totalQuantity: loc.stocks.reduce((sum, s) => sum + Number(s.qty), 0),
      stockValue: loc.stocks.reduce(
        (sum, s) => sum + Number(s.qty) * Number(s.item.costPrice),
        0
      ),
    }));

    // Process items for low stock and items with images
    const lowStockItems = allItems
      .map((item) => {
        const currentStock = item.stocks.reduce(
          (sum, s) => sum + Number(s.qty) - Number(s.reservedQty),
          0
        );
        return {
          id: item.id,
          name: item.name,
          sku: item.sku,
          currentStock,
          minStock: Number(item.minStock),
        };
      })
      .filter((item) => item.currentStock <= item.minStock);

    // Get first 20 items for display
    const itemsWithImages = allItems.slice(0, 20);

    const sessionTotal = Number(sessionSales._sum.totalAmount || 0);

    return {
      inventoryByLocation,
      itemsWithImages: itemsWithImages.map((item) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        imageUrl: item.image?.path || null,
        totalStock: item.stocks.reduce((sum: number, s) => sum + Number(s.qty), 0),
      })),
      lowStockItems,
      pendingTransfers: pendingTransfers.map((t) => ({
        id: t.id,
        transferNumber: t.transferNumber,
        fromLocation: t.fromLocation.name,
        toLocation: t.toLocation.name,
        status: t.status,
        createdAt: t.createdAt,
      })),
      recentStockMovements: recentMovements.map((m) => ({
        itemName: 'Stock Movement',
        locationName: '',
        quantity: 0,
        type: m.action,
        timestamp: m.createdAt,
      })),
      // Normalized fields for frontend consistency
      totalSales: {
        today: sessionTotal,
        week: 0,
        month: 0,
      },
      recentTransactions: (recentTransactions as any[]).map((s: any) => ({
        id: s.id,
        receiptNumber: s.receiptNumber,
        totalAmount: Number(s.totalAmount),
        status: s.status,
        createdAt: s.createdAt,
        items: s.items.map((i: any) => ({
          name: i.item.name,
          qty: Number(i.qty),
        })),
        payments: s.payments.map((p: any) => ({
          method: p.method,
          amount: Number(p.amount),
          bankName: p.bankAccount?.bankName || null,
        })),
      })),
    };
  }

  // ==================== SESSION FINANCIALS METHODS ====================

  /**
   * Get the current active session or null if none exists
   */
  private static async getActiveSession() {
    return prisma.dailySession.findFirst({
      where: { status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
    });
  }

  /**
   * Calculate cash in hand for the current session
   * Formula: Opening + Cash Sales + Layaway + Credit Payments + Special Income + Bank-to-Cash - Expenses - Cash-to-Bank
   */
  static async calculateCashInHand(sessionId: string, sessionStart: Date): Promise<CashInHandBreakdown> {
    const [
      session,
      cashSalesResult,
      cashLayawayPayments,
      cashCreditPayments,
      specialIncomeResult,
      cashExpensesResult,
      fundTransfers,
    ] = await Promise.all([
      // Get session opening balance
      prisma.dailySession.findUnique({
        where: { id: sessionId },
        select: { openingCashBalance: true },
      }),
      // Get cash sales (payments where method = 'CASH' for completed sales in session)
      prisma.payment.aggregate({
        where: {
          method: 'CASH',
          sale: {
            status: 'COMPLETED',
            sessionId: sessionId,
          },
        },
        _sum: { amount: true },
      }),
      // Get cash layaway payments since session start
      prisma.layawayPayment.aggregate({
        where: {
          paymentMethod: 'CASH',
          createdAt: { gte: sessionStart },
        },
        _sum: { amount: true },
      }),
      // Get cash credit payments since session start
      prisma.creditPayment.aggregate({
        where: {
          paymentMethod: 'CASH',
          createdAt: { gte: sessionStart },
        },
        _sum: { amount: true },
      }),
      // Get special income for session (cash-based)
      prisma.specialIncome.aggregate({
        where: {
          sessionId: sessionId,
          OR: [
            { paymentMethod: 'CASH' },
            { paymentMethod: null }, // Default to cash if not specified
          ],
        },
        _sum: { amount: true },
      }),
      // Get cash expenses for session
      prisma.expense.aggregate({
        where: {
          sessionId: sessionId,
          paymentMethod: 'CASH',
        },
        _sum: { amount: true },
      }),
      // Get fund transfers for session
      prisma.fundTransfer.findMany({
        where: { sessionId: sessionId },
        select: { type: true, amount: true },
      }),
    ]);

    const openingBalance = Number(session?.openingCashBalance || 0);
    const cashSales = Number(cashSalesResult._sum.amount || 0);
    const cashLayaway = Number(cashLayawayPayments._sum.amount || 0);
    const cashCredit = Number(cashCreditPayments._sum.amount || 0);
    const specialIncome = Number(specialIncomeResult._sum.amount || 0);
    const cashExpenses = Number(cashExpensesResult._sum.amount || 0);

    // Calculate fund transfers
    let cashToBank = 0;
    let bankToCash = 0;
    for (const transfer of fundTransfers) {
      if (transfer.type === 'CASH_TO_BANK') {
        cashToBank += Number(transfer.amount);
      } else if (transfer.type === 'BANK_TO_CASH') {
        bankToCash += Number(transfer.amount);
      }
    }

    const total = openingBalance + cashSales + cashLayaway + cashCredit + specialIncome + bankToCash - cashExpenses - cashToBank;

    return {
      openingBalance,
      cashSales,
      cashLayawayPayments: cashLayaway,
      cashCreditPayments: cashCredit,
      specialIncome,
      cashExpenses,
      cashToBank,
      bankToCash,
      total,
    };
  }

  /**
   * Calculate total cash expenses for the current session
   */
  static async calculateTotalExpenses(sessionId: string): Promise<number> {
    const result = await prisma.expense.aggregate({
      where: {
        sessionId: sessionId,
        paymentMethod: 'CASH',
      },
      _sum: { amount: true },
    });
    return Number(result._sum.amount || 0);
  }

  /**
   * Calculate total mobile transfers for the current session
   */
  static async calculateMobileTransfers(sessionId: string): Promise<number> {
    const result = await prisma.payment.aggregate({
      where: {
        method: 'MOBILE_TRANSFER',
        sale: {
          status: 'COMPLETED',
          sessionId: sessionId,
        },
      },
      _sum: { amount: true },
    });
    return Number(result._sum.amount || 0);
  }

  /**
   * Calculate mobile transfer breakdown for the current session
   */
  static async calculateMobileTransferBreakdown(sessionId: string, sessionStart: Date): Promise<MobileTransferBreakdown> {
    const [salesPayments, layawayPayments, creditPayments] = await Promise.all([
      // Mobile payments from sales
      prisma.payment.aggregate({
        where: {
          method: 'MOBILE_TRANSFER',
          sale: {
            status: 'COMPLETED',
            sessionId: sessionId,
          },
        },
        _sum: { amount: true },
        _count: true,
      }),
      // Mobile layaway payments
      prisma.layawayPayment.aggregate({
        where: {
          paymentMethod: 'MOBILE_TRANSFER',
          createdAt: { gte: sessionStart },
        },
        _sum: { amount: true },
        _count: true,
      }),
      // Mobile credit payments
      prisma.creditPayment.aggregate({
        where: {
          paymentMethod: 'MOBILE_TRANSFER',
          createdAt: { gte: sessionStart },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const salesAmount = Number(salesPayments._sum.amount || 0);
    const layawayAmount = Number(layawayPayments._sum.amount || 0);
    const creditAmount = Number(creditPayments._sum.amount || 0);
    const totalCount = (salesPayments._count || 0) + (layawayPayments._count || 0) + (creditPayments._count || 0);

    return {
      salesPayments: salesAmount,
      layawayPayments: layawayAmount,
      creditPayments: creditAmount,
      total: salesAmount + layawayAmount + creditAmount,
      transactionCount: totalCount,
    };
  }

  /**
   * Get bank accounts with session transaction summary
   */
  static async getBankAccountsSummary(sessionStart: Date): Promise<BankAccountSummary[]> {
    const bankAccounts = await prisma.bankAccount.findMany({
      where: { isActive: true },
      select: {
        id: true,
        bankName: true,
        accountNumber: true,
        currentBalance: true,
      },
    });

    // Get session transactions for each bank account
    const summaries: BankAccountSummary[] = [];

    for (const account of bankAccounts) {
      const transactions = await prisma.bankTransaction.findMany({
        where: {
          createdAt: { gte: sessionStart },
          OR: [
            { fromAccountId: account.id },
            { toAccountId: account.id },
          ],
        },
        select: {
          fromAccountId: true,
          toAccountId: true,
          amount: true,
        },
      });

      let sessionInflow = 0;
      let sessionOutflow = 0;

      for (const tx of transactions) {
        if (tx.toAccountId === account.id) {
          sessionInflow += Number(tx.amount);
        }
        if (tx.fromAccountId === account.id) {
          sessionOutflow += Number(tx.amount);
        }
      }

      // Calculate session balance as inflows minus outflows (not cumulative balance)
      const sessionBalance = sessionInflow - sessionOutflow;

      summaries.push({
        id: account.id,
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        currentBalance: sessionBalance, // Session-specific balance, not cumulative
        sessionTransactionCount: transactions.length,
        sessionInflow,
        sessionOutflow,
      });
    }

    return summaries;
  }

  /**
   * Get session transactions for a specific bank account
   */
  static async getBankAccountSessionTransactions(
    bankAccountId: string,
    sessionStart: Date
  ): Promise<BankSessionTransactions> {
    const transactions = await prisma.bankTransaction.findMany({
      where: {
        createdAt: { gte: sessionStart },
        OR: [
          { fromAccountId: bankAccountId },
          { toAccountId: bankAccountId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fromAccountId: true,
        toAccountId: true,
        amount: true,
        transactionType: true,
        reference: true,
        description: true,
        createdAt: true,
      },
    });

    let totalInflow = 0;
    let totalOutflow = 0;

    const formattedTransactions = transactions.map((tx) => {
      const isInflow = tx.toAccountId === bankAccountId;
      const amount = Number(tx.amount);

      if (isInflow) {
        totalInflow += amount;
      } else {
        totalOutflow += amount;
      }

      return {
        id: tx.id,
        type: isInflow ? 'INFLOW' : 'OUTFLOW',
        amount: isInflow ? amount : -amount,
        reference: tx.reference,
        description: tx.description,
        createdAt: tx.createdAt,
      };
    });

    return {
      transactions: formattedTransactions,
      summary: {
        totalInflow,
        totalOutflow,
        transactionCount: transactions.length,
      },
    };
  }

  /**
   * Get all session financials - main entry point
   * Returns zeros when no active session exists
   */
  static async getSessionFinancials(): Promise<SessionFinancials> {
    const activeSession = await this.getActiveSession();

    // No active session - return zeros
    if (!activeSession) {
      return {
        hasActiveSession: false,
        sessionId: null,
        sessionStartTime: null,
        cashInHand: 0,
        cashInHandBreakdown: {
          openingBalance: 0,
          cashSales: 0,
          cashLayawayPayments: 0,
          cashCreditPayments: 0,
          specialIncome: 0,
          cashExpenses: 0,
          cashToBank: 0,
          bankToCash: 0,
          total: 0,
        },
        totalExpenses: 0,
        totalMobileTransfers: 0,
        mobileTransferBreakdown: {
          salesPayments: 0,
          layawayPayments: 0,
          creditPayments: 0,
          total: 0,
          transactionCount: 0,
        },
        bankAccounts: [],
      };
    }

    // Active session - calculate all metrics
    const [cashInHandBreakdown, totalExpenses, mobileTransferBreakdown, bankAccounts] = await Promise.all([
      this.calculateCashInHand(activeSession.id, activeSession.openedAt),
      this.calculateTotalExpenses(activeSession.id),
      this.calculateMobileTransferBreakdown(activeSession.id, activeSession.openedAt),
      this.getBankAccountsSummary(activeSession.openedAt),
    ]);

    return {
      hasActiveSession: true,
      sessionId: activeSession.id,
      sessionStartTime: activeSession.openedAt,
      cashInHand: cashInHandBreakdown.total,
      cashInHandBreakdown,
      totalExpenses,
      totalMobileTransfers: mobileTransferBreakdown.total,
      mobileTransferBreakdown,
      bankAccounts,
    };
  }
}

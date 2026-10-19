import { prisma } from '@/lib/prisma';

export class NotificationService {
  static async create(data: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }) {
    return prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
      },
    });
  }

  static async getUnread() {
    return prisma.notification.findMany({
      where: { isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  static async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  static async markAllAsRead() {
    return prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
  }

  // Helper methods for common notifications
  static async notifyLowStock(itemId: string, itemName: string, currentQty: number, minStock: number) {
    return this.create({
      type: 'LOW_STOCK',
      title: 'Low Stock Alert',
      message: `${itemName} is running low (${currentQty} remaining, min: ${minStock})`,
      data: { itemId, currentQty, minStock },
    });
  }

  static async notifyOverdueCredit(creditId: string, customerName: string, amount: number) {
    return this.create({
      type: 'OVERDUE_CREDIT',
      title: 'Overdue Credit',
      message: `Credit for ${customerName} is overdue (${amount} outstanding)`,
      data: { creditId, amount },
    });
  }

  static async notifyPendingTransfer(transferId: string, transferNumber: string, toLocation: string) {
    return this.create({
      type: 'PENDING_TRANSFER',
      title: 'Pending Transfer',
      message: `Transfer ${transferNumber} is pending at ${toLocation}`,
      data: { transferId, transferNumber },
    });
  }
}

import { prisma } from '@/lib/prisma';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  static async log(entry: AuditLogEntry) {
    return prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        oldValues: entry.oldValues,
        newValues: entry.newValues,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });
  }

  static async list(params: {
    page?: number;
    pageSize?: number;
    userId?: string;
    entityType?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { page = 1, pageSize = 50, userId, entityType, action, startDate, endDate } = params;

    const where: any = {};
    if (userId) where.userId = userId;
    if (entityType) where.entityType = entityType;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, fullName: true, username: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      items: logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // Helper methods for common audit actions
  static async logCreate(userId: string, entityType: string, entityId: string, newValues: any) {
    return this.log({
      userId,
      action: 'CREATE',
      entityType,
      entityId,
      newValues,
    });
  }

  static async logUpdate(userId: string, entityType: string, entityId: string, oldValues: any, newValues: any) {
    return this.log({
      userId,
      action: 'UPDATE',
      entityType,
      entityId,
      oldValues,
      newValues,
    });
  }

  static async logDelete(userId: string, entityType: string, entityId: string, oldValues: any) {
    return this.log({
      userId,
      action: 'DELETE',
      entityType,
      entityId,
      oldValues,
    });
  }

  static async logLogin(userId: string, ipAddress?: string, userAgent?: string) {
    return this.log({
      userId,
      action: 'LOGIN',
      entityType: 'USER',
      entityId: userId,
      ipAddress,
      userAgent,
    });
  }

  static async logLogout(userId: string) {
    return this.log({
      userId,
      action: 'LOGOUT',
      entityType: 'USER',
      entityId: userId,
    });
  }
}

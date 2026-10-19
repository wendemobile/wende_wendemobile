import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Error severity levels
export type ErrorSeverity = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

// Standard error codes
export const ERROR_CODES = {
  // Authentication errors (AUTH_xxx)
  AUTH_001: 'Authentication required',
  AUTH_002: 'Invalid credentials',
  AUTH_003: 'Session expired',
  AUTH_004: 'Account disabled',

  // Authorization errors (AUTHZ_xxx)
  AUTHZ_001: 'Permission denied',
  AUTHZ_002: 'Insufficient privileges',

  // Validation errors (VAL_xxx)
  VAL_001: 'Invalid input',
  VAL_002: 'Required field missing',
  VAL_003: 'Invalid format',
  VAL_004: 'Value out of range',

  // Resource errors (RES_xxx)
  RES_001: 'Resource not found',
  RES_002: 'Resource already exists',
  RES_003: 'Resource conflict',

  // Business logic errors (BIZ_xxx)
  BIZ_001: 'Insufficient stock',
  BIZ_002: 'Credit limit exceeded',
  BIZ_003: 'Session not open',
  BIZ_004: 'Transfer not allowed',
  BIZ_005: 'Payment mismatch',

  // Server errors (SRV_xxx)
  SRV_001: 'Internal server error',
  SRV_002: 'Database error',
  SRV_003: 'External service error',
  SRV_004: 'Configuration error',

  // Image errors (IMG_xxx)
  IMG_001: 'File size exceeded',
  IMG_002: 'Invalid file type',
  IMG_003: 'Upload failed',
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

// Standard error response interface
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
    requestId: string;
  };
}

// Application error class
export class AppError extends Error {
  code: ErrorCode;
  severity: ErrorSeverity;
  details?: Record<string, unknown>;
  requestId: string;

  constructor(
    code: ErrorCode,
    message?: string,
    options?: {
      severity?: ErrorSeverity;
      details?: Record<string, unknown>;
      requestId?: string;
    }
  ) {
    super(message || ERROR_CODES[code]);
    this.code = code;
    this.severity = options?.severity || 'ERROR';
    this.details = options?.details;
    this.requestId = options?.requestId || generateRequestId();
    this.name = 'AppError';
  }
}

// Generate unique request ID
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export class ErrorService {
  /**
   * Build standardized error response
   */
  static buildErrorResponse(
    code: ErrorCode | string,
    message?: string,
    details?: Record<string, unknown>,
    requestId?: string
  ): ErrorResponse {
    return {
      success: false,
      error: {
        code,
        message: message || (ERROR_CODES[code as ErrorCode] ?? 'Unknown error'),
        details,
        timestamp: new Date().toISOString(),
        requestId: requestId || generateRequestId(),
      },
    };
  }

  /**
   * Build error response from AppError
   */
  static fromAppError(error: AppError): ErrorResponse {
    return this.buildErrorResponse(
      error.code,
      error.message,
      error.details,
      error.requestId
    );
  }

  /**
   * Build error response from unknown error
   */
  static fromUnknownError(error: unknown, requestId?: string): ErrorResponse {
    if (error instanceof AppError) {
      return this.fromAppError(error);
    }

    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return this.buildErrorResponse('SRV_001', message, undefined, requestId);
  }

  /**
   * Log error to database
   */
  static async logError(
    error: Error | AppError,
    options?: {
      userId?: string;
      requestId?: string;
      component?: string;
      context?: Record<string, unknown>;
    }
  ): Promise<void> {
    try {
      const isAppError = error instanceof AppError;

      await prisma.errorLog.create({
        data: {
          code: isAppError ? error.code : 'SRV_001',
          message: error.message,
          stackTrace: error.stack,
          context: options?.context ? (options.context as any) : Prisma.JsonNull,
          userId: options?.userId,
          requestId: options?.requestId || (isAppError ? error.requestId : generateRequestId()),
          severity: isAppError ? error.severity : 'ERROR',
          component: options?.component,
        },
      });
    } catch (logError) {
      // If we can't log to database, log to console
      console.error('Failed to log error to database:', logError);
      console.error('Original error:', error);
    }
  }

  /**
   * Get error logs with filters
   */
  static async getErrorLogs(filters?: {
    severity?: ErrorSeverity;
    component?: string;
    startDate?: Date;
    endDate?: Date;
    resolved?: boolean;
    limit?: number;
  }) {
    const where: Record<string, unknown> = {};

    if (filters?.severity) {
      where.severity = filters.severity;
    }

    if (filters?.component) {
      where.component = filters.component;
    }

    if (filters?.resolved !== undefined) {
      where.resolved = filters.resolved;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        (where.createdAt as Record<string, Date>).gte = filters.startDate;
      }
      if (filters.endDate) {
        (where.createdAt as Record<string, Date>).lte = filters.endDate;
      }
    }

    return prisma.errorLog.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true } },
        resolvedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
    });
  }

  /**
   * Get error log by ID
   */
  static async getErrorLogById(id: string) {
    return prisma.errorLog.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true } },
        resolvedBy: { select: { id: true, fullName: true } },
      },
    });
  }

  /**
   * Mark error as resolved
   */
  static async resolveError(id: string, resolvedById: string): Promise<boolean> {
    try {
      await prisma.errorLog.update({
        where: { id },
        data: {
          resolved: true,
          resolvedAt: new Date(),
          resolvedById,
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get error statistics
   */
  static async getErrorStats(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const errors = await prisma.errorLog.findMany({
      where: { createdAt: { gte: startDate } },
      select: { severity: true, component: true, resolved: true },
    });

    const stats = {
      total: errors.length,
      bySeverity: {} as Record<string, number>,
      byComponent: {} as Record<string, number>,
      resolved: 0,
      unresolved: 0,
    };

    for (const error of errors) {
      // Count by severity
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;

      // Count by component
      if (error.component) {
        stats.byComponent[error.component] = (stats.byComponent[error.component] || 0) + 1;
      }

      // Count resolved/unresolved
      if (error.resolved) {
        stats.resolved++;
      } else {
        stats.unresolved++;
      }
    }

    return stats;
  }
}

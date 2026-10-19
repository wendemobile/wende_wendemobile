// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
  timestamp: string;
  requestId: string;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Search
export interface SearchParams extends PaginationParams {
  query?: string;
}

// Enums
export enum PaymentMethod {
  CASH = 'CASH',
  MOBILE_TRANSFER = 'MOBILE_TRANSFER',
  CREDIT = 'CREDIT',
  CARD = 'CARD',
  SPLIT_PAYMENT = 'SPLIT_PAYMENT',
}

export enum SaleStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum SessionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  RECONCILED = 'RECONCILED',
}

export enum TransferStatus {
  CREATED = 'CREATED',
  SENT = 'SENT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum DefectStatus {
  NEW = 'NEW',
  DIAGNOSED = 'DIAGNOSED',
  WITH_VENDOR = 'WITH_VENDOR',
  READY_FOR_CUSTOMER = 'READY_FOR_CUSTOMER',
  COMPLETED = 'COMPLETED',
}

export enum CreditStatus {
  OPEN = 'OPEN',
  OVERDUE = 'OVERDUE',
  CLOSED = 'CLOSED',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  CASHIER = 'CASHIER',
  BASEMENT_MANAGER = 'BASEMENT_MANAGER',
  SALESMAN = 'SALESMAN',
}

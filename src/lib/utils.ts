import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  // Format with Ethiopian Birr (Br)
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `Br ${formatted}`;
}

/**
 * Smart currency formatting that removes unnecessary .00 decimals
 * For whole numbers: Br 100 instead of Br 100.00
 * For amounts with cents: Br 100.50 (keeps decimals)
 */
export function formatCurrencySmart(amount: number): string {
  const isWholeNumber = amount % 1 === 0;

  if (isWholeNumber) {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    return `Br ${formatted}`;
  }

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `Br ${formatted}`;
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function generateReceiptNumber(): string {
  const date = new Date();
  // Using local time for receipt numbers to match physical business day
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RCP-${dateStr}-${random}`;
}

export function formatDecimal(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function generateBarcode(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `QR${timestamp}${random}`.toUpperCase();
}

/**
 * Generate a UUID that works in all contexts (including non-HTTPS)
 * Falls back to a custom implementation if crypto.randomUUID is not available
 */
export function generateUUID(): string {
  // Try native crypto.randomUUID first (requires secure context)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback implementation using crypto.getRandomValues or Math.random
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10

    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // Last resort fallback using Math.random (less secure but works everywhere)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * reliable way to get start/end of day from YYYY-MM-DD string
 * Uses local time to avoid UTC interpretation issues
 */
export function getDateRange(startDateStr?: string | null, endDateStr?: string | null) {
  // Default to today if invalid or empty
  if (!startDateStr) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    startDateStr = `${y}-${m}-${d}`;
  }

  const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
  const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);

  const targetEndDateStr = endDateStr || startDateStr;
  const [endYear, endMonth, endDay] = targetEndDateStr.split('-').map(Number);
  const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

  return { start, end };
}

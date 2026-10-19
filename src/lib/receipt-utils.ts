/**
 * Receipt Utility Functions for Ethiopian Tax-Compliant Receipts
 * Formats numbers, dates, times, and amounts according to ERCA requirements
 */

/**
 * Format receipt number as 8-digit zero-padded string
 * Example: 1890 -> "00001890"
 */
export function formatReceiptNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseInt(num, 10) : num;
  if (isNaN(n) || n < 0) return '00000000';
  return n.toString().padStart(8, '0');
}

/**
 * Format date as DD/MM/YYYY
 * Example: 2025-11-12 -> "11/12/2025"
 */
export function formatReceiptDate(date: Date): string {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format time as HH:MM (24-hour format)
 * Example: 16:03
 */
export function formatReceiptTime(date: Date): string {
  const d = new Date(date);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format amount with asterisk prefix and comma thousand separators
 * Example: 23000 -> "*23,000.00"
 */
export function formatReceiptAmount(amount: number): string {
  if (amount < 0) amount = 0;
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `*${formatted}`;
}


/**
 * Format price with 3 decimal places (for unit prices)
 * Example: 23000 -> "23000.000"
 */
export function formatReceiptPrice(price: number): string {
  if (price < 0) price = 0;
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

/**
 * Format phone number as TEL:-XX XX XX XX XX
 * Example: "0911346048" -> "TEL:-09 11 34 60 48"
 */
export function formatReceiptPhone(phone: string): string {
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Format as XX XX XX XX XX
  const parts: string[] = [];
  for (let i = 0; i < digits.length; i += 2) {
    parts.push(digits.slice(i, i + 2));
  }
  
  return `TEL:-${parts.join(' ')}`;
}

/**
 * Calculate 15% VAT tax
 * Example: 23000 -> 3450
 */
export function calculateTax(subtotal: number): number {
  if (subtotal < 0) return 0;
  return Math.round(subtotal * 0.15 * 100) / 100;
}

/**
 * Format invoice number with CA- prefix
 * Example: 5872 -> "CA-00005872"
 */
export function formatInvoiceNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseInt(num, 10) : num;
  if (isNaN(n) || n < 0) return 'CA-00000000';
  return `CA-${n.toString().padStart(8, '0')}`;
}

/**
 * Store configuration for receipt
 */
export const STORE_CONFIG = {
  tin: '0005018689',
  name: 'TOMAS ENDESHAW BEKELE',
  address: 'SNNPRS,BUTAJIRA/K,04\nNEAR TO BRIGHT HOTEL',
  phone: '0911346048',
  ercaEtNumber: 'NDB0000171',
};

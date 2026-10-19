import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { 
  cn, 
  formatCurrency, 
  formatDate, 
  generateReceiptNumber, 
  generateBarcode 
} from '@/lib/utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    });

    it('should merge tailwind classes correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });
  });

  describe('formatCurrency', () => {
    it('should format positive numbers', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('should format zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should format negative numbers', () => {
      expect(formatCurrency(-100)).toBe('-$100.00');
    });
  });

  describe('generateReceiptNumber', () => {
    it('should match format RCP-YYYYMMDD-XXXXXX', () => {
      const receipt = generateReceiptNumber();
      expect(receipt).toMatch(/^RCP-\d{8}-[A-Z0-9]{6}$/);
    });

    it('should contain current date', () => {
      const receipt = generateReceiptNumber();
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      expect(receipt).toContain(today);
    });

    /**
     * **Feature: web-pos-rebuild, Property 5: Receipt Number Format**
     * **Validates: Requirements 3.1**
     */
    it('property: all generated receipt numbers match format', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 1000 }), () => {
          const receipt = generateReceiptNumber();
          return /^RCP-\d{8}-[A-Z0-9]{6}$/.test(receipt);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('generateBarcode', () => {
    it('should generate unique barcodes', () => {
      const barcodes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        barcodes.add(generateBarcode());
      }
      expect(barcodes.size).toBe(100);
    });

    it('should start with QR', () => {
      const barcode = generateBarcode();
      expect(barcode).toMatch(/^QR/);
    });
  });
});

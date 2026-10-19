'use client';

import { forwardRef } from 'react';
import {
  formatReceiptDate,
  formatReceiptTime,
  formatReceiptAmount,
  formatReceiptPrice,
  calculateTax,
} from '@/lib/receipt-utils';

interface ReceiptItem {
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

interface ReceiptProps {
  receiptNumber: string;
  date: Date;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  total: number;
  payments: { method: string; amount: number }[];
  cashier?: string;
  customer?: string;
  customerTin?: string;
  refNo?: string;
}

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ receiptNumber, date, items, subtotal, discount, total, payments, customer, customerTin, refNo }, ref) => {
    // Calculate tax (15% VAT)
    const taxableAmount = subtotal - discount;
    const tax = calculateTax(taxableAmount);
    const grandTotal = taxableAmount + tax;
    
    // Get total item count
    const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
    
    // Get total paid across all payment methods
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    // Human-readable list of the payment methods used on this sale
    const methodLabel = Array.from(new Set(payments.map((p) => p.method.replace(/_/g, ' '))))
      .join(' + ') || 'CASH';

    return (
      <div ref={ref} className="w-full max-w-[320px] mx-auto bg-white p-3 font-mono text-xs text-black leading-tight rounded-lg">
        {/* Header - Simple Transaction Completed */}
        <div className="text-center mb-3 pb-2 border-b border-black">
          <p className="font-bold text-sm tracking-wide text-black uppercase">TRANSACTION IS COMPLETED</p>
          <p className="text-[11px] mt-1">{formatReceiptDate(date)} {formatReceiptTime(date)}</p>
        </div>

        {/* Items Header */}
        <div className="border-t border-black pt-1">
          <div className="flex font-bold">
            <span className="w-8 text-center">QTY</span>
            <span className="flex-1">DESCRIPTION</span>
            <span className="w-20 text-right">PRICE</span>
            <span className="w-20 text-right">AMOUNT</span>
          </div>
        </div>

        {/* Items */}
        <div className="border-t border-black py-1">
          {items.map((item, index) => (
            <div key={index} className="flex mb-1">
              <span className="w-8 text-center">{item.qty}</span>
              <span className="flex-1 truncate pr-1">{item.name}</span>
              <span className="w-20 text-right">{formatReceiptPrice(item.unitPrice)}</span>
              <span className="w-20 text-right">{formatReceiptAmount(item.lineTotal)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-black py-1">
          <div className="flex justify-between font-bold">
            <span>TOTAL</span>
            <span>{formatReceiptAmount(total || grandTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>{methodLabel.toUpperCase()}</span>
            <span>{formatReceiptAmount(totalPaid)}</span>
          </div>
          <div className="flex justify-between">
            <span>ITEMS</span>
            <span>{itemCount}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-3 pt-2 border-t border-black">
          <p className="font-bold">THANK YOU!</p>
        </div>
      </div>
    );
  }
);

Receipt.displayName = 'Receipt';

export function printReceipt(elementId: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>Receipt</title>
        <style>
          @page { margin: 0; size: 80mm auto; }
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 12px; 
            margin: 0; 
            padding: 5mm;
            width: 70mm;
            line-height: 1.2;
          }
          * { color: black !important; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .border-t { border-top: 1px dashed #000; }
          .border-b { border-bottom: 1px dashed #000; }
          .py-1 { padding-top: 2px; padding-bottom: 2px; }
          .pt-1 { padding-top: 2px; }
          .pt-2 { padding-top: 4px; }
          .mb-1 { margin-bottom: 2px; }
          .mb-2 { margin-bottom: 4px; }
          .mt-1 { margin-top: 2px; }
          .mt-3 { margin-top: 6px; }
          .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .whitespace-pre-line { white-space: pre-line; }
          .w-8 { width: 20px; }
          .w-24 { width: 70px; }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

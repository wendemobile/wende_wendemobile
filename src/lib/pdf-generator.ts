import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportData {
  period?: { startDate: string; endDate: string };
  summary?: {
    totalSales: number;
    totalCashSales?: number;
    totalBankSales?: number;
    totalCreditSales?: number;
    totalExpenses: number;
    totalCashExpenses?: number;
    totalBankExpenses?: number;
    totalSpecialIncome: number;
    totalLayawayPaymentsCash?: number;
    totalCreditPaymentsCash?: number;
    totalCancelledSales?: number;
    totalCancelledAmount?: number;
    totalRefundedAmount?: number;
    netCash: number;
  };
  sales?: any[];
  refunds?: any[];
  expenses?: any[];
  specialIncomes?: any[];
  layawayPayments?: any[];
  creditPayments?: any[];
}

const COLORS = {
  primary: [16, 185, 129] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],
  info: [59, 130, 246] as [number, number, number],
  purple: [139, 92, 246] as [number, number, number],
  dark: [30, 41, 59] as [number, number, number],
  gray: [100, 116, 139] as [number, number, number],
};

function formatCurrency(amount: number): string {
  // Format with Ethiopian Birr (Br)
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
  return `Br ${formatted}`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function addPageHeader(doc: jsPDF, title: string, startDate: string, endDate: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, 0, pageWidth, 45, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Period: ${formatDate(startDate)} - ${formatDate(endDate)}`, pageWidth / 2, 28, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 36, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  return 55;
}

function addSectionTitle(doc: jsPDF, title: string, yPos: number, color: [number, number, number], count?: number) {
  doc.setFillColor(...color);
  doc.roundedRect(14, yPos - 6, 8, 8, 1, 1, 'F');
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  const displayTitle = count !== undefined ? `${title} (${count})` : title;
  doc.text(displayTitle, 26, yPos);
  doc.setTextColor(0, 0, 0);
  return yPos + 8;
}

function checkPageBreak(doc: jsPDF, yPos: number, needed: number = 60): number {
  if (yPos + needed > doc.internal.pageSize.getHeight() - 20) {
    doc.addPage();
    return 20;
  }
  return yPos;
}

export function generateReconciliationPDF(data: ReportData, startDate: string, endDate: string): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = addPageHeader(doc, 'RECONCILIATION REPORT', startDate, endDate);

  // Summary Section - Key Metrics in a grid
  const summary = (data.summary || {}) as any;

  // Cash In Hand Calculation Table (matches dashboard)
  autoTable(doc, {
    startY: yPos,
    head: [['CASH IN HAND CALCULATION', 'Amount']],
    body: [
      ['Opening Balance', formatCurrency(summary.openingBalance || 0)],
      ['+ Cash Sales', formatCurrency(summary.totalCashSales || 0)],
      ['+ Layaway Payments (Cash)', formatCurrency(summary.totalLayawayPaymentsCash || 0)],
      ['+ Credit Payments (Cash)', formatCurrency(summary.totalCreditPaymentsCash || 0)],
      ['+ Special Income', formatCurrency(summary.totalSpecialIncome || 0)],
      ['+ Bank to Cash', formatCurrency(summary.bankToCash || 0)],
      ['- Cash Expenses', formatCurrency(summary.totalCashExpenses || 0)],
      ['- Cash to Bank', formatCurrency(summary.cashToBank || 0)],
      ['CASH IN HAND', formatCurrency(summary.netCash || 0)],
    ],
    theme: 'grid',
    headStyles: { fillColor: COLORS.primary, fontSize: 10, fontStyle: 'bold' },
    bodyStyles: { fontSize: 10 },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
    tableWidth: 140,
    didParseCell: (cellData: any) => {
      if (cellData.row.index === 8 && cellData.section === 'body') {
        cellData.cell.styles.fontStyle = 'bold';
        cellData.cell.styles.fillColor = [16, 185, 129];
        cellData.cell.styles.textColor = [255, 255, 255];
      }
    },
  });
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Cash Flow Summary Table
  autoTable(doc, {
    startY: yPos,
    head: [['SALES SUMMARY', 'Cash', 'Bank/Mobile', 'Credit', 'Total']],
    body: [
      ['Sales Revenue', formatCurrency(summary.totalCashSales || 0), formatCurrency(summary.totalBankSales || 0),
        formatCurrency(summary.totalCreditSales || 0), formatCurrency(summary.totalSales || 0)],
      ['Expenses', formatCurrency(summary.totalCashExpenses || 0), formatCurrency(summary.totalBankExpenses || 0),
        '-', formatCurrency(summary.totalExpenses || 0)],
    ],
    theme: 'grid',
    headStyles: { fillColor: COLORS.dark, fontSize: 10, fontStyle: 'bold', halign: 'center' },
    bodyStyles: { fontSize: 10, halign: 'right' },
    columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
  });
  yPos = (doc as any).lastAutoTable.finalY + 8;

  // Salesman Performance Summary (exclude cancelled sales)
  if (data.sales && data.sales.length > 0) {
    const completedSales = data.sales.filter((s: any) => s.status !== 'CANCELLED');
    const salesmanStats: Record<string, { count: number; total: number; items: number }> = {};
    for (const sale of completedSales) {
      const name = sale.salesman || sale.cashier || 'Unknown';
      if (!salesmanStats[name]) {
        salesmanStats[name] = { count: 0, total: 0, items: 0 };
      }
      salesmanStats[name].count++;
      salesmanStats[name].total += sale.totalAmount || 0;
      salesmanStats[name].items += sale.items?.reduce((sum: number, i: any) => sum + (i.qty || 0), 0) || 0;
    }

    const salesmanData = Object.entries(salesmanStats)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([name, stats]) => [
        name,
        String(stats.count),
        String(stats.items),
        formatCurrency(stats.total),
      ]);

    if (salesmanData.length > 0) {
      yPos = checkPageBreak(doc, yPos, 60);
      yPos = addSectionTitle(doc, 'SALESMAN PERFORMANCE', yPos, COLORS.info, salesmanData.length);

      autoTable(doc, {
        startY: yPos,
        head: [['Salesman', 'Sales Count', 'Items Sold', 'Total Revenue']],
        body: salesmanData,
        theme: 'striped',
        headStyles: { fillColor: COLORS.info, fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 14, right: 14 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 8;
    }
  }

  // Additional Income & Net Cash Position - Side by side with proper column widths
  const halfWidth = (pageWidth - 42) / 2; // Account for margins and gap

  // Additional Income Table (Left side)
  autoTable(doc, {
    startY: yPos,
    head: [['ADDITIONAL INCOME', 'Amount']],
    body: [
      ['Special Income', formatCurrency(summary.totalSpecialIncome || 0)],
      ['Layaway Payments (Cash)', formatCurrency(summary.totalLayawayPaymentsCash || 0)],
      ['Credit Payments (Cash)', formatCurrency(summary.totalCreditPaymentsCash || 0)],
    ],
    theme: 'grid',
    headStyles: { fillColor: COLORS.warning, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: halfWidth * 0.6 },
      1: { cellWidth: halfWidth * 0.4, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 14, right: pageWidth / 2 + 7 },
  });

  const leftTableY = (doc as any).lastAutoTable.finalY;

  // Net Cash Summary (Right side)
  autoTable(doc, {
    startY: yPos,
    head: [['NET CASH POSITION', 'Amount']],
    body: [
      ['Total Cash In', formatCurrency((summary.totalCashSales || 0) + (summary.totalSpecialIncome || 0) +
        (summary.totalLayawayPaymentsCash || 0) + (summary.totalCreditPaymentsCash || 0))],
      ['Total Cash Out', formatCurrency(summary.totalCashExpenses || 0)],
      ['NET CASH', formatCurrency(summary.netCash || 0)],
    ],
    theme: 'grid',
    headStyles: { fillColor: COLORS.primary, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: halfWidth * 0.55 },
      1: { cellWidth: halfWidth * 0.45, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: pageWidth / 2 + 7, right: 14 },
  });

  yPos = Math.max(leftTableY, (doc as any).lastAutoTable.finalY) + 10;

  // Payment Method Breakdown (exclude cancelled sales)
  if (data.sales && data.sales.length > 0) {
    const completedSalesForPayment = data.sales.filter((s: any) => s.status !== 'CANCELLED');
    const paymentMethodStats: Record<string, { count: number; total: number }> = {};
    for (const sale of completedSalesForPayment) {
      if (sale.payments) {
        for (const payment of sale.payments) {
          const methodName = payment.bankName
            ? `${payment.method} (${payment.bankName})`
            : payment.method;
          if (!paymentMethodStats[methodName]) {
            paymentMethodStats[methodName] = { count: 0, total: 0 };
          }
          paymentMethodStats[methodName].count++;
          paymentMethodStats[methodName].total += payment.amount || 0;
        }
      }
    }

    const paymentData = Object.entries(paymentMethodStats)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([method, stats]) => [
        method,
        String(stats.count),
        formatCurrency(stats.total),
      ]);

    if (paymentData.length > 0) {
      yPos = checkPageBreak(doc, yPos, 50);
      yPos = addSectionTitle(doc, 'PAYMENT METHOD BREAKDOWN', yPos, COLORS.purple);

      autoTable(doc, {
        startY: yPos,
        head: [['Payment Method', 'Transactions', 'Total Amount']],
        body: paymentData,
        theme: 'striped',
        headStyles: { fillColor: COLORS.purple, fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 14, right: 14 },
        tableWidth: 120,
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
  }

  // Sales Detail Section with Items
  if (data.sales && data.sales.length > 0) {
    yPos = checkPageBreak(doc, yPos, 80);
    yPos = addSectionTitle(doc, 'SALES TRANSACTIONS', yPos, COLORS.primary, data.sales.length);

    // Total only counts completed/refunded sales (not cancelled)
    const salesTotal = data.sales
      .filter((s: any) => s.status !== 'CANCELLED')
      .reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);

    // Build sales rows with item details and status column
    const salesRows: any[][] = [];
    for (const sale of data.sales) {
      const itemCount = sale.items?.length || 0;
      const itemQty = sale.items?.reduce((sum: number, i: any) => sum + (i.qty || 0), 0) || 0;
      const itemsSummary = itemCount > 0 ? `${itemCount} item(s), ${itemQty} qty` : '-';

      const paymentDetails = sale.payments?.map((p: any) =>
        `${p.method}${p.bankName ? ` (${p.bankName})` : ''}: ${formatCurrency(p.amount)}`
      ).join('\n') || '-';

      const status = sale.status || 'COMPLETED';
      let cancelInfo = status;
      if (status === 'CANCELLED' && sale.cancelledBy) {
        cancelInfo += `\nBy: ${sale.cancelledBy}`;
      }

      salesRows.push([
        sale.receiptNumber || '-',
        formatDateTime(sale.createdAt),
        sale.customer || 'Walk-in',
        sale.salesman || sale.cashier || '-',
        itemsSummary,
        paymentDetails,
        formatCurrency(sale.totalAmount),
        cancelInfo,
      ]);
    }

    autoTable(doc, {
      startY: yPos,
      head: [['Receipt #', 'Date/Time', 'Customer', 'Salesman', 'Items', 'Payments', 'Amount', 'Status']],
      body: salesRows,
      foot: [['', '', '', '', '', 'COMPLETED TOTAL:', formatCurrency(salesTotal), '']],
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      footStyles: { fillColor: COLORS.dark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      styles: { overflow: 'linebreak', cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 24 },
        2: { cellWidth: 24 },
        3: { cellWidth: 20 },
        4: { cellWidth: 'auto' }, // Allow dynamic sizing for items
        5: { cellWidth: 35 },
        6: { halign: 'right', fontStyle: 'bold', cellWidth: 20 },
        7: { halign: 'center', cellWidth: 20 }
      },
      margin: { left: 14, right: 14 },
      didParseCell: (cellData: any) => {
        // Color Status column: red for CANCELLED
        if (cellData.column.index === 7 && cellData.section === 'body') {
          const val = String(cellData.cell.raw || '');
          if (val.startsWith('CANCELLED')) {
            cellData.cell.styles.textColor = [239, 68, 68];
            cellData.cell.styles.fontStyle = 'bold';
          } else {
            cellData.cell.styles.textColor = [16, 185, 129];
          }
        }
        // Strike-through amount for cancelled sales
        if (cellData.column.index === 6 && cellData.section === 'body') {
          const statusVal = String(salesRows[cellData.row.index]?.[7] || '');
          if (statusVal.startsWith('CANCELLED')) {
            cellData.cell.styles.textColor = [150, 150, 150];
          }
        }
      },
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Detailed Item Breakdown (separate table) with Status
    yPos = checkPageBreak(doc, yPos, 80);
    yPos = addSectionTitle(doc, 'SOLD ITEMS DETAIL', yPos, COLORS.primary);

    const itemRows: any[][] = [];
    for (const sale of data.sales) {
      if (sale.items && sale.items.length > 0) {
        const paymentMethods = sale.payments?.map((p: any) =>
          p.bankName ? `${p.method} (${p.bankName}): ${formatCurrency(p.amount)}` : `${p.method}: ${formatCurrency(p.amount)}`
        ).join('\n') || '-';

        const salesman = sale.salesman || sale.cashier || '-';
        const location = sale.location || '-';
        const saleStatus = sale.status || 'COMPLETED';

        for (const item of sale.items) {
          itemRows.push([
            sale.receiptNumber || '-',
            item.name || '-',
            location,
            String(item.qty || 0),
            formatCurrency(item.unitPrice || 0),
            formatCurrency(item.lineTotal || 0),
            paymentMethods,
            salesman,
            saleStatus,
          ]);
        }
      }
    }

    if (itemRows.length > 0) {
      // Only sum items from completed sales
      const itemsTotal = data.sales
        .filter((s: any) => s.status !== 'CANCELLED')
        .reduce((sum: number, s: any) =>
          sum + (s.items?.reduce((iSum: number, i: any) => iSum + (i.lineTotal || 0), 0) || 0), 0);

      autoTable(doc, {
        startY: yPos,
        head: [['Receipt #', 'Item Name', 'Location', 'Qty', 'Unit Price', 'Line Total', 'Payment', 'Salesman', 'Status']],
        body: itemRows,
        foot: [['', '', '', '', '', formatCurrency(itemsTotal), '', '', '']],
        theme: 'striped',
        headStyles: { fillColor: COLORS.primary, fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7 },
        footStyles: { fillColor: COLORS.dark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 16 },
          1: { cellWidth: 30 },
          2: { cellWidth: 18 },
          3: { halign: 'center', cellWidth: 10 },
          4: { halign: 'right', cellWidth: 18 },
          5: { halign: 'right', fontStyle: 'bold', cellWidth: 18 },
          6: { cellWidth: 30 },
          7: { cellWidth: 20 },
          8: { halign: 'center', cellWidth: 18 }
        },
        margin: { left: 14, right: 14 },
        didParseCell: (cellData: any) => {
          if (cellData.column.index === 8 && cellData.section === 'body') {
            const val = String(cellData.cell.raw || '');
            if (val === 'CANCELLED') {
              cellData.cell.styles.textColor = [239, 68, 68];
              cellData.cell.styles.fontStyle = 'bold';
            } else {
              cellData.cell.styles.textColor = [16, 185, 129];
            }
          }
        },
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
    } else {
      yPos += 5;
    }
  }

  // Refunds & Cancellations Section
  if (data.refunds && data.refunds.length > 0) {
    yPos = checkPageBreak(doc, yPos, 80);
    yPos = addSectionTitle(doc, 'REFUNDS & CANCELLATIONS', yPos, COLORS.danger, data.refunds.length);

    const refundTotal = data.refunds.reduce((sum: number, r: any) => sum + (r.refundAmount || 0), 0);

    const refundRows = data.refunds.map((r: any) => [
      r.receiptNumber || '-',
      formatDateTime(r.cancelledAt),
      r.type === 'FULL_CANCEL' ? 'Full Cancel' : 'Partial Return',
      r.customer || 'Walk-in',
      r.refundMethod || '-',
      r.cancelledBy || '-',
      formatCurrency(r.refundAmount || 0),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Receipt #', 'Date/Time', 'Type', 'Customer', 'Refund Method', 'Cancelled By', 'Refund Amount']],
      body: refundRows,
      foot: [['', '', '', '', '', 'TOTAL REFUNDED:', formatCurrency(refundTotal)]],
      theme: 'striped',
      headStyles: { fillColor: COLORS.danger, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      footStyles: { fillColor: COLORS.dark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 28 },
        2: { cellWidth: 22 },
        3: { cellWidth: 28 },
        4: { cellWidth: 25 },
        5: { cellWidth: 28 },
        6: { halign: 'right', fontStyle: 'bold', cellWidth: 25 }
      },
      margin: { left: 14, right: 14 },
      didParseCell: (cellData: any) => {
        // Color type column
        if (cellData.column.index === 2 && cellData.section === 'body') {
          const val = String(cellData.cell.raw || '');
          if (val === 'Full Cancel') {
            cellData.cell.styles.textColor = [239, 68, 68];
            cellData.cell.styles.fontStyle = 'bold';
          } else {
            cellData.cell.styles.textColor = [245, 158, 11];
            cellData.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Expenses Section
  if (data.expenses && data.expenses.length > 0) {
    yPos = checkPageBreak(doc, yPos, 80);
    yPos = addSectionTitle(doc, 'EXPENSES', yPos, COLORS.danger, data.expenses.length);

    const expensesTotal = data.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    autoTable(doc, {
      startY: yPos,
      head: [['Category', 'Payee', 'Description', 'Payment Method', 'Amount']],
      body: data.expenses.map((expense: any) => [
        expense.category || '-',
        expense.payee || '-',
        (expense.description || '-').substring(0, 30),
        `${expense.paymentMethod}${expense.bankName ? ` (${expense.bankName})` : ''}`,
        formatCurrency(expense.amount),
      ]),
      foot: [['', '', '', 'TOTAL:', formatCurrency(expensesTotal)]],
      theme: 'striped',
      styles: { overflow: 'linebreak', cellPadding: 2 },
      headStyles: { fillColor: COLORS.danger, fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9 },
      footStyles: { fillColor: COLORS.dark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
      columnStyles: { 
        2: { cellWidth: 'auto' }, // Description can be long
        4: { halign: 'right', fontStyle: 'bold' } 
      },
      margin: { left: 14, right: 14 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Special Income Section
  if (data.specialIncomes && data.specialIncomes.length > 0) {
    yPos = checkPageBreak(doc, yPos, 60);
    yPos = addSectionTitle(doc, 'SPECIAL INCOME', yPos, COLORS.warning, data.specialIncomes.length);

    const incomeTotal = data.specialIncomes.reduce((sum, i) => sum + (i.amount || 0), 0);

    autoTable(doc, {
      startY: yPos,
      head: [['Category', 'Description', 'Created By', 'Amount']],
      body: data.specialIncomes.map((income: any) => [
        income.category || '-',
        income.description || '-',
        income.createdBy || '-',
        formatCurrency(income.amount),
      ]),
      foot: [['', '', 'TOTAL:', formatCurrency(incomeTotal)]],
      theme: 'striped',
      headStyles: { fillColor: COLORS.warning, fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9 },
      footStyles: { fillColor: COLORS.dark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
      columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: 14, right: 14 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Layaway Payments Section
  if (data.layawayPayments && data.layawayPayments.length > 0) {
    yPos = checkPageBreak(doc, yPos, 60);
    yPos = addSectionTitle(doc, 'LAYAWAY PAYMENTS', yPos, COLORS.purple, data.layawayPayments.length);

    const layawayTotal = data.layawayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    autoTable(doc, {
      startY: yPos,
      head: [['Layaway #', 'Customer', 'Date', 'Payment Method', 'Amount']],
      body: data.layawayPayments.map((payment: any) => [
        payment.layawayNumber || '-',
        payment.customerName || '-',
        formatDateTime(payment.createdAt),
        `${payment.paymentMethod}${payment.bankName ? ` (${payment.bankName})` : ''}`,
        formatCurrency(payment.amount),
      ]),
      foot: [['', '', '', 'TOTAL:', formatCurrency(layawayTotal)]],
      theme: 'striped',
      headStyles: { fillColor: COLORS.purple, fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9 },
      footStyles: { fillColor: COLORS.dark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
      columnStyles: { 4: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: 14, right: 14 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Credit Payments Section
  if (data.creditPayments && data.creditPayments.length > 0) {
    yPos = checkPageBreak(doc, yPos, 60);
    yPos = addSectionTitle(doc, 'CREDIT PAYMENTS', yPos, COLORS.info, data.creditPayments.length);

    const creditTotal = data.creditPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    autoTable(doc, {
      startY: yPos,
      head: [['Customer', 'Date', 'Payment Method', 'Amount']],
      body: data.creditPayments.map((payment: any) => [
        payment.customerName || '-',
        formatDateTime(payment.createdAt),
        `${payment.paymentMethod}${payment.bankName ? ` (${payment.bankName})` : ''}`,
        formatCurrency(payment.amount),
      ]),
      foot: [['', '', 'TOTAL:', formatCurrency(creditTotal)]],
      theme: 'striped',
      headStyles: { fillColor: COLORS.info, fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9 },
      footStyles: { fillColor: COLORS.dark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
      columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: 14, right: 14 },
    });
  }

  // Add page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  return doc;
}

// Sales Summary Report
export function generateSalesSummaryPDF(data: any, startDate: string, endDate: string): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = addPageHeader(doc, 'SALES SUMMARY REPORT', startDate, endDate);

  const summary = data.summary || {};

  // Summary metrics
  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: [
      ['Gross Sales', formatCurrency(summary.grossSales || 0)],
      ['Total Refunds', formatCurrency(summary.totalRefunds || 0)],
      ['Net Sales', formatCurrency(summary.totalSales || 0)],
      ['Total Cost', formatCurrency(summary.totalCost || 0)],
      ['Gross Profit', formatCurrency(summary.grossProfit || 0)],
      ['Total Transactions', String(summary.totalTransactions || 0)],
      ['Total Items Sold', String(summary.totalItems || 0)],
    ],
    theme: 'grid',
    headStyles: { fillColor: COLORS.primary, fontSize: 11, fontStyle: 'bold' },
    bodyStyles: { fontSize: 11 },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });
  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Payment breakdown
  if (data.paymentBreakdown) {
    yPos = addSectionTitle(doc, 'PAYMENT BREAKDOWN', yPos, COLORS.info);

    const paymentData = Object.entries(data.paymentBreakdown).map(([method, amount]) => [
      method, formatCurrency(amount as number)
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Payment Method', 'Amount']],
      body: paymentData,
      theme: 'striped',
      headStyles: { fillColor: COLORS.info, fontSize: 10, fontStyle: 'bold' },
      bodyStyles: { fontSize: 10 },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: 14, right: 14 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Sales list with items
  if (data.sales && data.sales.length > 0) {
    yPos = checkPageBreak(doc, yPos, 80);
    yPos = addSectionTitle(doc, 'SALES TRANSACTIONS', yPos, COLORS.primary, data.sales.length);

    // Build sales rows with item details
    const salesRows: any[][] = [];
    for (const sale of data.sales) {
      const itemsSummary = sale.items?.map((i: any) => `${i.name} (${i.qty})`).join(', ') || '-';
      
      let cancelInfo = sale.status || 'COMPLETED';
      if (cancelInfo === 'CANCELLED' && sale.cancelledBy) {
        cancelInfo += `\nBy: ${sale.cancelledBy}`;
      } else if (sale.returns && sale.returns.length > 0) {
        cancelInfo = 'REFUNDED';
      }

      salesRows.push([
        sale.receiptNumber || '-',
        formatDateTime(sale.createdAt),
        sale.salesman || sale.cashier || '-',
        sale.location || '-',
        itemsSummary.length > 40 ? itemsSummary.substring(0, 37) + '...' : itemsSummary,
        formatCurrency(sale.totalAmount),
        cancelInfo
      ]);
    }

    autoTable(doc, {
      startY: yPos,
      head: [['Receipt #', 'Date/Time', 'Salesman', 'Location', 'Items (Qty)', 'Amount', 'Status']],
      body: salesRows,
      theme: 'striped',
      styles: { overflow: 'linebreak', cellPadding: 2 },
      headStyles: { fillColor: COLORS.primary, fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 'auto' }, // Allow items to wrap
        5: { halign: 'right', fontStyle: 'bold', cellWidth: 25 },
        6: { halign: 'center', cellWidth: 20 }
      },
      margin: { left: 14, right: 14 },
      didParseCell: (cellData: any) => {
        // Color Status column
        if (cellData.column.index === 6 && cellData.section === 'body') {
          const val = String(cellData.cell.raw || '');
          if (val.startsWith('CANCELLED') || val.startsWith('REFUNDED')) {
            cellData.cell.styles.textColor = [239, 68, 68];
            cellData.cell.styles.fontStyle = 'bold';
          } else {
            cellData.cell.styles.textColor = [16, 185, 129];
          }
        }
        // Strike-through amount for cancelled sales
        if (cellData.column.index === 5 && cellData.section === 'body') {
          const statusVal = String(salesRows[cellData.row.index]?.[6] || '');
          if (statusVal.startsWith('CANCELLED')) {
            cellData.cell.styles.textColor = [150, 150, 150];
          }
        }
      },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Detailed Items Sold
    yPos = checkPageBreak(doc, yPos, 80);
    yPos = addSectionTitle(doc, 'ITEMS SOLD DETAIL', yPos, COLORS.primary);

    const itemRows: any[][] = [];
    for (const sale of data.sales) {
      if (sale.items && sale.items.length > 0) {
        for (const item of sale.items) {
          itemRows.push([
            sale.receiptNumber || '-',
            item.name || '-',
            sale.location || '-',
            String(item.qty || 0),
            formatCurrency(item.unitPrice || 0),
            formatCurrency(item.lineTotal || 0),
            sale.status || 'COMPLETED'
          ]);
        }
      }
    }

    if (itemRows.length > 0) {
      // Only sum items from completed sales
      const itemsTotal = data.sales
        .filter((s: any) => s.status !== 'CANCELLED')
        .reduce((sum: number, s: any) =>
          sum + (s.items?.reduce((iSum: number, i: any) => iSum + (i.lineTotal || 0), 0) || 0), 0);

      autoTable(doc, {
        startY: yPos,
        head: [['Receipt #', 'Item Name', 'Location', 'Qty', 'Unit Price', 'Line Total', 'Status']],
        body: itemRows,
        foot: [['', '', '', '', 'TOTAL:', formatCurrency(itemsTotal), '']],
        theme: 'striped',
        headStyles: { fillColor: COLORS.primary, fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8 },
        footStyles: { fillColor: COLORS.dark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        styles: { overflow: 'linebreak', cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 'auto' }, // Allow dynamic sizing
          2: { cellWidth: 30 },
          3: { halign: 'center', cellWidth: 15 },
          4: { halign: 'right', cellWidth: 20 },
          5: { halign: 'right', fontStyle: 'bold', cellWidth: 25 },
          6: { halign: 'center', cellWidth: 20 }
        },
        margin: { left: 14, right: 14 },
        didParseCell: (cellData: any) => {
          if (cellData.column.index === 6 && cellData.section === 'body') {
            const val = String(cellData.cell.raw || '');
            if (val === 'CANCELLED') {
              cellData.cell.styles.textColor = [239, 68, 68];
              cellData.cell.styles.fontStyle = 'bold';
            } else {
              cellData.cell.styles.textColor = [16, 185, 129];
            }
          }
        },
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
  }

  // Refunds & Cancellations Section for Daily Sales
  const cancelledSales = data.sales?.filter((s: any) => s.status === 'CANCELLED' || (s.returns && s.returns.length > 0)) || [];
  if (cancelledSales.length > 0) {
    yPos = checkPageBreak(doc, yPos, 80);
    yPos = addSectionTitle(doc, 'REFUNDS & CANCELLATIONS', yPos, COLORS.danger, cancelledSales.length);

    const refundTotal = cancelledSales.reduce((sum: number, r: any) => sum + (r.refundAmount || 0) + (r.returns?.reduce((rSum: number, ret: any) => rSum + Number(ret.totalAmount), 0) || 0), 0);

    const refundRows: any[][] = [];
    for (const r of cancelledSales) {
        if (r.status === 'CANCELLED') {
            refundRows.push([
              r.receiptNumber || '-',
              formatDateTime(r.createdAt),
              'Full Cancel',
              r.customer || 'Walk-in',
              r.refundMethod || '-',
              r.cancelledBy || '-',
              formatCurrency(r.refundAmount || 0),
            ]);
        }
        if (r.returns && r.returns.length > 0) {
            for (const ret of r.returns) {
                refundRows.push([
                  ret.returnNumber || r.receiptNumber,
                  formatDateTime(r.createdAt),
                  'Partial Return',
                  r.customer || 'Walk-in',
                  ret.refundMethod || '-',
                  'System', 
                  formatCurrency(ret.totalAmount || 0),
                ]);
            }
        }
    }

    autoTable(doc, {
      startY: yPos,
      head: [['Receipt #', 'Date/Time', 'Type', 'Customer', 'Refund Method', 'Cancelled By', 'Refund Amount']],
      body: refundRows,
      foot: [['', '', '', '', '', 'TOTAL REFUNDED:', formatCurrency(refundTotal)]],
      theme: 'striped',
      headStyles: { fillColor: COLORS.danger, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      footStyles: { fillColor: COLORS.dark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 28 },
        2: { cellWidth: 22 },
        3: { cellWidth: 28 },
        4: { cellWidth: 25 },
        5: { cellWidth: 28 },
        6: { halign: 'right', fontStyle: 'bold', cellWidth: 25 }
      },
      margin: { left: 14, right: 14 },
      didParseCell: (cellData: any) => {
        if (cellData.column.index === 2 && cellData.section === 'body') {
          const val = String(cellData.cell.raw || '');
          if (val === 'Full Cancel') {
            cellData.cell.styles.textColor = [239, 68, 68];
            cellData.cell.styles.fontStyle = 'bold';
          } else {
            cellData.cell.styles.textColor = [245, 158, 11];
            cellData.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  return doc;
}



// Inventory Status Report
export function generateInventoryStatusPDF(data: any): jsPDF {
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();
  const today = new Date().toISOString().split('T')[0];
  let yPos = addPageHeader(doc, 'INVENTORY STATUS REPORT', today, today);

  const summary = data.summary || {};

  // Summary metrics table
  autoTable(doc, {
    startY: yPos,
    head: [['INVENTORY SUMMARY', 'Value']],
    body: [
      ['Total Items', String(summary.totalItems || 0)],
      ['Total Stock Value (Cost)', formatCurrency(summary.totalStockValue || 0)],
      ['Total Retail Value', formatCurrency(summary.totalRetailValue || 0)],
      ['Potential Profit', formatCurrency(summary.potentialProfit || 0)],
      ['Low Stock Items', String(summary.lowStockItems || 0)],
      ['Out of Stock Items', String(summary.outOfStockItems || 0)],
    ],
    theme: 'grid',
    headStyles: { fillColor: COLORS.primary, fontSize: 11, fontStyle: 'bold' },
    bodyStyles: { fontSize: 10 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 }, 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
    tableWidth: 180,
  });
  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Items table with location breakdown
  if (data.items && data.items.length > 0) {
    yPos = checkPageBreak(doc, yPos, 80);
    yPos = addSectionTitle(doc, 'INVENTORY ITEMS', yPos, COLORS.info, data.items.length);

    const totalValue = data.items.reduce((sum: number, i: any) => sum + (i.stockValue || 0), 0);

    // Build rows with location info
    const itemRows: any[][] = [];
    for (const item of data.items) {
      // Format location stock info
      const locationInfo = item.stockByLocation && item.stockByLocation.length > 0
        ? item.stockByLocation.map((loc: any) => `${loc.location}: ${loc.qty}`).join('\n')
        : '-';

      itemRows.push([
        item.sku || '-',
        (item.name || '-').substring(0, 30),
        (item.category || '-').substring(0, 15),
        String(item.totalStock || 0),
        locationInfo,
        formatCurrency(item.costPrice || 0),
        formatCurrency(item.unitPrice || 0),
        formatCurrency(item.stockValue || 0),
        item.totalStock === 0 ? 'OUT' : item.isLowStock ? 'LOW' : 'OK',
      ]);
    }

    autoTable(doc, {
      startY: yPos,
      head: [['SKU', 'Item Name', 'Category', 'Stock', 'Location (Qty)', 'Cost', 'Unit Price', 'Stock Value', 'Status']],
      body: itemRows,
      foot: [['', '', '', '', '', '', 'TOTAL:', formatCurrency(totalValue), '']],
      theme: 'striped',
      headStyles: { fillColor: COLORS.info, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7 },
      footStyles: { fillColor: COLORS.dark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 50 },
        2: { cellWidth: 30 },
        3: { halign: 'center', cellWidth: 20 },
        4: { cellWidth: 50 },
        5: { halign: 'right', cellWidth: 28 },
        6: { halign: 'right', cellWidth: 28 },
        7: { halign: 'right', fontStyle: 'bold', cellWidth: 30 },
        8: { halign: 'center', cellWidth: 18 },
      },
      margin: { left: 14, right: 14 },
      didParseCell: (cellData: any) => {
        if (cellData.column.index === 8 && cellData.section === 'body') {
          const status = cellData.cell.raw;
          if (status === 'OUT') {
            cellData.cell.styles.textColor = [239, 68, 68];
            cellData.cell.styles.fontStyle = 'bold';
          } else if (status === 'LOW') {
            cellData.cell.styles.textColor = [245, 158, 11];
            cellData.cell.styles.fontStyle = 'bold';
          } else {
            cellData.cell.styles.textColor = [16, 185, 129];
          }
        }
      },
    });
  }

  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  return doc;
}

// Stock Adjustment Report
export function generateStockAdjustmentPDF(data: any, startDate: string, endDate: string): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = addPageHeader(doc, 'STOCK ADJUSTMENT REPORT', startDate, endDate);

  const summary = data.summary || {};

  // Summary table
  autoTable(doc, {
    startY: yPos,
    head: [['ADJUSTMENT SUMMARY', 'Count']],
    body: [
      ['Items Created', String(summary.itemsCreated || 0)],
      ['Items Updated', String(summary.itemsUpdated || 0)],
      ['Total Item Changes', String(summary.totalItemChanges || 0)],
      ['Stock Additions', String(summary.stockIn || 0)],
      ['Stock Reductions', String(summary.stockOut || 0)],
    ],
    theme: 'grid',
    headStyles: { fillColor: COLORS.warning, fontSize: 11, fontStyle: 'bold' },
    bodyStyles: { fontSize: 10 },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
    tableWidth: 120,
  });
  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Item Adjustments
  if (data.itemAdjustments && data.itemAdjustments.length > 0) {
    yPos = checkPageBreak(doc, yPos, 80);
    yPos = addSectionTitle(doc, 'ITEM CHANGES', yPos, COLORS.primary, data.itemAdjustments.length);

    autoTable(doc, {
      startY: yPos,
      head: [['Date/Time', 'SKU', 'Item Name', 'Action', 'Changes', 'User']],
      body: data.itemAdjustments.map((adj: any) => [
        formatDateTime(adj.createdAt),
        adj.itemSku || '-',
        (adj.itemName || '-').substring(0, 20),
        adj.action,
        adj.changesText || '-',
        adj.user || '-',
      ]),
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary, fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 18 },
        2: { cellWidth: 30 },
        3: { cellWidth: 18 },
        4: { cellWidth: 60, overflow: 'linebreak' },
        5: { cellWidth: 22 },
      },
      margin: { left: 14, right: 14 },
      didParseCell: (data: any) => {
        if (data.column.index === 3 && data.section === 'body') {
          const action = data.cell.raw;
          if (action === 'CREATE') {
            data.cell.styles.textColor = [16, 185, 129];
            data.cell.styles.fontStyle = 'bold';
          } else if (action === 'UPDATE') {
            data.cell.styles.textColor = [59, 130, 246];
          }
        }
      },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Stock Adjustments
  if (data.stockAdjustments && data.stockAdjustments.length > 0) {
    yPos = checkPageBreak(doc, yPos, 80);
    yPos = addSectionTitle(doc, 'STOCK QUANTITY CHANGES', yPos, COLORS.warning, data.stockAdjustments.length);

    autoTable(doc, {
      startY: yPos,
      head: [['Date/Time', 'SKU', 'Item Name', 'Location', 'Old Qty', 'New Qty', 'Change', 'User']],
      body: data.stockAdjustments.map((adj: any) => [
        formatDateTime(adj.createdAt),
        adj.itemSku || '-',
        (adj.itemName || '-').substring(0, 18),
        (adj.location || '-').substring(0, 12),
        String(adj.oldQty || 0),
        String(adj.newQty || 0),
        adj.qtyChange > 0 ? `+${adj.qtyChange}` : String(adj.qtyChange),
        adj.user || '-',
      ]),
      theme: 'striped',
      headStyles: { fillColor: COLORS.warning, fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
      didParseCell: (data: any) => {
        if (data.column.index === 6 && data.section === 'body') {
          const change = data.cell.raw;
          if (change && change.startsWith('+')) {
            data.cell.styles.textColor = [16, 185, 129];
          } else if (change && change.startsWith('-')) {
            data.cell.styles.textColor = [239, 68, 68];
          }
        }
      },
    });
  }

  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  return doc;
}

// Credits Report
export function generateCreditsPDF(data: any, startDate: string, endDate: string): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = addPageHeader(doc, 'CREDITS REPORT', startDate, endDate);

  const summary = data.summary || {};

  // Summary table
  autoTable(doc, {
    startY: yPos,
    head: [['CREDITS SUMMARY', 'Value']],
    body: [
      ['Total Credits', String(summary.totalCredits || 0)],
      ['Total Credit Amount', formatCurrency(summary.totalCreditAmount || 0)],
      ['Total Paid', formatCurrency(summary.totalPaid || 0)],
      ['Total Outstanding', formatCurrency(summary.totalOutstanding || 0)],
      ['Active Credits', String(summary.activeCredits || 0)],
      ['Overdue Credits', String(summary.overdueCredits || 0)],
      ['Paid Credits', String(summary.paidCredits || 0)],
    ],
    theme: 'grid',
    headStyles: { fillColor: COLORS.info, fontSize: 11, fontStyle: 'bold' },
    bodyStyles: { fontSize: 10 },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
    tableWidth: 140,
  });
  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Credits list
  if (data.credits && data.credits.length > 0) {
    yPos = checkPageBreak(doc, yPos, 80);
    yPos = addSectionTitle(doc, 'CREDIT DETAILS', yPos, COLORS.info, data.credits.length);

    autoTable(doc, {
      startY: yPos,
      head: [['Customer', 'Phone', 'Receipt #', 'Total', 'Paid', 'Balance', 'Due Date', 'Status']],
      body: data.credits.map((credit: any) => [
        (credit.customerName || '-').substring(0, 15),
        credit.customerPhone || '-',
        credit.receiptNumber || '-',
        formatCurrency(credit.totalAmount),
        formatCurrency(credit.paidAmount),
        formatCurrency(credit.balance),
        credit.dueDate ? formatDate(credit.dueDate) : '-',
        credit.status === 'CLOSED' ? 'PAID' : credit.status,
      ]),
      theme: 'striped',
      headStyles: { fillColor: COLORS.info, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold' },
        7: { halign: 'center' },
      },
      margin: { left: 14, right: 14 },
      didParseCell: (cellData: any) => {
        if (cellData.column.index === 7 && cellData.section === 'body') {
          const status = cellData.cell.raw;
          if (status === 'OVERDUE') {
            cellData.cell.styles.textColor = [239, 68, 68];
            cellData.cell.styles.fontStyle = 'bold';
          } else if (status === 'PAID') {
            cellData.cell.styles.textColor = [16, 185, 129];
          } else if (status === 'OPEN') {
            cellData.cell.styles.textColor = [59, 130, 246];
          }
        }
      },
    });
  }

  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  return doc;
}

// Layaways Report
export function generateLayawaysPDF(data: any, startDate: string, endDate: string): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = addPageHeader(doc, 'LAYAWAYS REPORT', startDate, endDate);

  const summary = data.summary || {};

  // Summary table
  autoTable(doc, {
    startY: yPos,
    head: [['LAYAWAYS SUMMARY', 'Value']],
    body: [
      ['Total Layaways', String(summary.totalLayaways || 0)],
      ['Total Layaway Amount', formatCurrency(summary.totalLayawayAmount || 0)],
      ['Total Paid', formatCurrency(summary.totalPaid || 0)],
      ['Total Outstanding', formatCurrency(summary.totalOutstanding || 0)],
      ['Active Layaways', String(summary.activeLayaways || 0)],
      ['Completed Layaways', String(summary.completedLayaways || 0)],
      ['Cancelled Layaways', String(summary.cancelledLayaways || 0)],
    ],
    theme: 'grid',
    headStyles: { fillColor: COLORS.purple, fontSize: 11, fontStyle: 'bold' },
    bodyStyles: { fontSize: 10 },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
    tableWidth: 140,
  });
  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Layaways list
  if (data.layaways && data.layaways.length > 0) {
    yPos = checkPageBreak(doc, yPos, 80);
    yPos = addSectionTitle(doc, 'LAYAWAY DETAILS', yPos, COLORS.purple, data.layaways.length);

    autoTable(doc, {
      startY: yPos,
      head: [['Layaway #', 'Customer', 'Phone', 'Total', 'Paid', 'Balance', 'Status']],
      body: data.layaways.map((layaway: any) => [
        layaway.layawayNumber || '-',
        (layaway.customerName || '-').substring(0, 15),
        layaway.customerPhone || '-',
        formatCurrency(layaway.totalAmount),
        formatCurrency(layaway.paidAmount),
        formatCurrency(layaway.balance),
        layaway.status,
      ]),
      theme: 'striped',
      headStyles: { fillColor: COLORS.purple, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold' },
        6: { halign: 'center' },
      },
      margin: { left: 14, right: 14 },
      didParseCell: (cellData: any) => {
        if (cellData.column.index === 6 && cellData.section === 'body') {
          const status = cellData.cell.raw;
          if (status === 'COMPLETED') {
            cellData.cell.styles.textColor = [16, 185, 129];
          } else if (status === 'CANCELLED') {
            cellData.cell.styles.textColor = [239, 68, 68];
          }
        }
      },
    });
  }

  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  return doc;
}

// Purchase Recommendation Report
export function generatePurchaseRecommendationPDF(data: any): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const today = new Date().toISOString().split('T')[0];
  let yPos = addPageHeader(doc, 'PURCHASE RECOMMENDATION', today, today);

  // Items list
  if (data.items && data.items.length > 0) {
    yPos = addSectionTitle(doc, 'RECOMMENDED ITEMS TO PURCHASE', yPos, COLORS.warning, data.items.length);

    autoTable(doc, {
      startY: yPos,
      head: [['SKU', 'Item Name', 'Current Stock', 'Min Stock', 'Suggested Qty', 'Cost Price', 'Est. Cost']],
      body: data.items.map((item: any) => [
        item.sku || '-',
        (item.name || '-').substring(0, 25),
        String(item.currentStock || 0),
        String(item.minStock || 0),
        String(item.suggestedQty || 0),
        formatCurrency(item.costPrice || 0),
        formatCurrency(item.estimatedCost || 0),
      ]),
      theme: 'striped',
      headStyles: { fillColor: COLORS.warning, fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center', fontStyle: 'bold' },
        5: { halign: 'right' },
        6: { halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    });
  }

  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  return doc;
}

// Inventory Movement Report
export function generateInventoryMovementPDF(data: any, startDate: string, endDate: string): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = addPageHeader(doc, 'INVENTORY MOVEMENT REPORT', startDate, endDate);

  // Fast moving items
  if (data.fastMoving && data.fastMoving.length > 0) {
    yPos = addSectionTitle(doc, 'FAST MOVING ITEMS', yPos, COLORS.primary, data.fastMoving.length);

    autoTable(doc, {
      startY: yPos,
      head: [['SKU', 'Item Name', 'Qty Sold', 'Revenue', 'Current Stock']],
      body: data.fastMoving.map((item: any) => [
        item.sku || '-',
        (item.name || '-').substring(0, 30),
        String(item.qtySold || 0),
        formatCurrency(item.revenue || 0),
        String(item.currentStock || 0),
      ]),
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary, fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'center' },
      },
      margin: { left: 14, right: 14 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Slow moving items
  if (data.slowMoving && data.slowMoving.length > 0) {
    yPos = checkPageBreak(doc, yPos, 80);
    yPos = addSectionTitle(doc, 'SLOW MOVING ITEMS', yPos, COLORS.danger, data.slowMoving.length);

    autoTable(doc, {
      startY: yPos,
      head: [['SKU', 'Item Name', 'Qty Sold', 'Days Since Last Sale', 'Current Stock']],
      body: data.slowMoving.map((item: any) => [
        item.sku || '-',
        (item.name || '-').substring(0, 30),
        String(item.qtySold || 0),
        String(item.daysSinceLastSale || '-'),
        String(item.currentStock || 0),
      ]),
      theme: 'striped',
      headStyles: { fillColor: COLORS.danger, fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
      },
      margin: { left: 14, right: 14 },
    });
  }

  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  return doc;
}

// Commission Report
export function generateCommissionPDF(data: any, startDate: string, endDate: string): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = addPageHeader(doc, 'COMMISSION REPORT', startDate, endDate);

  const summary = data.summary || {};

  // Overall Summary
  autoTable(doc, {
    startY: yPos,
    head: [['COMMISSION SUMMARY', 'Value']],
    body: [
      ['Total Transactions', String(summary.count || 0)],
      ['Total Profit Generated', formatCurrency(summary.totalProfitGenerated || 0)],
      ['Total Commission', formatCurrency(summary.totalCommission || 0)],
    ],
    theme: 'grid',
    headStyles: { fillColor: COLORS.primary, fontSize: 11, fontStyle: 'bold' },
    bodyStyles: { fontSize: 10 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 }, 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
    tableWidth: 150,
  });
  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Per-User Summary
  if (data.userStats && data.userStats.length > 0) {
    yPos = checkPageBreak(doc, yPos, 80);
    yPos = addSectionTitle(doc, 'COMMISSION BY USER', yPos, COLORS.info, data.userStats.length);

    const grandTotalCommission = data.userStats.reduce((sum: number, u: any) => sum + (u.totalCommission || 0), 0);
    const grandTotalProfit = data.userStats.reduce((sum: number, u: any) => sum + (u.totalProfit || 0), 0);
    const grandTotalCount = data.userStats.reduce((sum: number, u: any) => sum + (u.count || 0), 0);

    autoTable(doc, {
      startY: yPos,
      head: [['User Name', 'Role', 'Sales', 'Total Profit', 'Total Commission']],
      body: data.userStats.map((u: any) => [
        u.userName || '-',
        u.userRole || '-',
        String(u.count || 0),
        formatCurrency(u.totalProfit || 0),
        formatCurrency(u.totalCommission || 0),
      ]),
      foot: [['GRAND TOTAL', '', String(grandTotalCount), formatCurrency(grandTotalProfit), formatCurrency(grandTotalCommission)]],
      theme: 'striped',
      headStyles: { fillColor: COLORS.info, fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9 },
      footStyles: { fillColor: COLORS.dark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      columnStyles: {
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Detailed Commission Items
  if (data.commissionItems && data.commissionItems.length > 0) {
    yPos = checkPageBreak(doc, yPos, 80);
    yPos = addSectionTitle(doc, 'COMMISSION DETAILS', yPos, COLORS.primary, data.commissionItems.length);

    const totalCommissionAmount = data.commissionItems.reduce((sum: number, item: any) => sum + (item.commission || 0), 0);

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Receipt', 'Salesman', 'Item', 'Qty', 'Price', 'Commission']],
      body: data.commissionItems.map((item: any) => [
        formatDateTime(item.date),
        item.receiptNumber || '-',
        (item.salesman || '-').substring(0, 15),
        (item.itemName || '-').substring(0, 20),
        String(item.qty || 0),
        formatCurrency(item.sellingPrice || 0),
        formatCurrency(item.commission || 0),
      ]),
      foot: [['', '', '', '', '', 'TOTAL:', formatCurrency(totalCommissionAmount)]],
      theme: 'striped',
      styles: { overflow: 'linebreak', cellPadding: 2 },
      headStyles: { fillColor: COLORS.primary, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      footStyles: { fillColor: COLORS.dark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 'auto' }, // Allow item names to wrap
        2: { cellWidth: 30 },
        3: { halign: 'center', cellWidth: 15 },
        4: { halign: 'right', cellWidth: 20 },
        5: { halign: 'right', fontStyle: 'bold', cellWidth: 25 },
        6: { halign: 'center', cellWidth: 20 }
      },
      margin: { left: 14, right: 14 },
    });
  }

  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  return doc;
}

export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(filename);
}


// Bulk QR Labels Report
interface BulkQRLabelItem {
  id: string;
  sku: string;
  name: string;
  barcode: string;
  unitPrice: number;
  unitOfMeasure: string;
  stockQuantity: number;
}

interface BulkQRLabelData {
  items: BulkQRLabelItem[];
  totalLabels: number;
  locationName?: string;
  generatedAt: string;
}

// Generate QR code as data URL using the qrcode library
// This creates actual scannable QR codes
async function generateQRCodeImage(value: string, size: number = 150): Promise<string> {
  try {
    // Dynamically import the qrcode library
    const QRCode = await import('qrcode');

    // Generate QR code as data URL
    const dataUrl = await QRCode.toDataURL(value, {
      width: size,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    // Return empty string on error - the PDF will show placeholder
    return '';
  }
}

export async function generateBulkQRLabelsPDF(data: BulkQRLabelData): Promise<jsPDF> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Label dimensions (in mm) - adjusted for 4 columns
  const marginX = 10;
  const marginY = 12;
  const gapX = 3;
  const gapY = 4;

  // Calculate width for 4 columns: (PageWidth - 2*Margin - 3*Gap) / 4
  // A4 width ~210mm. (210 - 20 - 9) / 4 = ~45.25mm
  const labelWidth = (pageWidth - (2 * marginX) - (3 * gapX)) / 4;
  const labelHeight = 38; // Increased slightly for vertical space

  // Calculate grid
  const labelsPerRow = 4;
  const labelsPerCol = Math.floor((pageHeight - marginY - 10 + gapY) / (labelHeight + gapY));
  const labelsPerPage = labelsPerRow * labelsPerCol;

  // Header on first page
  const today = new Date().toISOString().split('T')[0];
  let yPos = addPageHeader(doc, 'BULK QR CODE LABELS', today, today);

  // Summary info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.dark);

  const summaryText = data.locationName
    ? `Location: ${data.locationName} | Items: ${data.items.length} | Total Labels: ${data.totalLabels}`
    : `All Locations | Items: ${data.items.length} | Total Labels: ${data.totalLabels}`;
  doc.text(summaryText, pageWidth / 2, yPos, { align: 'center' });

  // Start labels on new page for cleaner layout
  doc.addPage();

  let labelIndex = 0;

  // Pre-generate QR codes for each unique item (cache them)
  const qrCodeCache: Record<string, string> = {};
  for (const item of data.items) {
    if (!qrCodeCache[item.barcode]) {
      qrCodeCache[item.barcode] = await generateQRCodeImage(item.barcode, 150);
    }
  }

  // Process each item and generate labels based on stock quantity
  for (const item of data.items) {
    const qrCodeDataUrl = qrCodeCache[item.barcode];

    for (let i = 0; i < item.stockQuantity; i++) {
      // Check if we need a new page
      if (labelIndex > 0 && labelIndex % labelsPerPage === 0) {
        doc.addPage();
      }

      // Calculate position in grid
      const posInPage = labelIndex % labelsPerPage;
      const col = posInPage % labelsPerRow;
      const row = Math.floor(posInPage / labelsPerRow);

      const x = marginX + col * (labelWidth + gapX);
      const y = marginY + row * (labelHeight + gapY);

      // Draw label border
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.rect(x, y, labelWidth, labelHeight);

      // Draw item name (truncated) at top
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.dark);
      const truncatedName = item.name.length > 20 ? item.name.substring(0, 18) + '...' : item.name;
      doc.text(truncatedName, x + labelWidth / 2, y + 4.5, { align: 'center', maxWidth: labelWidth - 2 });

      // Determine if unit should be shown
      const showUnit = item.unitOfMeasure && item.unitOfMeasure.toUpperCase() !== 'METER';

      // Calculate layout based on whether unit is shown
      let qrY = y + 6;
      let qrSize = 22; // Default size

      if (showUnit) {
        // If unit is shown, shift QR code down slightly and maybe shrink relevant to space
        qrY = y + 6.5;
        qrSize = 20;
      }

      const qrX = x + (labelWidth - qrSize) / 2;

      // Draw QR Code
      if (qrCodeDataUrl && qrCodeDataUrl.startsWith('data:image')) {
        try {
          doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
        } catch {
          // Fallback
          doc.setFillColor(240, 240, 240);
          doc.rect(qrX, qrY, qrSize, qrSize, 'F');
        }
      } else {
        // Placeholder
        doc.setFillColor(240, 240, 240);
        doc.rect(qrX, qrY, qrSize, qrSize, 'F');
      }

      // Draw SKU
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.dark);

      let textY = y + labelHeight - 6.5; // Baseline for text block

      doc.text(`SKU: ${item.sku}`, x + labelWidth / 2, textY, { align: 'center' });

      // Draw Unit if applicable
      if (showUnit) {
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold'); // Make it slightly bold to stand out
        doc.setTextColor(...COLORS.gray);
        doc.text(`Unit: ${item.unitOfMeasure}`, x + labelWidth / 2, textY + 3.5, { align: 'center' });
      }

      labelIndex++;
    }
  }

  // Add page numbers to all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }

  return doc;
}

// Stock Movement (Ledger) Report
export function generateStockMovementPDF(data: any[], startDate: string, endDate: string): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = addPageHeader(doc, 'STOCK MOVEMENT LEDGER', startDate, endDate);

  // Summary - In/Out totals
  const totalIn = data.filter(m => m.qtyChange > 0).reduce((sum, m) => sum + m.qtyChange, 0);
  const totalOut = data.filter(m => m.qtyChange < 0).reduce((sum, m) => sum + Math.abs(m.qtyChange), 0);

  autoTable(doc, {
    startY: yPos,
    head: [['Movement Summary', 'Total Quantity']],
    body: [
      ['Total Stock In', String(totalIn)],
      ['Total Stock Out', String(totalOut)],
      ['Net Movement', String(totalIn - totalOut)],
    ],
    theme: 'grid',
    headStyles: { fillColor: COLORS.primary, fontSize: 11, fontStyle: 'bold' },
    bodyStyles: { fontSize: 10 },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
    tableWidth: 100,
  });
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Detailed Movements Table
  autoTable(doc, {
    startY: yPos,
    head: [['Date/Time', 'Type', 'Reference', 'Item', 'Location', 'Qty', 'User']],
    body: data.map(m => [
      formatDateTime(m.date),
      m.type.replace('_', ' '),
      m.reference || '-',
      m.item || '-',
      m.location || '-',
      {
        content: m.qtyChange > 0 ? `+${m.qtyChange}` : `${m.qtyChange}`,
        styles: { textColor: m.qtyChange > 0 ? [16, 185, 129] : [239, 68, 68], fontStyle: 'bold' }
      },
      m.user || '-',
    ]),
    theme: 'striped',
    headStyles: { fillColor: COLORS.dark, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 22 },
      2: { cellWidth: 25 },
      3: { cellWidth: 45 },
      4: { cellWidth: 25 },
      5: { halign: 'center', cellWidth: 15 },
      6: { cellWidth: 25 },
    },
    margin: { left: 14, right: 14 },
  });

  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  return doc;
}

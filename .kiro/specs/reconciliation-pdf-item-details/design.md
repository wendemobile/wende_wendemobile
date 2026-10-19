# Design Document

## Overview

This design enhances the Reconciliation Report feature to include detailed item-level information in the PDF output. The enhancement requires modifications to both the API layer (to fetch and return complete sale item data) and the PDF generator (to display the enhanced item details table).

## Architecture

The solution follows the existing architecture pattern:

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│   Reports Page      │────▶│  Reconciliation API  │────▶│   Prisma Database   │
│   (Frontend)        │     │  (route.ts)          │     │                     │
└─────────────────────┘     └──────────────────────┘     └─────────────────────┘
         │                           │
         │                           │
         ▼                           ▼
┌─────────────────────┐     ┌──────────────────────┐
│   PDF Generator     │◀────│   Enhanced Sales     │
│   (pdf-generator.ts)│     │   Data with Items    │
└─────────────────────┘     └──────────────────────┘
```

### Data Flow

1. Frontend requests reconciliation report with date range
2. API fetches payments with enhanced includes (sale items, location, payments with bank accounts)
3. API transforms data to include complete item details
4. Frontend passes data to PDF generator
5. PDF generator renders enhanced "SOLD ITEMS DETAIL" table

## Components and Interfaces

### 1. Reconciliation API Enhancement

**File:** `src/app/api/reports/reconciliation/route.ts`

**Changes Required:**
- Modify the payments query to include `sale.items` with item details
- Include `sale.location` for location name
- Include all `sale.payments` with bank account details
- Transform the response to include complete item-level data

**Enhanced Query Structure:**
```typescript
prisma.payment.findMany({
  where: { createdAt: { gte: start, lte: endRange } },
  include: {
    sale: {
      include: {
        customer: { select: { name: true } },
        salesman: { select: { fullName: true } },
        cashier: { select: { fullName: true } },
        location: { select: { name: true } },
        items: {
          include: {
            item: { select: { name: true } }
          }
        },
        payments: {
          include: {
            bankAccount: { select: { bankName: true } }
          }
        }
      }
    },
    bankAccount: { select: { bankName: true } },
  },
  orderBy: { createdAt: 'desc' },
})
```

### 2. PDF Generator Enhancement

**File:** `src/lib/pdf-generator.ts`

**Changes Required:**
- Update the "SOLD ITEMS DETAIL" table to include Location column
- Ensure payment method displays bank name for non-cash payments
- Format payment column as "METHOD (Bank Name): Amount"

**Enhanced Table Columns:**
| Column | Width | Description |
|--------|-------|-------------|
| Receipt # | 18 | Sale receipt number |
| Item Name | 40 | Name of the sold item |
| Location | 25 | Store location name |
| Qty | 12 | Quantity sold |
| Unit Price | 20 | Price per unit |
| Line Total | 20 | Total for this line item |
| Payment | 35 | Payment method with bank name and amount |
| Salesman | 22 | Name of salesman/cashier |

## Data Models

### Enhanced Sale Response Structure

```typescript
interface EnhancedSale {
  id: string;
  receiptNumber: string;
  createdAt: Date;
  totalAmount: number;
  customer: string;
  salesman: string | null;
  cashier: string | null;
  location: string | null;  // NEW: Location name
  items: SaleItemDetail[];  // NEW: Complete item details
  payments: PaymentDetail[]; // NEW: All payments with bank info
}

interface SaleItemDetail {
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

interface PaymentDetail {
  method: string;
  amount: number;
  bankName: string | null;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Sale items data completeness
*For any* sale returned by the reconciliation API, the sale SHALL contain an items array where each item has name, qty, unitPrice, and lineTotal fields with non-null values.
**Validates: Requirements 1.1**

### Property 2: Location data inclusion
*For any* sale returned by the reconciliation API that has a locationId, the sale SHALL include a location field with the location name.
**Validates: Requirements 1.2**

### Property 3: Payment details completeness
*For any* payment in a sale returned by the reconciliation API, the payment SHALL include method, amount, and bankName (null for cash payments).
**Validates: Requirements 1.3**

### Property 4: PDF item row data integrity
*For any* item row rendered in the PDF "SOLD ITEMS DETAIL" table, the row SHALL contain all required columns: receipt number, item name, location, qty, unit price, line total, payment method, and salesman.
**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 5: Bank name display for non-cash payments
*For any* payment with method other than CASH, the PDF payment column SHALL display the bank name in the format "METHOD (Bank Name): Amount".
**Validates: Requirements 2.5, 3.2**

### Property 6: Line totals sum consistency
*For any* reconciliation report, the sum of all line totals in the sold items detail table SHALL equal the total displayed in the footer row.
**Validates: Requirements 3.3**

## Error Handling

1. **Missing Location**: If a sale has no location, display "-" in the location column
2. **Missing Salesman**: If a sale has no salesman or cashier, display "-" in the salesman column
3. **Missing Bank Name**: For non-cash payments without bank account, display only the method name
4. **Empty Items**: If a sale has no items, skip it in the items detail table (should not occur in valid data)

## Testing Strategy

### Unit Tests
- Test API response structure includes all required fields
- Test PDF table generation with various data scenarios
- Test edge cases (missing location, missing salesman, cash vs bank payments)

### Property-Based Tests
- Use fast-check library for property-based testing
- Generate random sale data and verify API response structure
- Generate random payment methods and verify PDF formatting
- Verify line total calculations across random item sets

### Integration Tests
- End-to-end test of API to PDF generation flow
- Verify PDF output contains expected data from API response

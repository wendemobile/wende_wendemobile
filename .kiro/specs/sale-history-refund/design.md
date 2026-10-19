# Design Document: Sale History and Refund Feature

## Overview

This feature adds a Sale History panel accessible from the POS page, allowing users to view past sales, cancel completed sales with refund processing, and automatically restore inventory. The design leverages the existing Sale, Return, and Stock models while adding new UI components and service methods.

## Architecture

```mermaid
flowchart TB
    subgraph UI["UI Layer"]
        POS[POS Page]
        SHB[Sale History Button]
        SHP[Sale History Panel]
        RD[Refund Dialog]
    end
    
    subgraph API["API Layer"]
        SA[/api/sales]
        SC[/api/sales/:id/cancel]
    end
    
    subgraph Services["Service Layer"]
        SS[SaleService]
        StS[StockService]
        AS[AuditService]
    end
    
    subgraph DB["Database"]
        Sales[(Sales)]
        Stock[(Stock)]
        AuditLog[(AuditLog)]
    end
    
    POS --> SHB
    SHB --> SHP
    SHP --> RD
    SHP --> SA
    RD --> SC
    SC --> SS
    SS --> StS
    SS --> AS
    SS --> Sales
    StS --> Stock
    AS --> AuditLog
```

## Components and Interfaces

### UI Components

#### 1. SaleHistoryButton
Location: `src/components/pos/sale-history-button.tsx`
- Renders a button in the POS header
- Opens the SaleHistoryPanel on click

#### 2. SaleHistoryPanel
Location: `src/components/pos/sale-history-panel.tsx`
- Slide-out panel or modal displaying sale history
- Props:
  - `isOpen: boolean`
  - `onClose: () => void`
- Features:
  - Search by receipt number
  - Date range filter
  - Status filter (All, Completed, Cancelled)
  - Paginated sale list

#### 3. SaleHistoryItem
Location: `src/components/pos/sale-history-item.tsx`
- Expandable card showing sale details
- Props:
  - `sale: SaleWithDetails`
  - `onCancel: (saleId: string) => void`
- Displays: receipt number, date, total, status, items, payment method

#### 4. RefundDialog
Location: `src/components/pos/refund-dialog.tsx`
- Modal for processing refunds
- Props:
  - `isOpen: boolean`
  - `sale: SaleWithDetails`
  - `onClose: () => void`
  - `onConfirm: (refundAmount: number, refundMethod: string, bankAccountId?: string) => void`
- Features:
  - Pre-filled with sale total
  - Editable refund amount field
  - Validation (0 < amount <= saleTotal)
  - Payment method selection (Cash, Mobile Transfer, Card)
  - Bank account dropdown when Mobile Transfer selected

#### 5. SalesmanSelect
Location: `src/components/pos/salesman-select.tsx`
- Dropdown for selecting salesman during sale
- Props:
  - `value: string`
  - `onChange: (salesmanId: string) => void`
  - `defaultUserId: string`
- Features:
  - Fetches list of users with sales permissions
  - Defaults to current user if no selection made
  - Shows user name in dropdown

### API Endpoints

#### GET /api/sales
Enhanced to support filtering:
- Query params: `status`, `startDate`, `endDate`, `search`, `page`, `pageSize`
- Returns paginated sales with items and payments

#### POST /api/sales/:id/cancel
New endpoint for cancelling sales:
- Request body: `{ refundAmount: number, refundMethod: string, bankAccountId?: string }`
- Response: Updated sale with cancellation details
- Actions:
  1. Validate sale is COMPLETED
  2. Update sale status to CANCELLED
  3. Restore stock quantities
  4. Record refund payment method
  5. Create audit log entry
  6. Return updated sale

### Service Layer

#### SaleService Extensions
```typescript
interface CancelSaleInput {
  saleId: string;
  refundAmount: number;
  refundMethod: 'CASH' | 'MOBILE_TRANSFER' | 'CARD';
  bankAccountId?: string;
  cancelledById: string;
}

interface CancelSaleResult {
  success: boolean;
  sale?: Sale;
  error?: string;
}

// New methods
cancelSale(input: CancelSaleInput): Promise<CancelSaleResult>
getSalesHistory(filters: SaleHistoryFilters): Promise<PaginatedSales>
```

#### StockService Extensions
```typescript
// New method
restoreStock(saleItems: SaleItem[], locationId: string): Promise<void>
```

#### UserService Extensions
```typescript
// New method for salesman selection
getSalesUsers(): Promise<User[]>  // Returns users with sales permissions
```

## Data Models

### Sale Model Updates
The existing Sale model already has:
- `status`: Supports 'CANCELLED' value
- `updatedAt`: Tracks when cancelled
- `userId`: The user who created the sale (will be used as salesman)

We'll add new fields to track refund details and salesman:

```prisma
model Sale {
  // ... existing fields
  salesmanId      String?   @map("salesman_id")
  salesman        User?     @relation("SalesmanSales", fields: [salesmanId], references: [id])
  refundAmount    Decimal?  @db.Decimal(12, 2) @map("refund_amount")
  refundMethod    String?   @map("refund_method")  // CASH, MOBILE_TRANSFER, CARD
  refundBankAccountId String? @map("refund_bank_account_id")
  cancelledAt     DateTime? @map("cancelled_at")
  cancelledById   String?   @map("cancelled_by_id")
  cancelledBy     User?     @relation("CancelledSales", fields: [cancelledById], references: [id])
}
```

### Audit Log Entry
Uses existing AuditLog model:
```typescript
{
  action: 'SALE_CANCELLED',
  entityType: 'Sale',
  entityId: saleId,
  newValues: {
    refundAmount,
    cancelledAt,
    cancelledById
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Sales sorted by date descending
*For any* list of sales returned by the history query, each sale's createdAt timestamp should be greater than or equal to the next sale's timestamp in the list.
**Validates: Requirements 1.3**

### Property 2: Sale display contains required fields
*For any* sale displayed in the history list, the rendered output should contain the receipt number, date/time, total amount, and status.
**Validates: Requirements 2.1, 2.2**

### Property 3: Cancel button only for completed sales
*For any* sale displayed in the history, the Cancel Sale button should only be visible when the sale status is COMPLETED.
**Validates: Requirements 3.1**

### Property 4: Refund amount validation
*For any* refund amount entered, if the amount is greater than the original sale total, the submission should be blocked and an error displayed.
**Validates: Requirements 3.4**

### Property 5: Stock restoration on cancellation
*For any* cancelled sale, the stock quantities at the sale location should increase by exactly the quantities that were sold in that sale.
**Validates: Requirements 4.2**

### Property 6: Cancellation state transition
*For any* sale that is cancelled, the sale status should be updated to CANCELLED and the refundAmount and cancelledAt fields should be populated.
**Validates: Requirements 4.1, 4.3**

### Property 7: Audit log creation on cancellation
*For any* cancelled sale, an audit log entry should exist with action SALE_CANCELLED, the correct entityId, and the refund amount in newValues.
**Validates: Requirements 5.1**

### Property 8: Cancelled sale display
*For any* cancelled sale displayed in the history, the rendered output should include the refund amount and cancellation date.
**Validates: Requirements 5.3**

### Property 9: Default salesman is current user
*For any* sale where no salesman is explicitly selected, the salesmanId should equal the current user's ID.
**Validates: Requirements 7.2**

### Property 10: Salesman recorded with sale
*For any* completed sale, the sale record should contain a valid salesmanId.
**Validates: Requirements 7.3**

### Property 11: Sale history shows salesman
*For any* sale displayed in the history, the rendered output should include the salesman name.
**Validates: Requirements 7.4**

### Property 12: Bank account dropdown for Mobile Transfer refund
*For any* refund dialog where Mobile Transfer is selected as the refund method, the bank account dropdown should be visible.
**Validates: Requirements 8.2**

### Property 13: Refund method recorded with cancellation
*For any* cancelled sale, the refund payment method should be recorded in the sale record.
**Validates: Requirements 8.3**

### Property 14: Cancelled sale shows refund method
*For any* cancelled sale displayed in the history, the rendered output should include the refund payment method used.
**Validates: Requirements 8.4**

## Error Handling

| Error Condition | Response | User Message |
|----------------|----------|--------------|
| Sale not found | 404 | "Sale not found" |
| Sale not COMPLETED | 400 | "Only completed sales can be cancelled" |
| Refund amount > total | 400 | "Refund amount cannot exceed sale total" |
| Refund amount <= 0 | 400 | "Refund amount must be greater than zero" |
| Stock restore fails | 500 | "Failed to restore inventory. Please try again." |
| Database error | 500 | "An error occurred. Please try again." |

## Testing Strategy

### Unit Tests
- SaleService.cancelSale validation logic
- StockService.restoreStock calculations
- RefundDialog input validation
- SaleHistoryItem rendering

### Property-Based Tests
Using fast-check library for TypeScript:

1. **Property 1**: Generate random lists of sales, verify sorting
2. **Property 4**: Generate random refund amounts, verify validation
3. **Property 5**: Generate random sales with items, cancel them, verify stock changes
4. **Property 6**: Generate random completed sales, cancel them, verify state
5. **Property 7**: Generate random cancellations, verify audit logs exist
6. **Property 9**: Generate random sales without explicit salesman, verify default to current user
7. **Property 10**: Generate random completed sales, verify salesmanId is present
8. **Property 13**: Generate random cancellations with refund methods, verify method is recorded

### Integration Tests
- Full cancellation flow: API call → stock update → audit log
- Sale history filtering and pagination
- Salesman selection and recording flow
- Refund payment method selection and recording

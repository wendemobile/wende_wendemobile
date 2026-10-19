# Design Document: Session Financial Fixes

## Overview

This design addresses five key issues in the POS system:
1. Dashboard cash in hand accuracy
2. Expense validation against available cash
3. Manual credit recording capability
4. Money management page session dependency
5. Stock transfer location accuracy

## Architecture

The fixes involve modifications to:
- **API Routes**: Expense creation validation, new credit creation endpoint
- **Services**: Dashboard service (already correct), expense service (add validation)
- **Frontend Pages**: Expense form, credits page, money management page, transfer creation page

## Components and Interfaces

### 1. Expense Validation API

```typescript
// src/app/api/expenses/route.ts - Enhanced POST handler
interface ExpenseValidationResult {
  valid: boolean;
  availableCash?: number;
  error?: string;
}

// Add cash validation before creating expense
async function validateCashExpense(amount: number, sessionId: string): Promise<ExpenseValidationResult>
```

### 2. Manual Credit Creation API

```typescript
// src/app/api/credits/route.ts - New POST handler
interface CreateCreditInput {
  customerId: string;
  principal: number;
  dueDate: string;
  notes?: string;
}
```

### 3. Money Management Page Updates

```typescript
// Fetch session-aware cash balance
interface SessionCashBalance {
  hasActiveSession: boolean;
  cashBalance: number;
}
```

### 4. Transfer Stock Display Fix

```typescript
// Enhanced item search result for transfers
interface TransferItemResult {
  id: string;
  name: string;
  sku: string;
  stocks: Array<{
    locationId: string;
    qty: number;
    reservedQty: number;
  }>;
  sourceLocationStock: number; // Calculated for selected source
}
```

## Data Models

### Credit Model (existing)
```prisma
model Credit {
  id          String   @id @default(uuid())
  customerId  String
  saleId      String?  // Optional - null for manual credits
  sessionId   String?  // Link to session
  principal   Decimal
  balance     Decimal
  dueDate     DateTime
  status      CreditStatus @default(OPEN)
  notes       String?
  createdAt   DateTime @default(now())
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Cash in hand calculation correctness
*For any* session with opening balance and transactions, the cash in hand should equal: Opening Balance + Cash Sales + Cash Layaway Payments + Cash Credit Payments + Special Income + Bank-to-Cash - Cash Expenses - Cash-to-Bank.
**Validates: Requirements 1.1**

### Property 2: Cash expense validation
*For any* cash expense creation attempt where the expense amount exceeds current cash in hand, the system should reject the expense. For non-cash expenses, the validation should be bypassed regardless of cash balance.
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Manual credit creation with session linking
*For any* manually created credit with valid inputs, the credit should be created with status OPEN and linked to the current active session.
**Validates: Requirements 3.3, 3.4**

### Property 4: Transfer stock availability accuracy
*For any* item search during transfer creation with a selected source location, the available quantity shown should equal (qty - reservedQty) at that specific location, and adding items should be prevented when quantity exceeds available stock.
**Validates: Requirements 5.1, 5.2, 5.4**

## Error Handling

| Error Code | Message | Condition |
|------------|---------|-----------|
| EXP_001 | Insufficient cash balance | Cash expense exceeds available cash |
| EXP_002 | No active session | Attempting expense without session |
| CRD_001 | Customer not found | Invalid customer ID for credit |
| CRD_002 | Invalid due date | Due date is in the past |
| TRF_001 | Insufficient stock | Transfer qty exceeds available |

## Testing Strategy

### Unit Tests
- Test cash validation logic with various amounts
- Test credit creation with valid/invalid inputs
- Test session-aware balance calculations

### Property-Based Tests
- Use fast-check library for TypeScript
- Generate random expense amounts and validate against cash balance
- Generate random credit inputs and verify session linking
- Generate random stock scenarios and verify transfer availability

### Integration Tests
- End-to-end expense creation flow with validation
- Manual credit creation and retrieval
- Money management page with/without active session
- Transfer creation with various stock configurations


# Design Document

## Overview

This design document outlines the technical solutions for fixing bugs, improving performance, and enhancing scalability in the POS/Inventory management system. The changes focus on database-level optimizations, atomic operations, and efficient query patterns to handle large datasets (2000+ items) and high transaction volumes.

## Architecture

The system follows a Next.js application architecture with:
- **API Routes**: Handle HTTP requests with authentication
- **Service Layer**: Business logic and database operations via Prisma
- **Database**: PostgreSQL with Prisma ORM

### Key Architectural Changes

1. **Optimistic Locking**: Add version-based concurrency control to Stock model
2. **Database-Level Aggregation**: Move calculations from application to database
3. **Parallel Query Execution**: Use Promise.all for independent queries
4. **Connection Pool Tuning**: Configure appropriate pool sizes

## Components and Interfaces

### 1. Stock Service Enhancements

```typescript
interface StockDeductionResult {
  success: boolean;
  deductedLocations: { locationId: string; amount: number }[];
  error?: string;
}

interface OptimisticLockConfig {
  maxRetries: number;
  retryDelayMs: number;
}
```

### 2. Enhanced Item Search Interface

```typescript
interface ItemSearchParams {
  page?: number;
  pageSize?: number;  // Max 100
  search?: string;
  category?: string;
  brand?: string;
  locationId?: string;
  isActive?: boolean;
  lowStock?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}
```

### 3. Dashboard Query Optimization

```typescript
interface DashboardQueryConfig {
  parallelQueries: boolean;
  cacheTimeout: number;
  maxItems: number;
}
```

## Data Models

### Stock Model Enhancement (Prisma Schema)

```prisma
model Stock {
  id          String   @id @default(uuid())
  itemId      String   @map("item_id")
  locationId  String   @map("location_id")
  qty         Decimal  @db.Decimal(12, 3)
  reservedQty Decimal  @default(0) @db.Decimal(12, 3) @map("reserved_qty")
  version     Int      @default(0)  // Already exists - ensure it's used
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  item     Item     @relation(fields: [itemId], references: [id])
  location Location @relation(fields: [locationId], references: [id])

  @@unique([itemId, locationId])
  @@index([itemId])
  @@index([locationId])
  @@index([qty])  // NEW: For low stock queries
  @@map("stocks")
}
```

### New Indexes for Performance

```prisma
model Item {
  // ... existing fields ...
  
  @@index([name])
  @@index([sku])
  @@index([barcode])
  @@index([category])
  @@index([brand])
  @@index([isActive, category])  // Composite for filtered queries
  @@index([isActive, brand])     // Composite for filtered queries
  @@index([vendorId])
  @@index([createdAt])           // NEW: For date-based queries
}

model Sale {
  // ... existing fields ...
  
  @@index([receiptNumber])
  @@index([createdAt])
  @@index([status])
  @@index([sessionId])
  @@index([locationId])
  @@index([salesmanId])
  @@index([status, createdAt])   // NEW: Composite for dashboard queries
  @@index([locationId, status, createdAt])  // NEW: For location reports
}

model AuditLog {
  // ... existing fields ...
  
  @@index([userId])
  @@index([entityType])
  @@index([createdAt])
  @@index([entityType, createdAt])  // NEW: For filtered audit queries
}
```

## Error Handling

### Stock Deduction Errors

| Error Code | Description | Recovery Action |
|------------|-------------|-----------------|
| STOCK_VERSION_CONFLICT | Optimistic lock failed | Retry with fresh data |
| STOCK_INSUFFICIENT | Not enough stock | Return error to user |
| STOCK_NEGATIVE | Would result in negative | Reject transaction |
| TRANSACTION_TIMEOUT | DB transaction timeout | Rollback and retry |

### Credit Payment Errors

| Error Code | Description | Recovery Action |
|------------|-------------|-----------------|
| PAYMENT_EXCEEDS_BALANCE | Amount > remaining balance | Return error with balance |
| CREDIT_ALREADY_CLOSED | Credit is already paid | Return error |
| DECIMAL_PRECISION_ERROR | Calculation error | Use Decimal.js |

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests:

- **Unit Tests**: Verify specific examples, edge cases, and error conditions using Vitest
- **Property-Based Tests**: Verify universal properties across all inputs using fast-check

### Property-Based Testing Library

- **Library**: fast-check (already compatible with Vitest)
- **Minimum Iterations**: 100 per property test
- **Test Location**: Co-located with source files using `.test.ts` suffix



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Stock Never Goes Negative

*For any* stock deduction operation and any initial stock quantity, if the deduction amount exceeds available stock (qty - reservedQty), the operation should be rejected and stock should remain unchanged.

**Validates: Requirements 1.3**

### Property 2: Pagination Size Cap

*For any* pagination request with pageSize parameter, the actual returned page size should never exceed 100 items, regardless of the requested size.

**Validates: Requirements 4.1**

### Property 3: Credit Payment Balance Constraint

*For any* credit payment operation, if the payment amount exceeds the remaining balance, the payment should be rejected and the balance should remain unchanged.

**Validates: Requirements 6.1**

### Property 4: Credit Balance Precision

*For any* sequence of credit payments on a credit record, the remaining balance should equal principal minus the sum of all payments, with no floating-point precision loss.

**Validates: Requirements 6.2**

### Property 5: Credit Closure Consistency

*For any* credit record where the sum of payments equals the principal amount, the credit status should be CLOSED and the balance should be exactly zero.

**Validates: Requirements 6.3**

### Property 6: Transfer Stock Conservation

*For any* completed transfer, the total stock across all locations should remain constant (source decreases by N, destination increases by N).

**Validates: Requirements 7.2**

### Property 7: Transfer Reservation Release

*For any* transfer that is cancelled from SENT status, the reserved quantity at the source location should be decremented by the transfer amount.

**Validates: Requirements 7.3**

### Property 8: Available Stock Calculation

*For any* stock record, the available quantity should equal qty minus reservedQty.

**Validates: Requirements 7.4**

### Property 9: Sale Finalization Atomicity

*For any* successfully finalized sale, the sale status should be COMPLETED and the total stock across all locations should be reduced by exactly the quantities sold.

**Validates: Requirements 8.4**

### Property 10: Receipt Number Uniqueness

*For any* set of sales created (even concurrently), all receipt numbers should be unique.

**Validates: Requirements 9.2**

### Property 11: Bank Balance Consistency

*For any* sequence of payments to a bank account, the final balance should equal the initial balance plus the sum of all payment amounts.

**Validates: Requirements 12.1, 12.2**

## Implementation Details

### 1. Stock Deduction with Optimistic Locking

```typescript
// src/services/stock.service.ts
static async deductStockWithRetry(
  itemId: string,
  quantity: number,
  locationPriority: string[],
  maxRetries: number = 3
): Promise<StockDeductionResult> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        let remainingQty = quantity;
        const deductedLocations: { locationId: string; amount: number }[] = [];

        for (const locationId of locationPriority) {
          if (remainingQty <= 0) break;

          const stock = await tx.stock.findUnique({
            where: { itemId_locationId: { itemId, locationId } },
          });

          if (!stock) continue;

          const available = Number(stock.qty) - Number(stock.reservedQty);
          if (available <= 0) continue;

          const deductAmount = Math.min(available, remainingQty);

          // Optimistic lock check
          const updated = await tx.stock.updateMany({
            where: {
              id: stock.id,
              version: stock.version, // Version check
            },
            data: {
              qty: { decrement: deductAmount },
              version: { increment: 1 },
            },
          });

          if (updated.count === 0) {
            throw new Error('VERSION_CONFLICT');
          }

          deductedLocations.push({ locationId, amount: deductAmount });
          remainingQty -= deductAmount;
        }

        if (remainingQty > 0) {
          throw new Error(`INSUFFICIENT_STOCK:${remainingQty}`);
        }

        return { success: true, deductedLocations };
      }, {
        isolationLevel: 'Serializable',
        timeout: 10000,
      });
    } catch (error: any) {
      if (error.message === 'VERSION_CONFLICT' && attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 50 * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }
  throw new Error('MAX_RETRIES_EXCEEDED');
}
```

### 2. Optimized Low Stock Query

```typescript
// src/services/item.service.ts
static async getLowStockItemsOptimized(params: {
  category?: string;
  brand?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const { category, brand, search, page = 1, pageSize = 20 } = params;
  const limitedPageSize = Math.min(pageSize, 100);
  const offset = (page - 1) * limitedPageSize;

  // Use raw query for efficient aggregation
  const lowStockItems = await prisma.$queryRaw<any[]>`
    SELECT 
      i.id, i.sku, i.name, i.brand, i.category,
      i."unit_price" as "unitPrice",
      i."min_stock" as "minStock",
      COALESCE(SUM(s.qty - s."reserved_qty"), 0) as "currentStock"
    FROM items i
    LEFT JOIN stocks s ON i.id = s."item_id"
    WHERE i."is_active" = true
      ${category ? Prisma.sql`AND i.category = ${category}` : Prisma.empty}
      ${brand ? Prisma.sql`AND i.brand = ${brand}` : Prisma.empty}
      ${search ? Prisma.sql`AND (
        i.name ILIKE ${`%${search}%`} OR 
        i.sku ILIKE ${`%${search}%`}
      )` : Prisma.empty}
    GROUP BY i.id
    HAVING COALESCE(SUM(s.qty - s."reserved_qty"), 0) <= i."min_stock"
    ORDER BY COALESCE(SUM(s.qty - s."reserved_qty"), 0) ASC
    LIMIT ${limitedPageSize}
    OFFSET ${offset}
  `;

  // Get total count
  const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM (
      SELECT i.id
      FROM items i
      LEFT JOIN stocks s ON i.id = s."item_id"
      WHERE i."is_active" = true
        ${category ? Prisma.sql`AND i.category = ${category}` : Prisma.empty}
        ${brand ? Prisma.sql`AND i.brand = ${brand}` : Prisma.empty}
      GROUP BY i.id
      HAVING COALESCE(SUM(s.qty - s."reserved_qty"), 0) <= i."min_stock"
    ) subquery
  `;

  const total = Number(countResult[0].count);

  return {
    items: lowStockItems.map(item => ({
      ...item,
      currentStock: Number(item.currentStock),
      minStock: Number(item.minStock),
      unitPrice: Number(item.unitPrice),
    })),
    total,
    page,
    pageSize: limitedPageSize,
    totalPages: Math.ceil(total / limitedPageSize),
  };
}
```

### 3. Credit Payment with Decimal Precision

```typescript
// src/services/credit.service.ts
import Decimal from 'decimal.js';

async addPayment(creditId: string, payment: CreditPaymentInput) {
  return prisma.$transaction(async (tx) => {
    const credit = await tx.credit.findUnique({
      where: { id: creditId },
    });

    if (!credit) throw new Error('Credit not found');
    if (credit.status === 'CLOSED') throw new Error('Credit is already closed');
    if (payment.amount <= 0) throw new Error('Payment amount must be positive');

    // Use Decimal.js for precise arithmetic
    const balance = new Decimal(credit.balance.toString());
    const paymentAmount = new Decimal(payment.amount);

    if (paymentAmount.greaterThan(balance)) {
      throw new Error(`Payment amount ${payment.amount} exceeds balance ${balance.toNumber()}`);
    }

    const newBalance = balance.minus(paymentAmount);
    const newStatus = newBalance.isZero() ? 'CLOSED' : credit.status;

    // Create payment and update credit atomically
    const [creditPayment] = await Promise.all([
      tx.creditPayment.create({
        data: {
          creditId,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          bankAccountId: payment.bankAccountId,
          reference: payment.reference,
          notes: payment.notes,
        },
      }),
      tx.credit.update({
        where: { id: creditId },
        data: {
          balance: newBalance.toNumber(),
          status: newStatus,
          closedAt: newStatus === 'CLOSED' ? new Date() : null,
        },
      }),
      // Update bank account if applicable
      payment.paymentMethod === 'MOBILE_TRANSFER' && payment.bankAccountId
        ? tx.bankAccount.update({
            where: { id: payment.bankAccountId },
            data: { currentBalance: { increment: payment.amount } },
          })
        : Promise.resolve(),
    ]);

    return creditPayment;
  }, {
    isolationLevel: 'Serializable',
  });
}
```

### 4. Receipt Number Generation with Atomic Counter

```typescript
// src/services/sale.service.ts
private static async generateReceiptNumber(): Promise<string> {
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const prefix = `RCP-${dateStr}-`;

  // Use database-level atomic increment
  const result = await prisma.$queryRaw<[{ next_val: bigint }]>`
    INSERT INTO receipt_sequences (date_prefix, last_value)
    VALUES (${prefix}, 1)
    ON CONFLICT (date_prefix) 
    DO UPDATE SET last_value = receipt_sequences.last_value + 1
    RETURNING last_value as next_val
  `;

  const nextNum = Number(result[0].next_val);
  return `${prefix}${nextNum.toString().padStart(6, '0')}`;
}
```

### 5. New Database Migration for Receipt Sequence

```sql
-- prisma/migrations/add_receipt_sequence.sql
CREATE TABLE IF NOT EXISTS receipt_sequences (
  date_prefix VARCHAR(20) PRIMARY KEY,
  last_value BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_receipt_sequences_date ON receipt_sequences(date_prefix);
```

### 6. Connection Pool Configuration

```typescript
// src/lib/prisma.ts
const getDatabaseUrl = () => {
  const baseUrl = process.env.DATABASE_URL || '';
  if (baseUrl.includes('postgresql') && !baseUrl.includes('connection_limit')) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    // Optimized pool settings for concurrent users
    return `${baseUrl}${separator}connection_limit=20&pool_timeout=30&connect_timeout=10`;
  }
  return baseUrl;
};

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: { url: getDatabaseUrl() },
  },
});
```

### 7. Prisma Schema Index Additions

```prisma
// Add to prisma/schema.prisma

model Stock {
  // ... existing fields ...
  @@index([qty])  // For low stock queries
}

model Sale {
  // ... existing fields ...
  @@index([status, createdAt])  // For dashboard queries
  @@index([locationId, status, createdAt])  // For location reports
}

model SaleItem {
  // ... existing fields ...
  @@index([saleId])
  @@index([itemId])
}

model AuditLog {
  // ... existing fields ...
  @@index([entityType, createdAt])  // For filtered audit queries
}
```

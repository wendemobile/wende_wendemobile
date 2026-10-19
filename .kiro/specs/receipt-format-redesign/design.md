# Design Document: Ethiopian Tax-Compliant Receipt Format

## Overview

This design document outlines the implementation of an Ethiopian tax-compliant receipt format for the POS system. The receipt will match the exact format required by ERCA (Ethiopian Revenue and Customs Authority), including proper TIN display, 15% VAT calculation, fiscal serial numbers, and compliance footer information.

## Architecture

The receipt system follows a component-based architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    POS Page                              │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Payment Modal                       │    │
│  │  ┌─────────────────────────────────────────┐    │    │
│  │  │         Receipt Component               │    │    │
│  │  │  ┌─────────────────────────────────┐    │    │    │
│  │  │  │    Receipt Formatter Utils      │    │    │    │
│  │  │  │  - formatReceiptNumber()        │    │    │    │
│  │  │  │  - formatReceiptDate()          │    │    │    │
│  │  │  │  - formatReceiptTime()          │    │    │    │
│  │  │  │  - formatReceiptAmount()        │    │    │    │
│  │  │  │  - calculateTax()               │    │    │    │
│  │  │  └─────────────────────────────────┘    │    │    │
│  │  └─────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │         Store Settings (Configuration)          │    │
│  │  - businessTin                                   │    │
│  │  - businessName                                  │    │
│  │  - businessAddress                               │    │
│  │  - businessPhone                                 │    │
│  │  - ercaEtNumber                                  │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Receipt Component Interface

```typescript
interface ReceiptProps {
  receiptNumber: string;      // Will be formatted as FS NO.XXXXXXXX
  invoiceNumber: string;      // Will be formatted as CA-XXXXXXXX
  date: Date;
  items: ReceiptItem[];
  subtotal: number;           // TXBL amount
  tax: number;                // 15% VAT
  total: number;              // subtotal + tax
  payments: PaymentInfo[];
  customer?: CustomerInfo;
  storeConfig: StoreConfig;
}

interface ReceiptItem {
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

interface PaymentInfo {
  method: string;
  amount: number;
}

interface CustomerInfo {
  name?: string;
  tin?: string;
}

interface StoreConfig {
  tin: string;
  name: string;
  address: string;
  phone: string;
  ercaEtNumber: string;
}
```

### 2. Receipt Formatter Utilities

```typescript
// Format receipt number as 8-digit zero-padded
function formatReceiptNumber(num: number | string): string;

// Format date as DD/MM/YYYY
function formatReceiptDate(date: Date): string;

// Format time as HH:MM (24-hour)
function formatReceiptTime(date: Date): string;

// Format amount with asterisk prefix and thousand separators
function formatReceiptAmount(amount: number): string;

// Format phone as TEL:-XX XX XX XX XX
function formatReceiptPhone(phone: string): string;

// Calculate 15% tax
function calculateTax(subtotal: number): number;
```

## Data Models

### Store Configuration Model

The store configuration will be stored in environment variables or a settings table:

```typescript
interface StoreSettings {
  STORE_TIN: string;           // e.g., "0005018689"
  STORE_NAME: string;          // e.g., "TOMAS ENDESHAW BEKELE"
  STORE_ADDRESS: string;       // e.g., "SNNPRS,BUTAJIRA/K,04\nNEAR TO BRIGHT HOTEL"
  STORE_PHONE: string;         // e.g., "0911346048"
  ERCA_ET_NUMBER: string;      // e.g., "NDB0000171"
}
```

### Receipt Data Flow

```
Sale Completion → Calculate Tax (15%) → Generate Receipt Data → Render Receipt → Print
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Tax Calculation Accuracy
*For any* subtotal amount, the calculated tax SHALL equal exactly subtotal × 0.15 (15%)
**Validates: Requirements 5.3**

### Property 2: Total Calculation Accuracy
*For any* receipt with a subtotal, the total SHALL equal subtotal + tax (where tax = subtotal × 0.15)
**Validates: Requirements 6.1**

### Property 3: Receipt Number Formatting
*For any* receipt number, the formatted output SHALL be exactly 8 digits with leading zeros
**Validates: Requirements 2.1**

### Property 4: Date Formatting
*For any* date, the formatted output SHALL match the pattern DD/MM/YYYY where DD is 01-31, MM is 01-12, YYYY is 4 digits
**Validates: Requirements 2.2**

### Property 5: Time Formatting
*For any* time, the formatted output SHALL match the pattern HH:MM in 24-hour format (00:00 to 23:59)
**Validates: Requirements 2.4**

### Property 6: Amount Formatting with Asterisk
*For any* monetary amount, the formatted output SHALL have an asterisk prefix and use comma thousand separators with 2 decimal places
**Validates: Requirements 5.4, 6.2**

### Property 7: Item Count Accuracy
*For any* list of receipt items, the displayed item count SHALL equal the sum of all item quantities
**Validates: Requirements 6.3**

### Property 8: Price Formatting with Decimals
*For any* unit price, the formatted output SHALL display exactly 3 decimal places
**Validates: Requirements 4.2**

### Property 9: Invoice Number Formatting
*For any* invoice number, the formatted output SHALL have the prefix "CA-" followed by 8 digits
**Validates: Requirements 3.3**

### Property 10: Phone Number Formatting
*For any* phone number, the formatted output SHALL match the pattern "TEL:-XX XX XX XX XX"
**Validates: Requirements 1.4**

### Property 11: Receipt Contains All Required Sections
*For any* generated receipt, the output SHALL contain: TIN header, FS NO, CASH INVOICE separator, items table, TXBL, TAX, TOTAL, ERCA footer
**Validates: Requirements 1.1, 2.1, 3.1, 5.1, 5.2, 6.1, 7.1**

## Error Handling

1. **Missing Store Configuration**: If store settings are not configured, display placeholder values and log a warning
2. **Invalid Amounts**: If negative amounts are provided, treat as zero and log error
3. **Missing Customer Info**: Customer name and TIN are optional; display empty fields if not provided
4. **Print Failure**: If print window fails to open, show error message to user

## Testing Strategy

### Unit Tests
- Test each formatting function with specific examples
- Test edge cases (zero amounts, very large numbers, empty strings)
- Test date/time formatting across different timezones

### Property-Based Tests
Using Vitest with fast-check for property-based testing:

1. **Tax calculation property**: Generate random subtotals, verify tax = subtotal × 0.15
2. **Total calculation property**: Generate random subtotals, verify total = subtotal + tax
3. **Receipt number formatting**: Generate random numbers 1-99999999, verify 8-digit output
4. **Date formatting**: Generate random dates, verify DD/MM/YYYY pattern
5. **Time formatting**: Generate random times, verify HH:MM pattern
6. **Amount formatting**: Generate random amounts, verify asterisk prefix and comma separators
7. **Item count**: Generate random item lists, verify count matches sum of quantities

### Integration Tests
- Test complete receipt generation with mock data
- Test print functionality in browser environment

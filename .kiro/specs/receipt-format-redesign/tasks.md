# Implementation Plan

- [x] 1. Create receipt formatter utility functions




  - [ ] 1.1 Create `src/lib/receipt-utils.ts` with formatting functions
    - Implement `formatReceiptNumber(num)` - 8-digit zero-padded
    - Implement `formatReceiptDate(date)` - DD/MM/YYYY format
    - Implement `formatReceiptTime(date)` - HH:MM 24-hour format
    - Implement `formatReceiptAmount(amount)` - asterisk prefix with comma separators
    - Implement `formatReceiptPhone(phone)` - TEL:-XX XX XX XX XX format
    - Implement `formatReceiptPrice(price)` - 3 decimal places
    - Implement `calculateTax(subtotal)` - 15% VAT calculation
    - _Requirements: 1.4, 2.1, 2.2, 2.4, 4.2, 5.3, 5.4_
  - [ ]* 1.2 Write property test for tax calculation
    - **Property 1: Tax Calculation Accuracy**
    - **Validates: Requirements 5.3**
  - [ ]* 1.3 Write property test for receipt number formatting
    - **Property 3: Receipt Number Formatting**
    - **Validates: Requirements 2.1**
  - [ ]* 1.4 Write property test for date formatting
    - **Property 4: Date Formatting**
    - **Validates: Requirements 2.2**
  - [ ]* 1.5 Write property test for time formatting
    - **Property 5: Time Formatting**
    - **Validates: Requirements 2.4**
  - [ ]* 1.6 Write property test for amount formatting
    - **Property 6: Amount Formatting with Asterisk**
    - **Validates: Requirements 5.4, 6.2**
  - [ ]* 1.7 Write property test for phone formatting
    - **Property 10: Phone Number Formatting**
    - **Validates: Requirements 1.4**





- [ ] 2. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Add store configuration for receipt settings
  - [x] 3.1 Add receipt configuration constants to `src/lib/store.ts`




    - Add STORE_TIN constant
    - Add STORE_NAME constant
    - Add STORE_ADDRESS constant
    - Add STORE_PHONE constant
    - Add ERCA_ET_NUMBER constant
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 4. Redesign the Receipt component
  - [ ] 4.1 Update `src/components/pos/receipt.tsx` with Ethiopian format
    - Add header section with TIN, business name, address, phone
    - Add FS NO and date/time section with #A indicator
    - Add "=======CASH INVOICE=======" separator
    - Add REF NO, INVOICE NO, CUSTOMER NAME, BUYER'S TIN fields
    - Add items table with DESCRIPTION, QTY, PRICE, AMOUNT columns
    - Add TXBL and TAX (15%) display




    - Add TOTAL, CASH, ITEM# summary
    - Add ERCA footer with ET number and thank you message





    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.4, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4_
  - [ ]* 4.2 Write property test for total calculation
    - **Property 2: Total Calculation Accuracy**
    - **Validates: Requirements 6.1**
  - [ ]* 4.3 Write property test for item count
    - **Property 7: Item Count Accuracy**
    - **Validates: Requirements 6.3**

- [ ] 5. Update POS page to pass tax data to receipt
  - [ ] 5.1 Modify `src/app/(dashboard)/pos/page.tsx` to calculate and pass tax
    - Calculate 15% tax on subtotal
    - Pass tax and total (subtotal + tax) to receipt component
    - Pass store configuration to receipt
    - _Requirements: 5.3, 6.1_

- [ ] 6. Update print functionality for thermal receipt format
  - [ ] 6.1 Update print styles in receipt component
    - Set monospace font for thermal printer compatibility
    - Set appropriate width (80mm or 58mm thermal paper)
    - Ensure proper line spacing and alignment
    - _Requirements: 4.4, 6.4_

- [ ] 7. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

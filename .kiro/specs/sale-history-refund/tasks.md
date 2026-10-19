# Implementation Plan

- [-] 1. Update database schema for sale cancellation and salesman tracking



  - [ ] 1.1 Add salesmanId, refundAmount, refundMethod, cancelledAt, cancelledById fields to Sale model in prisma/schema.prisma
    - Add optional String field for salesmanId with User relation
    - Add optional Decimal field for refundAmount
    - Add optional String field for refundMethod (CASH, MOBILE_TRANSFER, CARD)
    - Add optional String field for refundBankAccountId
    - Add optional DateTime field for cancelledAt


    - Add optional String field for cancelledById with User relation
    - _Requirements: 4.3, 5.3, 7.3, 8.3_
  - [ ] 1.2 Run prisma db push to apply schema changes
    - _Requirements: 4.3, 7.3_

- [ ] 2. Implement sale cancellation service logic
  - [ ] 2.1 Add cancelSale method to SaleService
    - Validate sale exists and is COMPLETED
    - Validate refund amount is valid (0 < amount <= total)
    - Update sale status to CANCELLED with refund details
    - Record refund payment method and bank account (if Mobile Transfer)
    - Call stock restoration
    - Create audit log entry
    - _Requirements: 4.1, 4.3, 5.1, 8.3_
  - [ ]* 2.2 Write property test for cancellation state transition
    - **Property 6: Cancellation state transition**
    - **Validates: Requirements 4.1, 4.3**
  - [ ] 2.3 Add restoreStock method to StockService
    - Accept sale items and location
    - Increment stock quantities for each item
    - Use transaction for atomicity
    - _Requirements: 4.2_
  - [ ]* 2.4 Write property test for stock restoration
    - **Property 5: Stock restoration on cancellation**
    - **Validates: Requirements 4.2**
  - [ ]* 2.5 Write property test for refund method recording
    - **Property 13: Refund method recorded with cancellation**
    - **Validates: Requirements 8.3**

- [ ] 3. Create API endpoint for sale cancellation
  - [ ] 3.1 Create POST /api/sales/[id]/cancel route
    - Parse and validate request body (refundAmount, refundMethod, bankAccountId)
    - Call SaleService.cancelSale
    - Return updated sale or error response
    - _Requirements: 3.2, 4.1, 8.1, 8.2, 8.3_
  - [ ]* 3.2 Write property test for refund amount validation
    - **Property 4: Refund amount validation**
    - **Validates: Requirements 3.4**

- [ ] 4. Enhance sales listing API for history
  - [ ] 4.1 Update GET /api/sales to support filters
    - Add search parameter for receipt number
    - Add startDate and endDate parameters
    - Add status filter parameter
    - Return paginated results with items and payments
    - _Requirements: 6.1, 6.2, 6.3_
  - [ ]* 4.2 Write property test for sales sorting
    - **Property 1: Sales sorted by date descending**
    - **Validates: Requirements 1.3**

- [ ] 5. Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Create Sale History UI components
  - [ ] 6.1 Create SaleHistoryButton component
    - Render button with history icon
    - Accept onClick handler prop
    - Style to match POS header
    - _Requirements: 1.1_
  - [ ] 6.2 Create SaleHistoryPanel component
    - Slide-out panel with header and close button
    - Search input for receipt number
    - Date range picker
    - Status filter dropdown
    - Scrollable list area
    - _Requirements: 1.2, 6.1, 6.2, 6.3_
  - [ ] 6.3 Create SaleHistoryItem component
    - Expandable card showing sale summary
    - Display receipt number, date, total, status, item count, payment method
    - Expand to show full item details on tap
    - Show Cancel Sale button for completed sales
    - Visual distinction for cancelled sales (different badge color)
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 5.2_
  - [ ]* 6.4 Write property test for cancel button visibility
    - **Property 3: Cancel button only for completed sales**
    - **Validates: Requirements 3.1**

- [ ] 7. Create Refund Dialog component
  - [ ] 7.1 Create RefundDialog component
    - Modal with sale summary
    - Pre-filled refund amount input (editable)
    - Payment method selection (Cash, Mobile Transfer, Card)
    - Bank account dropdown when Mobile Transfer selected
    - Validation: amount must be > 0 and <= sale total
    - Error message display for invalid amounts
    - Confirm and Cancel buttons
    - _Requirements: 3.2, 3.3, 3.4, 8.1, 8.2_
  - [ ]* 7.2 Write property test for bank account dropdown visibility
    - **Property 12: Bank account dropdown for Mobile Transfer refund**
    - **Validates: Requirements 8.2**

- [ ] 8. Add Salesman Selection to Payment Modal
  - [ ] 8.1 Create SalesmanSelect component
    - Dropdown fetching users with sales permissions
    - Accept value and onChange props
    - Display user names in dropdown
    - _Requirements: 7.1_
  - [ ] 8.2 Integrate SalesmanSelect into PaymentModal
    - Add salesman dropdown to payment modal
    - Default to current user if not selected
    - Pass salesmanId to sale creation API
    - _Requirements: 7.1, 7.2_
  - [ ]* 8.3 Write property test for default salesman
    - **Property 9: Default salesman is current user**
    - **Validates: Requirements 7.2**
  - [ ] 8.4 Update sale creation API to accept salesmanId
    - Modify POST /api/sales to accept salesmanId
    - Default to current user if not provided
    - _Requirements: 7.2, 7.3_
  - [ ]* 8.5 Write property test for salesman recording
    - **Property 10: Salesman recorded with sale**
    - **Validates: Requirements 7.3**

- [ ] 9. Integrate Sale History into POS page
  - [ ] 9.1 Add Sale History button to POS header
    - Import and render SaleHistoryButton
    - Add state for panel visibility
    - Position button in header alongside location selector
    - _Requirements: 1.1_
  - [ ] 9.2 Add SaleHistoryPanel to POS page
    - Render panel conditionally based on state
    - Fetch sales data with react-query
    - Handle filter changes and refetch
    - Display salesman name for each sale
    - _Requirements: 1.2, 1.3, 7.4_
  - [ ]* 9.3 Write property test for salesman display in history
    - **Property 11: Sale history shows salesman**
    - **Validates: Requirements 7.4**
  - [ ] 9.4 Wire up cancellation flow
    - Handle Cancel Sale button click
    - Open RefundDialog with selected sale
    - Pass refund method and bank account to cancel API
    - Show success/error toast
    - Refresh sale list after cancellation
    - _Requirements: 4.4, 8.3_

- [ ] 10. Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 11. Write remaining property tests
  - [ ]* 11.1 Write property test for sale display fields
    - **Property 2: Sale display contains required fields**
    - **Validates: Requirements 2.1, 2.2**
  - [ ]* 11.2 Write property test for audit log creation
    - **Property 7: Audit log creation on cancellation**
    - **Validates: Requirements 5.1**
  - [ ]* 11.3 Write property test for cancelled sale display
    - **Property 8: Cancelled sale display**
    - **Validates: Requirements 5.3**
  - [ ]* 11.4 Write property test for cancelled sale refund method display
    - **Property 14: Cancelled sale shows refund method**
    - **Validates: Requirements 8.4**

- [ ] 12. Final Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.

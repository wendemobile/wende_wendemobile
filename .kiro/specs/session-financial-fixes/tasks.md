# Implementation Plan

- [x] 1. Fix expense cash validation
  - [x] 1.1 Add cash balance validation to expense API
    - Modify src/app/api/expenses/route.ts POST handler
    - Calculate current cash in hand using DashboardService
    - Reject cash expenses that exceed available cash with error message
    - Allow non-cash expenses without validation
    - _Requirements: 2.1, 2.2, 2.3_
  - [ ]* 1.2 Write property test for expense cash validation
    - **Property 2: Cash expense validation**
    - **Validates: Requirements 2.1, 2.2, 2.3**
  - [x] 1.3 Update expense form to show available cash
    - Modify src/app/(dashboard)/expenses/new/page.tsx
    - Fetch current cash in hand from dashboard API
    - Display available cash balance when payment method is CASH
    - Show warning if entered amount exceeds available cash
    - _Requirements: 2.4_

- [x] 2. Implement manual credit creation
  - [x] 2.1 Create credit POST API endpoint
    - Add POST handler to src/app/api/credits/route.ts
    - Accept customerId, principal, dueDate, notes
    - Create credit with status OPEN and balance = principal
    - Link to current active session
    - _Requirements: 3.3, 3.4_
  - [ ]* 2.2 Write property test for credit creation
    - **Property 3: Manual credit creation with session linking**
    - **Validates: Requirements 3.3, 3.4**
  - [x] 2.3 Add credit creation UI to credits page
    - Add "Add Credit" button to src/app/(dashboard)/credits/page.tsx
    - Create new page src/app/(dashboard)/credits/new/page.tsx
    - Include form with customer selector, amount, due date, notes
    - _Requirements: 3.1, 3.2_

- [x] 3. Checkpoint - Ensure expense and credit features work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Fix money management session dependency
  - [x] 4.1 Update money management page to use session-aware data
    - Modify src/app/(dashboard)/money-management/page.tsx
    - Fetch cash balance from dashboard API (session financials)
    - Show zero when no active session exists
    - Display actual bank balances regardless of session
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Fix stock transfer location accuracy
  - [x] 5.1 Fix item search to show source location stock
    - Modify src/app/(dashboard)/transfers/new/page.tsx
    - Ensure stock lookup uses the selected fromLocationId
    - Calculate available quantity as (qty - reservedQty) for source location
    - Show message when item has stock elsewhere but not at source
    - _Requirements: 5.1, 5.2, 5.3_
  - [ ]* 5.2 Write property test for transfer stock accuracy
    - **Property 4: Transfer stock availability accuracy**
    - **Validates: Requirements 5.1, 5.2, 5.4**
  - [x] 5.3 Clear items when source location changes
    - Add effect to clear selected items when fromLocationId changes
    - Refresh search results with new location context
    - _Requirements: 5.5_

- [x] 6. Final Checkpoint - Verify all fixes

  - Ensure all tests pass, ask the user if questions arise.

## Summary of Changes

### 1. Expense Cash Validation
- Added cash balance validation to expense API (`src/app/api/expenses/route.ts`)
- Expenses paid with CASH are now validated against available cash in hand
- If expense exceeds available cash, returns error "Insufficient cash balance"
- Non-cash expenses bypass validation
- Updated expense form to show available cash balance and warning when exceeded

### 2. Manual Credit Creation
- Added POST endpoint to credits API (`src/app/api/credits/route.ts`)
- Creates a placeholder sale record for manual credits (required by schema)
- Credits are linked to current active session
- Added "Add Credit" button and FAB to credits page
- Created new credit form page (`src/app/(dashboard)/credits/new/page.tsx`)

### 3. Money Management Session Dependency
- Updated money management page to fetch cash balance from dashboard API
- Shows $0.00 when no active session exists
- Displays "No Active Session" label when session is closed
- Bank account balances still show actual values regardless of session

### 4. Stock Transfer Location Accuracy
- Fixed item search to correctly look up stock at selected source location
- Uses `stocksByLocation` from API response with fallback to `stocks` array
- Modified item service to include all stocks (even with 0 qty) in response
- Shows warning when item has stock elsewhere but not at source location
- Items are cleared when source location changes (already implemented)

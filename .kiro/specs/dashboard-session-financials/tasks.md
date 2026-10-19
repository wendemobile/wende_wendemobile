# Implementation Plan

- [x] 1. Create session financials service functions




  - [ ] 1.1 Implement `getSessionFinancials()` function in DashboardService
    - Add function to calculate all session-based financial metrics
    - Return `hasActiveSession`, `sessionId`, `sessionStartTime`

    - Return zeros when no active session exists
    - _Requirements: 1.2, 2.2, 3.3, 4.4_
  - [ ] 1.2 Implement `calculateCashInHand()` helper function
    - Query cash sales payments for current session
    - Query cash layaway payments since session start
    - Query cash credit payments since session start
    - Query special income for current session
    - Query cash expenses for current session
    - Query fund transfers (cash-to-bank, bank-to-cash) for current session
    - Apply formula: Opening + Inflows - Outflows
    - _Requirements: 1.1, 5.1_

  - [ ]* 1.3 Write property test for cash in hand calculation
    - **Property 1: Cash in hand calculation correctness**
    - **Validates: Requirements 1.1, 5.1**
  - [ ] 1.4 Implement `calculateTotalExpenses()` helper function
    - Query expenses where sessionId matches and paymentMethod = 'CASH'
    - Sum amounts for session-scoped expenses

    - _Requirements: 2.1_
  - [ ]* 1.5 Write property test for expense session filtering
    - **Property 7: Expense session filtering**
    - **Validates: Requirements 2.1**
  - [ ] 1.6 Implement `calculateMobileTransfers()` helper function
    - Query payments where method = 'MOBILE_TRANSFER'
    - Filter by session timeframe via associated sale

    - Sum all mobile transfer amounts
    - _Requirements: 3.1, 5.2_
  - [x]* 1.7 Write property test for mobile transfer calculation



    - **Property 5: Mobile transfer calculation correctness**
    - **Validates: Requirements 3.1, 5.2**

- [ ] 2. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Create bank account session transactions API


  - [ ] 3.1 Implement `getBankAccountSessionTransactions()` in DashboardService
    - Query bank transactions for specific account within session timeframe
    - Calculate session inflow, outflow, and transaction count




    - Return transaction list with summary
    - _Requirements: 3.2, 5.3_
  - [ ]* 3.2 Write property test for bank transaction filtering
    - **Property 6: Bank account session transactions**
    - **Validates: Requirements 3.2, 5.3**
  - [ ] 3.3 Create API route `/api/bank-accounts/[id]/session-transactions`
    - GET endpoint to fetch session transactions for a bank account

    - Include authentication and authorization checks
    - Return transactions and summary data
    - _Requirements: 3.2_





- [ ] 4. Update dashboard API and service
  - [ ] 4.1 Update `/api/dashboard` route to include session financials
    - Call `getSessionFinancials()` and include in response
    - Ensure backward compatibility with existing dashboard data

    - _Requirements: 1.1, 2.1, 3.1, 4.1, 4.2, 4.3_
  - [ ]* 4.2 Write property test for session-scoped data filtering
    - **Property 4: Session-scoped data filtering**
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [ ]* 4.3 Write property test for no active session returns zeros
    - **Property 2: No active session returns zeros**
    - **Validates: Requirements 1.2, 2.2, 3.3**


- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 6. Update dashboard UI components
  - [ ] 6.1 Create financial summary cards component
    - Add Cash In Hand card with breakdown tooltip
    - Add Total Expenses card for session
    - Add Total Mobile Transfers card




    - Style cards consistently with existing dashboard
    - _Requirements: 1.1, 2.1, 3.1_

  - [ ] 6.2 Create bank accounts section with clickable cards
    - Display each bank account with current balance
    - Show session transaction count badge

    - Add click handler to open transaction modal
    - _Requirements: 3.2, 5.3_
  - [x] 6.3 Create bank transaction modal component


    - Modal to display session transactions for selected bank
    - Show transaction list with date, type, amount, reference
    - Show summary (total inflow, outflow, count)
    - _Requirements: 3.2_
  - [ ] 6.4 Update dashboard page to integrate new components
    - Add session financials section to admin dashboard
    - Add session financials section to cashier dashboard
    - Handle loading and error states
    - Display "No Active Session" message when appropriate
    - _Requirements: 1.2, 2.2, 3.3, 4.4_

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Fix existing bugs and ensure data accuracy
  - [ ] 8.1 Fix cashier dashboard cash balance calculation
    - Replace `closingCashBalance` with real-time calculated cash in hand
    - Use `calculateCashInHand()` function for accurate balance
    - _Requirements: 1.1, 5.1_
  - [ ] 8.2 Ensure all sales are linked to active session
    - Update sale creation to always set sessionId when session is active
    - Verify existing sale finalization includes session linkage
    - _Requirements: 4.1_
  - [ ] 8.3 Ensure all expenses are linked to active session
    - Update expense creation to always set sessionId when session is active
    - Verify expense API includes session linkage
    - _Requirements: 4.2_
  - [ ]* 8.4 Write property test for session close resets metrics
    - **Property 3: Session close resets all metrics**
    - **Validates: Requirements 1.3, 2.3, 4.4**

- [ ] 9. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

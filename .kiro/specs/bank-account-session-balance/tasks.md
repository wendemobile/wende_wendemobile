# Implementation Plan

- [x] 1. Fix getBankAccountsSummary to return session-specific balances

  - [x] 1.1 Modify DashboardService.getBankAccountsSummary() to calculate session balance


    - Update the method to return `sessionInflow - sessionOutflow` as `currentBalance`
    - Ensure the calculation uses BankTransaction records filtered by session start time
    - _Requirements: 1.1, 1.4, 3.1, 3.2_
  - [ ]* 1.2 Write property test for session balance calculation
    - **Property 1: Session Balance Calculation**

    - **Validates: Requirements 1.1, 1.4, 3.1, 3.2**



- [ ] 2. Ensure payment increment is correctly reflected
  - [ ] 2.1 Verify PaymentService creates BankTransaction records correctly
    - Review and confirm BankTransaction is created with correct toAccountId and amount
    - Ensure transaction timestamp is set correctly for session filtering

    - _Requirements: 1.3, 4.1_


  - [ ]* 2.2 Write property test for payment increment
    - **Property 2: Payment Increment**
    - **Validates: Requirements 1.3, 4.1**

- [x] 3. Verify transaction history session filtering

  - [x] 3.1 Review fund-transfers API session filtering


    - Confirm the API correctly filters by session start time
    - Ensure all transaction types are included in history
    - _Requirements: 2.1, 2.2, 2.3_
  - [ ]* 3.2 Write property test for transaction session filtering
    - **Property 3: Transaction Session Filtering**


    - **Validates: Requirements 2.1, 2.2, 2.3**




- [ ] 4. Handle no active session case
  - [x] 4.1 Verify getSessionFinancials returns zero balances when no session


    - Confirm bankAccounts array is empty or has zero balances
    - Ensure frontend displays appropriate message



    - _Requirements: 1.2, 2.4_
  - [ ]* 4.2 Write property test for no session returns zero
    - **Property 4: No Session Returns Zero**
    - **Validates: Requirements 1.2, 2.4**

- [ ] 5. Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Update frontend components if needed
  - [ ] 6.1 Review Money Management page balance display
    - Verify it correctly uses the session balance from API
    - Ensure balance updates after transactions
    - _Requirements: 1.1, 4.3_
  - [ ] 6.2 Review Bank Accounts page balance display
    - Verify it shows session-specific balances
    - Ensure change indicator shows session inflow/outflow
    - _Requirements: 3.1, 3.2_

- [ ] 7. Final Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.

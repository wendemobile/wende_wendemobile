# Implementation Plan

- [x] 1. Database Schema and Index Optimizations





  - [ ] 1.1 Add new indexes to Prisma schema for performance
    - Add composite index on Sale (status, createdAt)
    - Add composite index on Sale (locationId, status, createdAt)

    - Add index on Stock (qty) for low stock queries
    - Add composite index on AuditLog (entityType, createdAt)




    - Add indexes on SaleItem (saleId, itemId)
    - _Requirements: 2.3, 10.1, 10.2, 10.3_




  - [ ] 1.2 Create receipt_sequences table for atomic receipt generation
    - Create migration SQL for receipt_sequences table




    - Add unique constraint on date_prefix
    - _Requirements: 9.1, 9.2_
  - [ ] 1.3 Run database migration
    - Execute prisma migrate to apply schema changes
    - Verify indexes are created
    - _Requirements: 2.3, 10.1_



- [ ] 2. Stock Service Optimizations
  - [ ] 2.1 Implement optimistic locking with retry for stock deductions
    - Add deductStockWithRetry method with version checks
    - Implement retry logic with exponential backoff

    - Use Serializable isolation level for transactions

    - _Requirements: 1.1, 1.2, 1.3_
  - [x]* 2.2 Write property test for stock never goes negative





    - **Property 1: Stock Never Goes Negative**
    - **Validates: Requirements 1.3**

  - [x] 2.3 Add validation to prevent negative stock


    - Check available stock before deduction
    - Return clear error message with shortage amount
    - _Requirements: 1.3_

  - [ ]* 2.4 Write property test for available stock calculation
    - **Property 8: Available Stock Calculation**
    - **Validates: Requirements 7.4**



- [ ] 3. Checkpoint - Ensure stock service tests pass
  - Ensure all tests pass, ask the user if questions arise.





- [x] 4. Item Service Performance Optimizations

  - [ ] 4.1 Implement optimized low stock query using raw SQL
    - Use database-level aggregation with GROUP BY and HAVING
    - Support filtering by category, brand, and search
    - Return paginated results
    - _Requirements: 2.1, 2.4_
  - [x] 4.2 Enforce maximum page size of 100 in searchItems

    - Add Math.min(pageSize, 100) validation
    - Apply to all paginated endpoints
    - _Requirements: 4.1_



  - [ ]* 4.3 Write property test for pagination size cap
    - **Property 2: Pagination Size Cap**
    - **Validates: Requirements 4.1**
  - [ ] 4.4 Optimize searchItems to select only required fields
    - Use Prisma select instead of include for list views

    - Reduce data transfer for large result sets

    - _Requirements: 4.2_







- [ ] 5. Credit Service Bug Fixes
  - [ ] 5.1 Add Decimal.js for precise balance calculations
    - Install decimal.js package
    - Replace floating-point arithmetic with Decimal operations
    - _Requirements: 6.2_


  - [ ] 5.2 Fix payment validation to prevent exceeding balance
    - Add strict comparison using Decimal.js
    - Return clear error with current balance
    - _Requirements: 6.1_
  - [x]* 5.3 Write property test for credit payment balance constraint

    - **Property 3: Credit Payment Balance Constraint**





    - **Validates: Requirements 6.1**


  - [ ]* 5.4 Write property test for credit balance precision
    - **Property 4: Credit Balance Precision**
    - **Validates: Requirements 6.2**
  - [x] 5.5 Fix credit closure to be atomic with balance update

    - Update status to CLOSED when balance reaches zero

    - Set closedAt timestamp atomically
    - _Requirements: 6.3_

  - [ ]* 5.6 Write property test for credit closure consistency
    - **Property 5: Credit Closure Consistency**
    - **Validates: Requirements 6.3**


- [x] 6. Checkpoint - Ensure credit service tests pass








  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Transfer Service Bug Fixes
  - [ ] 7.1 Fix transfer cancellation to release reserved stock
    - Check if transfer was in SENT status



    - Decrement reservedQty atomically

    - _Requirements: 7.3_
  - [x]* 7.2 Write property test for transfer reservation release



    - **Property 7: Transfer Reservation Release**

    - **Validates: Requirements 7.3**

  - [ ] 7.3 Verify transfer receive properly updates both locations
    - Decrement source qty and reservedQty
    - Increment destination qty


    - _Requirements: 7.2_
  - [ ]* 7.4 Write property test for transfer stock conservation
    - **Property 6: Transfer Stock Conservation**
    - **Validates: Requirements 7.2**

- [ ] 8. Sale Service Atomicity Fixes
  - [ ] 8.1 Implement atomic receipt number generation
    - Create generateReceiptNumber using database sequence
    - Handle concurrent generation safely
    - _Requirements: 9.1, 9.2_
  - [ ]* 8.2 Write property test for receipt number uniqueness
    - **Property 10: Receipt Number Uniqueness**
    - **Validates: Requirements 9.2**
  - [ ] 8.3 Ensure sale finalization is fully atomic
    - Wrap all operations in single transaction
    - Rollback on any failure
    - _Requirements: 8.1, 8.2, 8.3_
  - [ ]* 8.4 Write property test for sale finalization atomicity
    - **Property 9: Sale Finalization Atomicity**
    - **Validates: Requirements 8.4**

- [ ] 9. Checkpoint - Ensure sale service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Bank Account Balance Consistency
  - [ ] 10.1 Fix bank balance updates to be atomic
    - Use Prisma increment/decrement operations
    - Ensure serializable isolation for concurrent updates
    - _Requirements: 12.1, 12.2_
  - [ ]* 10.2 Write property test for bank balance consistency
    - **Property 11: Bank Balance Consistency**
    - **Validates: Requirements 12.1, 12.2**

- [ ] 11. Connection Pool and Prisma Optimization
  - [ ] 11.1 Update Prisma client configuration
    - Increase connection_limit to 20
    - Set pool_timeout to 30 seconds
    - Add connect_timeout of 10 seconds
    - _Requirements: 5.1, 5.2, 5.3_

- [ ] 12. Dashboard Query Optimization
  - [ ] 12.1 Refactor admin dashboard to use parallel queries
    - Use Promise.all for independent queries
    - Reduce total query time
    - _Requirements: 3.1_
  - [ ] 12.2 Optimize top selling items query
    - Use single aggregated query with joins
    - Eliminate N+1 query pattern
    - _Requirements: 3.2_

- [ ] 13. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

# Implementation Plan

- [x] 1. Enhance Reconciliation API to include complete sale item details




  - [ ] 1.1 Update the payments query to include sale.items with item name
    - Modify the Prisma query in `src/app/api/reports/reconciliation/route.ts`

    - Add `items: { include: { item: { select: { name: true } } } }` to the sale include
    - _Requirements: 1.1_

  - [ ] 1.2 Add location include to the sale query
    - Add `location: { select: { name: true } }` to the sale include


    - _Requirements: 1.2_
  - [ ] 1.3 Add all payments with bank account details to the sale query
    - Add `payments: { include: { bankAccount: { select: { bankName: true } } } }` to the sale include





    - _Requirements: 1.3_
  - [x] 1.4 Transform the API response to include enhanced sale data

    - Update the `formattedSales` mapping to include items array with name, qty, unitPrice, lineTotal
    - Include location name in the response
    - Include payments array with method, amount, and bankName
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Update PDF Generator to display enhanced item details
  - [ ] 2.1 Update the "SOLD ITEMS DETAIL" table columns
    - Modify `generateReconciliationPDF` in `src/lib/pdf-generator.ts`
    - Add Location column to the table header


    - Adjust column widths to accommodate new column




    - _Requirements: 2.2, 3.1_
  - [ ] 2.2 Update item row generation to include location and enhanced payment info
    - Extract location from sale data for each item row
    - Format payment column as "METHOD (Bank Name): Amount" for non-cash payments
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.2_
  - [ ]* 2.3 Write property test for payment formatting
    - **Property 5: Bank name display for non-cash payments**
    - **Validates: Requirements 2.5, 3.2**


  - [ ]* 2.4 Write property test for line totals sum consistency
    - **Property 6: Line totals sum consistency**
    - **Validates: Requirements 3.3**

- [ ] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Final verification and edge case handling
  - [ ] 4.1 Handle missing data gracefully
    - Display "-" for missing location
    - Display "-" for missing salesman/cashier
    - Display method only (without bank name) for cash payments
    - _Requirements: 2.2, 2.3, 2.5_
  - [ ]* 4.2 Write unit tests for edge cases
    - Test with missing location
    - Test with missing salesman
    - Test with cash vs bank payments
    - _Requirements: 1.2, 1.4, 2.5_

- [ ] 5. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

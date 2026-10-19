# Implementation Plan

- [x] 1. Create vendor moves API endpoints




  - [ ] 1.1 Create POST /api/defects/[id]/vendor-moves endpoint
    - Create route file at `src/app/api/defects/[id]/vendor-moves/route.ts`
    - Validate vendorId exists
    - Create DefectVendorMove record with sentAt timestamp
    - Update defect status to WITH_VENDOR


    - Return created vendor move with vendor details
    - _Requirements: 2.2, 2.3_
  - [ ] 1.2 Create PATCH /api/defects/[id]/vendor-moves/[moveId] endpoint
    - Create route file at `src/app/api/defects/[id]/vendor-moves/[moveId]/route.ts`
    - Update receivedAt timestamp on vendor move
    - Allow optional notes update
    - Update defect status to READY_FOR_CUSTOMER
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ]* 1.3 Write property test for vendor move creation
    - **Property 2: Vendor move creation updates status**




    - **Validates: Requirements 2.2, 2.3**
  - [ ]* 1.4 Write property test for receive from vendor
    - **Property 3: Receive from vendor updates status and vendor move**
    - **Validates: Requirements 4.1, 4.2**

- [ ] 2. Enhance defect status update API
  - [x] 2.1 Update PATCH /api/defects/[id] for workflow transitions

    - Add status transition validation (only allow valid transitions)
    - Set completedAt when status changes to COMPLETED




    - Return updated defect with all relations
    - _Requirements: 1.1, 1.2, 5.1, 5.2_
  - [ ]* 2.2 Write property test for status transitions
    - **Property 1: Status transition from NEW to DIAGNOSED**
    - **Property 4: Transfer to customer completes defect**
    - **Validates: Requirements 1.1, 1.2, 5.1, 5.2**





- [ ] 3. Checkpoint - Ensure all API tests pass
  - Ensure all tests pass, ask the user if questions arise.





- [ ] 4. Create workflow action button visibility helper
  - [ ] 4.1 Create getWorkflowActions utility function
    - Create helper function that returns available actions based on status
    - Return action type, label, and variant for each status
    - Handle COMPLETED status returning empty array
    - _Requirements: 1.3, 2.4, 4.4, 5.3, 7.1-7.6_
  - [x]* 4.2 Write property test for action button visibility



    - **Property 5: Action button visibility matches status**
    - **Validates: Requirements 1.3, 2.4, 4.4, 5.3, 7.1-7.6**

- [x] 5. Create VendorSelectionModal component

  - [ ] 5.1 Create vendor selection modal UI
    - Create modal component at `src/components/defects/vendor-selection-modal.tsx`
    - Fetch and display vendors list with search
    - Include optional notes textarea

    - Handle confirm/cancel actions
    - _Requirements: 2.1_


- [ ] 6. Create VendorMoveHistory component
  - [ ] 6.1 Create vendor move history display
    - Create component at `src/components/defects/vendor-move-history.tsx`
    - Display vendor moves in chronological order


    - Show vendor name, sent date, received date, notes
    - Indicate "Currently with vendor" for active moves
    - _Requirements: 6.1, 6.2, 6.3_
  - [ ]* 6.2 Write property test for vendor moves ordering
    - **Property 6: Vendor moves returned in chronological order**
    - **Validates: Requirements 6.1**

- [ ] 7. Update defect detail page with workflow actions
  - [ ] 7.1 Add WorkflowActions section to defect detail page
    - Import and use getWorkflowActions helper
    - Display appropriate action button based on status
    - Wire up mutation handlers for each action
    - _Requirements: 7.1-7.6_
  - [ ] 7.2 Integrate VendorSelectionModal
    - Show modal when "Send to Vendor" is clicked
    - Handle vendor selection and API call
    - Refresh defect data on success
    - _Requirements: 2.1, 2.2, 2.3_
  - [ ] 7.3 Integrate VendorMoveHistory component
    - Display vendor move history card
    - Show current vendor info when WITH_VENDOR
    - _Requirements: 3.1, 3.2, 6.1, 6.2, 6.3_
  - [ ] 7.4 Add "Receive from Vendor" action handler
    - Show confirmation with optional notes input
    - Call vendor move update API
    - Refresh defect data on success
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 8. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

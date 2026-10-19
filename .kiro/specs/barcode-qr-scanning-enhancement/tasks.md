# Implementation Plan

- [x] 1. Create useScanDetector hook for physical scanner detection
  - [x] 1.1 Implement the useScanDetector hook with keyboard event listeners
    - Create `src/hooks/use-scan-detector.ts`
    - Implement rapid keystroke detection algorithm (50ms threshold)
    - Handle Enter key as scan terminator
    - Prevent default to stop characters appearing in inputs
    - _Requirements: 1.1, 1.5_
  - [ ]* 1.2 Write property test for scan detection accuracy
    - **Property 1: Physical Scanner Detection Accuracy**
    - **Validates: Requirements 1.1**
  - [x]* 1.3 Write property test for input interception
    - **Property 5: Scanner Input Interception**
    - **Validates: Requirements 1.5**

- [x] 2. Create item lookup API endpoint
  - [x] 2.1 Implement GET /api/items/lookup endpoint
    - Create `src/app/api/items/lookup/route.ts`
    - Accept barcode or SKU as query parameter
    - Return item with stock information by location
    - Handle not found case with appropriate error
    - _Requirements: 1.2, 1.4, 3.1_
  - [ ]* 2.2 Write property test for item lookup
    - **Property 4: Unknown Barcode Error Handling**
    - **Validates: Requirements 1.4**

- [x] 3. Create unified useScan hook
  - [x] 3.1 Implement the useScan hook combining scanner detection and item lookup
    - Create `src/hooks/use-scan.ts`
    - Integrate useScanDetector for physical scanner support
    - Add camera scanner state management
    - Implement item lookup on scan
    - Call onItemFound/onItemNotFound callbacks
    - _Requirements: 1.2, 1.3, 1.4, 5.3_
  - [ ]* 3.2 Write property test for callback execution
    - **Property 12: Page-Specific Callback Execution**
    - **Validates: Requirements 5.3**

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Integrate scanning into POS page
  - [x] 5.1 Update POS page to use useScan hook
    - Modify `src/app/(dashboard)/pos/page.tsx`
    - Replace manual search trigger with useScan hook
    - Add item to cart when scanned item is found
    - Increment quantity if item already in cart
    - Show error toast when item not found
    - _Requirements: 1.2, 1.3, 1.4, 2.4, 2.5_
  - [x]* 5.2 Write property test for cart addition
    - **Property 2: Item Found Adds to Cart**
    - **Validates: Requirements 1.2, 2.5**
  - [ ]* 5.3 Write property test for quantity increment
    - **Property 3: Existing Item Quantity Increment**
    - **Validates: Requirements 1.3**

- [x] 6. Integrate scanning into Transfer page
  - [x] 6.1 Update Transfer page to use useScan hook
    - Modify `src/app/(dashboard)/transfers/new/page.tsx`
    - Use useScan hook for barcode detection
    - Trigger search with scanned barcode
    - Show stock availability warning when applicable
    - _Requirements: 3.1, 3.2, 3.3_
  - [ ]* 6.2 Write property test for transfer scan search
    - **Property 6: Transfer Page Scan Search**
    - **Validates: Requirements 3.1**
  - [ ]* 6.3 Write property test for stock availability
    - **Property 7: Stock Availability Validation**
    - **Validates: Requirements 3.2, 3.3**

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Enhance BarcodeScanner component
  - [x] 8.1 Improve camera permission handling
    - Update `src/components/ui/barcode-scanner.tsx`
    - Add clear permission request UI
    - Show browser-specific instructions when permission denied
    - Add retry mechanism for camera errors
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 9. Validate barcode/QR code generation
  - [x] 9.1 Add validation to BarcodeGenerator component
    - Update `src/components/ui/barcode-generator.tsx`
    - Validate barcode value contains only valid CODE128 characters
    - Ensure QR code data doesn't exceed size limits
    - Add error handling for invalid inputs
    - _Requirements: 4.1, 4.2_
  - [ ]* 9.2 Write property test for barcode generation validity
    - **Property 8: Barcode Generation Validity**
    - **Validates: Requirements 4.1**
  - [ ]* 9.3 Write property test for QR code generation validity
    - **Property 9: QR Code Generation Validity**
    - **Validates: Requirements 4.2**
  - [ ]* 9.4 Write property test for barcode round-trip
    - **Property 10: Barcode Round-Trip Consistency**
    - **Validates: Requirements 4.3, 7.2**
  - [ ]* 9.5 Write property test for QR code round-trip
    - **Property 11: QR Code Round-Trip Consistency**
    - **Validates: Requirements 4.4, 7.3**

- [x] 10. Add visual feedback for scanning
  - [x] 10.1 Implement scan success/error feedback

    - Add toast notifications for scan results
    - Add success animation when item found
    - Add error state display when item not found
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 11. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

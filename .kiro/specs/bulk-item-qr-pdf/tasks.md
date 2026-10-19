# Implementation Plan: Bulk Item QR Code PDF

## Overview

This implementation adds a new report type that generates a PDF with QR codes for all inventory items, where each item's QR code is repeated based on its stock quantity. The implementation follows the existing patterns in the codebase for reports.

## Tasks

- [x] 1. Create API endpoint for bulk QR labels report
  - [x] 1.1 Create the API route file at `src/app/api/reports/bulk-qr-labels/route.ts`
    - Implement GET handler with authentication and permission check
    - Query items with stock information from database
    - Support optional locationId query parameter for filtering
    - Return items with id, sku, name, barcode, unitPrice, and stockQuantity
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 1.2 Write unit tests for API endpoint
    - Test authentication requirement returns 401
    - Test permission requirement returns 403
    - Test successful response structure
    - Test location filter parameter
    - _Requirements: 4.3, 4.4, 4.5_

- [x] 2. Implement PDF generator function
  - [x] 2.1 Add `generateBulkQRLabelsPDF` function to `src/lib/pdf-generator.ts`
    - Create PDF with header showing report title and generation date
    - Generate QR codes for each item repeated by stock quantity
    - Arrange labels in grid layout (e.g., 4 columns × 6 rows per page)
    - Include item name, SKU, and price on each label
    - Add borders around each label for cutting
    - Handle pagination automatically
    - Add page numbers to each page
    - _Requirements: 1.2, 1.3, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 2.2 Write property test for QR code count
    - **Property 1: QR Code Count Equals Stock Quantity**
    - **Validates: Requirements 1.3, 1.4**

  - [ ]* 2.3 Write property test for label content
    - **Property 3: Label Contains Required Information**
    - **Validates: Requirements 1.6**

- [x] 3. Checkpoint - API and PDF generator implemented
  - API endpoint created at `src/app/api/reports/bulk-qr-labels/route.ts`
  - PDF generator function added to `src/lib/pdf-generator.ts`

- [x] 4. Integrate with reports page UI
  - [x] 4.1 Add bulk QR labels report type to reports page
    - Add new entry to `reportTypes` array in `src/app/(dashboard)/reports/page.tsx`
    - Use QrCode icon from lucide-react
    - Set permission to 'reports:inventory'
    - _Requirements: 1.1, 5.1, 5.2_

  - [x] 4.2 Add UI section for bulk QR labels report
    - Display summary cards (total items, total labels, location if filtered)
    - Show info card explaining the QR code generation
    - List all items with their stock quantities
    - _Requirements: 5.1, 5.2_

  - [x] 4.3 Add PDF download handler for bulk QR report
    - Import and call generateBulkQRLabelsPDF when downloading
    - Handle async PDF generation with await
    - _Requirements: 5.3, 5.4_

- [x] 5. Final checkpoint - Implementation complete
  - All core functionality implemented
  - API endpoint, PDF generator, and UI integration complete
  - Optional tasks (unit tests, property tests) skipped for faster MVP

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The implementation follows existing patterns in the codebase
- QR codes will be generated using the qrcode library (already used in barcode-generator.tsx)
- PDF generation uses jsPDF (already used in pdf-generator.ts)

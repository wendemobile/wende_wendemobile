# Requirements Document

## Introduction

This feature adds a new report type that generates a PDF containing QR codes for all inventory items. The key functionality is that each item's QR code is repeated based on its current stock quantity - for example, if an item has 20 units in stock, the PDF will contain 20 QR codes for that item. This enables printing QR code labels for every physical unit in inventory.

## Glossary

- **QR_Code_Generator**: The system component responsible for generating QR code images for items
- **PDF_Generator**: The system component responsible for creating PDF documents with QR codes
- **Item**: An inventory product with SKU, name, barcode, price, and stock information
- **Stock_Quantity**: The total number of units available for an item across all locations
- **Label**: A single QR code unit in the PDF containing item information

## Requirements

### Requirement 1: Bulk QR Code PDF Report

**User Story:** As a store manager, I want to generate a PDF with QR codes for all items based on their stock quantity, so that I can print labels for every physical unit in my inventory.

#### Acceptance Criteria

1. WHEN a user selects the "Bulk QR Labels" report type, THE System SHALL display the report option in the reports page
2. WHEN a user generates the bulk QR report, THE PDF_Generator SHALL create a PDF document containing QR codes for all active items
3. FOR EACH item with stock quantity greater than zero, THE PDF_Generator SHALL generate QR codes equal to the item's total stock quantity
4. WHEN an item has zero stock, THE PDF_Generator SHALL skip that item and not include any QR codes for it
5. THE QR_Code_Generator SHALL encode the item's barcode value in each QR code
6. WHEN displaying a QR code label, THE System SHALL show the item name, SKU, and price alongside the QR code

### Requirement 2: PDF Layout and Formatting

**User Story:** As a store manager, I want the QR code labels to be well-organized in the PDF, so that I can easily cut and apply them to products.

#### Acceptance Criteria

1. THE PDF_Generator SHALL arrange QR code labels in a grid layout on each page
2. THE PDF_Generator SHALL include a visible border around each label for easy cutting
3. WHEN a page is full, THE PDF_Generator SHALL automatically add a new page and continue
4. THE PDF_Generator SHALL include page numbers on each page
5. THE PDF_Generator SHALL include a header with the report title and generation date

### Requirement 3: Location-Based Filtering

**User Story:** As a store manager, I want to optionally filter items by location, so that I can generate QR codes only for items at a specific location.

#### Acceptance Criteria

1. WHEN generating the report, THE System SHALL allow optional location selection
2. IF a location is selected, THE PDF_Generator SHALL only include items with stock at that location
3. IF a location is selected, THE PDF_Generator SHALL use the stock quantity at that specific location
4. IF no location is selected, THE PDF_Generator SHALL use the total stock quantity across all locations

### Requirement 4: API Endpoint

**User Story:** As a developer, I want a dedicated API endpoint for the bulk QR report, so that the frontend can request the report data.

#### Acceptance Criteria

1. THE System SHALL provide a GET endpoint at /api/reports/bulk-qr-labels
2. WHEN the endpoint is called, THE System SHALL return item data with stock quantities
3. THE System SHALL require authentication for the endpoint
4. THE System SHALL require the reports:inventory permission to access the endpoint
5. IF a locationId query parameter is provided, THE System SHALL filter items by that location

### Requirement 5: Report Integration

**User Story:** As a user, I want the bulk QR report to be accessible from the existing reports page, so that I can easily find and generate it.

#### Acceptance Criteria

1. THE System SHALL add the "Bulk QR Labels" option to the reports page
2. THE System SHALL display an appropriate icon for the bulk QR report
3. WHEN the user clicks the PDF download button, THE System SHALL generate and download the PDF
4. THE System SHALL show a loading state while the PDF is being generated

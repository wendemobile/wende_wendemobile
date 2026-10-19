# Requirements Document

## Introduction

This feature adds a new report type that generates a PDF containing QR codes and/or barcodes for all inventory items. The PDF will display codes based on the current stock quantity - if an item has 12 units in stock, the PDF will contain 12 copies of that item's QR code or barcode. Each code label includes the item name and the code itself. Users can choose between QR code format or barcode format before downloading.

## Glossary

- **QR_Code**: A two-dimensional barcode that can store item information, generated using the item's barcode value
- **Barcode**: A one-dimensional CODE128 barcode generated from the item's barcode value
- **Stock_Quantity**: The total quantity of an item available across all locations
- **Label**: A single printable unit containing the item name and its QR code or barcode
- **Bulk_PDF**: A PDF document containing multiple labels for all items based on their stock quantities

## Requirements

### Requirement 1

**User Story:** As a store manager, I want to select a QR code or barcode report type from the reports page, so that I can generate bulk labels for all inventory items.

#### Acceptance Criteria

1. WHEN a user visits the reports page THEN the System SHALL display a "QR/Barcode Labels" report option alongside existing report types
2. WHEN the user selects the QR/Barcode Labels report THEN the System SHALL display format selection options for QR Code or Barcode
3. WHEN the user selects a format THEN the System SHALL enable the PDF download button

### Requirement 2

**User Story:** As a store manager, I want the PDF to contain labels for each unit of stock, so that I can print and attach labels to individual items.

#### Acceptance Criteria

1. WHEN generating the bulk PDF THEN the System SHALL create one label for each unit of stock for every item
2. WHEN an item has stock quantity of N THEN the System SHALL generate exactly N labels for that item in the PDF
3. WHEN an item has zero stock THEN the System SHALL skip that item and not include any labels for it
4. WHEN generating labels THEN the System SHALL include all active items from the inventory

### Requirement 3

**User Story:** As a store manager, I want each label to show the item name and code clearly, so that I can identify items after printing.

#### Acceptance Criteria

1. WHEN displaying a label THEN the System SHALL show the item name at the top of the label
2. WHEN displaying a label THEN the System SHALL show the QR code or barcode image below the item name
3. WHEN displaying a label THEN the System SHALL show the barcode value text below the code image
4. WHEN the item name is too long THEN the System SHALL truncate it to fit within the label width

### Requirement 4

**User Story:** As a store manager, I want the PDF to be well-organized for printing, so that I can easily cut and use the labels.

#### Acceptance Criteria

1. WHEN generating the PDF THEN the System SHALL arrange labels in a grid layout with multiple labels per page
2. WHEN a page is full THEN the System SHALL automatically create a new page and continue adding labels
3. WHEN displaying labels THEN the System SHALL include light borders around each label for cutting guidance
4. WHEN generating the PDF THEN the System SHALL use consistent label sizes throughout the document

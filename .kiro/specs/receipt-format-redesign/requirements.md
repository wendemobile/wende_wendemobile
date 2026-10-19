# Requirements Document

## Introduction

This feature redesigns the POS receipt to match the exact format of Ethiopian tax-compliant receipts. The receipt must include TIN numbers, ERCA compliance information, tax calculations (15% VAT), and follow the specific layout used by Ethiopian businesses for fiscal documentation.

## Glossary

- **TIN**: Tax Identification Number - A unique identifier assigned to businesses for tax purposes
- **ERCA**: Ethiopian Revenue and Customs Authority - The government body responsible for tax collection
- **FS NO**: Fiscal Serial Number - A sequential receipt number for tax tracking
- **TXBL**: Taxable Amount - The subtotal before tax is applied
- **VAT**: Value Added Tax - Currently 15% in Ethiopia
- **Receipt System**: The component responsible for generating and printing sales receipts

## Requirements

### Requirement 1

**User Story:** As a store owner, I want the receipt header to display my business information exactly as required by Ethiopian tax regulations, so that my receipts are legally compliant.

#### Acceptance Criteria

1. WHEN a receipt is generated THEN the Receipt System SHALL display the business TIN number at the top center of the receipt
2. WHEN a receipt is generated THEN the Receipt System SHALL display the business name directly below the TIN
3. WHEN a receipt is generated THEN the Receipt System SHALL display the business address including region and kebele information
4. WHEN a receipt is generated THEN the Receipt System SHALL display the business phone number in the format "TEL:-XX XX XX XX XX"

### Requirement 2

**User Story:** As a cashier, I want the receipt to show the fiscal serial number, date, and time in the correct format, so that each transaction is properly documented.

#### Acceptance Criteria

1. WHEN a receipt is generated THEN the Receipt System SHALL display "FS NO." followed by an 8-digit zero-padded receipt number on the left side
2. WHEN a receipt is generated THEN the Receipt System SHALL display the date in DD/MM/YYYY format below the FS NO
3. WHEN a receipt is generated THEN the Receipt System SHALL display "#A" indicator on the right side of the FS NO line
4. WHEN a receipt is generated THEN the Receipt System SHALL display the time in HH:MM format (24-hour) on the right side below #A

### Requirement 3

**User Story:** As a store owner, I want the receipt to clearly indicate it is a cash invoice with proper separators, so that the document type is immediately identifiable.

#### Acceptance Criteria

1. WHEN a receipt is generated THEN the Receipt System SHALL display "=======CASH INVOICE=======" as a centered separator line
2. WHEN a receipt is generated THEN the Receipt System SHALL display "REF NO.:" field for reference numbers
3. WHEN a receipt is generated THEN the Receipt System SHALL display "INVOICE NO.:" followed by the invoice number in format "CA-XXXXXXXX"
4. WHEN a receipt is generated THEN the Receipt System SHALL display "CUSTOMER NAME:" followed by the customer name if provided
5. WHEN a receipt is generated THEN the Receipt System SHALL display "BUYER'S TIN:" field for customer tax identification

### Requirement 4

**User Story:** As a cashier, I want the items section to display description, quantity, price, and amount in a clear tabular format, so that customers can verify their purchases.

#### Acceptance Criteria

1. WHEN items are listed THEN the Receipt System SHALL display a header row with "DESCRIPTION QTY PRICE AMOUNT" columns
2. WHEN items are listed THEN the Receipt System SHALL display each item's quantity, unit price (with 3 decimal places), and line total (with asterisk prefix)
3. WHEN items are listed THEN the Receipt System SHALL display the item description/name below the numeric values
4. WHEN items are listed THEN the Receipt System SHALL use horizontal lines to separate the header from item rows

### Requirement 5

**User Story:** As a store owner, I want the receipt to calculate and display the 15% VAT separately, so that tax compliance is transparent and verifiable.

#### Acceptance Criteria

1. WHEN totals are calculated THEN the Receipt System SHALL display "TXBL 1" followed by the taxable subtotal with asterisk prefix
2. WHEN totals are calculated THEN the Receipt System SHALL display "TAX 1(15.00%)" followed by the calculated tax amount with asterisk prefix
3. WHEN totals are calculated THEN the Receipt System SHALL calculate tax as exactly 15% of the taxable amount
4. WHEN totals are calculated THEN the Receipt System SHALL display amounts right-aligned with asterisk prefix (e.g., "*23,000.00")

### Requirement 6

**User Story:** As a cashier, I want the receipt to show the final total, payment amount, and item count clearly, so that the transaction summary is complete.

#### Acceptance Criteria

1. WHEN the receipt is finalized THEN the Receipt System SHALL display "TOTAL" followed by the grand total (subtotal + tax) with asterisk prefix
2. WHEN the receipt is finalized THEN the Receipt System SHALL display "CASH" followed by the amount paid with asterisk prefix
3. WHEN the receipt is finalized THEN the Receipt System SHALL display "ITEM#" followed by the total number of items sold
4. WHEN the receipt is finalized THEN the Receipt System SHALL use horizontal lines to separate the totals section

### Requirement 7

**User Story:** As a store owner, I want the receipt footer to include ERCA compliance information, so that my receipts meet Ethiopian tax authority requirements.

#### Acceptance Criteria

1. WHEN a receipt is generated THEN the Receipt System SHALL display "ERCA" centered in the footer
2. WHEN a receipt is generated THEN the Receipt System SHALL display the ET (Ethiopian Tax) machine number in format "ET NDBXXXXXXX"
3. WHEN a receipt is generated THEN the Receipt System SHALL display "SYSTEM BY PEDS." as the system identifier
4. WHEN a receipt is generated THEN the Receipt System SHALL display "THANK YOU! PLEASE COME AGAIN." as the closing message

### Requirement 8

**User Story:** As a store owner, I want to configure my business details for the receipt, so that the receipt displays my specific business information.

#### Acceptance Criteria

1. WHEN the system is configured THEN the Receipt System SHALL allow setting the business TIN number
2. WHEN the system is configured THEN the Receipt System SHALL allow setting the business name
3. WHEN the system is configured THEN the Receipt System SHALL allow setting the business address
4. WHEN the system is configured THEN the Receipt System SHALL allow setting the business phone number
5. WHEN the system is configured THEN the Receipt System SHALL allow setting the ERCA ET machine number

# Requirements Document

## Introduction

This document specifies requirements for fixing multiple issues related to session-based financial tracking, expense validation, credit management, money management page, and stock transfer functionality. The system needs to ensure accurate cash-in-hand tracking, prevent expenses exceeding available cash, support manual credit recording, properly reset financial data when sessions close, and correctly display stock availability for transfers.

## Glossary

- **Session**: A daily business session that tracks all financial transactions from opening to closing
- **Cash In Hand**: The total physical cash available during a session, calculated from opening balance plus cash inflows minus cash outflows
- **Expense**: A business expenditure recorded during a session
- **Credit**: A sale made on credit where the customer pays later
- **Fund Transfer**: Movement of money between cash and bank accounts
- **Stock Transfer**: Movement of inventory items between physical locations
- **Available Stock**: The quantity of an item at a specific location minus reserved quantities

## Requirements

### Requirement 1: Dashboard Cash In Hand Accuracy

**User Story:** As a business owner, I want the dashboard to show accurate cash in hand information, so that I can make informed financial decisions.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the system SHALL calculate cash in hand using the formula: Opening Balance + Cash Sales + Cash Layaway Payments + Cash Credit Payments + Special Income + Bank-to-Cash Transfers - Cash Expenses - Cash-to-Bank Transfers
2. WHEN no active session exists THEN the system SHALL display zero for cash in hand
3. WHEN the cash in hand breakdown is expanded THEN the system SHALL show each component with its correct value

### Requirement 2: Expense Cash Validation

**User Story:** As a cashier, I want the system to prevent me from recording cash expenses that exceed available cash, so that I don't create negative cash balances.

#### Acceptance Criteria

1. WHEN a user attempts to create a cash expense THEN the system SHALL validate that the expense amount does not exceed current cash in hand
2. IF the expense amount exceeds cash in hand THEN the system SHALL reject the expense and display an "Insufficient cash balance" error message
3. WHEN the expense payment method is not CASH THEN the system SHALL allow the expense without cash validation
4. WHEN displaying the expense form THEN the system SHALL show the current available cash balance

### Requirement 3: Manual Credit Recording

**User Story:** As a store manager, I want to manually add credit records, so that I can record credits that were not created through the POS system.

#### Acceptance Criteria

1. WHEN a user navigates to the credits page THEN the system SHALL display an "Add Credit" button
2. WHEN a user clicks "Add Credit" THEN the system SHALL display a form with fields for customer, principal amount, due date, and notes
3. WHEN a user submits a valid credit form THEN the system SHALL create a new credit record with status OPEN
4. WHEN a credit is created manually THEN the system SHALL link it to the current active session

### Requirement 4: Money Management Session Dependency

**User Story:** As a cashier, I want the money management page to show session-specific data, so that financial information resets when a new session starts.

#### Acceptance Criteria

1. WHEN no active session exists THEN the system SHALL display zero for cash balance on the money management page
2. WHEN a session is closed THEN the system SHALL show zero balances until a new session is opened
3. WHEN an active session exists THEN the system SHALL display the current session's cash balance
4. WHEN displaying bank account balances THEN the system SHALL show the actual current balance regardless of session status

### Requirement 5: Stock Transfer Location Accuracy

**User Story:** As a warehouse manager, I want to see accurate stock quantities for each location when creating transfers, so that I can transfer the correct amounts.

#### Acceptance Criteria

1. WHEN searching for items to transfer THEN the system SHALL display the available quantity at the selected source location
2. WHEN an item has stock at the source location THEN the system SHALL show the correct available quantity (qty - reservedQty)
3. WHEN an item has zero stock at the source location but stock at other locations THEN the system SHALL display a message indicating stock exists elsewhere
4. WHEN adding an item to a transfer THEN the system SHALL prevent adding more than the available quantity at the source location
5. WHEN the source location is changed THEN the system SHALL clear the selected items and refresh stock availability


# Requirements Document

## Introduction

This document specifies the requirements for a Sale History and Cancellation/Refund feature in the POS system. The feature enables users to view completed sales history, cancel sales with refund processing, and restore inventory when sales are cancelled. A Sale History button will be added to the POS page header for quick access. Additionally, this document covers salesman selection during sale processing and refund payment method selection during cancellation.

## Glossary

- **Sale_History_System**: The component responsible for displaying and managing completed sales records
- **Refund_Processor**: The component that handles refund amount calculation and processing
- **Stock_Restorer**: The component that returns items to inventory when a sale is cancelled
- **Sale**: A completed transaction record containing items, payments, and customer information
- **Refund**: The monetary amount returned to the customer when a sale is cancelled
- **Salesman**: The user who made the sale, tracked for commission and reporting purposes
- **Current_User**: The authenticated user currently logged into the system
- **Refund_Payment_Method**: The method by which the refund amount is returned to the customer (Cash, Mobile Transfer, Card)

## Requirements

### Requirement 1

**User Story:** As a cashier, I want to access sale history from the POS page, so that I can quickly view and manage past transactions.

#### Acceptance Criteria

1. WHEN a user views the POS page THEN the Sale_History_System SHALL display a "Sale History" button in the top header area
2. WHEN a user clicks the Sale History button THEN the Sale_History_System SHALL open a modal or slide-out panel showing recent sales
3. WHEN the sale history panel opens THEN the Sale_History_System SHALL display sales sorted by date in descending order (newest first)

### Requirement 2

**User Story:** As a cashier, I want to view sale details in the history list, so that I can identify the correct sale to manage.

#### Acceptance Criteria

1. WHEN displaying a sale in the history list THEN the Sale_History_System SHALL show receipt number, date/time, total amount, and status
2. WHEN displaying a sale in the history list THEN the Sale_History_System SHALL show the number of items and payment method used
3. WHEN a user taps on a sale entry THEN the Sale_History_System SHALL expand to show full item details including item names, quantities, and prices

### Requirement 3

**User Story:** As a cashier, I want to cancel a completed sale, so that I can process customer refunds when needed.

#### Acceptance Criteria

1. WHEN viewing a completed sale THEN the Sale_History_System SHALL display a "Cancel Sale" button
2. WHEN a user clicks Cancel Sale THEN the Refund_Processor SHALL display a refund dialog with the sale total pre-filled
3. WHEN the refund dialog opens THEN the Refund_Processor SHALL allow the user to enter a custom refund amount (partial or full)
4. WHEN the refund amount exceeds the original sale total THEN the Refund_Processor SHALL prevent submission and display an error message

### Requirement 4

**User Story:** As a cashier, I want to process the refund and restore inventory, so that the system accurately reflects the cancellation.

#### Acceptance Criteria

1. WHEN a user confirms the sale cancellation THEN the Refund_Processor SHALL update the sale status to "CANCELLED"
2. WHEN a sale is cancelled THEN the Stock_Restorer SHALL add the sold quantities back to inventory at the original sale location
3. WHEN a sale is cancelled THEN the Sale_History_System SHALL record the refund amount and timestamp
4. WHEN a sale is successfully cancelled THEN the Sale_History_System SHALL display a confirmation message with the refund amount

### Requirement 5

**User Story:** As a manager, I want cancelled sales to be tracked, so that I can audit refund activity.

#### Acceptance Criteria

1. WHEN a sale is cancelled THEN the Sale_History_System SHALL create an audit log entry with user, timestamp, and refund amount
2. WHEN viewing the sale history THEN the Sale_History_System SHALL visually distinguish cancelled sales from completed sales
3. WHEN viewing a cancelled sale THEN the Sale_History_System SHALL display the refund amount and cancellation date

### Requirement 6

**User Story:** As a cashier, I want to filter and search sale history, so that I can quickly find specific transactions.

#### Acceptance Criteria

1. WHEN viewing sale history THEN the Sale_History_System SHALL provide a search field to filter by receipt number
2. WHEN viewing sale history THEN the Sale_History_System SHALL provide date range filters
3. WHEN viewing sale history THEN the Sale_History_System SHALL provide status filters (Completed, Cancelled, All)

### Requirement 7

**User Story:** As a cashier, I want to select a salesman when processing a sale, so that sales can be attributed to the correct person for commission tracking.

#### Acceptance Criteria

1. WHEN a user opens the payment modal THEN the POS_System SHALL display a salesman selection dropdown
2. WHEN no salesman is explicitly selected THEN the POS_System SHALL default to the Current_User as the salesman
3. WHEN a sale is completed THEN the POS_System SHALL record the selected salesman with the sale record
4. WHEN displaying sale history THEN the Sale_History_System SHALL show the salesman name for each sale

### Requirement 8

**User Story:** As a cashier, I want to select a refund payment method when cancelling a sale, so that I can process the refund through the appropriate channel.

#### Acceptance Criteria

1. WHEN the refund dialog opens THEN the Refund_Processor SHALL display payment method options (Cash, Mobile Transfer, Card)
2. WHEN a user selects Mobile Transfer as refund method THEN the Refund_Processor SHALL display a bank account selection dropdown
3. WHEN a user confirms the refund THEN the Refund_Processor SHALL record the refund payment method with the cancellation
4. WHEN viewing a cancelled sale THEN the Sale_History_System SHALL display the refund payment method used

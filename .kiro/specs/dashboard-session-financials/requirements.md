# Requirements Document

## Introduction

This feature enhances the Admin and Cashier dashboards to display accurate session-based financial information including total cash in hand, total expenses, and total mobile/bank transfers. The dashboard must show ONLY current session data, and when a session is closed, all financial metrics must reset to zero. This ensures accurate real-time business information for daily operations.

## Glossary

- **Session**: A daily business session that tracks all financial transactions from opening to closing
- **Cash in Hand**: The current cash balance calculated as: Opening Balance + Cash Sales + Cash Layaway Payments + Cash Credit Payments + Special Income - Cash Expenses
- **Mobile Transfer**: Payments received via mobile money or bank transfer during the session
- **Bank Balance**: The current balance of bank accounts with session-specific transaction history
- **Session Stats**: Financial metrics that are scoped to the current active session only

## Requirements

### Requirement 1

**User Story:** As an admin or cashier, I want to see the total cash in hand for the current session, so that I can track the expected cash drawer balance.

#### Acceptance Criteria

1. WHEN a session is active THEN the Dashboard SHALL display the calculated cash in hand (Opening + Cash Inflows - Cash Outflows)
2. WHEN no session is active THEN the Dashboard SHALL display zero for cash in hand
3. WHEN a session is closed THEN the Dashboard SHALL reset cash in hand to zero immediately

### Requirement 2

**User Story:** As an admin or cashier, I want to see total expenses for the current session, so that I can track cash outflows.

#### Acceptance Criteria

1. WHEN viewing the dashboard THEN the system SHALL display total cash expenses for the current session only
2. WHEN no session is active THEN the Dashboard SHALL display zero for expenses
3. WHEN a session is closed THEN the Dashboard SHALL reset expenses to zero

### Requirement 3

**User Story:** As an admin or cashier, I want to see total mobile/bank transfers for the current session, so that I can track non-cash payments.

#### Acceptance Criteria

1. WHEN viewing the dashboard THEN the system SHALL display total mobile transfer payments received in the current session
2. WHEN a user taps on a bank account balance THEN the system SHALL display a list of transactions for that account in the current session
3. WHEN no session is active THEN the Dashboard SHALL display zero for mobile transfers

### Requirement 4

**User Story:** As an admin or cashier, I want all dashboard financial data to be session-scoped, so that I see only today's business activity.

#### Acceptance Criteria

1. WHEN displaying sales data THEN the system SHALL filter by current session start time
2. WHEN displaying expense data THEN the system SHALL filter by current session ID
3. WHEN displaying payment data THEN the system SHALL filter by current session timeframe
4. WHEN the session is closed THEN all financial metrics SHALL reset to zero or show "No Active Session"

### Requirement 5

**User Story:** As an admin or cashier, I want accurate financial calculations, so that I can trust the dashboard for real business decisions.

#### Acceptance Criteria

1. WHEN calculating cash in hand THEN the system SHALL include: Opening Balance + Cash Sales + Cash Layaway Payments + Cash Credit Payments + Special Income - Cash Expenses
2. WHEN calculating mobile transfers THEN the system SHALL sum all MOBILE_TRANSFER payment method amounts
3. WHEN displaying bank balances THEN the system SHALL show current balance with session transaction count

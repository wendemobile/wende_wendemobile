# Requirements Document

## Introduction

This feature addresses the issue where the Money Management and Bank Accounts pages display incorrect bank account balances. Currently, the pages show cumulative all-time balances instead of session-specific balances. When a sale is processed with a bank account (mobile transfer), the balance should reflect only the current session's transactions, and the transaction history should display only session-related transactions.

## Glossary

- **Session**: A daily business session that starts when opened and ends when closed. All financial transactions are tracked within a session context.
- **Bank Account**: A financial account (bank or mobile money) used to receive payments from sales, layaways, and credit payments.
- **Mobile Transfer**: A payment method where money is transferred to a bank/mobile money account.
- **Session Balance**: The net amount of money received in a bank account during the current session only.
- **Transaction History**: A list of all financial transactions affecting a bank account within the current session.

## Requirements

### Requirement 1

**User Story:** As a cashier, I want to see the actual session-specific balance for each bank account, so that I can accurately track money received during my shift.

#### Acceptance Criteria

1. WHEN a session is active THEN the Money_Management_Page SHALL display bank account balances calculated from session transactions only
2. WHEN no session is active THEN the Money_Management_Page SHALL display zero balance for all bank accounts
3. WHEN a sale is completed with mobile transfer payment THEN the Bank_Account_Balance SHALL increment by the payment amount within the session context
4. WHEN the session balance is displayed THEN the Money_Management_Page SHALL show the sum of all inflows minus outflows for that session

### Requirement 2

**User Story:** As a cashier, I want to see transaction history for the current session only, so that I can verify all money movements during my shift.

#### Acceptance Criteria

1. WHEN viewing transaction history THEN the Money_Management_Page SHALL display only transactions from the current session
2. WHEN a mobile transfer payment is made THEN the Transaction_History SHALL include the payment with correct amount and reference
3. WHEN viewing bank account details THEN the Bank_Accounts_Page SHALL show session-specific transaction count and amounts
4. WHEN no session is active THEN the Transaction_History SHALL display empty list

### Requirement 3

**User Story:** As a manager, I want the bank account page to show session-aware balances, so that I can reconcile daily transactions accurately.

#### Acceptance Criteria

1. WHEN viewing the Bank Accounts page THEN the Bank_Accounts_Page SHALL display session-specific balances for each account
2. WHEN a session is active THEN the Bank_Accounts_Page SHALL show the change in balance (session inflow minus outflow)
3. WHEN no session is active THEN the Bank_Accounts_Page SHALL display a warning message indicating no active session
4. WHEN clicking on a bank account THEN the Bank_Accounts_Page SHALL navigate to details showing session transactions

### Requirement 4

**User Story:** As a cashier, I want mobile transfer payments from sales to be immediately reflected in bank account balances, so that I can confirm payments are recorded correctly.

#### Acceptance Criteria

1. WHEN a sale is finalized with mobile transfer THEN the Bank_Account_Balance SHALL update immediately
2. WHEN multiple payments are made to the same bank account THEN the Session_Balance SHALL reflect the cumulative total
3. WHEN viewing the money management page after a sale THEN the Updated_Balance SHALL be visible without page refresh

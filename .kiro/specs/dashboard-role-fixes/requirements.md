# Requirements Document

## Introduction

This document specifies the requirements for fixing two critical issues in the Web POS system:
1. Mobile menu navigation showing all items regardless of user role permissions
2. Dashboard displaying incorrect/empty data for non-admin users (Cashier, Salesman, Basement Manager)

## Glossary

- **Mobile_Menu**: The slide-out navigation menu displayed on small screens when the hamburger icon is tapped
- **Desktop_Sidebar**: The fixed navigation panel displayed on larger screens (md breakpoint and above)
- **Dashboard_Page**: The main dashboard view that displays session financials, recent sales, and other metrics
- **User_Role**: The permission level assigned to a user (ADMIN, CASHIER, SALESMAN, BASEMENT_MANAGER)
- **Session_Financials**: Financial data tied to the current active daily session
- **Recent_Transactions**: List of recent completed sales with items and payment details

## Requirements

### Requirement 1: Mobile Menu Role-Based Filtering

**User Story:** As a user with a specific role, I want the mobile menu to only show navigation items I have permission to access, so that I have a consistent experience between mobile and desktop views.

#### Acceptance Criteria

1. WHEN the Mobile_Menu is opened on a small screen, THE Mobile_Menu SHALL display only navigation items that the current user has permission to access based on their User_Role
2. WHEN a user with CASHIER role opens the Mobile_Menu, THE Mobile_Menu SHALL hide navigation items that require permissions the CASHIER role does not have
3. WHEN a user with SALESMAN role opens the Mobile_Menu, THE Mobile_Menu SHALL hide navigation items that require permissions the SALESMAN role does not have
4. WHEN a user with BASEMENT_MANAGER role opens the Mobile_Menu, THE Mobile_Menu SHALL hide navigation items that require permissions the BASEMENT_MANAGER role does not have
5. THE Mobile_Menu SHALL use the same permission checking logic as the Desktop_Sidebar for consistency

### Requirement 2: Dashboard Data Normalization for All Roles

**User Story:** As a user with any role, I want the dashboard to correctly display my recent sales and sales totals, so that I can see accurate information about my session activity.

#### Acceptance Criteria

1. WHEN a CASHIER user views the Dashboard_Page, THE Dashboard_Page SHALL display the user's recent sales from the `recentSales` field returned by the API
2. WHEN a CASHIER user views the Dashboard_Page, THE Dashboard_Page SHALL display the correct sales total from `locationSales.today` in the sales card
3. WHEN a SALESMAN user views the Dashboard_Page, THE Dashboard_Page SHALL display the user's recent transactions from the `recentTransactions` field returned by the API
4. WHEN a SALESMAN user views the Dashboard_Page, THE Dashboard_Page SHALL display the correct sales total from `personalSales.today` in the sales card
5. WHEN a BASEMENT_MANAGER user views the Dashboard_Page, THE Dashboard_Page SHALL display relevant inventory data instead of sales data
6. THE Dashboard_Page SHALL normalize different API response structures into a consistent format for display

### Requirement 3: API Response Structure Consistency

**User Story:** As a developer, I want the dashboard API to return consistent field names across all roles, so that the frontend can display data without complex conditional logic.

#### Acceptance Criteria

1. THE Dashboard API SHALL return a `recentTransactions` field for all roles that have sales data
2. THE Dashboard API SHALL return a `totalSales.today` field for all roles that have sales data
3. WHEN the CASHIER dashboard is generated, THE Dashboard_Service SHALL map `recentSales` to `recentTransactions` for consistency
4. WHEN the CASHIER dashboard is generated, THE Dashboard_Service SHALL map `locationSales.today` to `totalSales.today` for consistency
5. WHEN the SALESMAN dashboard is generated, THE Dashboard_Service SHALL map `personalSales.today` to `totalSales.today` for consistency

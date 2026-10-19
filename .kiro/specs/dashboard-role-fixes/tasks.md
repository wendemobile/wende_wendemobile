# Implementation Plan: Dashboard Role Fixes

## Overview

This implementation plan addresses two issues:
1. Mobile menu showing all navigation items regardless of user role
2. Dashboard showing empty/incorrect data for non-admin users

## Tasks

- [x] 1. Fix mobile menu role-based filtering
  - [x] 1.1 Add role-based filtering to Header component
    - Import `useSession` from next-auth/react
    - Import `hasPermission` from @/lib/permissions
    - Add `useMemo` to filter `mobileNavItems` based on user role
    - Use same permission mapping as sidebar component
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Fix dashboard data normalization for Cashier role
  - [x] 2.1 Update getCashierDashboard to return normalized fields
    - Add `totalSales` field mapping from `locationSales`
    - Add `recentTransactions` field mapping from `recentSales`
    - Ensure same structure as AdminDashboard response
    - _Requirements: 2.1, 2.2, 3.3, 3.4_

- [x] 3. Fix dashboard data normalization for Salesman role
  - [x] 3.1 Update getSalesmanDashboard to return normalized fields
    - Add `totalSales` field mapping from `personalSales`
    - Ensure `recentTransactions` field is properly structured
    - _Requirements: 2.3, 2.4, 3.5_

- [x] 4. Checkpoint - Verify fixes work correctly
  - Test mobile menu filtering for each role
  - Test dashboard data display for CASHIER and SALESMAN roles
  - Ensure all tests pass, ask the user if questions arise

## Notes

- The fixes are minimal and focused on the specific issues
- No database changes required
- Uses existing permission system for consistency
- Property tests validate filtering consistency and API structure

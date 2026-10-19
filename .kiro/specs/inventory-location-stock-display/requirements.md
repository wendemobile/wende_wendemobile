# Requirements Document

## Introduction

This feature enhances the inventory view to display stock quantities by location for each item. When an item exists in multiple locations (e.g., warehouse, display, showroom), the system will show the breakdown of stock per location. Additionally, an "Add to Cart" action button will be added to the inventory view to enable quick sales processing. When adding items with stock in multiple locations, users can select which location to deduct stock from.

## Glossary

- **Inventory_View**: The page displaying all items in the system with their details and stock information
- **Location**: A physical place where stock is stored (e.g., Warehouse, Display, Showroom, Basement)
- **Stock**: The quantity of an item available at a specific location
- **Cart**: A temporary collection of items selected for a sale transaction
- **POS**: Point of Sale system for processing sales

## Requirements

### Requirement 1

**User Story:** As a store staff member, I want to see stock quantities broken down by location for each item, so that I can quickly identify where items are stored.

#### Acceptance Criteria

1. WHEN the inventory view displays an item with stock in multiple locations THEN the Inventory_View SHALL show each location name with its corresponding stock quantity
2. WHEN an item has stock in only one location THEN the Inventory_View SHALL display that single location with its stock quantity
3. WHEN an item has zero stock across all locations THEN the Inventory_View SHALL display a clear "Out of Stock" indicator
4. WHEN displaying location stock breakdown THEN the Inventory_View SHALL show location name and available quantity for each location with stock greater than zero

### Requirement 2

**User Story:** As a cashier, I want to add items to cart directly from the inventory view, so that I can quickly process sales without navigating to the POS page.

#### Acceptance Criteria

1. WHEN viewing an item in the inventory list THEN the Inventory_View SHALL display an "Add to Cart" action button
2. WHEN a user clicks "Add to Cart" for an item with stock in a single location THEN the Inventory_View SHALL add the item to the cart with that location selected
3. WHEN a user clicks "Add to Cart" for an item with stock in multiple locations THEN the Inventory_View SHALL display a location selection dialog showing available locations and their stock quantities
4. WHEN a user selects a location from the dialog THEN the Inventory_View SHALL add the item to the cart with the selected location
5. WHEN an item has zero stock THEN the Inventory_View SHALL disable the "Add to Cart" button and display it as unavailable

### Requirement 3

**User Story:** As a store manager, I want the location selection to show stock availability, so that staff can make informed decisions about which location to deduct from.

#### Acceptance Criteria

1. WHEN the location selection dialog is displayed THEN the Inventory_View SHALL show each location's available stock quantity
2. WHEN a location has zero stock THEN the Inventory_View SHALL disable that location option in the selection dialog
3. WHEN displaying location options THEN the Inventory_View SHALL sort locations by stock quantity in descending order

### Requirement 4

**User Story:** As a user, I want the cart to persist across navigation, so that I can continue adding items from different pages.

#### Acceptance Criteria

1. WHEN items are added to cart from the inventory view THEN the Cart SHALL persist the items when navigating to other pages
2. WHEN the user navigates to the POS page THEN the Cart SHALL display all items added from the inventory view
3. WHEN items are in the cart THEN the Inventory_View SHALL display a cart indicator showing the number of items

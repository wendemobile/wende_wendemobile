# Design Document

## Overview

This feature enhances the inventory view to display stock quantities broken down by location and adds an "Add to Cart" functionality directly from the inventory page. The implementation uses a shared cart context to persist cart state across pages, enabling seamless workflow between inventory browsing and POS checkout.

## Architecture

The feature follows the existing Next.js App Router architecture with React Query for data fetching. A new CartContext will be introduced to manage cart state globally across the application.

```mermaid
graph TB
    subgraph "Frontend Components"
        IV[Inventory Page]
        POS[POS Page]
        CC[CartContext Provider]
        LSD[LocationSelectDialog]
        CI[CartIndicator]
    end
    
    subgraph "API Layer"
        IA[/api/items]
        SA[/api/sales]
    end
    
    subgraph "Services"
        SS[StockService]
    end
    
    IV --> CC
    POS --> CC
    IV --> LSD
    IV --> CI
    IV --> IA
    POS --> SA
    IA --> SS
```

## Components and Interfaces

### CartContext

A React context that manages cart state globally across the application.

```typescript
interface CartItem {
  id: string;
  itemId: string;
  name: string;
  sku: string;
  qty: number;
  unitPrice: number;
  costPrice: number;
  lineTotal: number;
  locationId: string;
  locationName: string;
  imageUrl?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateQty: (id: string, delta: number) => void;
  updatePrice: (id: string, newPrice: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
}
```

### LocationSelectDialog

A modal dialog for selecting which location to deduct stock from when adding items with multiple locations.

```typescript
interface LocationSelectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    name: string;
    sku: string;
    unitPrice: number;
    costPrice: number;
    imageUrl?: string;
  };
  locations: Array<{
    locationId: string;
    locationName: string;
    availableQuantity: number;
  }>;
  onSelect: (locationId: string, locationName: string) => void;
}
```

### StockByLocation Component

A component that displays stock breakdown by location for an item.

```typescript
interface StockByLocationProps {
  stocks: Array<{
    locationId: string;
    locationName: string;
    quantity: number;
  }>;
  compact?: boolean;
}
```

### CartIndicator Component

A floating indicator showing cart item count with navigation to POS.

```typescript
interface CartIndicatorProps {
  count: number;
  onClick: () => void;
}
```

## Data Models

### Enhanced Item Response

The items API will be enhanced to include location-level stock breakdown:

```typescript
interface ItemWithStockBreakdown {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  unitPrice: string;
  costPrice: string;
  category: string | null;
  brand: string | null;
  isActive: boolean;
  image: { path: string } | null;
  stocks: Array<{
    locationId: string;
    locationName: string;
    locationType: string;
    quantity: number;
    reservedQuantity: number;
    availableQuantity: number;
  }>;
  totalStock: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Location stock display completeness
*For any* item with stock in N locations (where N > 0), the inventory view should display exactly N location entries, each showing the correct location name and available quantity.
**Validates: Requirements 1.1, 1.2, 1.4**

### Property 2: Zero stock indicator consistency
*For any* item where the sum of all location stocks equals zero, the inventory view should display an "Out of Stock" indicator and the "Add to Cart" button should be disabled.
**Validates: Requirements 1.3, 2.5**

### Property 3: Add to cart single location behavior
*For any* item with stock in exactly one location, clicking "Add to Cart" should immediately add the item to the cart with that location selected, without showing a location selection dialog.
**Validates: Requirements 2.2**

### Property 4: Add to cart multi-location dialog
*For any* item with stock in more than one location, clicking "Add to Cart" should display a location selection dialog showing all locations with positive stock.
**Validates: Requirements 2.3, 3.1**

### Property 5: Location dialog sorting
*For any* location selection dialog, the locations should be sorted by available stock quantity in descending order.
**Validates: Requirements 3.3**

### Property 6: Cart persistence across navigation
*For any* cart state with N items, navigating from inventory to POS page should preserve all N items with their quantities and selected locations.
**Validates: Requirements 4.1, 4.2**

### Property 7: Cart indicator accuracy
*For any* cart state, the cart indicator should display the exact sum of all item quantities in the cart.
**Validates: Requirements 4.3**

## Error Handling

| Error Scenario | Handling Strategy |
|----------------|-------------------|
| Failed to fetch item stocks | Display error toast, show cached data if available |
| Location has insufficient stock | Disable location option, show available quantity |
| Cart context not available | Fallback to local state, warn in console |
| Failed to add to cart | Display error toast with retry option |

## Testing Strategy

### Unit Tests
- CartContext: Test add, update, remove, clear operations
- StockByLocation: Test rendering with various stock configurations
- LocationSelectDialog: Test sorting, disabled states, selection

### Property-Based Tests
Using fast-check library for property-based testing:

- **Property 1**: Generate random items with 1-5 locations and random stock quantities, verify all locations are displayed
- **Property 2**: Generate items with zero total stock, verify indicator and button state
- **Property 3**: Generate single-location items, verify direct add behavior
- **Property 4**: Generate multi-location items, verify dialog display
- **Property 5**: Generate random stock quantities, verify descending sort order
- **Property 6**: Generate random cart states, simulate navigation, verify persistence
- **Property 7**: Generate random cart items with quantities, verify indicator sum

Each property-based test will run a minimum of 100 iterations to ensure comprehensive coverage.

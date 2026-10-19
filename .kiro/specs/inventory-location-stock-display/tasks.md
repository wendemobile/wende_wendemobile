# Implementation Plan

- [x] 1. Create CartContext for global cart state management




  - [ ] 1.1 Create CartContext with types and provider
    - Create `src/contexts/cart-context.tsx` with CartItem interface and CartContextType
    - Implement addToCart, updateQty, updatePrice, removeFromCart, clearCart functions
    - Use localStorage for persistence across page refreshes
    - _Requirements: 4.1, 4.2_
  - [x]* 1.2 Write property test for cart operations


    - **Property 6: Cart persistence across navigation**




    - **Validates: Requirements 4.1, 4.2**
  - [ ] 1.3 Wrap application with CartProvider
    - Update `src/app/(dashboard)/layout.tsx` to include CartProvider
    - _Requirements: 4.1_





- [ ] 2. Enhance Items API to include location stock breakdown
  - [ ] 2.1 Update items API response to include stock by location
    - Modify `src/app/api/items/route.ts` to include stocks with location details
    - Include locationId, locationName, locationType, quantity, availableQuantity
    - _Requirements: 1.1, 1.4_
  - [x]* 2.2 Write property test for stock breakdown response




    - **Property 1: Location stock display completeness**
    - **Validates: Requirements 1.1, 1.2, 1.4**

- [ ] 3. Create StockByLocation component
  - [ ] 3.1 Implement StockByLocation component
    - Create `src/components/inventory/stock-by-location.tsx`
    - Display location name and quantity for each location with stock > 0




    - Support compact mode for list view
    - _Requirements: 1.1, 1.2, 1.4_
  - [ ]* 3.2 Write property test for stock display
    - **Property 2: Zero stock indicator consistency**
    - **Validates: Requirements 1.3, 2.5**





- [ ] 4. Create LocationSelectDialog component
  - [x] 4.1 Implement LocationSelectDialog component

    - Create `src/components/inventory/location-select-dialog.tsx`
    - Display locations sorted by stock quantity descending
    - Disable locations with zero stock
    - _Requirements: 2.3, 3.1, 3.2, 3.3_
  - [ ]* 4.2 Write property test for location dialog
    - **Property 4: Add to cart multi-location dialog**

    - **Property 5: Location dialog sorting**
    - **Validates: Requirements 2.3, 3.1, 3.3**





- [ ] 5. Create CartIndicator component
  - [x] 5.1 Implement CartIndicator component



    - Create `src/components/inventory/cart-indicator.tsx`
    - Display item count badge
    - Navigate to POS page on click
    - _Requirements: 4.3_
  - [ ]* 5.2 Write property test for cart indicator
    - **Property 7: Cart indicator accuracy**
    - **Validates: Requirements 4.3**

- [ ] 6. Update Inventory Page with new features
  - [ ] 6.1 Add stock by location display to ItemCard and ItemRow
    - Update `src/app/(dashboard)/inventory/page.tsx`
    - Replace total stock badge with StockByLocation component
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [ ] 6.2 Add "Add to Cart" button to inventory items
    - Add ShoppingCart button to ItemCard and ItemRow actions
    - Implement add to cart logic with location selection
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [ ]* 6.3 Write property test for add to cart behavior
    - **Property 3: Add to cart single location behavior**
    - **Validates: Requirements 2.2**
  - [ ] 6.4 Add CartIndicator to inventory page
    - Show floating cart indicator when cart has items
    - _Requirements: 4.3_

- [ ] 7. Update POS Page to use CartContext
  - [ ] 7.1 Refactor POS page to use CartContext
    - Update `src/app/(dashboard)/pos/page.tsx`
    - Replace local cart state with CartContext
    - Ensure cart items from inventory are displayed
    - _Requirements: 4.2_

- [ ] 8. Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.

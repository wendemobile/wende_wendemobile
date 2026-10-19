# Design Document: Defect Workflow Enhancement

## Overview

This feature enhances the defect management system to support a complete workflow for tracking defective items through vendor repair processes. The enhancement adds proper workflow action buttons that transition defects through stages: NEW → DIAGNOSED → WITH_VENDOR → READY_FOR_CUSTOMER → COMPLETED.

## Architecture

The implementation follows the existing Next.js App Router architecture with:
- **API Routes**: RESTful endpoints for defect status transitions and vendor move operations
- **React Components**: UI components for the defect detail page with workflow actions
- **Prisma ORM**: Database operations using existing Defect and DefectVendorMove models

```
┌─────────────────────────────────────────────────────────────────┐
│                    Defect Detail Page                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ Defect Info │  │ Customer    │  │ Vendor Move History     │ │
│  │ Card        │  │ Card        │  │ Card                    │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  Workflow Actions Card                      ││
│  │  [Start Working] [Send to Vendor] [Receive] [Transfer]      ││
│  │  (Only relevant button shown based on status)               ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### API Endpoints

#### PATCH /api/defects/[id]
Enhanced to support workflow transitions:
```typescript
interface UpdateDefectRequest {
  status?: 'NEW' | 'DIAGNOSED' | 'WITH_VENDOR' | 'READY_FOR_CUSTOMER' | 'COMPLETED';
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}
```

#### POST /api/defects/[id]/vendor-moves
Create a new vendor move (send to vendor):
```typescript
interface CreateVendorMoveRequest {
  vendorId: string;
  notes?: string;
}
```

#### PATCH /api/defects/[id]/vendor-moves/[moveId]
Update vendor move (receive from vendor):
```typescript
interface UpdateVendorMoveRequest {
  receivedAt?: Date;
  notes?: string;
}
```

### UI Components

#### WorkflowActions Component
Displays the appropriate action button based on current defect status:
- NEW: "Start Working" button
- DIAGNOSED: "Send to Vendor" button (opens vendor selection modal)
- WITH_VENDOR: "Receive from Vendor" button
- READY_FOR_CUSTOMER: "Transfer to Customer" button
- COMPLETED: No action buttons

#### VendorSelectionModal Component
Modal for selecting a vendor when sending a defect for repair:
- Searchable vendor list
- Optional notes field
- Confirm/Cancel buttons

#### VendorMoveHistory Component
Displays the history of vendor moves for a defect:
- Vendor name
- Sent date
- Received date (or "Currently with vendor" indicator)
- Notes

## Data Models

### Existing Models (No Changes Required)

The existing Prisma schema already supports the workflow:

```prisma
model Defect {
  id           String    @id @default(uuid())
  defectNumber String    @unique
  status       String    @default("NEW")  // NEW, DIAGNOSED, WITH_VENDOR, READY_FOR_CUSTOMER, COMPLETED
  completedAt  DateTime?
  // ... other fields
  vendorMoves  DefectVendorMove[]
}

model DefectVendorMove {
  id         String    @id @default(uuid())
  defectId   String
  vendorId   String
  sentAt     DateTime
  receivedAt DateTime?
  notes      String?
  
  defect     Defect    @relation(...)
  vendor     Vendor    @relation(...)
}
```

### Status Flow State Machine

```
┌─────┐  Start Working  ┌───────────┐  Send to Vendor  ┌─────────────┐
│ NEW │ ───────────────► │ DIAGNOSED │ ────────────────► │ WITH_VENDOR │
└─────┘                  └───────────┘                   └──────┬──────┘
                                                                │
                                                    Receive from Vendor
                                                                │
┌───────────┐  Transfer to Customer  ┌────────────────────┐    │
│ COMPLETED │ ◄───────────────────── │ READY_FOR_CUSTOMER │ ◄──┘
└───────────┘                        └────────────────────┘
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Status transition from NEW to DIAGNOSED
*For any* defect with status NEW, when the "Start Working" action is invoked, the defect status should become DIAGNOSED and the updatedAt timestamp should be updated.
**Validates: Requirements 1.1, 1.2**

### Property 2: Vendor move creation updates status
*For any* defect with status DIAGNOSED, when a vendor move is created with a valid vendorId, the defect status should become WITH_VENDOR and the vendor move should have a sentAt timestamp.
**Validates: Requirements 2.2, 2.3**

### Property 3: Receive from vendor updates status and vendor move
*For any* defect with status WITH_VENDOR and an active vendor move (no receivedAt), when the receive action is invoked, the vendor move receivedAt should be set and the defect status should become READY_FOR_CUSTOMER.
**Validates: Requirements 4.1, 4.2**

### Property 4: Transfer to customer completes defect
*For any* defect with status READY_FOR_CUSTOMER, when the transfer to customer action is invoked, the defect status should become COMPLETED and the completedAt timestamp should be set.
**Validates: Requirements 5.1, 5.2**

### Property 5: Action button visibility matches status
*For any* defect status, the visible action buttons should match exactly:
- NEW: only "Start Working"
- DIAGNOSED: only "Send to Vendor"
- WITH_VENDOR: only "Receive from Vendor"
- READY_FOR_CUSTOMER: only "Transfer to Customer"
- COMPLETED: no action buttons
**Validates: Requirements 1.3, 2.4, 4.4, 5.3, 7.1-7.6**

### Property 6: Vendor moves returned in chronological order
*For any* defect with multiple vendor moves, the API should return vendor moves sorted by sentAt in ascending order.
**Validates: Requirements 6.1**

## Error Handling

### Invalid Status Transitions
- Return 400 Bad Request if attempting an invalid status transition (e.g., NEW → COMPLETED directly)
- Error message: "Invalid status transition from {current} to {target}"

### Missing Vendor
- Return 400 Bad Request if vendorId is not provided when sending to vendor
- Return 404 Not Found if vendorId does not exist

### No Active Vendor Move
- Return 400 Bad Request if attempting to receive from vendor when no active vendor move exists

### Defect Not Found
- Return 404 Not Found if defect ID does not exist

## Testing Strategy

### Property-Based Testing
Using **fast-check** library for property-based testing in TypeScript/JavaScript.

Each property-based test will:
- Generate random valid inputs
- Execute the workflow action
- Verify the expected state changes
- Run minimum 100 iterations

Test annotations will follow the format:
`**Feature: defect-workflow-enhancement, Property {number}: {property_text}**`

### Unit Tests
- Test individual API route handlers
- Test status transition validation logic
- Test button visibility helper function

### Integration Tests
- Test complete workflow from NEW to COMPLETED
- Test vendor move creation and update flow
- Test error cases for invalid transitions

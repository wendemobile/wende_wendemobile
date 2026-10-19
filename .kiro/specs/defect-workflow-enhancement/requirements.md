# Requirements Document

## Introduction

This feature enhances the defect management workflow to support a complete lifecycle for tracking defective items through vendor repair processes. The current system has basic status tracking (NEW, DIAGNOSED, WITH_VENDOR, READY_FOR_CUSTOMER, COMPLETED), but lacks the action buttons and workflow transitions needed to move defects through each stage. This enhancement adds proper workflow actions: Start Working, Send to Vendor, Check at Vendor, Receive from Vendor, Transfer to Customer, and Finish.

## Glossary

- **Defect**: A record tracking a defective item brought in by a customer for repair or diagnosis
- **Defect_Management_System**: The system component responsible for tracking defective items through their repair lifecycle
- **Vendor**: An external repair service provider who receives defective items for repair
- **Vendor_Move**: A record tracking when a defect is sent to and received from a vendor
- **Workflow_Status**: The current stage of a defect in the repair process (NEW, DIAGNOSED, WITH_VENDOR, READY_FOR_CUSTOMER, COMPLETED)

## Requirements

### Requirement 1

**User Story:** As a store staff member, I want to start working on a new defect, so that I can diagnose the issue and determine next steps.

#### Acceptance Criteria

1. WHEN a defect has status NEW and the user clicks "Start Working" THEN the Defect_Management_System SHALL update the defect status to DIAGNOSED
2. WHEN the status changes to DIAGNOSED THEN the Defect_Management_System SHALL record the timestamp of the status change
3. WHEN a defect status is not NEW THEN the Defect_Management_System SHALL hide the "Start Working" button

### Requirement 2

**User Story:** As a store staff member, I want to send a defective item to a vendor for repair, so that the item can be professionally repaired.

#### Acceptance Criteria

1. WHEN a defect has status DIAGNOSED and the user clicks "Send to Vendor" THEN the Defect_Management_System SHALL display a vendor selection modal
2. WHEN the user selects a vendor and confirms THEN the Defect_Management_System SHALL create a new Vendor_Move record with the current timestamp as sentAt
3. WHEN a Vendor_Move is created THEN the Defect_Management_System SHALL update the defect status to WITH_VENDOR
4. WHEN a defect status is not DIAGNOSED THEN the Defect_Management_System SHALL hide the "Send to Vendor" button

### Requirement 3

**User Story:** As a store staff member, I want to track when a vendor is checking the item, so that I know the repair is in progress.

#### Acceptance Criteria

1. WHEN a defect has status WITH_VENDOR THEN the Defect_Management_System SHALL display the vendor name and sent date
2. WHEN viewing a defect WITH_VENDOR THEN the Defect_Management_System SHALL show the current vendor move details including vendor name and notes

### Requirement 4

**User Story:** As a store staff member, I want to record when I receive an item back from the vendor, so that I can prepare it for customer pickup.

#### Acceptance Criteria

1. WHEN a defect has status WITH_VENDOR and the user clicks "Receive from Vendor" THEN the Defect_Management_System SHALL update the Vendor_Move receivedAt timestamp
2. WHEN the item is received from vendor THEN the Defect_Management_System SHALL update the defect status to READY_FOR_CUSTOMER
3. WHEN receiving from vendor THEN the Defect_Management_System SHALL allow the user to add optional notes about the repair
4. WHEN a defect status is not WITH_VENDOR THEN the Defect_Management_System SHALL hide the "Receive from Vendor" button

### Requirement 5

**User Story:** As a store staff member, I want to record when I transfer the repaired item to the customer, so that I can complete the defect workflow.

#### Acceptance Criteria

1. WHEN a defect has status READY_FOR_CUSTOMER and the user clicks "Transfer to Customer" THEN the Defect_Management_System SHALL update the defect status to COMPLETED
2. WHEN the status changes to COMPLETED THEN the Defect_Management_System SHALL record the completedAt timestamp
3. WHEN a defect status is not READY_FOR_CUSTOMER THEN the Defect_Management_System SHALL hide the "Transfer to Customer" button

### Requirement 6

**User Story:** As a store staff member, I want to see the complete history of a defect's vendor moves, so that I can track the repair journey.

#### Acceptance Criteria

1. WHEN viewing a defect detail page THEN the Defect_Management_System SHALL display all vendor moves in chronological order
2. WHEN displaying vendor moves THEN the Defect_Management_System SHALL show vendor name, sent date, received date, and notes for each move
3. WHEN a vendor move has no received date THEN the Defect_Management_System SHALL indicate the item is currently with that vendor

### Requirement 7

**User Story:** As a store staff member, I want clear visual indicators of the current workflow stage, so that I can quickly understand what action is needed.

#### Acceptance Criteria

1. WHEN viewing the defect detail page THEN the Defect_Management_System SHALL display only the action buttons relevant to the current status
2. WHEN a defect is NEW THEN the Defect_Management_System SHALL show "Start Working" button
3. WHEN a defect is DIAGNOSED THEN the Defect_Management_System SHALL show "Send to Vendor" button
4. WHEN a defect is WITH_VENDOR THEN the Defect_Management_System SHALL show "Receive from Vendor" button
5. WHEN a defect is READY_FOR_CUSTOMER THEN the Defect_Management_System SHALL show "Transfer to Customer" (Finish) button
6. WHEN a defect is COMPLETED THEN the Defect_Management_System SHALL hide all workflow action buttons

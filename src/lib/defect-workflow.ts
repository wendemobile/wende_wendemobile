// Defect workflow status types
export type DefectStatus = 'NEW' | 'DIAGNOSED' | 'WITH_VENDOR' | 'READY_FOR_CUSTOMER' | 'COMPLETED';

// Workflow action types
export type WorkflowActionType = 'START_WORKING' | 'SEND_TO_VENDOR' | 'RECEIVE_FROM_VENDOR' | 'TRANSFER_TO_CUSTOMER';

export interface WorkflowAction {
  type: WorkflowActionType;
  label: string;
  variant: 'default' | 'primary' | 'success' | 'warning';
  targetStatus?: DefectStatus;
}

/**
 * Get available workflow actions based on current defect status
 * Returns an array of actions that can be performed on the defect
 */
export function getWorkflowActions(status: DefectStatus): WorkflowAction[] {
  switch (status) {
    case 'NEW':
      return [{
        type: 'START_WORKING',
        label: 'Start Working',
        variant: 'primary',
        targetStatus: 'DIAGNOSED',
      }];
    
    case 'DIAGNOSED':
      return [{
        type: 'SEND_TO_VENDOR',
        label: 'Send to Vendor',
        variant: 'warning',
        // Status is set via vendor-moves endpoint
      }];
    
    case 'WITH_VENDOR':
      return [{
        type: 'RECEIVE_FROM_VENDOR',
        label: 'Receive from Vendor',
        variant: 'primary',
        // Status is set via vendor-moves endpoint
      }];
    
    case 'READY_FOR_CUSTOMER':
      return [{
        type: 'TRANSFER_TO_CUSTOMER',
        label: 'Transfer to Customer',
        variant: 'success',
        targetStatus: 'COMPLETED',
      }];
    
    case 'COMPLETED':
      return [];
    
    default:
      return [];
  }
}

/**
 * Get status badge styling based on defect status
 */
export function getStatusBadgeStyle(status: DefectStatus): string {
  const styles: Record<DefectStatus, string> = {
    NEW: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    DIAGNOSED: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    WITH_VENDOR: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    READY_FOR_CUSTOMER: 'bg-green-500/20 text-green-400 border border-green-500/30',
    COMPLETED: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  };
  return styles[status] || 'bg-gray-500/20 text-gray-400';
}

/**
 * Format status for display (replace underscores with spaces)
 */
export function formatStatus(status: string): string {
  return status.replace(/_/g, ' ');
}

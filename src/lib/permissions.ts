// Client-safe permissions module - NO server-side imports
// This file can be safely imported in client components

// Permission definitions
export const PERMISSIONS = {
  // User management
  'users:read': ['ADMIN'],
  'users:write': ['ADMIN'],
  'users:delete': ['ADMIN'],

  // Sales
  'sales:read': ['ADMIN', 'CASHIER', 'SALESMAN'],
  'sales:write': ['ADMIN', 'CASHIER', 'SALESMAN'],
  'sales:delete': ['ADMIN'],

  // Inventory
  'items:read': ['ADMIN', 'CASHIER', 'BASEMENT_MANAGER', 'SALESMAN'],
  'items:write': ['ADMIN', 'BASEMENT_MANAGER'],
  'items:delete': ['ADMIN'],

  // Stock
  'stock:read': ['ADMIN', 'CASHIER', 'BASEMENT_MANAGER', 'SALESMAN'],
  'stock:write': ['ADMIN', 'BASEMENT_MANAGER'],
  'stock:adjust': ['ADMIN', 'BASEMENT_MANAGER'],

  // Transfers
  'transfers:read': ['ADMIN', 'BASEMENT_MANAGER', 'SALESMAN', 'CASHIER'],
  'transfers:write': ['ADMIN', 'BASEMENT_MANAGER'],
  'transfers:receive': ['ADMIN', 'BASEMENT_MANAGER', 'SALESMAN', 'CASHIER'],

  // Customers
  'customers:read': ['ADMIN', 'CASHIER', 'SALESMAN'],
  'customers:write': ['ADMIN', 'CASHIER', 'SALESMAN'],

  // Credits
  'credits:read': ['ADMIN', 'CASHIER'],
  'credits:write': ['ADMIN', 'CASHIER'],

  // Expenses
  'expenses:read': ['ADMIN', 'CASHIER'],
  'expenses:write': ['ADMIN', 'CASHIER'],

  // Reports
  'reports:view': ['ADMIN', 'CASHIER', 'BASEMENT_MANAGER', 'SALESMAN'],
  'reports:sales': ['ADMIN', 'SALESMAN'],
  'reports:inventory': ['ADMIN', 'BASEMENT_MANAGER'],
  'reports:financial': ['ADMIN', 'CASHIER'],
  'reports:export': ['ADMIN'],

  // Sessions
  'sessions:read': ['ADMIN', 'CASHIER'],
  'sessions:write': ['ADMIN', 'CASHIER'],

  // Bank accounts
  'bank-accounts:read': ['ADMIN'],
  'bank-accounts:write': ['ADMIN'],

  // Finance / Money Management
  'finance:read': ['ADMIN', 'CASHIER'],
  'finance:write': ['ADMIN', 'CASHIER'],
  'finance:profit': ['ADMIN'],

  // Defects
  'defects:read': ['ADMIN', 'CASHIER', 'BASEMENT_MANAGER'],
  'defects:write': ['ADMIN', 'CASHIER'],

  // Vendors
  'vendors:read': ['ADMIN', 'BASEMENT_MANAGER'],
  'vendors:write': ['ADMIN'],

  // Locations
  'locations:read': ['ADMIN', 'BASEMENT_MANAGER'],
  'locations:write': ['ADMIN'],
  'locations:delete': ['ADMIN'],

  // Audit logs
  'audit:read': ['ADMIN'],

  // Settings
  'settings:read': ['ADMIN'],
  'settings:write': ['ADMIN'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a role has a specific permission
 * This function is safe to use in client components
 */
export function hasPermission(role: string, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles?.includes(role as any) ?? false;
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: string, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

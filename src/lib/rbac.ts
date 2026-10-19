// Server-only RBAC module - contains auth-related functions
// For client components, use '@/lib/permissions' instead

import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { 
  PERMISSIONS, 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  type Permission 
} from '@/lib/permissions';

// Re-export client-safe functions from permissions module
export { PERMISSIONS, hasPermission, hasAnyPermission, hasAllPermissions };
export type { Permission };

// Authenticated request type with user info
export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    username: string;
    email: string;
    name: string;
    role: string;
    roleId: string;
    defaultLocationId: string | null;
  };
}

/**
 * API route protection wrapper
 */
export function withAuth(
  handler: (req: AuthenticatedRequest, context: any) => Promise<Response>,
  requiredPermission?: Permission
) {
  return async (req: NextRequest, context: any) => {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_001',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        { status: 401 }
      );
    }

    if (requiredPermission && !hasPermission(session.user.role, requiredPermission)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTHZ_001',
            message: 'Permission denied',
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        { status: 403 }
      );
    }

    // Attach user to request
    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.user = session.user;

    return handler(authenticatedReq, context);
  };
}

/**
 * Get current user session
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

/**
 * Require permission - throws if not authorized
 */
export async function requirePermission(permission: Permission) {
  const user = await requireAuth();
  if (!hasPermission(user.role, permission)) {
    throw new Error('Permission denied');
  }
  return user;
}

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Role-based route protection
    const roleRoutes: Record<string, string[]> = {
      '/settings': ['ADMIN'],
      '/reports': ['ADMIN', 'CASHIER', 'BASEMENT_MANAGER', 'SALESMAN'],
      '/users': ['ADMIN'],
      '/bank-accounts': ['ADMIN'],
      '/audit': ['ADMIN'],
      '/transfers': ['ADMIN', 'BASEMENT_MANAGER', 'SALESMAN'],
      '/vendors': ['ADMIN', 'BASEMENT_MANAGER'],
    };

    for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
      if (path.startsWith(route) && token && !allowedRoles.includes(token.role as string)) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Allow public paths without authentication
        if (path.startsWith('/login') || path.startsWith('/api/auth')) {
          return true;
        }

        // All other paths require authentication
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/auth (NextAuth routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)',
  ],
};

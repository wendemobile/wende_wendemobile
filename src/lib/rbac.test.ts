import { describe, it, expect } from 'vitest';
import { hasPermission, PERMISSIONS } from './rbac';

describe('RBAC Logic', () => {
    // 1. ADMIN - Should have access to everything
    describe('ADMIN Role', () => {
        const role = 'ADMIN';

        it('should have full access to sensitive areas', () => {
            expect(hasPermission(role, 'users:read')).toBe(true);
            expect(hasPermission(role, 'finance:profit')).toBe(true);
            expect(hasPermission(role, 'settings:write')).toBe(true);
            expect(hasPermission(role, 'items:delete')).toBe(true);
        });
    });

    // 2. CASHIER - Should have restricted access
    describe('CASHIER Role', () => {
        const role = 'CASHIER';

        it('should allow sales and basic read access', () => {
            expect(hasPermission(role, 'sales:write')).toBe(true);
            expect(hasPermission(role, 'items:read')).toBe(true);
            expect(hasPermission(role, 'customers:write')).toBe(true);
        });

        it('should DENY sensitive/admin access', () => {
            expect(hasPermission(role, 'finance:profit')).toBe(false); // No profit
            expect(hasPermission(role, 'items:delete')).toBe(false); // No delete items
            expect(hasPermission(role, 'settings:write')).toBe(false); // No settings
            expect(hasPermission(role, 'transfers:write')).toBe(false); // No transfers
        });

        it('should allow report reconciliation', () => {
            expect(hasPermission(role, 'reports:financial')).toBe(true);
        });
    });

    // 3. SALESMAN - Should be sales focused
    describe('SALESMAN Role', () => {
        const role = 'SALESMAN';

        it('should allow sales and reading inventory', () => {
            expect(hasPermission(role, 'sales:write')).toBe(true);
            expect(hasPermission(role, 'items:read')).toBe(true);
        });

        it('should DENY money/finance views', () => {
            expect(hasPermission(role, 'finance:read')).toBe(false); // No money management
            expect(hasPermission(role, 'finance:profit')).toBe(false);
            expect(hasPermission(role, 'reports:financial')).toBe(false);
        });

        it('should DENY inventory modification', () => {
            expect(hasPermission(role, 'items:write')).toBe(false);
        });
    });

    // 4. BASEMENT_MANAGER - Should be inventory focused
    describe('BASEMENT_MANAGER Role', () => {
        const role = 'BASEMENT_MANAGER';

        it('should allow inventory modification', () => {
            expect(hasPermission(role, 'items:write')).toBe(true);
            expect(hasPermission(role, 'stock:adjust')).toBe(true);
            expect(hasPermission(role, 'transfers:write')).toBe(true);
        });

        it('should DENY sales', () => {
            expect(hasPermission(role, 'sales:write')).toBe(false);
        });

        it('should allow inventory reports but not financial', () => {
            expect(hasPermission(role, 'reports:inventory')).toBe(true);
            expect(hasPermission(role, 'reports:sales')).toBe(false);
        });
    });
});

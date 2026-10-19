-- Migrate data from tom_backup to pos_db
-- Only migrate tables that exist in both schemas

-- 1. Roles
INSERT INTO "Role" (id, name, description, permissions, "createdAt", "updatedAt")
SELECT id, name, description, COALESCE(permissions::jsonb, '[]'::jsonb), created_at, COALESCE(updated_at, created_at)
FROM dblink('dbname=tom_backup user=pos_user', 'SELECT id, name, description, permissions, created_at, updated_at FROM roles')
AS t(id text, name text, description text, permissions text, created_at timestamp, updated_at timestamp)
ON CONFLICT (id) DO NOTHING;

-- 2. Locations
INSERT INTO "Location" (id, name, type, description, "isActive", "createdAt", "updatedAt")
SELECT id, name, type, description, is_active, created_at, COALESCE(updated_at, created_at)
FROM dblink('dbname=tom_backup user=pos_user', 'SELECT id, name, type, description, is_active, created_at, updated_at FROM locations')
AS t(id text, name text, type text, description text, is_active boolean, created_at timestamp, updated_at timestamp)
ON CONFLICT (id) DO NOTHING;

-- 3. Users
INSERT INTO "User" (id, username, email, "passwordHash", "fullName", "roleId", "defaultLocationId", "isActive", "lastLoginAt", "createdAt", "updatedAt")
SELECT id, username, email, password_hash, full_name, role_id, default_location_id, is_active, last_login_at, created_at, COALESCE(updated_at, created_at)
FROM dblink('dbname=tom_backup user=pos_user', 'SELECT id, username, email, password_hash, full_name, role_id, default_location_id, is_active, last_login_at, created_at, updated_at FROM users')
AS t(id text, username text, email text, password_hash text, full_name text, role_id text, default_location_id text, is_active boolean, last_login_at timestamp, created_at timestamp, updated_at timestamp)
ON CONFLICT (id) DO NOTHING;

-- 4. Vendors
INSERT INTO "Vendor" (id, name, "contactPerson", phone, email, address, balance, "isActive", "createdAt", "updatedAt")
SELECT id, name, contact_person, phone, email, address, 0, is_active, created_at, COALESCE(updated_at, created_at)
FROM dblink('dbname=tom_backup user=pos_user', 'SELECT id, name, contact_person, phone, email, address, is_active, created_at, updated_at FROM vendors')
AS t(id text, name text, contact_person text, phone text, email text, address text, is_active boolean, created_at timestamp, updated_at timestamp)
ON CONFLICT (id) DO NOTHING;

-- 5. Items
INSERT INTO "Item" (id, sku, name, brand, "itemType", "unitOfMeasure", "unitPrice", "costPrice", category, subcategory, barcode, "barcodeGenerated", "minStock", specifications, "isActive", "supplierId", "createdAt", "updatedAt")
SELECT id, sku, name, brand, item_type, COALESCE(unit_of_measure, 'PIECE'), unit_price, cost_price, category, subcategory, barcode, COALESCE(barcode_generated, false), COALESCE(min_stock, 0), specifications::jsonb, is_active, vendor_id, created_at, COALESCE(updated_at, created_at)
FROM dblink('dbname=tom_backup user=pos_user', 'SELECT id, sku, name, brand, item_type, unit_of_measure, unit_price, cost_price, category, subcategory, barcode, barcode_generated, min_stock, specifications, is_active, vendor_id, created_at, updated_at FROM items')
AS t(id text, sku text, name text, brand text, item_type text, unit_of_measure text, unit_price numeric, cost_price numeric, category text, subcategory text, barcode text, barcode_generated boolean, min_stock numeric, specifications text, is_active boolean, vendor_id text, created_at timestamp, updated_at timestamp)
ON CONFLICT (id) DO NOTHING;

-- 6. Stocks
INSERT INTO "Stock" (id, "itemId", "locationId", qty, "reservedQty", version, "createdAt", "updatedAt")
SELECT id, item_id, location_id, qty, COALESCE(reserved_qty, 0), COALESCE(version, 0), created_at, COALESCE(updated_at, created_at)
FROM dblink('dbname=tom_backup user=pos_user', 'SELECT id, item_id, location_id, qty, reserved_qty, version, created_at, updated_at FROM stocks')
AS t(id text, item_id text, location_id text, qty numeric, reserved_qty numeric, version int, created_at timestamp, updated_at timestamp)
ON CONFLICT (id) DO NOTHING;

-- 7. Customers
INSERT INTO "Customer" (id, name, phone, email, "idNumber", address, "creditLimit", "isActive", "createdAt", "updatedAt")
SELECT id, name, phone, email, id_number, address, COALESCE(credit_limit, 0), is_active, created_at, COALESCE(updated_at, created_at)
FROM dblink('dbname=tom_backup user=pos_user', 'SELECT id, name, phone, email, id_number, address, credit_limit, is_active, created_at, updated_at FROM customers')
AS t(id text, name text, phone text, email text, id_number text, address text, credit_limit numeric, is_active boolean, created_at timestamp, updated_at timestamp)
ON CONFLICT (id) DO NOTHING;

-- 8. Bank Accounts
INSERT INTO "BankAccount" (id, "holderName", "bankName", "accountNumber", "initialBalance", "currentBalance", "isActive", "createdAt", "updatedAt")
SELECT id, holder_name, bank_name, account_number, COALESCE(initial_balance, 0), COALESCE(current_balance, 0), is_active, created_at, COALESCE(updated_at, created_at)
FROM dblink('dbname=tom_backup user=pos_user', 'SELECT id, holder_name, bank_name, account_number, initial_balance, current_balance, is_active, created_at, updated_at FROM bank_accounts')
AS t(id text, holder_name text, bank_name text, account_number text, initial_balance numeric, current_balance numeric, is_active boolean, created_at timestamp, updated_at timestamp)
ON CONFLICT (id) DO NOTHING;

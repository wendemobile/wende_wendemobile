--
-- PostgreSQL database dump
--

\restrict Dic1fr5cXOl4aOzBMvUxJtXRhUQc2CaYSEwMvY21kIjwcY037h9cfT0WQ3oxeaY

-- Dumped from database version 15.16
-- Dumped by pg_dump version 15.16

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE ONLY public.users DROP CONSTRAINT users_role_id_fkey;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_default_location_id_fkey;
ALTER TABLE ONLY public.transfers DROP CONSTRAINT transfers_to_location_id_fkey;
ALTER TABLE ONLY public.transfers DROP CONSTRAINT transfers_received_by_id_fkey;
ALTER TABLE ONLY public.transfers DROP CONSTRAINT transfers_from_location_id_fkey;
ALTER TABLE ONLY public.transfers DROP CONSTRAINT transfers_created_by_id_fkey;
ALTER TABLE ONLY public.transfers DROP CONSTRAINT transfers_assigned_to_id_fkey;
ALTER TABLE ONLY public.transfer_items DROP CONSTRAINT transfer_items_transfer_id_fkey;
ALTER TABLE ONLY public.transfer_items DROP CONSTRAINT transfer_items_item_id_fkey;
ALTER TABLE ONLY public.supplier_payments DROP CONSTRAINT supplier_payments_vendor_id_fkey;
ALTER TABLE ONLY public.supplier_payments DROP CONSTRAINT supplier_payments_bank_account_id_fkey;
ALTER TABLE ONLY public.stocks DROP CONSTRAINT stocks_location_id_fkey;
ALTER TABLE ONLY public.stocks DROP CONSTRAINT stocks_item_id_fkey;
ALTER TABLE ONLY public.special_incomes DROP CONSTRAINT special_incomes_session_id_fkey;
ALTER TABLE ONLY public.special_incomes DROP CONSTRAINT special_incomes_recorded_by_fkey;
ALTER TABLE ONLY public.sales DROP CONSTRAINT sales_session_id_fkey;
ALTER TABLE ONLY public.sales DROP CONSTRAINT sales_salesman_id_fkey;
ALTER TABLE ONLY public.sales DROP CONSTRAINT sales_location_id_fkey;
ALTER TABLE ONLY public.sales DROP CONSTRAINT sales_customer_id_fkey;
ALTER TABLE ONLY public.sales DROP CONSTRAINT sales_cashier_id_fkey;
ALTER TABLE ONLY public.sales DROP CONSTRAINT sales_cancelled_by_id_fkey;
ALTER TABLE ONLY public.sale_items DROP CONSTRAINT sale_items_sale_id_fkey;
ALTER TABLE ONLY public.sale_items DROP CONSTRAINT sale_items_location_id_fkey;
ALTER TABLE ONLY public.sale_items DROP CONSTRAINT sale_items_item_id_fkey;
ALTER TABLE ONLY public.returns DROP CONSTRAINT returns_sale_id_fkey;
ALTER TABLE ONLY public.returns DROP CONSTRAINT returns_customer_id_fkey;
ALTER TABLE ONLY public.returns DROP CONSTRAINT returns_bank_account_id_fkey;
ALTER TABLE ONLY public.return_payments DROP CONSTRAINT return_payments_return_id_fkey;
ALTER TABLE ONLY public.return_payments DROP CONSTRAINT return_payments_bank_account_id_fkey;
ALTER TABLE ONLY public.return_items DROP CONSTRAINT return_items_return_id_fkey;
ALTER TABLE ONLY public.return_items DROP CONSTRAINT return_items_item_id_fkey;
ALTER TABLE ONLY public.payments DROP CONSTRAINT payments_sale_id_fkey;
ALTER TABLE ONLY public.payments DROP CONSTRAINT payments_bank_account_id_fkey;
ALTER TABLE ONLY public.layaways DROP CONSTRAINT layaways_customer_id_fkey;
ALTER TABLE ONLY public.layaway_payments DROP CONSTRAINT layaway_payments_layaway_id_fkey;
ALTER TABLE ONLY public.layaway_payments DROP CONSTRAINT layaway_payments_bank_account_id_fkey;
ALTER TABLE ONLY public.layaway_items DROP CONSTRAINT layaway_items_layaway_id_fkey;
ALTER TABLE ONLY public.layaway_items DROP CONSTRAINT layaway_items_item_id_fkey;
ALTER TABLE ONLY public.items DROP CONSTRAINT items_vendor_id_fkey;
ALTER TABLE ONLY public.item_images DROP CONSTRAINT item_images_item_id_fkey;
ALTER TABLE ONLY public.expenses DROP CONSTRAINT expenses_session_id_fkey;
ALTER TABLE ONLY public.expenses DROP CONSTRAINT expenses_created_by_id_fkey;
ALTER TABLE ONLY public.expenses DROP CONSTRAINT expenses_bank_account_id_fkey;
ALTER TABLE ONLY public.error_logs DROP CONSTRAINT error_logs_user_id_fkey;
ALTER TABLE ONLY public.error_logs DROP CONSTRAINT error_logs_resolved_by_id_fkey;
ALTER TABLE ONLY public.defects DROP CONSTRAINT defects_item_id_fkey;
ALTER TABLE ONLY public.defects DROP CONSTRAINT defects_customer_id_fkey;
ALTER TABLE ONLY public.defect_vendor_moves DROP CONSTRAINT defect_vendor_moves_vendor_id_fkey;
ALTER TABLE ONLY public.defect_vendor_moves DROP CONSTRAINT defect_vendor_moves_defect_id_fkey;
ALTER TABLE ONLY public.defect_photos DROP CONSTRAINT defect_photos_defect_id_fkey;
ALTER TABLE ONLY public.defect_notes DROP CONSTRAINT defect_notes_defect_id_fkey;
ALTER TABLE ONLY public.daily_sessions DROP CONSTRAINT daily_sessions_opened_by_id_fkey;
ALTER TABLE ONLY public.daily_sessions DROP CONSTRAINT daily_sessions_closed_by_id_fkey;
ALTER TABLE ONLY public.credits DROP CONSTRAINT credits_sale_id_fkey;
ALTER TABLE ONLY public.credits DROP CONSTRAINT credits_customer_id_fkey;
ALTER TABLE ONLY public.credit_payments DROP CONSTRAINT credit_payments_credit_id_fkey;
ALTER TABLE ONLY public.credit_payments DROP CONSTRAINT credit_payments_bank_account_id_fkey;
ALTER TABLE ONLY public.commissions DROP CONSTRAINT commissions_user_id_fkey;
ALTER TABLE ONLY public.commissions DROP CONSTRAINT commissions_sale_id_fkey;
ALTER TABLE ONLY public.cash_flow_entries DROP CONSTRAINT cash_flow_entries_user_id_fkey;
ALTER TABLE ONLY public.cash_flow_entries DROP CONSTRAINT cash_flow_entries_source_bank_id_fkey;
ALTER TABLE ONLY public.cash_flow_entries DROP CONSTRAINT cash_flow_entries_session_id_fkey;
ALTER TABLE ONLY public.cash_flow_entries DROP CONSTRAINT cash_flow_entries_dest_bank_id_fkey;
ALTER TABLE ONLY public.bank_account_transactions DROP CONSTRAINT bank_account_transactions_to_account_id_fkey;
ALTER TABLE ONLY public.bank_account_transactions DROP CONSTRAINT bank_account_transactions_from_account_id_fkey;
ALTER TABLE ONLY public.audit_logs DROP CONSTRAINT audit_logs_user_id_fkey;
DROP INDEX public.users_username_key;
DROP INDEX public.users_role_id_idx;
DROP INDEX public.users_email_key;
DROP INDEX public.users_default_location_id_idx;
DROP INDEX public.transfers_transfer_number_key;
DROP INDEX public.transfers_to_location_id_idx;
DROP INDEX public.transfers_status_idx;
DROP INDEX public.transfers_from_location_id_idx;
DROP INDEX public.transfers_created_by_id_idx;
DROP INDEX public.transfers_created_at_idx;
DROP INDEX public.supplier_payments_vendor_id_idx;
DROP INDEX public.supplier_payments_bank_account_id_idx;
DROP INDEX public.stocks_qty_idx;
DROP INDEX public.stocks_location_id_idx;
DROP INDEX public.stocks_item_id_location_id_key;
DROP INDEX public.stocks_item_id_idx;
DROP INDEX public.sales_status_idx;
DROP INDEX public.sales_status_created_at_idx;
DROP INDEX public.sales_session_id_idx;
DROP INDEX public.sales_salesman_id_idx;
DROP INDEX public.sales_sale_number_key;
DROP INDEX public.sales_receipt_number_key;
DROP INDEX public.sales_receipt_number_idx;
DROP INDEX public.sales_location_id_status_created_at_idx;
DROP INDEX public.sales_location_id_idx;
DROP INDEX public.sales_customer_id_idx;
DROP INDEX public.sales_created_at_idx;
DROP INDEX public.sales_cashier_id_idx;
DROP INDEX public.sale_items_sale_id_idx;
DROP INDEX public.sale_items_location_id_idx;
DROP INDEX public.sale_items_item_id_idx;
DROP INDEX public.roles_name_key;
DROP INDEX public.returns_sale_id_idx;
DROP INDEX public.returns_return_number_key;
DROP INDEX public.returns_customer_id_idx;
DROP INDEX public.return_payments_return_id_idx;
DROP INDEX public.return_payments_bank_account_id_idx;
DROP INDEX public.payments_sale_id_idx;
DROP INDEX public.payments_bank_account_id_idx;
DROP INDEX public.notifications_type_idx;
DROP INDEX public.notifications_is_read_idx;
DROP INDEX public.notifications_created_at_idx;
DROP INDEX public.locations_name_key;
DROP INDEX public.layaways_status_idx;
DROP INDEX public.layaways_layaway_number_key;
DROP INDEX public.layaways_customer_id_idx;
DROP INDEX public.items_vendor_id_idx;
DROP INDEX public.items_sku_key;
DROP INDEX public.items_sku_idx;
DROP INDEX public.items_name_idx;
DROP INDEX public.items_is_active_category_idx;
DROP INDEX public.items_is_active_brand_idx;
DROP INDEX public.items_category_idx;
DROP INDEX public.items_brand_idx;
DROP INDEX public.items_barcode_key;
DROP INDEX public.items_barcode_idx;
DROP INDEX public.item_images_item_id_key;
DROP INDEX public.expenses_session_id_idx;
DROP INDEX public.expenses_expense_date_idx;
DROP INDEX public.expenses_created_at_idx;
DROP INDEX public.expenses_category_idx;
DROP INDEX public.error_logs_severity_idx;
DROP INDEX public.error_logs_created_at_idx;
DROP INDEX public.defects_status_idx;
DROP INDEX public.defects_item_id_idx;
DROP INDEX public.defects_intake_date_idx;
DROP INDEX public.defects_defect_number_key;
DROP INDEX public.defects_customer_id_idx;
DROP INDEX public.daily_sessions_status_idx;
DROP INDEX public.daily_sessions_business_date_idx;
DROP INDEX public.customers_phone_idx;
DROP INDEX public.customers_name_idx;
DROP INDEX public.customers_id_number_idx;
DROP INDEX public.credits_status_idx;
DROP INDEX public.credits_due_date_idx;
DROP INDEX public.credits_customer_id_idx;
DROP INDEX public.commissions_user_id_idx;
DROP INDEX public.commissions_sale_id_idx;
DROP INDEX public.commissions_created_at_idx;
DROP INDEX public.bank_accounts_account_number_key;
DROP INDEX public.bank_account_transactions_created_at_idx;
DROP INDEX public.audit_logs_user_id_idx;
DROP INDEX public.audit_logs_entity_type_idx;
DROP INDEX public.audit_logs_entity_type_created_at_idx;
DROP INDEX public.audit_logs_created_at_idx;
ALTER TABLE ONLY public.vendors DROP CONSTRAINT vendors_pkey;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
ALTER TABLE ONLY public.transfers DROP CONSTRAINT transfers_pkey;
ALTER TABLE ONLY public.transfer_items DROP CONSTRAINT transfer_items_pkey;
ALTER TABLE ONLY public.supplier_payments DROP CONSTRAINT supplier_payments_pkey;
ALTER TABLE ONLY public.stocks DROP CONSTRAINT stocks_pkey;
ALTER TABLE ONLY public.special_incomes DROP CONSTRAINT special_incomes_pkey;
ALTER TABLE ONLY public.sales DROP CONSTRAINT sales_pkey;
ALTER TABLE ONLY public.sale_items DROP CONSTRAINT sale_items_pkey;
ALTER TABLE ONLY public.roles DROP CONSTRAINT roles_pkey;
ALTER TABLE ONLY public.returns DROP CONSTRAINT returns_pkey;
ALTER TABLE ONLY public.return_payments DROP CONSTRAINT return_payments_pkey;
ALTER TABLE ONLY public.return_items DROP CONSTRAINT return_items_pkey;
ALTER TABLE ONLY public.receipt_sequences DROP CONSTRAINT receipt_sequences_pkey;
ALTER TABLE ONLY public.payments DROP CONSTRAINT payments_pkey;
ALTER TABLE ONLY public.notifications DROP CONSTRAINT notifications_pkey;
ALTER TABLE ONLY public.locations DROP CONSTRAINT locations_pkey;
ALTER TABLE ONLY public.layaways DROP CONSTRAINT layaways_pkey;
ALTER TABLE ONLY public.layaway_payments DROP CONSTRAINT layaway_payments_pkey;
ALTER TABLE ONLY public.layaway_items DROP CONSTRAINT layaway_items_pkey;
ALTER TABLE ONLY public.items DROP CONSTRAINT items_pkey;
ALTER TABLE ONLY public.item_images DROP CONSTRAINT item_images_pkey;
ALTER TABLE ONLY public.expenses DROP CONSTRAINT expenses_pkey;
ALTER TABLE ONLY public.error_logs DROP CONSTRAINT error_logs_pkey;
ALTER TABLE ONLY public.defects DROP CONSTRAINT defects_pkey;
ALTER TABLE ONLY public.defect_vendor_moves DROP CONSTRAINT defect_vendor_moves_pkey;
ALTER TABLE ONLY public.defect_photos DROP CONSTRAINT defect_photos_pkey;
ALTER TABLE ONLY public.defect_notes DROP CONSTRAINT defect_notes_pkey;
ALTER TABLE ONLY public.daily_sessions DROP CONSTRAINT daily_sessions_pkey;
ALTER TABLE ONLY public.customers DROP CONSTRAINT customers_pkey;
ALTER TABLE ONLY public.credits DROP CONSTRAINT credits_pkey;
ALTER TABLE ONLY public.credit_payments DROP CONSTRAINT credit_payments_pkey;
ALTER TABLE ONLY public.commissions DROP CONSTRAINT commissions_pkey;
ALTER TABLE ONLY public.cash_flow_entries DROP CONSTRAINT cash_flow_entries_pkey;
ALTER TABLE ONLY public.bank_accounts DROP CONSTRAINT bank_accounts_pkey;
ALTER TABLE ONLY public.bank_account_transactions DROP CONSTRAINT bank_account_transactions_pkey;
ALTER TABLE ONLY public.audit_logs DROP CONSTRAINT audit_logs_pkey;
DROP TABLE public.vendors;
DROP TABLE public.users;
DROP TABLE public.transfers;
DROP TABLE public.transfer_items;
DROP TABLE public.supplier_payments;
DROP TABLE public.stocks;
DROP TABLE public.special_incomes;
DROP TABLE public.sales;
DROP TABLE public.sale_items;
DROP TABLE public.roles;
DROP TABLE public.returns;
DROP TABLE public.return_payments;
DROP TABLE public.return_items;
DROP TABLE public.receipt_sequences;
DROP TABLE public.payments;
DROP TABLE public.notifications;
DROP TABLE public.locations;
DROP TABLE public.layaways;
DROP TABLE public.layaway_payments;
DROP TABLE public.layaway_items;
DROP TABLE public.items;
DROP TABLE public.item_images;
DROP TABLE public.expenses;
DROP TABLE public.error_logs;
DROP TABLE public.defects;
DROP TABLE public.defect_vendor_moves;
DROP TABLE public.defect_photos;
DROP TABLE public.defect_notes;
DROP TABLE public.daily_sessions;
DROP TABLE public.customers;
DROP TABLE public.credits;
DROP TABLE public.credit_payments;
DROP TABLE public.commissions;
DROP TABLE public.cash_flow_entries;
DROP TABLE public.bank_accounts;
DROP TABLE public.bank_account_transactions;
DROP TABLE public.audit_logs;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    user_id text,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text,
    old_values jsonb,
    new_values jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO pos_user;

--
-- Name: bank_account_transactions; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.bank_account_transactions (
    id text NOT NULL,
    from_account_id text,
    to_account_id text,
    amount numeric(12,2) NOT NULL,
    transaction_type text NOT NULL,
    reference text,
    description text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.bank_account_transactions OWNER TO pos_user;

--
-- Name: bank_accounts; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.bank_accounts (
    id text NOT NULL,
    holder_name text NOT NULL,
    bank_name text NOT NULL,
    account_number text NOT NULL,
    initial_balance numeric(12,2) NOT NULL,
    current_balance numeric(12,2) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.bank_accounts OWNER TO pos_user;

--
-- Name: cash_flow_entries; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.cash_flow_entries (
    id text NOT NULL,
    type text NOT NULL,
    amount numeric(12,2) NOT NULL,
    source_bank_id text,
    dest_bank_id text,
    reference text,
    notes text,
    user_id text NOT NULL,
    session_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.cash_flow_entries OWNER TO pos_user;

--
-- Name: commissions; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.commissions (
    id text NOT NULL,
    user_id text NOT NULL,
    sale_id text NOT NULL,
    amount numeric(12,2) NOT NULL,
    rate numeric(5,2) NOT NULL,
    profit_snapshot numeric(12,2) NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.commissions OWNER TO pos_user;

--
-- Name: credit_payments; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.credit_payments (
    id text NOT NULL,
    credit_id text NOT NULL,
    amount numeric(12,2) NOT NULL,
    payment_method text NOT NULL,
    bank_account_id text,
    reference text,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.credit_payments OWNER TO pos_user;

--
-- Name: credits; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.credits (
    id text NOT NULL,
    customer_id text,
    sale_id text NOT NULL,
    customer_name text,
    customer_phone text,
    principal numeric(12,2) NOT NULL,
    balance numeric(12,2) NOT NULL,
    due_date date NOT NULL,
    status text DEFAULT 'OPEN'::text NOT NULL,
    closed_at timestamp(3) without time zone,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.credits OWNER TO pos_user;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.customers (
    id text NOT NULL,
    name text NOT NULL,
    phone text,
    email text,
    id_number text,
    address text,
    credit_limit numeric(12,2) DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.customers OWNER TO pos_user;

--
-- Name: daily_sessions; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.daily_sessions (
    id text NOT NULL,
    business_date date NOT NULL,
    opened_at timestamp(3) without time zone NOT NULL,
    closed_at timestamp(3) without time zone,
    opened_by_id text NOT NULL,
    closed_by_id text,
    opening_cash_balance numeric(12,2) NOT NULL,
    closing_cash_balance numeric(12,2) DEFAULT 0 NOT NULL,
    actual_cash_count numeric(12,2) DEFAULT 0 NOT NULL,
    cash_variance numeric(12,2) DEFAULT 0 NOT NULL,
    status text DEFAULT 'OPEN'::text NOT NULL,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.daily_sessions OWNER TO pos_user;

--
-- Name: defect_notes; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.defect_notes (
    id text NOT NULL,
    defect_id text NOT NULL,
    note text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.defect_notes OWNER TO pos_user;

--
-- Name: defect_photos; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.defect_photos (
    id text NOT NULL,
    defect_id text NOT NULL,
    url text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.defect_photos OWNER TO pos_user;

--
-- Name: defect_vendor_moves; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.defect_vendor_moves (
    id text NOT NULL,
    defect_id text NOT NULL,
    vendor_id text NOT NULL,
    sent_at timestamp(3) without time zone NOT NULL,
    received_at timestamp(3) without time zone,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.defect_vendor_moves OWNER TO pos_user;

--
-- Name: defects; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.defects (
    id text NOT NULL,
    defect_number text NOT NULL,
    customer_id text,
    item_id text,
    item_name text NOT NULL,
    serial_number text,
    description text NOT NULL,
    priority text DEFAULT 'NORMAL'::text NOT NULL,
    status text DEFAULT 'NEW'::text NOT NULL,
    intake_date date NOT NULL,
    completed_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.defects OWNER TO pos_user;

--
-- Name: error_logs; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.error_logs (
    id text NOT NULL,
    code text NOT NULL,
    message text NOT NULL,
    stack_trace text,
    context jsonb,
    user_id text,
    request_id text,
    severity text NOT NULL,
    component text,
    resolved boolean DEFAULT false NOT NULL,
    resolved_at timestamp(3) without time zone,
    resolved_by_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.error_logs OWNER TO pos_user;

--
-- Name: expenses; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.expenses (
    id text NOT NULL,
    amount numeric(12,2) NOT NULL,
    category text NOT NULL,
    payee text,
    description text,
    payment_method text NOT NULL,
    bank_account_id text,
    reference text,
    session_id text,
    created_by_id text NOT NULL,
    expense_date date NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.expenses OWNER TO pos_user;

--
-- Name: item_images; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.item_images (
    id text NOT NULL,
    item_id text NOT NULL,
    filename text NOT NULL,
    original_name text NOT NULL,
    mime_type text NOT NULL,
    size integer NOT NULL,
    path text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.item_images OWNER TO pos_user;

--
-- Name: items; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.items (
    id text NOT NULL,
    sku text NOT NULL,
    name text NOT NULL,
    brand text,
    item_type text,
    unit_of_measure text DEFAULT 'PIECE'::text NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    cost_price numeric(12,2) NOT NULL,
    category text,
    subcategory text,
    barcode text NOT NULL,
    barcode_generated boolean DEFAULT false NOT NULL,
    min_stock numeric(12,3) DEFAULT 0 NOT NULL,
    specifications text,
    is_active boolean DEFAULT true NOT NULL,
    supplier_id text,
    vendor_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.items OWNER TO pos_user;

--
-- Name: layaway_items; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.layaway_items (
    id text NOT NULL,
    layaway_id text NOT NULL,
    item_id text NOT NULL,
    qty numeric(12,3) NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    line_total numeric(12,2) NOT NULL
);


ALTER TABLE public.layaway_items OWNER TO pos_user;

--
-- Name: layaway_payments; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.layaway_payments (
    id text NOT NULL,
    layaway_id text NOT NULL,
    amount numeric(12,2) NOT NULL,
    payment_method text NOT NULL,
    bank_account_id text,
    reference text,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.layaway_payments OWNER TO pos_user;

--
-- Name: layaways; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.layaways (
    id text NOT NULL,
    layaway_number text NOT NULL,
    customer_id text NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    deposit_amount numeric(12,2) NOT NULL,
    paid_amount numeric(12,2) DEFAULT 0 NOT NULL,
    balance_amount numeric(12,2) NOT NULL,
    min_payment numeric(12,2) DEFAULT 0 NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    due_date date,
    completed_at timestamp(3) without time zone,
    cancelled_at timestamp(3) without time zone,
    notes text,
    created_by_id text,
    location_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.layaways OWNER TO pos_user;

--
-- Name: locations; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.locations (
    id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.locations OWNER TO pos_user;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    data jsonb,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO pos_user;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.payments (
    id text NOT NULL,
    sale_id text NOT NULL,
    method text NOT NULL,
    amount numeric(12,2) NOT NULL,
    bank_account_id text,
    reference text,
    sequence_number integer DEFAULT 1 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.payments OWNER TO pos_user;

--
-- Name: receipt_sequences; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.receipt_sequences (
    date_prefix text NOT NULL,
    last_value bigint DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.receipt_sequences OWNER TO pos_user;

--
-- Name: return_items; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.return_items (
    id text NOT NULL,
    return_id text NOT NULL,
    item_id text NOT NULL,
    qty numeric(12,3) NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    line_total numeric(12,2) NOT NULL,
    is_resellable boolean DEFAULT true NOT NULL
);


ALTER TABLE public.return_items OWNER TO pos_user;

--
-- Name: return_payments; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.return_payments (
    id text NOT NULL,
    return_id text NOT NULL,
    amount numeric(12,2) NOT NULL,
    payment_method text NOT NULL,
    bank_account_id text,
    reference text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.return_payments OWNER TO pos_user;

--
-- Name: returns; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.returns (
    id text NOT NULL,
    return_number text NOT NULL,
    sale_id text NOT NULL,
    customer_id text,
    return_type text NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    refund_method text,
    bank_account_id text,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.returns OWNER TO pos_user;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.roles (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    permissions jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.roles OWNER TO pos_user;

--
-- Name: sale_items; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.sale_items (
    id text NOT NULL,
    sale_id text NOT NULL,
    item_id text NOT NULL,
    location_id text,
    qty numeric(12,3) NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    cost_price numeric(12,2) NOT NULL,
    line_total numeric(12,2) NOT NULL
);


ALTER TABLE public.sale_items OWNER TO pos_user;

--
-- Name: sales; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.sales (
    id text NOT NULL,
    receipt_number text NOT NULL,
    sale_number text,
    cashier_id text,
    customer_id text,
    location_id text,
    salesman_id text,
    total_amount numeric(12,2) NOT NULL,
    actual_amount_paid numeric(12,2) NOT NULL,
    total_cost numeric(12,2) NOT NULL,
    discount numeric(12,2) DEFAULT 0 NOT NULL,
    payment_method text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    session_id text,
    notes text,
    refund_amount numeric(12,2),
    refund_method text,
    refund_bank_account_id text,
    cancelled_at timestamp(3) without time zone,
    cancelled_by_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.sales OWNER TO pos_user;

--
-- Name: special_incomes; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.special_incomes (
    id text NOT NULL,
    amount numeric(12,2) NOT NULL,
    category text NOT NULL,
    description text,
    reference text,
    payment_method text,
    bank_account_id text,
    session_id text,
    recorded_by text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.special_incomes OWNER TO pos_user;

--
-- Name: stocks; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.stocks (
    id text NOT NULL,
    item_id text NOT NULL,
    location_id text NOT NULL,
    qty numeric(12,3) NOT NULL,
    reserved_qty numeric(12,3) DEFAULT 0 NOT NULL,
    version integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.stocks OWNER TO pos_user;

--
-- Name: supplier_payments; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.supplier_payments (
    id text NOT NULL,
    vendor_id text NOT NULL,
    amount numeric(12,2) NOT NULL,
    payment_method text NOT NULL,
    bank_account_id text,
    reference text,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.supplier_payments OWNER TO pos_user;

--
-- Name: transfer_items; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.transfer_items (
    id text NOT NULL,
    transfer_id text NOT NULL,
    item_id text NOT NULL,
    qty numeric(12,3) NOT NULL
);


ALTER TABLE public.transfer_items OWNER TO pos_user;

--
-- Name: transfers; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.transfers (
    id text NOT NULL,
    transfer_number text NOT NULL,
    from_location_id text NOT NULL,
    to_location_id text NOT NULL,
    salesman_id text,
    assigned_to_id text,
    received_by_id text,
    purpose text DEFAULT 'STOCK_MOVE'::text NOT NULL,
    status text DEFAULT 'CREATED'::text NOT NULL,
    notes text,
    created_by_id text NOT NULL,
    sent_at timestamp(3) without time zone,
    received_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.transfers OWNER TO pos_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.users (
    id text NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    full_name text NOT NULL,
    role_id text NOT NULL,
    default_location_id text,
    is_active boolean DEFAULT true NOT NULL,
    last_login_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    commission_rate numeric(5,2) DEFAULT 0 NOT NULL
);


ALTER TABLE public.users OWNER TO pos_user;

--
-- Name: vendors; Type: TABLE; Schema: public; Owner: pos_user
--

CREATE TABLE public.vendors (
    id text NOT NULL,
    name text NOT NULL,
    contact_person text,
    phone text,
    email text,
    address text,
    balance numeric(12,2) DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.vendors OWNER TO pos_user;

--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.audit_logs (id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, created_at) FROM stdin;
e2bf2f17-acf2-4e96-bc43-433f116af493	ea4ef3be-834b-4b08-8769-138e6e451957	STOCK_ADDITION	Stock	c6500d86-931b-4c35-a951-585cda15b87b	\N	{"qty": 5, "itemId": "c51839f5-304f-4bd2-b47f-c533f9281afc", "reason": "Initial Stock", "itemSku": "ITM-OY0G5G", "itemName": "sdgs", "locationId": "85a97fac-c1b3-4ea6-96e3-158628e3b551", "locationName": "Basement", "adjustmentAmount": 5}	\N	\N	2026-02-27 17:30:58.9
c6e44ba6-4fbd-40dc-990f-111f7631619d	ea4ef3be-834b-4b08-8769-138e6e451957	CREATE	Item	c51839f5-304f-4bd2-b47f-c533f9281afc	null	{"sku": "ITM-OY0G5G", "name": "sdgs", "brand": null, "barcode": "QRMM564IR14TTPX8", "category": null, "minStock": 2.0, "costPrice": 9000, "unitPrice": 12000, "initialStock": 5}	\N	\N	2026-02-27 17:30:58.922
2aad94bc-9101-49c9-af7c-fbe3a5ec60b5	ea4ef3be-834b-4b08-8769-138e6e451957	STOCK_ADDITION	Stock	94cab9b0-facd-48cc-a221-76bc92e350aa	\N	{"qty": 12, "itemId": "1eb254f0-47ba-49da-be9c-ea8ef79d4296", "reason": "Initial Stock", "itemSku": "ITM-K9UMPC", "itemName": "melata", "locationId": "85a97fac-c1b3-4ea6-96e3-158628e3b551", "locationName": "Basement", "adjustmentAmount": 12}	\N	\N	2026-02-27 17:40:27.025
ac224741-4a91-4db4-b835-d8e3339dcad3	ea4ef3be-834b-4b08-8769-138e6e451957	CREATE	Item	1eb254f0-47ba-49da-be9c-ea8ef79d4296	null	{"sku": "ITM-K9UMPC", "name": "melata", "brand": null, "barcode": "QRMM56BYHPZWL5B9", "category": null, "minStock": 0.0, "costPrice": 4500, "unitPrice": 7000, "initialStock": 12}	\N	\N	2026-02-27 17:40:27.034
8ba1d84c-3990-4f73-8311-3b6a23585df3	ea4ef3be-834b-4b08-8769-138e6e451957	STOCK_ADJUSTMENT	Stock	c6500d86-931b-4c35-a951-585cda15b87b	{"qty": 0, "itemId": "c51839f5-304f-4bd2-b47f-c533f9281afc", "itemSku": "ITM-OY0G5G", "itemName": "sdgs", "locationId": "85a97fac-c1b3-4ea6-96e3-158628e3b551", "locationName": "Basement"}	{"qty": 21, "itemId": "c51839f5-304f-4bd2-b47f-c533f9281afc", "reason": "Return from Customer", "itemSku": "ITM-OY0G5G", "itemName": "sdgs", "locationId": "85a97fac-c1b3-4ea6-96e3-158628e3b551", "locationName": "Basement", "adjustmentAmount": 21}	\N	\N	2026-02-27 17:40:54.971
06d5fbcc-af09-423a-b09b-dca3f514c57e	ea4ef3be-834b-4b08-8769-138e6e451957	STOCK_ADDITION	Stock	0b9285e0-8144-4cea-8bd3-46fd2a66daae	\N	{"qty": 4, "itemId": "626ea2f0-0e04-4377-8583-baf96f3efc6d", "reason": "Initial Stock", "itemSku": "ITM-X8ZV6I", "itemName": "ase ty", "locationId": "e62acb5a-f9e9-445f-a0fc-a0d74cca1cac", "locationName": "Warehouse", "adjustmentAmount": 4}	\N	\N	2026-02-27 18:16:49.009
5eaa3337-4d09-4bdd-be7e-1dc2634f549a	ea4ef3be-834b-4b08-8769-138e6e451957	CREATE	Item	626ea2f0-0e04-4377-8583-baf96f3efc6d	null	{"sku": "ITM-X8ZV6I", "name": "ase ty", "brand": null, "barcode": "QRMM57R1G3IDR250", "category": null, "minStock": 0.0, "costPrice": 100000, "unitPrice": 200000, "initialStock": 4}	\N	\N	2026-02-27 18:16:49.018
3a31acc1-ee43-41e4-a11c-44eef15b1f8d	ea4ef3be-834b-4b08-8769-138e6e451957	STOCK_ADDITION	Stock	4d085fe9-9581-47da-adae-1958c54e5af2	\N	{"qty": 19, "itemId": "9e88ba50-67c1-4a0f-9417-63050c04cd63", "reason": "Initial Stock", "itemSku": "ITM-VDI515", "itemName": "hiopa ", "locationId": "3dad2e75-53d6-48db-8fb9-a328aeca3dbb", "locationName": "Showroom", "adjustmentAmount": 19}	\N	\N	2026-03-01 09:54:13.622
0327f73f-6223-4990-93d2-9e30c0277745	ea4ef3be-834b-4b08-8769-138e6e451957	CREATE	Item	9e88ba50-67c1-4a0f-9417-63050c04cd63	null	{"sku": "ITM-VDI515", "name": "hiopa ", "brand": "asf", "barcode": "QRMM7KLJ8VTIOXMI", "category": "sds", "minStock": 0.0, "costPrice": 9000, "unitPrice": 10000, "initialStock": 19}	\N	\N	2026-03-01 09:54:13.63
4f51b12d-321a-445a-92eb-482e84a3314f	ea4ef3be-834b-4b08-8769-138e6e451957	STOCK_ADJUSTMENT	Stock	6acc5837-1576-4a8f-be6f-3ef92099651c	{"qty": 0, "itemId": "9e88ba50-67c1-4a0f-9417-63050c04cd63", "itemSku": "ITM-VDI515", "itemName": "hiopa ", "locationId": "85a97fac-c1b3-4ea6-96e3-158628e3b551", "locationName": "Basement"}	{"qty": 5, "itemId": "9e88ba50-67c1-4a0f-9417-63050c04cd63", "reason": "Correction", "itemSku": "ITM-VDI515", "itemName": "hiopa ", "locationId": "85a97fac-c1b3-4ea6-96e3-158628e3b551", "locationName": "Basement", "adjustmentAmount": 5}	\N	\N	2026-03-06 20:35:25.478
d1eb4807-938d-4bfe-ac14-b7de8b7297ac	ea4ef3be-834b-4b08-8769-138e6e451957	STOCK_ADJUSTMENT	Stock	50d2ed3c-7a4b-4e92-993e-993136d0b10d	{"qty": 0, "itemId": "626ea2f0-0e04-4377-8583-baf96f3efc6d", "itemSku": "ITM-X8ZV6I", "itemName": "ase ty", "locationId": "3dad2e75-53d6-48db-8fb9-a328aeca3dbb", "locationName": "Showroom"}	{"qty": 12, "itemId": "626ea2f0-0e04-4377-8583-baf96f3efc6d", "reason": "Correction", "itemSku": "ITM-X8ZV6I", "itemName": "ase ty", "locationId": "3dad2e75-53d6-48db-8fb9-a328aeca3dbb", "locationName": "Showroom", "adjustmentAmount": 12}	\N	\N	2026-03-06 20:39:22.339
ae538270-58e9-4cc7-84f5-539406643aa2	ea4ef3be-834b-4b08-8769-138e6e451957	STOCK_ADDITION	Stock	80b83315-1d20-4d88-bc83-c6a0566c74e4	\N	{"qty": 230, "itemId": "4a780635-cedd-484d-a529-e12090ebd933", "reason": "Initial Stock", "itemSku": "ITM-CDXA3W", "itemName": "qwsv", "locationId": "3dad2e75-53d6-48db-8fb9-a328aeca3dbb", "locationName": "Showroom", "adjustmentAmount": 230}	\N	\N	2026-03-11 19:52:32.635
35bc44fa-e47d-476e-958f-5932d144f9ed	ea4ef3be-834b-4b08-8769-138e6e451957	CREATE	Item	4a780635-cedd-484d-a529-e12090ebd933	null	{"sku": "ITM-CDXA3W", "name": "qwsv", "brand": null, "barcode": "QRMMMGGI3H096O4T", "category": null, "minStock": 0.0, "costPrice": 21234.98, "unitPrice": 34534, "initialStock": 230}	\N	\N	2026-03-11 19:52:32.663
f39b8323-650b-4db7-90b4-a84d1cdde0d4	ea4ef3be-834b-4b08-8769-138e6e451957	STOCK_ADDITION	Stock	b26e9d6a-1862-40d4-8aaa-0a1642eafc07	\N	{"qty": 23, "itemId": "a3ea97b4-484d-4b76-89a2-643679461cb2", "reason": "Initial Stock", "itemSku": "ITM-NBXGRZ", "itemName": "wefw rt", "locationId": "85a97fac-c1b3-4ea6-96e3-158628e3b551", "locationName": "Basement", "adjustmentAmount": 23}	\N	\N	2026-03-12 18:52:51.979
91865df2-b310-4e90-9f6f-d5ec53d9c947	ea4ef3be-834b-4b08-8769-138e6e451957	CREATE	Item	a3ea97b4-484d-4b76-89a2-643679461cb2	null	{"sku": "ITM-NBXGRZ", "name": "wefw rt", "brand": null, "barcode": "QRMMNTRM8MDDR56O", "category": null, "minStock": 2.0, "costPrice": 45000, "unitPrice": 50000, "initialStock": 23}	\N	\N	2026-03-12 18:52:51.994
eb0347c3-be14-4e23-8b88-2839769b7b95	ea4ef3be-834b-4b08-8769-138e6e451957	STOCK_ADDITION	Stock	64b14d9f-6d45-468f-93c5-00ff1f8e6b9e	\N	{"qty": 90, "itemId": "0d6bd511-f05e-4578-8af7-57ba11ee2e22", "reason": "Initial Stock", "itemSku": "ITM-RBO7ST", "itemName": "poiu", "locationId": "3dad2e75-53d6-48db-8fb9-a328aeca3dbb", "locationName": "Showroom", "adjustmentAmount": 90}	\N	\N	2026-03-12 18:53:58.27
e0604bfe-7a93-45e1-b521-14eecb2218f8	ea4ef3be-834b-4b08-8769-138e6e451957	CREATE	Item	0d6bd511-f05e-4578-8af7-57ba11ee2e22	null	{"sku": "ITM-RBO7ST", "name": "poiu", "brand": null, "barcode": "QRMMNTT6R6R2QITU", "category": null, "minStock": 0.0, "costPrice": 23000, "unitPrice": 28000, "initialStock": 90}	\N	\N	2026-03-12 18:53:58.275
0b341fe2-87a0-46b3-8aa0-d486849585f3	ea4ef3be-834b-4b08-8769-138e6e451957	PARTIAL_SALE_REFUND	Sale	8d886244-b8b8-406a-b2e2-0359cdf98a1e	\N	{"returnId": "b890ca86-c92b-4de7-b501-94a6bebcf566", "itemsCount": 1, "returnNumber": "RET-20260315-000001", "totalRefunded": 200000}	\N	\N	2026-03-15 12:32:12.245
377348e9-c311-49f6-afb0-367a7e8dca3a	ea4ef3be-834b-4b08-8769-138e6e451957	PARTIAL_SALE_REFUND	Sale	8d886244-b8b8-406a-b2e2-0359cdf98a1e	\N	{"returnId": "c6c42662-03b8-46fc-a98d-c22b2f577d99", "itemsCount": 1, "returnNumber": "RET-20260315-000002", "totalRefunded": 10000}	\N	\N	2026-03-15 13:15:13.799
9528c903-c668-4d1e-93e4-4a0639314e58	ea4ef3be-834b-4b08-8769-138e6e451957	PARTIAL_SALE_REFUND	Sale	8d886244-b8b8-406a-b2e2-0359cdf98a1e	\N	{"returnId": "ce78250c-cd56-4bed-810c-41759f03bf8b", "itemsCount": 1, "returnNumber": "RET-20260315-000003", "totalRefunded": 34534}	\N	\N	2026-03-15 14:06:08.492
6c3d7d88-af60-4452-a799-1e3c05a3a89a	ea4ef3be-834b-4b08-8769-138e6e451957	PARTIAL_SALE_REFUND	Sale	690b2b8b-f18d-4ae2-a721-bf9c40dc7776	\N	{"returnId": "a17d1aee-4dfd-4767-bebd-722aab9a41f7", "itemsCount": 1, "returnNumber": "RET-20260315-000004", "totalRefunded": 10000}	\N	\N	2026-03-15 14:07:18.576
9d64a7bb-52d4-45cc-8dfa-1f9bf7b284a5	ea4ef3be-834b-4b08-8769-138e6e451957	PARTIAL_SALE_REFUND	Sale	5941f647-c976-4372-83a0-531beb468a45	\N	{"returnId": "621b42dc-ee40-4617-b296-37ee4e873d32", "itemsCount": 1, "returnNumber": "RET-20260315-000005", "totalRefunded": 200000}	\N	\N	2026-03-15 14:23:43.612
c7feb58c-02f4-4147-a0e5-5a63291abac5	ea4ef3be-834b-4b08-8769-138e6e451957	PARTIAL_SALE_REFUND	Sale	c9c9ee3a-51a5-47b8-9563-2e5b70634d1b	\N	{"returnId": "788e7d34-e72a-40ab-ae39-8be350728e76", "itemsCount": 1, "returnNumber": "RET-20260315-000006", "totalRefunded": 28000}	\N	\N	2026-03-15 16:19:27.026
85595063-3bf1-47a2-b487-7bd3344157e6	ea4ef3be-834b-4b08-8769-138e6e451957	PARTIAL_SALE_REFUND	Sale	c9c9ee3a-51a5-47b8-9563-2e5b70634d1b	\N	{"returnId": "fe679a9b-d1fc-48ee-90dc-d1138b561b2e", "itemsCount": 1, "returnNumber": "RET-20260315-000007", "totalRefunded": 10000}	\N	\N	2026-03-15 16:23:46.899
4619455f-abea-4553-93f6-5f053a061d90	ea4ef3be-834b-4b08-8769-138e6e451957	PARTIAL_SALE_REFUND	Sale	fed5c431-8074-4f7c-9b3a-b2c57afe9f7c	\N	{"returnId": "ead9761b-98a8-4d9e-8875-a7a6f010c784", "itemsCount": 1, "returnNumber": "RET-20260315-000008", "totalRefunded": 10000}	\N	\N	2026-03-15 16:24:32.372
54f5cc8d-f0a8-496f-8594-aaf4b368173d	ea4ef3be-834b-4b08-8769-138e6e451957	PARTIAL_SALE_REFUND	Sale	ef157c9a-964d-4fd7-958e-7ddc9cf204a0	\N	{"returnId": "256feb7c-5a86-441e-b385-e714dd74f700", "itemsCount": 1, "returnNumber": "RET-20260315-000009", "totalRefunded": 12000}	\N	\N	2026-03-15 16:25:13.651
7c8c26f4-6518-4dc7-ba15-a3d8ed014d02	ea4ef3be-834b-4b08-8769-138e6e451957	PARTIAL_SALE_REFUND	Sale	df77f6b7-feb2-411b-89af-acec451b078f	\N	{"returnId": "735e706e-8897-49e6-992b-5011b42ad695", "itemsCount": 1, "returnNumber": "RET-20260315-000010", "totalRefunded": 34534}	\N	\N	2026-03-15 17:05:23.932
f420414f-bef7-4319-97af-928ed99db1af	ea4ef3be-834b-4b08-8769-138e6e451957	PARTIAL_SALE_REFUND	Sale	5ca126ff-0a2c-4965-aa97-dcca517010c0	\N	{"returnId": "925688d4-0050-471f-a218-d765f3b237e8", "itemsCount": 1, "returnNumber": "RET-20260315-000011", "totalRefunded": 10000}	\N	\N	2026-03-15 17:21:41.709
5b773773-36d1-4fc9-8dc0-0a0fa9d5b8f3	ea4ef3be-834b-4b08-8769-138e6e451957	PARTIAL_SALE_REFUND	Sale	f7a494f5-b9c2-45cd-a744-7a0a071ea506	\N	{"returnId": "df806978-2cd4-461a-b93d-e424aa2eff54", "itemsCount": 1, "returnNumber": "RET-20260315-000012", "totalRefunded": 12000}	\N	\N	2026-03-15 18:05:10.484
\.


--
-- Data for Name: bank_account_transactions; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.bank_account_transactions (id, from_account_id, to_account_id, amount, transaction_type, reference, description, created_at) FROM stdin;
27b623a0-8f3a-4249-98a5-cb3a62a15242	\N	2f3b97af-d909-4030-89a2-2b48d062e96e	120000.00	CASH_DEPOSIT		Cash to bank transfer	2026-02-28 06:33:10.554
888ff1bf-f6f5-4620-ab90-aff156e637dd	\N	2f3b97af-d909-4030-89a2-2b48d062e96e	499999.98	CASH_DEPOSIT		Cash to bank transfer	2026-02-28 06:52:22.238
1495181e-da6d-4302-918c-e3493f50bfd6	\N	2f3b97af-d909-4030-89a2-2b48d062e96e	10000.00	CASH_DEPOSIT		Cash to bank transfer	2026-03-01 09:45:15.903
c839d598-6f1c-452f-a759-e9fca9e29e38	\N	2f3b97af-d909-4030-89a2-2b48d062e96e	10000.00	SALE_PAYMENT	RCP-20260301-000003	Sale payment - RCP-20260301-000003	2026-03-01 09:56:12.066
82116389-d3cb-434e-86bd-cf9db2f55648	\N	2f3b97af-d909-4030-89a2-2b48d062e96e	24000.00	SALE_PAYMENT	RCP-20260301-000004	Sale payment - RCP-20260301-000004	2026-03-01 09:56:46.217
73adb7af-4bc5-49dc-9d2d-7a0562cc57b7	\N	2f3b97af-d909-4030-89a2-2b48d062e96e	90000.00	CASH_DEPOSIT		Cash to bank transfer	2026-03-12 18:58:28.113
0f2d02a0-3d22-4409-9216-65f39443dbb1	\N	2f3b97af-d909-4030-89a2-2b48d062e96e	1000000.00	CASH_DEPOSIT		Cash to bank transfer	2026-03-12 19:01:42.834
b99c40c4-8fb6-4145-b8df-4623593bbab2	\N	2f3b97af-d909-4030-89a2-2b48d062e96e	251534.00	SALE_PAYMENT	RCP-20260315-000001	Sale payment - RCP-20260315-000001	2026-03-15 10:59:32.19
b44e2599-28e2-450e-9fdf-fa900cfbc3f8	2f3b97af-d909-4030-89a2-2b48d062e96e	\N	8000.00	SALE_REVERSAL	RET-20260315-000002	Refund for return RET-20260315-000002	2026-03-15 13:15:13.795
1ab7edad-7942-4b01-869d-cb0fb52ed3eb	\N	2f3b97af-d909-4030-89a2-2b48d062e96e	22534.00	SALE_PAYMENT	RCP-20260315-000004	Sale payment - RCP-20260315-000004	2026-03-15 14:10:15.332
976d10da-7ea6-4c11-924e-8eeb2bd0c8bc	\N	2f3b97af-d909-4030-89a2-2b48d062e96e	72534.00	SALE_PAYMENT	RCP-20260315-000005	Sale payment - RCP-20260315-000005	2026-03-15 14:11:02.534
6182bc6a-00a3-4890-ba1b-ae8911384efd	2f3b97af-d909-4030-89a2-2b48d062e96e	\N	9000.00	SALE_REVERSAL	RET-20260315-000006	Refund for return RET-20260315-000006	2026-03-15 16:19:27.022
f7d98870-9381-42c2-b2ed-6d7503c4fd77	\N	2f3b97af-d909-4030-89a2-2b48d062e96e	82534.00	SALE_PAYMENT	RCP-20260315-000009	Sale payment - RCP-20260315-000009	2026-03-15 17:03:32.396
\.


--
-- Data for Name: bank_accounts; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.bank_accounts (id, holder_name, bank_name, account_number, initial_balance, current_balance, is_active, created_at, updated_at) FROM stdin;
2f3b97af-d909-4030-89a2-2b48d062e96e	awas	nigd bank	24	0.00	2166135.98	t	2026-02-28 06:32:37.67	2026-03-15 17:03:32.392
\.


--
-- Data for Name: cash_flow_entries; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.cash_flow_entries (id, type, amount, source_bank_id, dest_bank_id, reference, notes, user_id, session_id, created_at) FROM stdin;
e02f30a2-5495-4872-9575-89e2e70b20a5	CASH_TO_BANK	120000.00	\N	2f3b97af-d909-4030-89a2-2b48d062e96e			ea4ef3be-834b-4b08-8769-138e6e451957	51cebc41-c26c-4098-a732-0b2244c0d3dd	2026-02-28 06:33:10.579
91d1f704-27db-441a-b44e-c334a2d10918	CASH_TO_BANK	499999.98	\N	2f3b97af-d909-4030-89a2-2b48d062e96e			ea4ef3be-834b-4b08-8769-138e6e451957	871731d8-cd49-401c-8264-d99208dad8ae	2026-02-28 06:52:22.243
34be5d06-b663-496e-8a5a-291b55adc83d	CASH_TO_BANK	10000.00	\N	2f3b97af-d909-4030-89a2-2b48d062e96e			ea4ef3be-834b-4b08-8769-138e6e451957	b528d7ab-5fe6-4427-b6a1-ab135e1cf7cd	2026-03-01 09:45:15.907
a371c069-b23d-4c27-abef-12c2adb0323c	CASH_TO_BANK	90000.00	\N	2f3b97af-d909-4030-89a2-2b48d062e96e			ea4ef3be-834b-4b08-8769-138e6e451957	c3b77b12-b3fc-41af-974b-53540b9e9437	2026-03-12 18:58:28.127
055b3894-a20c-4a23-b103-75d39f3f1de5	CASH_TO_BANK	1000000.00	\N	2f3b97af-d909-4030-89a2-2b48d062e96e			ea4ef3be-834b-4b08-8769-138e6e451957	c3b77b12-b3fc-41af-974b-53540b9e9437	2026-03-12 19:01:42.842
\.


--
-- Data for Name: commissions; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.commissions (id, user_id, sale_id, amount, rate, profit_snapshot, status, created_at) FROM stdin;
a8b5417e-9e20-44b8-897a-a9882ea6fffb	ea4ef3be-834b-4b08-8769-138e6e451957	afacbf83-c950-4a2e-8f29-cd17359978c5	600.00	10.00	6000.00	PENDING	2026-02-27 17:32:01.979
f6d0bdb7-d9cd-47b5-88e8-c13b43730ebf	ea4ef3be-834b-4b08-8769-138e6e451957	d98af3f4-c0f8-470f-8058-f49a4f6d19af	30.00	1.00	3000.00	PENDING	2026-02-27 17:32:59.145
adbc4be9-c5e5-4d88-9efd-d02e07bef1de	ea4ef3be-834b-4b08-8769-138e6e451957	89639f4d-83c7-459e-8384-81c2cf607314	100.00	1.00	10000.00	PENDING	2026-02-27 17:34:08.506
7e419acb-1cae-4a0c-a272-e0384359dc73	ea4ef3be-834b-4b08-8769-138e6e451957	979c9b4c-f732-4e68-9f6c-86f7b0a8c3ad	30.35	1.00	3035.00	PENDING	2026-02-27 17:41:17.149
23873da2-0a67-4bc4-8d46-f9c385cbfaf8	efbe8ff4-ad8a-4afb-9d7b-87d46030ceb7	dfe7e268-b8f8-44fb-a4de-ef7f1dd84eea	125.00	1.00	12500.00	PENDING	2026-02-27 17:42:32.791
d2ab94b2-51d8-4061-abb9-74c2586c47d2	ea4ef3be-834b-4b08-8769-138e6e451957	50154bbd-7513-4e98-991a-c0ca818ed1de	1000.00	1.00	100000.00	PENDING	2026-02-27 18:17:07.859
9ee68fa3-7da7-45a9-b536-5ecefe8b4f6f	ea4ef3be-834b-4b08-8769-138e6e451957	5daeeddb-3aea-44de-8624-fa22435327af	1100.00	1.00	110000.00	PENDING	2026-02-28 06:14:29.636
d6fa3160-1185-4c1a-b45e-ae290a4126f2	ea4ef3be-834b-4b08-8769-138e6e451957	bb47bf65-96f2-4841-8fc1-14d8326970e9	45.00	1.00	4500.00	PENDING	2026-02-28 06:14:56.846
3807491d-d2c2-40f1-997a-3c2e9359e762	ea4ef3be-834b-4b08-8769-138e6e451957	827a9c03-9f29-493d-9823-a1f40d0c3715	60.00	1.00	6000.00	PENDING	2026-02-28 06:15:15.353
20bcedb6-310c-4db1-9767-0645996e04dc	ea4ef3be-834b-4b08-8769-138e6e451957	f8f4b1b9-b0da-4a85-aafc-080d63e4e975	30.00	1.00	3000.00	PENDING	2026-02-28 06:15:26.809
d850a92e-ab44-446e-83bc-1a51af920a00	ea4ef3be-834b-4b08-8769-138e6e451957	104b3d9d-1420-4445-b9b2-41f897fb4474	1050.00	1.00	105000.00	PENDING	2026-02-28 06:52:00.092
e334fa6e-e2cf-4e06-bf93-6dcdee0567f8	ea4ef3be-834b-4b08-8769-138e6e451957	e4a179a4-066c-4910-a665-3ef4da2357db	75.00	1.00	7500.00	PENDING	2026-02-28 08:41:27.845
f4ab7de2-27e4-4c3d-9915-8075f95db0c5	ea4ef3be-834b-4b08-8769-138e6e451957	7e750c23-8ef4-42b5-ae4c-d567ea9060c9	30.00	1.00	3000.00	PENDING	2026-03-01 09:54:45.552
7f8f3c09-afbc-4ad1-ae51-2fd8e5c4ca87	ea4ef3be-834b-4b08-8769-138e6e451957	c7a2e69a-3345-4f72-b6a6-db568cdbc899	20.00	1.00	2000.00	PENDING	2026-03-01 09:55:53.763
5d3af4c6-1382-49d5-8912-bcbbc0db94c3	ea4ef3be-834b-4b08-8769-138e6e451957	2acc7f9b-86cb-4bfc-bbb0-b98acf2d1554	10.00	1.00	1000.00	PENDING	2026-03-01 09:56:12.087
c9c42dfa-7ed1-4d12-a8d8-cbe0cb06bb02	ea4ef3be-834b-4b08-8769-138e6e451957	7e3d8560-6847-4d76-a2ab-fd5ae6b376a1	60.00	1.00	6000.00	PENDING	2026-03-01 09:56:46.253
09897171-4dcd-4ebd-a60a-79cff8fbcdb7	ea4ef3be-834b-4b08-8769-138e6e451957	4c884c5e-8c92-47c7-8489-f142d8cf9e2f	1000.00	1.00	100000.00	PENDING	2026-03-06 20:40:25.882
54eb7c77-24e4-4ad8-ad7d-432c14587680	ea4ef3be-834b-4b08-8769-138e6e451957	b187b9f0-f233-471e-897a-495afead9a0f	20801.47	1.00	2080147.12	PENDING	2026-03-11 19:53:43.188
50cde379-1d0a-437f-a1dd-2c2cf67b6cbe	ea4ef3be-834b-4b08-8769-138e6e451957	0a0b07e2-a8ea-4b5d-bdbf-e3dc9233e8ba	3989.71	1.00	398970.60	PENDING	2026-03-11 19:54:22.031
047c149d-445d-487f-956a-667449124769	ea4ef3be-834b-4b08-8769-138e6e451957	c33a6060-a5d3-41fb-b26f-19f2efa842cc	2733.97	1.00	273397.06	PENDING	2026-03-12 18:59:15.39
85a7bca3-b1cc-4542-a51e-f5ae12a6ecf8	ea4ef3be-834b-4b08-8769-138e6e451957	8d886244-b8b8-406a-b2e2-0359cdf98a1e	1167.99	1.00	116799.02	PENDING	2026-03-15 10:59:32.22
1173e6fc-75f5-45e8-9c80-94197b97d1c2	ea4ef3be-834b-4b08-8769-138e6e451957	690b2b8b-f18d-4ae2-a721-bf9c40dc7776	10.00	1.00	1000.00	CANCELLED	2026-03-15 14:06:54.06
a50230ce-2bf7-4b3b-b60e-45950a56715f	ea4ef3be-834b-4b08-8769-138e6e451957	78a2b5d7-d201-4e33-95f1-d53aa9e48f5b	132.99	1.00	13299.02	PENDING	2026-03-15 14:10:15.361
bdf7ca32-11c6-4344-ac8d-dbd8959a63d1	ea4ef3be-834b-4b08-8769-138e6e451957	aa13c801-93fa-4163-a940-a8b0d24d730e	1192.99	1.00	119299.02	PENDING	2026-03-15 14:11:02.57
60518389-5701-4200-a392-4b0a2c70cbfd	ea4ef3be-834b-4b08-8769-138e6e451957	5941f647-c976-4372-83a0-531beb468a45	1000.00	1.00	100000.00	CANCELLED	2026-03-15 14:07:56.5
36508a2c-aa59-4355-b061-68fa91938ecd	ea4ef3be-834b-4b08-8769-138e6e451957	c9c9ee3a-51a5-47b8-9563-2e5b70634d1b	192.99	1.00	19299.02	PENDING	2026-03-15 16:18:08.175
10a43998-a336-403f-a618-21eb818ea5a0	ea4ef3be-834b-4b08-8769-138e6e451957	fed5c431-8074-4f7c-9b3a-b2c57afe9f7c	10.00	1.00	1000.00	CANCELLED	2026-03-15 16:24:11.928
01cf4c51-3aec-4dc6-9f6f-b5f4dc34c9f9	ea4ef3be-834b-4b08-8769-138e6e451957	ef157c9a-964d-4fd7-958e-7ddc9cf204a0	80.00	1.00	8000.00	PENDING	2026-03-15 16:24:48.937
51d3dab4-e00c-46a4-99eb-ac632b8191b7	ea4ef3be-834b-4b08-8769-138e6e451957	df77f6b7-feb2-411b-89af-acec451b078f	202.99	1.00	20299.02	PENDING	2026-03-15 17:03:32.436
92d8092d-469e-4874-bd47-a6d97764e654	ea4ef3be-834b-4b08-8769-138e6e451957	5ca126ff-0a2c-4965-aa97-dcca517010c0	1010.00	1.00	101000.00	PENDING	2026-03-15 17:19:18.898
f8b470c8-2984-4847-ad34-70e212592e09	ea4ef3be-834b-4b08-8769-138e6e451957	6d361346-f521-4286-a180-56c8f2f51292	50.00	1.00	5000.00	PENDING	2026-03-15 18:02:27.867
70b71c5c-58f2-4499-8d5c-700e978c7816	ea4ef3be-834b-4b08-8769-138e6e451957	f7a494f5-b9c2-45cd-a744-7a0a071ea506	1272.99	1.00	127299.02	PENDING	2026-03-15 18:04:34.913
\.


--
-- Data for Name: credit_payments; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.credit_payments (id, credit_id, amount, payment_method, bank_account_id, reference, notes, created_at) FROM stdin;
9b7b0b1d-d046-4a7f-a3c9-c4d3bc142460	630195b6-d47d-4714-a871-b95c52d536d9	900.00	CASH	\N	\N	\N	2026-03-06 20:41:02.688
\.


--
-- Data for Name: credits; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.credits (id, customer_id, sale_id, customer_name, customer_phone, principal, balance, due_date, status, closed_at, notes, created_at, updated_at) FROM stdin;
630195b6-d47d-4714-a871-b95c52d536d9	\N	4c884c5e-8c92-47c7-8489-f142d8cf9e2f	asa	1231	10000.00	9100.00	2026-12-12	OPEN	\N	Credit sale from receipt RCP-20260306-000001	2026-03-06 20:40:25.899	2026-03-06 20:41:02.695
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.customers (id, name, phone, email, id_number, address, credit_limit, is_active, created_at, updated_at) FROM stdin;
c0a708b6-34e0-46bd-a3a0-6dfc46ed9ee1	ABRAHAM MULATU	0919340004	abfx143@gmail.com	2782834	Addis ababa, bole	12000.00	t	2026-03-06 20:45:33.12	2026-03-06 20:45:33.12
\.


--
-- Data for Name: daily_sessions; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.daily_sessions (id, business_date, opened_at, closed_at, opened_by_id, closed_by_id, opening_cash_balance, closing_cash_balance, actual_cash_count, cash_variance, status, notes, created_at, updated_at) FROM stdin;
b3dc1978-2fd0-40b7-9317-8204ae2d1263	2026-02-27	2026-02-27 17:33:49.157	2026-02-28 06:13:20.056	ea4ef3be-834b-4b08-8769-138e6e451957	ea4ef3be-834b-4b08-8769-138e6e451957	0.00	290150.00	0.00	-290150.00	CLOSED	\N	2026-02-27 17:33:49.158	2026-02-28 06:13:20.057
51cebc41-c26c-4098-a732-0b2244c0d3dd	2026-02-28	2026-02-28 06:14:08.356	2026-02-28 06:51:21.547	ea4ef3be-834b-4b08-8769-138e6e451957	ea4ef3be-834b-4b08-8769-138e6e451957	20000.00	146000.00	0.00	-146000.00	CLOSED	\N	2026-02-28 06:14:08.358	2026-02-28 06:51:21.549
871731d8-cd49-401c-8264-d99208dad8ae	2026-02-28	2026-02-28 06:51:30.961	2026-02-28 08:40:26.622	ea4ef3be-834b-4b08-8769-138e6e451957	ea4ef3be-834b-4b08-8769-138e6e451957	400000.00	114000.02	0.00	-114000.02	CLOSED	\N	2026-02-28 06:51:30.962	2026-02-28 08:40:26.624
b65162b6-5e7c-44f5-b721-1dc6dccbca49	2026-02-28	2026-02-28 08:40:38.715	2026-02-28 08:40:51.668	ea4ef3be-834b-4b08-8769-138e6e451957	ea4ef3be-834b-4b08-8769-138e6e451957	0.00	0.00	0.00	0.00	CLOSED	\N	2026-02-28 08:40:38.717	2026-02-28 08:40:51.671
b528d7ab-5fe6-4427-b6a1-ab135e1cf7cd	2026-02-28	2026-02-28 08:41:04.672	2026-03-01 09:47:42.76	ea4ef3be-834b-4b08-8769-138e6e451957	ea4ef3be-834b-4b08-8769-138e6e451957	90000.00	92000.00	0.00	-92000.00	CLOSED	\N	2026-02-28 08:41:04.674	2026-03-01 09:47:42.762
bf7ca23e-ea33-4eea-947c-b31fef525067	2026-03-01	2026-03-01 09:48:49.614	2026-03-01 09:58:29.166	ea4ef3be-834b-4b08-8769-138e6e451957	ea4ef3be-834b-4b08-8769-138e6e451957	0.00	122000.00	0.00	-122000.00	CLOSED	\N	2026-03-01 09:48:49.616	2026-03-01 09:58:29.168
5bf49079-6cda-4d29-9646-a683bb955aa6	2026-03-01	2026-03-01 09:59:05.106	2026-03-06 20:38:12.863	ea4ef3be-834b-4b08-8769-138e6e451957	ea4ef3be-834b-4b08-8769-138e6e451957	70000.00	70000.00	0.00	-70000.00	CLOSED	\N	2026-03-01 09:59:05.107	2026-03-06 20:38:12.865
7024ace6-9bbe-413d-9834-414681ba42df	2026-03-06	2026-03-06 20:38:33.883	2026-03-11 19:51:02.638	ea4ef3be-834b-4b08-8769-138e6e451957	f274cc03-9bfc-41f9-a048-c78bf5dbcfa1	20000.00	419900.00	0.00	-419900.00	CLOSED	\N	2026-03-06 20:38:33.884	2026-03-11 19:51:02.642
79cbccf3-27de-41e1-986a-23fecd120d2c	2026-03-11	2026-03-11 19:53:57.621	2026-03-12 18:57:03.5	ea4ef3be-834b-4b08-8769-138e6e451957	ea4ef3be-834b-4b08-8769-138e6e451957	0.00	1036020.00	0.00	-1036020.00	CLOSED	\N	2026-03-11 19:53:57.623	2026-03-12 18:57:03.502
c3b77b12-b3fc-41af-974b-53540b9e9437	2026-03-12	2026-03-12 18:57:40.553	2026-03-12 19:07:36.093	ea4ef3be-834b-4b08-8769-138e6e451957	ea4ef3be-834b-4b08-8769-138e6e451957	890000.00	460602.00	0.00	-460602.00	CLOSED	\N	2026-03-12 18:57:40.555	2026-03-12 19:07:36.096
26564204-c838-4b30-891e-5b57e98393b6	2026-03-12	2026-03-12 19:08:29.873	2026-03-12 19:08:34.34	ea4ef3be-834b-4b08-8769-138e6e451957	ea4ef3be-834b-4b08-8769-138e6e451957	0.00	0.00	0.00	0.00	CLOSED	\N	2026-03-12 19:08:29.875	2026-03-12 19:08:34.347
aab8dd53-8cf0-4400-bc74-bd15fa2daf24	2026-03-12	2026-03-12 19:08:44.673	2026-03-15 17:54:00.865	ea4ef3be-834b-4b08-8769-138e6e451957	ea4ef3be-834b-4b08-8769-138e6e451957	51500.00	806034.00	0.00	-806034.00	CLOSED	\N	2026-03-12 19:08:44.677	2026-03-15 17:54:00.866
1a5d533b-3fce-4f2c-9044-f8838f7845ec	2026-03-15	2026-03-15 17:55:07.625	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	19000.00	0.00	0.00	0.00	OPEN	\N	2026-03-15 17:55:07.626	2026-03-15 17:55:07.626
\.


--
-- Data for Name: defect_notes; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.defect_notes (id, defect_id, note, created_at) FROM stdin;
\.


--
-- Data for Name: defect_photos; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.defect_photos (id, defect_id, url, created_at) FROM stdin;
\.


--
-- Data for Name: defect_vendor_moves; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.defect_vendor_moves (id, defect_id, vendor_id, sent_at, received_at, notes, created_at) FROM stdin;
\.


--
-- Data for Name: defects; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.defects (id, defect_number, customer_id, item_id, item_name, serial_number, description, priority, status, intake_date, completed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: error_logs; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.error_logs (id, code, message, stack_trace, context, user_id, request_id, severity, component, resolved, resolved_at, resolved_by_id, created_at) FROM stdin;
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.expenses (id, amount, category, payee, description, payment_method, bank_account_id, reference, session_id, created_by_id, expense_date, created_at, updated_at) FROM stdin;
b181e266-544e-4e43-86c5-4bb9e5a16d7e	50000.00	Other	dfsd		CASH	\N		c3b77b12-b3fc-41af-974b-53540b9e9437	ea4ef3be-834b-4b08-8769-138e6e451957	2026-03-12	2026-03-12 19:02:20.88	2026-03-12 19:02:20.88
7b474166-8030-4c6c-adec-ed63c9b4bf5a	12000.00	Other			CASH	\N		c3b77b12-b3fc-41af-974b-53540b9e9437	ea4ef3be-834b-4b08-8769-138e6e451957	2026-03-12	2026-03-12 19:02:53.047	2026-03-12 19:02:53.047
\.


--
-- Data for Name: item_images; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.item_images (id, item_id, filename, original_name, mime_type, size, path, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.items (id, sku, name, brand, item_type, unit_of_measure, unit_price, cost_price, category, subcategory, barcode, barcode_generated, min_stock, specifications, is_active, supplier_id, vendor_id, created_at, updated_at) FROM stdin;
c51839f5-304f-4bd2-b47f-c533f9281afc	ITM-OY0G5G	sdgs	\N	\N	PIECE	12000.00	9000.00	\N	\N	QRMM564IR14TTPX8	f	2.000	\N	t	\N	\N	2026-02-27 17:30:58.86	2026-02-27 17:30:58.86
1eb254f0-47ba-49da-be9c-ea8ef79d4296	ITM-K9UMPC	melata	\N	\N	PIECE	7000.00	4500.00	\N	\N	QRMM56BYHPZWL5B9	f	0.000	\N	t	\N	\N	2026-02-27 17:40:27.004	2026-02-27 17:40:27.004
626ea2f0-0e04-4377-8583-baf96f3efc6d	ITM-X8ZV6I	ase ty	\N	\N	PIECE	200000.00	100000.00	\N	\N	QRMM57R1G3IDR250	f	0.000	\N	t	\N	\N	2026-02-27 18:16:48.991	2026-02-27 18:16:48.991
fd9823ed-57df-43a8-b518-e35c02fc2121	ITEM-001	Sample Product 1	Generic	\N	PIECE	100.00	80.00	Electronics	\N	1234567890123	f	0.000	\N	f	\N	\N	2026-02-24 09:37:29.491	2026-02-28 06:13:48.144
f5723b07-4d22-4582-bffc-e7387c3dbe09	ITEM-002	Sample Product 2	Generic	\N	PIECE	50.00	35.00	Accessories	\N	1234567890124	f	0.000	\N	f	\N	\N	2026-02-24 09:37:29.505	2026-02-28 06:13:57.016
9e88ba50-67c1-4a0f-9417-63050c04cd63	ITM-VDI515	hiopa 	asf	\N	PIECE	10000.00	9000.00	sds	\N	QRMM7KLJ8VTIOXMI	f	0.000	\N	t	\N	\N	2026-03-01 09:54:13.6	2026-03-01 09:54:13.6
4a780635-cedd-484d-a529-e12090ebd933	ITM-CDXA3W	qwsv	\N	\N	METER	34534.00	21234.98	\N	\N	QRMMMGGI3H096O4T	f	0.000	\N	t	\N	\N	2026-03-11 19:52:32.596	2026-03-11 19:52:32.596
a3ea97b4-484d-4b76-89a2-643679461cb2	ITM-NBXGRZ	wefw rt	\N	\N	PIECE	50000.00	45000.00	\N	\N	QRMMNTRM8MDDR56O	f	2.000	\N	t	\N	\N	2026-03-12 18:52:51.944	2026-03-12 18:52:51.944
0d6bd511-f05e-4578-8af7-57ba11ee2e22	ITM-RBO7ST	poiu	\N	\N	PIECE	28000.00	23000.00	\N	\N	QRMMNTT6R6R2QITU	f	0.000	\N	t	\N	\N	2026-03-12 18:53:58.255	2026-03-12 18:53:58.255
\.


--
-- Data for Name: layaway_items; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.layaway_items (id, layaway_id, item_id, qty, unit_price, line_total) FROM stdin;
c6af7e67-5532-416c-9380-6b06b11be046	c2ad8b90-6192-45c9-935f-c7133d334d12	626ea2f0-0e04-4377-8583-baf96f3efc6d	1.000	200000.00	200000.00
4e1ac070-de33-4a5a-a129-b9ef5c6ca022	1cc12b06-08db-4131-b81a-bfd205dc99ef	9e88ba50-67c1-4a0f-9417-63050c04cd63	1.000	10000.00	10000.00
\.


--
-- Data for Name: layaway_payments; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.layaway_payments (id, layaway_id, amount, payment_method, bank_account_id, reference, notes, created_at) FROM stdin;
2ba26530-3646-4025-a0a5-1f78abcec2e1	c2ad8b90-6192-45c9-935f-c7133d334d12	120000.00	CASH	\N	\N	Initial deposit	2026-03-06 20:48:29.857
c38d9a8c-fbd1-4bc9-bd3a-3510dbd0276b	c2ad8b90-6192-45c9-935f-c7133d334d12	80000.00	CASH	\N	\N	\N	2026-03-06 20:49:43.574
c4acc713-1e18-40ca-b5a1-a66bda004fd0	1cc12b06-08db-4131-b81a-bfd205dc99ef	9000.00	CASH	\N	\N	Initial deposit	2026-03-06 20:51:33.272
\.


--
-- Data for Name: layaways; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.layaways (id, layaway_number, customer_id, total_amount, deposit_amount, paid_amount, balance_amount, min_payment, status, due_date, completed_at, cancelled_at, notes, created_by_id, location_id, created_at, updated_at) FROM stdin;
c2ad8b90-6192-45c9-935f-c7133d334d12	LAY-20260306-000001	c0a708b6-34e0-46bd-a3a0-6dfc46ed9ee1	200000.00	120000.00	200000.00	0.00	0.00	COMPLETED	2026-12-12	2026-03-06 20:49:43.577	\N	\N	\N	e62acb5a-f9e9-445f-a0fc-a0d74cca1cac	2026-03-06 20:48:29.857	2026-03-06 20:49:43.578
1cc12b06-08db-4131-b81a-bfd205dc99ef	LAY-20260306-000002	c0a708b6-34e0-46bd-a3a0-6dfc46ed9ee1	10000.00	9000.00	9000.00	1000.00	0.00	ACTIVE	2026-12-12	\N	\N	\N	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	2026-03-06 20:51:33.272	2026-03-06 20:51:33.272
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.locations (id, name, type, description, is_active, created_at) FROM stdin;
3dad2e75-53d6-48db-8fb9-a328aeca3dbb	Showroom	SHOWROOM	Main showroom floor	t	2026-02-24 09:37:27.608
85a97fac-c1b3-4ea6-96e3-158628e3b551	Basement	BASEMENT	Basement storage	t	2026-02-24 09:37:27.619
e62acb5a-f9e9-445f-a0fc-a0d74cca1cac	Warehouse	WAREHOUSE	Main warehouse	t	2026-02-24 09:37:27.629
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.notifications (id, type, title, message, data, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.payments (id, sale_id, method, amount, bank_account_id, reference, sequence_number, created_at) FROM stdin;
f416ad24-34f0-4238-9f72-c6580b77c514	afacbf83-c950-4a2e-8f29-cd17359978c5	CASH	15000.00	\N	\N	1	2026-02-27 17:32:01.949
3f9c20d8-c802-40cf-9659-71002862de58	d98af3f4-c0f8-470f-8058-f49a4f6d19af	CASH	12000.00	\N	\N	1	2026-02-27 17:32:59.122
892ec4ee-a9cb-42c3-80b1-590164ef8e0d	89639f4d-83c7-459e-8384-81c2cf607314	CASH	28000.00	\N	\N	1	2026-02-27 17:34:08.474
1ca27d66-4ef9-4f02-aa5b-9997ce721390	5aaf351f-3192-48df-b19b-37cd31ba0270	CASH	15000.00	\N	\N	1	2026-02-27 17:35:25.035
b91f5f6a-26e9-41c0-971f-cc496d81555d	979c9b4c-f732-4e68-9f6c-86f7b0a8c3ad	CASH	12150.00	\N	\N	1	2026-02-27 17:41:17.111
7eb4997e-9ae1-4343-9a28-229826c169ca	dfe7e268-b8f8-44fb-a4de-ef7f1dd84eea	CASH	35000.00	\N	\N	1	2026-02-27 17:42:32.675
7001c10b-4940-4875-a309-150fbd2a1641	50154bbd-7513-4e98-991a-c0ca818ed1de	CASH	200000.00	\N	\N	1	2026-02-27 18:17:07.69
f395ce76-f4d2-423b-8bc1-4b87b9fefd99	5daeeddb-3aea-44de-8624-fa22435327af	CASH	210000.00	\N	\N	1	2026-02-28 06:14:29.598
8c7dd623-d729-48e4-ab26-64a07363d960	bb47bf65-96f2-4841-8fc1-14d8326970e9	CASH	9000.00	\N	\N	1	2026-02-28 06:14:56.787
42bca3c2-64ed-461e-ad4d-38a051920f2c	827a9c03-9f29-493d-9823-a1f40d0c3715	CASH	15000.00	\N	\N	1	2026-02-28 06:15:15.334
b7a71455-e74d-43f2-bfbe-f8824128b275	f8f4b1b9-b0da-4a85-aafc-080d63e4e975	CASH	12000.00	\N	\N	1	2026-02-28 06:15:26.79
1fbf81da-94d2-4183-b22c-62748b5e7510	104b3d9d-1420-4445-b9b2-41f897fb4474	CASH	214000.00	\N	\N	1	2026-02-28 06:52:00.053
d1a2cf84-d1ae-4f7e-807a-126e9d1d2f39	e4a179a4-066c-4910-a665-3ef4da2357db	CASH	12000.00	\N	\N	1	2026-02-28 08:41:27.808
210cc20c-8568-4664-9ef2-3da9f5a08746	7e750c23-8ef4-42b5-ae4c-d567ea9060c9	CASH	12000.00	\N	\N	1	2026-03-01 09:54:45.525
f00fb529-7ea1-433b-9630-9fdd8ff6b3c1	c7a2e69a-3345-4f72-b6a6-db568cdbc899	CASH	20000.00	\N	\N	1	2026-03-01 09:55:53.739
a55361b9-6e8b-446d-b1c1-0423dfa65b7a	2acc7f9b-86cb-4bfc-bbb0-b98acf2d1554	MOBILE_TRANSFER	10000.00	2f3b97af-d909-4030-89a2-2b48d062e96e	\N	1	2026-03-01 09:56:12.056
c868de47-6085-4de5-9dfd-2e1576e3b002	7e3d8560-6847-4d76-a2ab-fd5ae6b376a1	MOBILE_TRANSFER	24000.00	2f3b97af-d909-4030-89a2-2b48d062e96e	\N	1	2026-03-01 09:56:46.204
47e111b1-b368-4a71-a144-111125a16efb	4c884c5e-8c92-47c7-8489-f142d8cf9e2f	CASH	190000.00	\N	\N	1	2026-03-06 20:40:25.861
5506a4de-8200-4566-800b-c9041cb0fa5d	4c884c5e-8c92-47c7-8489-f142d8cf9e2f	CREDIT	10000.00	\N	\N	1	2026-03-06 20:40:25.864
e70fc593-f971-495e-8376-81af87dfdd51	b187b9f0-f233-471e-897a-495afead9a0f	CASH	5406304.00	\N	\N	1	2026-03-11 19:53:42.924
0174db35-1541-4bff-bd8c-dd5f3414b056	0a0b07e2-a8ea-4b5d-bdbf-e3dc9233e8ba	CASH	1036020.00	\N	\N	1	2026-03-11 19:54:22.007
f3264adc-4f2a-4414-b835-8c05f9865d57	c33a6060-a5d3-41fb-b26f-19f2efa842cc	CASH	722602.00	\N	\N	1	2026-03-12 18:59:15.306
81e2e83d-2a4f-4563-8c27-52fb28e29218	8d886244-b8b8-406a-b2e2-0359cdf98a1e	MOBILE_TRANSFER	251534.00	2f3b97af-d909-4030-89a2-2b48d062e96e	\N	1	2026-03-15 10:59:32.179
b7d24ad1-2171-47ac-9dab-336dcf4b3102	690b2b8b-f18d-4ae2-a721-bf9c40dc7776	CASH	10000.00	\N	\N	1	2026-03-15 14:06:54.038
de040c87-51b5-43b8-9a20-60823d4e1a77	5941f647-c976-4372-83a0-531beb468a45	CASH	150000.00	\N	\N	1	2026-03-15 14:07:56.472
08f9402b-59be-48bb-aaaf-5a8b25b7708f	5941f647-c976-4372-83a0-531beb468a45	CASH	50000.00	\N	\N	1	2026-03-15 14:07:56.476
5ea87d3f-3010-4f03-9318-3e45eba4e5ec	78a2b5d7-d201-4e33-95f1-d53aa9e48f5b	CASH	12000.00	\N	\N	1	2026-03-15 14:10:15.319
da4ddd7b-d470-4c1a-b71b-74375e2f6ccd	78a2b5d7-d201-4e33-95f1-d53aa9e48f5b	MOBILE_TRANSFER	22534.00	2f3b97af-d909-4030-89a2-2b48d062e96e	\N	1	2026-03-15 14:10:15.322
523baa46-62c8-4a1e-b3a7-9fd1a4c36622	aa13c801-93fa-4163-a940-a8b0d24d730e	CASH	200000.00	\N	\N	1	2026-03-15 14:11:02.522
be317dcb-d62b-4109-b64d-59ccb802755a	aa13c801-93fa-4163-a940-a8b0d24d730e	MOBILE_TRANSFER	72534.00	2f3b97af-d909-4030-89a2-2b48d062e96e	\N	1	2026-03-15 14:11:02.525
f9fb8c0d-c4b1-471d-910d-3e90490c12f2	c9c9ee3a-51a5-47b8-9563-2e5b70634d1b	CASH	72534.00	\N	\N	1	2026-03-15 16:18:08.14
79470ea4-071a-4a3d-905d-dad3caeae7f1	fed5c431-8074-4f7c-9b3a-b2c57afe9f7c	CASH	10000.00	\N	\N	1	2026-03-15 16:24:11.898
04c0d303-3ea4-4ff3-a8a1-12e96caed2f3	ef157c9a-964d-4fd7-958e-7ddc9cf204a0	CASH	40000.00	\N	\N	1	2026-03-15 16:24:48.913
9fdb4f3e-7a87-4a11-86f1-209f7dfb18e2	df77f6b7-feb2-411b-89af-acec451b078f	MOBILE_TRANSFER	82534.00	2f3b97af-d909-4030-89a2-2b48d062e96e	\N	1	2026-03-15 17:03:32.385
4301ef07-c494-4ee0-9ea0-1511f3f45306	5ca126ff-0a2c-4965-aa97-dcca517010c0	CASH	210000.00	\N	\N	1	2026-03-15 17:19:18.762
f1f0e09d-e99d-49c9-983a-023d0680defb	6d361346-f521-4286-a180-56c8f2f51292	CASH	28000.00	\N	\N	1	2026-03-15 18:02:27.846
9900b82b-f960-4316-8ea5-f8e4a7cd8353	f7a494f5-b9c2-45cd-a744-7a0a071ea506	CASH	334534.00	\N	\N	1	2026-03-15 18:04:34.844
\.


--
-- Data for Name: receipt_sequences; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.receipt_sequences (date_prefix, last_value, created_at) FROM stdin;
RCP-20260227-	7	2026-02-27 17:32:01.815
RCP-20260228-	6	2026-02-28 06:14:29.472
RCP-20260301-	4	2026-03-01 09:54:45.42
RCP-20260306-	1	2026-03-06 20:40:25.735
LAY-20260306-	2	2026-03-06 20:48:29.849
RCP-20260311-	2	2026-03-11 19:53:42.021
RCP-20260312-	1	2026-03-12 18:59:14.628
RCP-20260315-	12	2026-03-15 10:59:31.903
\.


--
-- Data for Name: return_items; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.return_items (id, return_id, item_id, qty, unit_price, line_total, is_resellable) FROM stdin;
e40c2d35-44a8-415a-8f31-0f3e9efaed74	b890ca86-c92b-4de7-b501-94a6bebcf566	626ea2f0-0e04-4377-8583-baf96f3efc6d	1.000	200000.00	200000.00	t
804cdb11-8279-455d-a21f-f33cde107ed5	c6c42662-03b8-46fc-a98d-c22b2f577d99	9e88ba50-67c1-4a0f-9417-63050c04cd63	1.000	10000.00	10000.00	t
7c84b70c-4f3c-407c-a647-59fd272d3002	ce78250c-cd56-4bed-810c-41759f03bf8b	4a780635-cedd-484d-a529-e12090ebd933	1.000	34534.00	34534.00	t
fd19d153-6326-499c-9e4b-2a2a08574d58	a17d1aee-4dfd-4767-bebd-722aab9a41f7	9e88ba50-67c1-4a0f-9417-63050c04cd63	1.000	10000.00	10000.00	t
ef893180-f2ca-416a-b6ac-3eb7bb79932d	621b42dc-ee40-4617-b296-37ee4e873d32	626ea2f0-0e04-4377-8583-baf96f3efc6d	1.000	200000.00	200000.00	t
fd6c1d2a-a7ff-4674-9727-6ce47426717c	788e7d34-e72a-40ab-ae39-8be350728e76	0d6bd511-f05e-4578-8af7-57ba11ee2e22	1.000	28000.00	28000.00	t
ec6a7243-ded5-413f-bf70-37cac0daaeaa	fe679a9b-d1fc-48ee-90dc-d1138b561b2e	9e88ba50-67c1-4a0f-9417-63050c04cd63	1.000	10000.00	10000.00	t
667d8efd-2423-493a-86d4-ae31bc1fc7be	ead9761b-98a8-4d9e-8875-a7a6f010c784	9e88ba50-67c1-4a0f-9417-63050c04cd63	1.000	10000.00	10000.00	t
ad56ef6f-4da1-4590-bac5-641aa26075ab	256feb7c-5a86-441e-b385-e714dd74f700	c51839f5-304f-4bd2-b47f-c533f9281afc	1.000	12000.00	12000.00	t
a326167a-4188-402a-aec5-b9399aa0b362	735e706e-8897-49e6-992b-5011b42ad695	4a780635-cedd-484d-a529-e12090ebd933	1.000	34534.00	34534.00	t
6c9054e7-4663-4b0e-8286-02d6b20102fe	925688d4-0050-471f-a218-d765f3b237e8	9e88ba50-67c1-4a0f-9417-63050c04cd63	1.000	10000.00	10000.00	t
1e63e901-9578-448c-84dd-0ef01dfe00e3	df806978-2cd4-461a-b93d-e424aa2eff54	c51839f5-304f-4bd2-b47f-c533f9281afc	1.000	12000.00	12000.00	t
\.


--
-- Data for Name: return_payments; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.return_payments (id, return_id, amount, payment_method, bank_account_id, reference, created_at) FROM stdin;
d35a3012-ced2-4f50-9e72-ce46edba1834	b890ca86-c92b-4de7-b501-94a6bebcf566	200000.00	CASH	\N	\N	2026-03-15 12:32:12.204
b841467f-7d19-4177-9ebf-d80a8073f0f9	c6c42662-03b8-46fc-a98d-c22b2f577d99	2000.00	CASH	\N	\N	2026-03-15 13:15:13.684
8141ab80-b3e6-4227-9c45-29ca531306fc	c6c42662-03b8-46fc-a98d-c22b2f577d99	8000.00	MOBILE_TRANSFER	2f3b97af-d909-4030-89a2-2b48d062e96e	\N	2026-03-15 13:15:13.684
b84de7dc-0075-4b9a-bc58-47d4be695c23	ce78250c-cd56-4bed-810c-41759f03bf8b	34534.00	CASH	\N	\N	2026-03-15 14:06:08.469
3c67d538-5c9e-41fe-9ca8-807187f366e2	a17d1aee-4dfd-4767-bebd-722aab9a41f7	10000.00	CASH	\N	\N	2026-03-15 14:07:18.528
0f366a2a-247d-495a-abc2-2ea0ec62e168	621b42dc-ee40-4617-b296-37ee4e873d32	200000.00	CASH	\N	\N	2026-03-15 14:23:43.26
1c5a38f6-574d-445c-b150-4082354cbcd7	788e7d34-e72a-40ab-ae39-8be350728e76	19000.00	CASH	\N	\N	2026-03-15 16:19:26.981
7a61a32c-98f2-4cbe-9f1f-1e5799beced3	788e7d34-e72a-40ab-ae39-8be350728e76	9000.00	MOBILE_TRANSFER	2f3b97af-d909-4030-89a2-2b48d062e96e	\N	2026-03-15 16:19:26.981
45782610-c78c-46e4-aff3-8e1e6420032c	fe679a9b-d1fc-48ee-90dc-d1138b561b2e	10000.00	CASH	\N	\N	2026-03-15 16:23:46.879
119c3aa9-f4f5-4ef1-8a12-99364f574aec	ead9761b-98a8-4d9e-8875-a7a6f010c784	10000.00	CASH	\N	\N	2026-03-15 16:24:32.33
3acf6174-c670-42b3-8fad-71181b209d00	256feb7c-5a86-441e-b385-e714dd74f700	12000.00	CASH	\N	\N	2026-03-15 16:25:13.626
636d178e-f904-4a4f-a7a7-81e83feaf618	735e706e-8897-49e6-992b-5011b42ad695	34534.00	CASH	\N	\N	2026-03-15 17:05:23.906
3a661e7d-08a0-419c-b360-9634f6d924bd	925688d4-0050-471f-a218-d765f3b237e8	10000.00	CASH	\N	\N	2026-03-15 17:21:41.541
51703933-0a45-4989-99bc-f423df7431a5	df806978-2cd4-461a-b93d-e424aa2eff54	12000.00	CASH	\N	\N	2026-03-15 18:05:10.457
\.


--
-- Data for Name: returns; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.returns (id, return_number, sale_id, customer_id, return_type, total_amount, refund_method, bank_account_id, notes, created_at, updated_at) FROM stdin;
b890ca86-c92b-4de7-b501-94a6bebcf566	RET-20260315-000001	8d886244-b8b8-406a-b2e2-0359cdf98a1e	\N	REFUND	200000.00	CASH	\N	\N	2026-03-15 12:32:12.204	2026-03-15 12:32:12.204
c6c42662-03b8-46fc-a98d-c22b2f577d99	RET-20260315-000002	8d886244-b8b8-406a-b2e2-0359cdf98a1e	\N	REFUND	10000.00	CASH	\N	\N	2026-03-15 13:15:13.684	2026-03-15 13:15:13.684
ce78250c-cd56-4bed-810c-41759f03bf8b	RET-20260315-000003	8d886244-b8b8-406a-b2e2-0359cdf98a1e	\N	REFUND	34534.00	CASH	\N	\N	2026-03-15 14:06:08.469	2026-03-15 14:06:08.469
a17d1aee-4dfd-4767-bebd-722aab9a41f7	RET-20260315-000004	690b2b8b-f18d-4ae2-a721-bf9c40dc7776	\N	REFUND	10000.00	CASH	\N	\N	2026-03-15 14:07:18.528	2026-03-15 14:07:18.528
621b42dc-ee40-4617-b296-37ee4e873d32	RET-20260315-000005	5941f647-c976-4372-83a0-531beb468a45	\N	REFUND	200000.00	CASH	\N	\N	2026-03-15 14:23:43.26	2026-03-15 14:23:43.26
788e7d34-e72a-40ab-ae39-8be350728e76	RET-20260315-000006	c9c9ee3a-51a5-47b8-9563-2e5b70634d1b	\N	REFUND	28000.00	CASH	\N	\N	2026-03-15 16:19:26.981	2026-03-15 16:19:26.981
fe679a9b-d1fc-48ee-90dc-d1138b561b2e	RET-20260315-000007	c9c9ee3a-51a5-47b8-9563-2e5b70634d1b	\N	REFUND	10000.00	CASH	\N	\N	2026-03-15 16:23:46.879	2026-03-15 16:23:46.879
ead9761b-98a8-4d9e-8875-a7a6f010c784	RET-20260315-000008	fed5c431-8074-4f7c-9b3a-b2c57afe9f7c	\N	REFUND	10000.00	CASH	\N	\N	2026-03-15 16:24:32.33	2026-03-15 16:24:32.33
256feb7c-5a86-441e-b385-e714dd74f700	RET-20260315-000009	ef157c9a-964d-4fd7-958e-7ddc9cf204a0	\N	REFUND	12000.00	CASH	\N	\N	2026-03-15 16:25:13.626	2026-03-15 16:25:13.626
735e706e-8897-49e6-992b-5011b42ad695	RET-20260315-000010	df77f6b7-feb2-411b-89af-acec451b078f	\N	REFUND	34534.00	CASH	\N	\N	2026-03-15 17:05:23.906	2026-03-15 17:05:23.906
925688d4-0050-471f-a218-d765f3b237e8	RET-20260315-000011	5ca126ff-0a2c-4965-aa97-dcca517010c0	\N	REFUND	10000.00	CASH	\N	\N	2026-03-15 17:21:41.541	2026-03-15 17:21:41.541
df806978-2cd4-461a-b93d-e424aa2eff54	RET-20260315-000012	f7a494f5-b9c2-45cd-a744-7a0a071ea506	\N	REFUND	12000.00	CASH	\N	\N	2026-03-15 18:05:10.457	2026-03-15 18:05:10.457
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.roles (id, name, description, permissions, created_at, updated_at) FROM stdin;
57f6f22b-f7e2-4742-820f-0639f0a954dc	ADMIN	Full system access	["*"]	2026-02-24 09:37:27.567	2026-02-24 09:37:27.567
1ded283e-59d7-4827-9e8a-3c2248f498d3	CASHIER	POS and sales operations	["sales", "customers", "items:read"]	2026-02-24 09:37:27.582	2026-02-24 09:37:27.582
58ae2b9b-b389-453c-bc8d-8b5ba732048b	BASEMENT_MANAGER	Inventory and transfer management	["inventory", "transfers", "items"]	2026-02-24 09:37:27.591	2026-02-24 09:37:27.591
8d358045-2e06-4442-b11e-2407ec1adb93	SALESMAN	Sales attribution and transfers	["sales:read", "transfers:read"]	2026-02-24 09:37:27.599	2026-02-24 09:37:27.599
\.


--
-- Data for Name: sale_items; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.sale_items (id, sale_id, item_id, location_id, qty, unit_price, cost_price, line_total) FROM stdin;
18255bd7-ffd0-4313-bdea-88abc3c2335a	afacbf83-c950-4a2e-8f29-cd17359978c5	c51839f5-304f-4bd2-b47f-c533f9281afc	85a97fac-c1b3-4ea6-96e3-158628e3b551	1.000	15000.00	9000.00	15000.00
a1ac3bd5-a8a9-4d7b-8dbc-045ee6794ce0	d98af3f4-c0f8-470f-8058-f49a4f6d19af	c51839f5-304f-4bd2-b47f-c533f9281afc	85a97fac-c1b3-4ea6-96e3-158628e3b551	1.000	12000.00	9000.00	12000.00
1f4d3c65-e74a-4e3f-912a-b8e8a1c9ee15	89639f4d-83c7-459e-8384-81c2cf607314	c51839f5-304f-4bd2-b47f-c533f9281afc	85a97fac-c1b3-4ea6-96e3-158628e3b551	2.000	14000.00	9000.00	28000.00
faa0dba5-54ca-4510-9ab5-09344b4b5d1b	5aaf351f-3192-48df-b19b-37cd31ba0270	c51839f5-304f-4bd2-b47f-c533f9281afc	85a97fac-c1b3-4ea6-96e3-158628e3b551	1.000	15000.00	9000.00	15000.00
31c2a029-babc-4f11-9f0c-bf7f5f9ed3d8	979c9b4c-f732-4e68-9f6c-86f7b0a8c3ad	c51839f5-304f-4bd2-b47f-c533f9281afc	85a97fac-c1b3-4ea6-96e3-158628e3b551	1.000	12000.00	9000.00	12000.00
2f741768-6305-4f08-9110-cdecb65707d4	979c9b4c-f732-4e68-9f6c-86f7b0a8c3ad	fd9823ed-57df-43a8-b518-e35c02fc2121	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	1.000	100.00	80.00	100.00
bd243680-c718-429e-8926-4d44cbe393cd	979c9b4c-f732-4e68-9f6c-86f7b0a8c3ad	f5723b07-4d22-4582-bffc-e7387c3dbe09	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	1.000	50.00	35.00	50.00
78b770e5-be8b-4b28-adf7-b29a97fcdb4d	dfe7e268-b8f8-44fb-a4de-ef7f1dd84eea	1eb254f0-47ba-49da-be9c-ea8ef79d4296	85a97fac-c1b3-4ea6-96e3-158628e3b551	5.000	7000.00	4500.00	35000.00
4aae6897-9b63-4c0e-9bc8-9db19498999a	50154bbd-7513-4e98-991a-c0ca818ed1de	626ea2f0-0e04-4377-8583-baf96f3efc6d	e62acb5a-f9e9-445f-a0fc-a0d74cca1cac	1.000	200000.00	100000.00	200000.00
ddce35be-2dad-4a60-b1b9-3df59cc02e59	5daeeddb-3aea-44de-8624-fa22435327af	626ea2f0-0e04-4377-8583-baf96f3efc6d	e62acb5a-f9e9-445f-a0fc-a0d74cca1cac	1.000	210000.00	100000.00	210000.00
1a1d93bb-4235-45cb-b902-d4aa12757a5a	bb47bf65-96f2-4841-8fc1-14d8326970e9	1eb254f0-47ba-49da-be9c-ea8ef79d4296	85a97fac-c1b3-4ea6-96e3-158628e3b551	1.000	9000.00	4500.00	9000.00
736e0a08-3466-4d0f-bb04-a3c931f96afa	827a9c03-9f29-493d-9823-a1f40d0c3715	c51839f5-304f-4bd2-b47f-c533f9281afc	85a97fac-c1b3-4ea6-96e3-158628e3b551	1.000	15000.00	9000.00	15000.00
47a5ab27-f177-4b79-9759-eaea840fbdc1	f8f4b1b9-b0da-4a85-aafc-080d63e4e975	c51839f5-304f-4bd2-b47f-c533f9281afc	85a97fac-c1b3-4ea6-96e3-158628e3b551	1.000	12000.00	9000.00	12000.00
bdfce809-7f71-40c8-9355-78615be3ac8f	104b3d9d-1420-4445-b9b2-41f897fb4474	626ea2f0-0e04-4377-8583-baf96f3efc6d	e62acb5a-f9e9-445f-a0fc-a0d74cca1cac	1.000	200000.00	100000.00	200000.00
7bd2d3d9-9966-4e01-9fac-7fbe57ab85a4	104b3d9d-1420-4445-b9b2-41f897fb4474	1eb254f0-47ba-49da-be9c-ea8ef79d4296	85a97fac-c1b3-4ea6-96e3-158628e3b551	2.000	7000.00	4500.00	14000.00
e14e3e84-b2a6-430c-8701-711a5695eccf	e4a179a4-066c-4910-a665-3ef4da2357db	1eb254f0-47ba-49da-be9c-ea8ef79d4296	85a97fac-c1b3-4ea6-96e3-158628e3b551	1.000	12000.00	4500.00	12000.00
439b06a4-f6b9-4c12-b6db-5d57f1ea80c8	7e750c23-8ef4-42b5-ae4c-d567ea9060c9	9e88ba50-67c1-4a0f-9417-63050c04cd63	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	1.000	12000.00	9000.00	12000.00
9d270399-68a7-408a-8f6e-f1382da322e2	c7a2e69a-3345-4f72-b6a6-db568cdbc899	9e88ba50-67c1-4a0f-9417-63050c04cd63	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	2.000	10000.00	9000.00	20000.00
5d0160a4-16b0-48e1-9432-c674cc828163	2acc7f9b-86cb-4bfc-bbb0-b98acf2d1554	9e88ba50-67c1-4a0f-9417-63050c04cd63	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	1.000	10000.00	9000.00	10000.00
354959cf-8346-4d62-8033-cb0379274857	7e3d8560-6847-4d76-a2ab-fd5ae6b376a1	9e88ba50-67c1-4a0f-9417-63050c04cd63	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	2.000	12000.00	9000.00	24000.00
f5fe066f-21f1-4359-a2f1-9d324989a104	4c884c5e-8c92-47c7-8489-f142d8cf9e2f	626ea2f0-0e04-4377-8583-baf96f3efc6d	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	1.000	200000.00	100000.00	200000.00
6501bbc2-2149-4fea-8ac6-5ff8b74e375a	b187b9f0-f233-471e-897a-495afead9a0f	1eb254f0-47ba-49da-be9c-ea8ef79d4296	85a97fac-c1b3-4ea6-96e3-158628e3b551	1.000	7000.00	4500.00	7000.00
ab969363-e217-4a96-8147-4b7951a3e0dc	b187b9f0-f233-471e-897a-495afead9a0f	c51839f5-304f-4bd2-b47f-c533f9281afc	85a97fac-c1b3-4ea6-96e3-158628e3b551	1.000	12000.00	9000.00	12000.00
0962a532-242f-4f97-934e-6d109212e8fa	b187b9f0-f233-471e-897a-495afead9a0f	4a780635-cedd-484d-a529-e12090ebd933	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	156.000	34534.00	21234.98	5387304.00
ee4b7de0-32d9-42f0-9d31-2c9fb07f71f3	0a0b07e2-a8ea-4b5d-bdbf-e3dc9233e8ba	4a780635-cedd-484d-a529-e12090ebd933	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	30.000	34534.00	21234.98	1036020.00
86864d35-a3d3-4b51-a04d-46ee63c17d3e	c33a6060-a5d3-41fb-b26f-19f2efa842cc	626ea2f0-0e04-4377-8583-baf96f3efc6d	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	2.000	200000.00	100000.00	400000.00
69a41101-dea3-42b1-b2d7-d49afe109dcc	c33a6060-a5d3-41fb-b26f-19f2efa842cc	9e88ba50-67c1-4a0f-9417-63050c04cd63	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	2.000	10000.00	9000.00	20000.00
19b0fda0-3a8a-4777-8160-2b8570a8fe5b	c33a6060-a5d3-41fb-b26f-19f2efa842cc	1eb254f0-47ba-49da-be9c-ea8ef79d4296	85a97fac-c1b3-4ea6-96e3-158628e3b551	1.000	7000.00	4500.00	7000.00
6674c07e-1ef0-47da-8866-ee2e49e8324e	c33a6060-a5d3-41fb-b26f-19f2efa842cc	0d6bd511-f05e-4578-8af7-57ba11ee2e22	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	2.000	28000.00	23000.00	56000.00
10efa203-6fe0-44bd-81b2-65d370d5294b	c33a6060-a5d3-41fb-b26f-19f2efa842cc	4a780635-cedd-484d-a529-e12090ebd933	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	3.000	34534.00	21234.98	103602.00
248bdfa8-0754-42d7-a273-d6eb3ca137c1	c33a6060-a5d3-41fb-b26f-19f2efa842cc	a3ea97b4-484d-4b76-89a2-643679461cb2	85a97fac-c1b3-4ea6-96e3-158628e3b551	2.000	50000.00	45000.00	100000.00
8efbb5c8-8422-444a-ba67-db658d003ae8	c33a6060-a5d3-41fb-b26f-19f2efa842cc	c51839f5-304f-4bd2-b47f-c533f9281afc	85a97fac-c1b3-4ea6-96e3-158628e3b551	3.000	12000.00	9000.00	36000.00
ceec7e6c-80b8-465e-a3b8-6ff5f4361418	8d886244-b8b8-406a-b2e2-0359cdf98a1e	626ea2f0-0e04-4377-8583-baf96f3efc6d	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	1.000	200000.00	100000.00	200000.00
081cbd3e-95ab-49f0-a952-d9abcdc4f60c	8d886244-b8b8-406a-b2e2-0359cdf98a1e	9e88ba50-67c1-4a0f-9417-63050c04cd63	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	1.000	10000.00	9000.00	10000.00
a10dd366-138e-48e6-b8d7-3ad8afcc6b66	8d886244-b8b8-406a-b2e2-0359cdf98a1e	1eb254f0-47ba-49da-be9c-ea8ef79d4296	85a97fac-c1b3-4ea6-96e3-158628e3b551	1.000	7000.00	4500.00	7000.00
ef8bfdbb-1bd6-4fe7-a185-b3940791f120	8d886244-b8b8-406a-b2e2-0359cdf98a1e	4a780635-cedd-484d-a529-e12090ebd933	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	1.000	34534.00	21234.98	34534.00
ce3f4ee5-70e0-497d-8707-e5cd7c26d63e	690b2b8b-f18d-4ae2-a721-bf9c40dc7776	9e88ba50-67c1-4a0f-9417-63050c04cd63	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	1.000	10000.00	9000.00	10000.00
a7d5ea9b-866e-4ae9-af9b-03a5e7be0284	5941f647-c976-4372-83a0-531beb468a45	626ea2f0-0e04-4377-8583-baf96f3efc6d	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	1.000	200000.00	100000.00	200000.00
fbb6e39b-8442-44c4-81c2-d78ef6cbf9b2	78a2b5d7-d201-4e33-95f1-d53aa9e48f5b	4a780635-cedd-484d-a529-e12090ebd933	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	1.000	34534.00	21234.98	34534.00
a941a46a-58c9-4b09-b856-a2fd402ebe7f	aa13c801-93fa-4163-a940-a8b0d24d730e	4a780635-cedd-484d-a529-e12090ebd933	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	1.000	34534.00	21234.98	34534.00
5a1a4baa-c53d-4330-8b7d-8f71c4b3653b	aa13c801-93fa-4163-a940-a8b0d24d730e	0d6bd511-f05e-4578-8af7-57ba11ee2e22	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	1.000	28000.00	23000.00	28000.00
dc1cea09-4afc-423e-95f0-a10595ad7a62	aa13c801-93fa-4163-a940-a8b0d24d730e	9e88ba50-67c1-4a0f-9417-63050c04cd63	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	1.000	10000.00	9000.00	10000.00
a063721b-4d38-4a1f-a153-718044551237	aa13c801-93fa-4163-a940-a8b0d24d730e	626ea2f0-0e04-4377-8583-baf96f3efc6d	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	1.000	200000.00	100000.00	200000.00
91a578ad-0a78-4696-a593-39ffdaeb0e1c	c9c9ee3a-51a5-47b8-9563-2e5b70634d1b	0d6bd511-f05e-4578-8af7-57ba11ee2e22	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	1.000	28000.00	23000.00	28000.00
6b6f3cee-d0d6-49bf-a7cd-0eb968171937	c9c9ee3a-51a5-47b8-9563-2e5b70634d1b	4a780635-cedd-484d-a529-e12090ebd933	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	1.000	34534.00	21234.98	34534.00
3ceac9d8-8f4a-4d6d-b6e8-fdb836f27224	c9c9ee3a-51a5-47b8-9563-2e5b70634d1b	9e88ba50-67c1-4a0f-9417-63050c04cd63	85a97fac-c1b3-4ea6-96e3-158628e3b551	1.000	10000.00	9000.00	10000.00
d8775f6d-0097-4054-988e-664c31f163da	fed5c431-8074-4f7c-9b3a-b2c57afe9f7c	9e88ba50-67c1-4a0f-9417-63050c04cd63	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	1.000	10000.00	9000.00	10000.00
f908f285-9459-4bae-ae81-3bad18ff631c	ef157c9a-964d-4fd7-958e-7ddc9cf204a0	0d6bd511-f05e-4578-8af7-57ba11ee2e22	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	1.000	28000.00	23000.00	28000.00
0d6a5d03-0c7b-4536-a80d-1cb7515635d1	ef157c9a-964d-4fd7-958e-7ddc9cf204a0	c51839f5-304f-4bd2-b47f-c533f9281afc	85a97fac-c1b3-4ea6-96e3-158628e3b551	1.000	12000.00	9000.00	12000.00
917aefed-6578-411b-a0f9-90cc055d8b15	df77f6b7-feb2-411b-89af-acec451b078f	9e88ba50-67c1-4a0f-9417-63050c04cd63	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	1.000	10000.00	9000.00	10000.00
6322c045-1807-4f2a-84ff-068548ef1a82	df77f6b7-feb2-411b-89af-acec451b078f	9e88ba50-67c1-4a0f-9417-63050c04cd63	85a97fac-c1b3-4ea6-96e3-158628e3b551	1.000	10000.00	9000.00	10000.00
073189fb-24bd-4b5d-8066-de593d425773	df77f6b7-feb2-411b-89af-acec451b078f	0d6bd511-f05e-4578-8af7-57ba11ee2e22	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	1.000	28000.00	23000.00	28000.00
c01315d7-3e9d-4a9d-85c1-04860ff6505e	df77f6b7-feb2-411b-89af-acec451b078f	4a780635-cedd-484d-a529-e12090ebd933	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	1.000	34534.00	21234.98	34534.00
cac42b0c-846d-4b9b-ae34-a78ff0b91a86	5ca126ff-0a2c-4965-aa97-dcca517010c0	626ea2f0-0e04-4377-8583-baf96f3efc6d	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	1.000	200000.00	100000.00	200000.00
577ab40f-5ae9-498c-9067-d1a5305c392f	5ca126ff-0a2c-4965-aa97-dcca517010c0	9e88ba50-67c1-4a0f-9417-63050c04cd63	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	1.000	10000.00	9000.00	10000.00
027073ee-7da7-44c3-97cd-dd3914f313f3	6d361346-f521-4286-a180-56c8f2f51292	0d6bd511-f05e-4578-8af7-57ba11ee2e22	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	1.000	28000.00	23000.00	28000.00
0187a3b6-2401-4635-8c6c-e342c135ce8b	f7a494f5-b9c2-45cd-a744-7a0a071ea506	626ea2f0-0e04-4377-8583-baf96f3efc6d	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	1.000	200000.00	100000.00	200000.00
520339dc-0448-45c8-83b6-3734d129e161	f7a494f5-b9c2-45cd-a744-7a0a071ea506	9e88ba50-67c1-4a0f-9417-63050c04cd63	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	1.000	10000.00	9000.00	10000.00
1686fa84-8f7b-4546-a018-68670fd2b537	f7a494f5-b9c2-45cd-a744-7a0a071ea506	0d6bd511-f05e-4578-8af7-57ba11ee2e22	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	1.000	28000.00	23000.00	28000.00
9073b5be-7d9d-4877-bc34-48d086230637	f7a494f5-b9c2-45cd-a744-7a0a071ea506	4a780635-cedd-484d-a529-e12090ebd933	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	1.000	34534.00	21234.98	34534.00
ce9a1ed2-2716-407d-b3a9-3a1d2cc72770	f7a494f5-b9c2-45cd-a744-7a0a071ea506	a3ea97b4-484d-4b76-89a2-643679461cb2	85a97fac-c1b3-4ea6-96e3-158628e3b551	1.000	50000.00	45000.00	50000.00
0f19b125-192c-49f5-892e-a242d82e4282	f7a494f5-b9c2-45cd-a744-7a0a071ea506	c51839f5-304f-4bd2-b47f-c533f9281afc	85a97fac-c1b3-4ea6-96e3-158628e3b551	1.000	12000.00	9000.00	12000.00
\.


--
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.sales (id, receipt_number, sale_number, cashier_id, customer_id, location_id, salesman_id, total_amount, actual_amount_paid, total_cost, discount, payment_method, status, session_id, notes, refund_amount, refund_method, refund_bank_account_id, cancelled_at, cancelled_by_id, created_at, updated_at) FROM stdin;
afacbf83-c950-4a2e-8f29-cd17359978c5	RCP-20260227-000001	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	15000.00	15000.00	9000.00	0.00	CASH	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2026-02-27 17:32:01.828	2026-02-27 17:32:01.983
827a9c03-9f29-493d-9823-a1f40d0c3715	RCP-20260228-000003	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	15000.00	15000.00	9000.00	0.00	CASH	COMPLETED	51cebc41-c26c-4098-a732-0b2244c0d3dd	\N	\N	\N	\N	\N	\N	2026-02-28 06:15:15.123	2026-02-28 06:15:15.357
d98af3f4-c0f8-470f-8058-f49a4f6d19af	RCP-20260227-000002	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	12000.00	12000.00	9000.00	0.00	CASH	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2026-02-27 17:32:58.959	2026-02-27 17:32:59.149
89639f4d-83c7-459e-8384-81c2cf607314	RCP-20260227-000003	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	28000.00	28000.00	18000.00	0.00	CASH	COMPLETED	b3dc1978-2fd0-40b7-9317-8204ae2d1263	\N	\N	\N	\N	\N	\N	2026-02-27 17:34:08.31	2026-02-27 17:34:08.512
2acc7f9b-86cb-4bfc-bbb0-b98acf2d1554	RCP-20260301-000003	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	10000.00	10000.00	9000.00	0.00	MOBILE_TRANSFER	COMPLETED	bf7ca23e-ea33-4eea-947c-b31fef525067	\N	\N	\N	\N	\N	\N	2026-03-01 09:56:11.897	2026-03-01 09:56:12.09
5aaf351f-3192-48df-b19b-37cd31ba0270	RCP-20260227-000004	\N	efbe8ff4-ad8a-4afb-9d7b-87d46030ceb7	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	15000.00	15000.00	9000.00	0.00	CASH	COMPLETED	b3dc1978-2fd0-40b7-9317-8204ae2d1263	\N	\N	\N	\N	\N	\N	2026-02-27 17:35:24.565	2026-02-27 17:35:25.182
f8f4b1b9-b0da-4a85-aafc-080d63e4e975	RCP-20260228-000004	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	12000.00	12000.00	9000.00	0.00	CASH	COMPLETED	51cebc41-c26c-4098-a732-0b2244c0d3dd	\N	\N	\N	\N	\N	\N	2026-02-28 06:15:26.635	2026-02-28 06:15:26.812
979c9b4c-f732-4e68-9f6c-86f7b0a8c3ad	RCP-20260227-000005	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	12150.00	12150.00	9115.00	0.00	CASH	COMPLETED	b3dc1978-2fd0-40b7-9317-8204ae2d1263	\N	\N	\N	\N	\N	\N	2026-02-27 17:41:16.681	2026-02-27 17:41:17.17
0a0b07e2-a8ea-4b5d-bdbf-e3dc9233e8ba	RCP-20260311-000002	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	1036020.00	1036020.00	637049.40	0.00	CASH	COMPLETED	79cbccf3-27de-41e1-986a-23fecd120d2c	\N	\N	\N	\N	\N	\N	2026-03-11 19:54:21.846	2026-03-11 19:54:22.035
dfe7e268-b8f8-44fb-a4de-ef7f1dd84eea	RCP-20260227-000006	\N	efbe8ff4-ad8a-4afb-9d7b-87d46030ceb7	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	35000.00	35000.00	22500.00	0.00	CASH	COMPLETED	b3dc1978-2fd0-40b7-9317-8204ae2d1263	\N	\N	\N	\N	\N	\N	2026-02-27 17:42:32.183	2026-02-27 17:42:32.816
104b3d9d-1420-4445-b9b2-41f897fb4474	RCP-20260228-000005	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	214000.00	214000.00	109000.00	0.00	CASH	COMPLETED	871731d8-cd49-401c-8264-d99208dad8ae	\N	\N	\N	\N	\N	\N	2026-02-28 06:51:59.855	2026-02-28 06:52:00.1
50154bbd-7513-4e98-991a-c0ca818ed1de	RCP-20260227-000007	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	200000.00	200000.00	100000.00	0.00	CASH	COMPLETED	b3dc1978-2fd0-40b7-9317-8204ae2d1263	\N	\N	\N	\N	\N	\N	2026-02-27 18:17:07.477	2026-02-27 18:17:07.907
5daeeddb-3aea-44de-8624-fa22435327af	RCP-20260228-000001	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	210000.00	210000.00	100000.00	0.00	CASH	COMPLETED	51cebc41-c26c-4098-a732-0b2244c0d3dd	\N	\N	\N	\N	\N	\N	2026-02-28 06:14:29.483	2026-02-28 06:14:29.643
7e3d8560-6847-4d76-a2ab-fd5ae6b376a1	RCP-20260301-000004	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	24000.00	24000.00	18000.00	0.00	MOBILE_TRANSFER	COMPLETED	bf7ca23e-ea33-4eea-947c-b31fef525067	\N	\N	\N	\N	\N	\N	2026-03-01 09:56:46.106	2026-03-01 09:56:46.258
bb47bf65-96f2-4841-8fc1-14d8326970e9	RCP-20260228-000002	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	9000.00	9000.00	4500.00	0.00	CASH	COMPLETED	51cebc41-c26c-4098-a732-0b2244c0d3dd	\N	\N	\N	\N	\N	\N	2026-02-28 06:14:56.621	2026-02-28 06:14:56.852
e4a179a4-066c-4910-a665-3ef4da2357db	RCP-20260228-000006	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	12000.00	12000.00	4500.00	0.00	CASH	COMPLETED	b528d7ab-5fe6-4427-b6a1-ab135e1cf7cd	\N	\N	\N	\N	\N	\N	2026-02-28 08:41:27.677	2026-02-28 08:41:27.857
7e750c23-8ef4-42b5-ae4c-d567ea9060c9	RCP-20260301-000001	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	12000.00	12000.00	9000.00	0.00	CASH	COMPLETED	bf7ca23e-ea33-4eea-947c-b31fef525067	\N	\N	\N	\N	\N	\N	2026-03-01 09:54:45.426	2026-03-01 09:54:45.562
c7a2e69a-3345-4f72-b6a6-db568cdbc899	RCP-20260301-000002	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	20000.00	20000.00	18000.00	0.00	CASH	COMPLETED	bf7ca23e-ea33-4eea-947c-b31fef525067	\N	\N	\N	\N	\N	\N	2026-03-01 09:55:53.592	2026-03-01 09:55:53.768
4c884c5e-8c92-47c7-8489-f142d8cf9e2f	RCP-20260306-000001	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	200000.00	200000.00	100000.00	0.00	SPLIT_PAYMENT	COMPLETED	7024ace6-9bbe-413d-9834-414681ba42df	\N	\N	\N	\N	\N	\N	2026-03-06 20:40:25.745	2026-03-06 20:40:25.892
c33a6060-a5d3-41fb-b26f-19f2efa842cc	RCP-20260312-000001	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	722602.00	722602.00	449204.94	0.00	CASH	COMPLETED	c3b77b12-b3fc-41af-974b-53540b9e9437	\N	\N	\N	\N	\N	\N	2026-03-12 18:59:14.645	2026-03-12 18:59:15.403
5941f647-c976-4372-83a0-531beb468a45	RCP-20260315-000003	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	200000.00	200000.00	100000.00	0.00	SPLIT_PAYMENT	CANCELLED	aab8dd53-8cf0-4400-bc74-bd15fa2daf24	\N	\N	\N	\N	2026-03-15 14:23:43.527	ea4ef3be-834b-4b08-8769-138e6e451957	2026-03-15 14:07:56.307	2026-03-15 14:23:43.529
b187b9f0-f233-471e-897a-495afead9a0f	RCP-20260311-000001	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	5406304.00	5406304.00	3326156.88	0.00	CASH	COMPLETED	\N	\N	\N	\N	\N	\N	\N	2026-03-11 19:53:42.077	2026-03-11 19:53:43.333
aa13c801-93fa-4163-a940-a8b0d24d730e	RCP-20260315-000005	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	272534.00	272534.00	153234.98	0.00	SPLIT_PAYMENT	COMPLETED	aab8dd53-8cf0-4400-bc74-bd15fa2daf24	\N	\N	\N	\N	\N	\N	2026-03-15 14:11:02.228	2026-03-15 14:11:02.575
690b2b8b-f18d-4ae2-a721-bf9c40dc7776	RCP-20260315-000002	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	10000.00	10000.00	9000.00	0.00	CASH	CANCELLED	aab8dd53-8cf0-4400-bc74-bd15fa2daf24	\N	\N	\N	\N	2026-03-15 14:07:18.553	ea4ef3be-834b-4b08-8769-138e6e451957	2026-03-15 14:06:53.686	2026-03-15 14:07:18.557
8d886244-b8b8-406a-b2e2-0359cdf98a1e	RCP-20260315-000001	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	251534.00	251534.00	134734.98	0.00	MOBILE_TRANSFER	COMPLETED	aab8dd53-8cf0-4400-bc74-bd15fa2daf24	\N	\N	\N	\N	\N	\N	2026-03-15 10:59:31.911	2026-03-15 10:59:32.228
78a2b5d7-d201-4e33-95f1-d53aa9e48f5b	RCP-20260315-000004	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	34534.00	34534.00	21234.98	0.00	SPLIT_PAYMENT	COMPLETED	aab8dd53-8cf0-4400-bc74-bd15fa2daf24	\N	\N	\N	\N	\N	\N	2026-03-15 14:10:15.142	2026-03-15 14:10:15.37
fed5c431-8074-4f7c-9b3a-b2c57afe9f7c	RCP-20260315-000007	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	10000.00	10000.00	9000.00	0.00	CASH	CANCELLED	aab8dd53-8cf0-4400-bc74-bd15fa2daf24	\N	\N	\N	\N	2026-03-15 16:24:32.353	ea4ef3be-834b-4b08-8769-138e6e451957	2026-03-15 16:24:11.688	2026-03-15 16:24:32.355
c9c9ee3a-51a5-47b8-9563-2e5b70634d1b	RCP-20260315-000006	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	72534.00	72534.00	53234.98	0.00	CASH	COMPLETED	aab8dd53-8cf0-4400-bc74-bd15fa2daf24	\N	\N	\N	\N	\N	\N	2026-03-15 16:18:07.922	2026-03-15 16:18:08.186
ef157c9a-964d-4fd7-958e-7ddc9cf204a0	RCP-20260315-000008	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	40000.00	40000.00	32000.00	0.00	CASH	COMPLETED	aab8dd53-8cf0-4400-bc74-bd15fa2daf24	\N	\N	\N	\N	\N	\N	2026-03-15 16:24:48.635	2026-03-15 16:24:48.942
df77f6b7-feb2-411b-89af-acec451b078f	RCP-20260315-000009	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	82534.00	82534.00	62234.98	0.00	MOBILE_TRANSFER	COMPLETED	aab8dd53-8cf0-4400-bc74-bd15fa2daf24	\N	\N	\N	\N	\N	\N	2026-03-15 17:03:32.057	2026-03-15 17:03:32.444
5ca126ff-0a2c-4965-aa97-dcca517010c0	RCP-20260315-000010	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	210000.00	210000.00	109000.00	0.00	CASH	COMPLETED	aab8dd53-8cf0-4400-bc74-bd15fa2daf24	\N	\N	\N	\N	\N	\N	2026-03-15 17:19:08.034	2026-03-15 17:19:18.919
6d361346-f521-4286-a180-56c8f2f51292	RCP-20260315-000011	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	28000.00	28000.00	23000.00	0.00	CASH	COMPLETED	1a5d533b-3fce-4f2c-9044-f8838f7845ec	\N	\N	\N	\N	\N	\N	2026-03-15 18:02:27.678	2026-03-15 18:02:27.876
f7a494f5-b9c2-45cd-a744-7a0a071ea506	RCP-20260315-000012	\N	ea4ef3be-834b-4b08-8769-138e6e451957	\N	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	\N	334534.00	334534.00	207234.98	0.00	CASH	COMPLETED	1a5d533b-3fce-4f2c-9044-f8838f7845ec	\N	\N	\N	\N	\N	\N	2026-03-15 18:04:34.477	2026-03-15 18:04:34.92
\.


--
-- Data for Name: special_incomes; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.special_incomes (id, amount, category, description, reference, payment_method, bank_account_id, session_id, recorded_by, created_at) FROM stdin;
f49d8f67-6915-4c48-9460-9feb2a23135f	90000.00	OTHER	qw	\N	\N	\N	bf7ca23e-ea33-4eea-947c-b31fef525067	ea4ef3be-834b-4b08-8769-138e6e451957	2026-03-01 09:55:40.184
\.


--
-- Data for Name: stocks; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.stocks (id, item_id, location_id, qty, reserved_qty, version, created_at, updated_at) FROM stdin;
6acc5837-1576-4a8f-be6f-3ef92099651c	9e88ba50-67c1-4a0f-9417-63050c04cd63	85a97fac-c1b3-4ea6-96e3-158628e3b551	4.000	0.000	3	2026-03-06 20:35:25.469	2026-03-15 17:03:32.423
d0f64e5a-032a-48ba-bcca-02675b124544	fd9823ed-57df-43a8-b518-e35c02fc2121	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	100.000	0.000	1	2026-02-24 09:37:29.514	2026-03-15 17:53:42.253
eb540bca-0969-417d-a84d-1d8073edbfa9	f5723b07-4d22-4582-bffc-e7387c3dbe09	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	50.000	0.000	1	2026-02-24 09:37:29.524	2026-03-15 17:53:42.268
50d2ed3c-7a4b-4e92-993e-993136d0b10d	626ea2f0-0e04-4377-8583-baf96f3efc6d	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	6.000	0.000	9	2026-03-06 20:39:22.316	2026-03-15 18:04:34.877
4d085fe9-9581-47da-adae-1958c54e5af2	9e88ba50-67c1-4a0f-9417-63050c04cd63	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	8.000	1.000	16	2026-03-01 09:54:13.608	2026-03-15 18:04:34.883
64b14d9f-6d45-468f-93c5-00ff1f8e6b9e	0d6bd511-f05e-4578-8af7-57ba11ee2e22	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	83.000	0.000	8	2026-03-12 18:53:58.26	2026-03-15 18:04:34.888
0b9285e0-8144-4cea-8bd3-46fd2a66daae	626ea2f0-0e04-4377-8583-baf96f3efc6d	e62acb5a-f9e9-445f-a0fc-a0d74cca1cac	0.000	0.000	3	2026-02-27 18:16:48.998	2026-03-06 20:49:43.582
80b83315-1d20-4d88-bc83-c6a0566c74e4	4a780635-cedd-484d-a529-e12090ebd933	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	37.000	0.000	11	2026-03-11 19:52:32.617	2026-03-15 18:04:34.894
b26e9d6a-1862-40d4-8aaa-0a1642eafc07	a3ea97b4-484d-4b76-89a2-643679461cb2	85a97fac-c1b3-4ea6-96e3-158628e3b551	20.000	0.000	2	2026-03-12 18:52:51.964	2026-03-15 18:04:34.9
c6500d86-931b-4c35-a951-585cda15b87b	c51839f5-304f-4bd2-b47f-c533f9281afc	85a97fac-c1b3-4ea6-96e3-158628e3b551	14.000	0.000	14	2026-02-27 17:30:58.886	2026-03-15 18:05:10.48
94cab9b0-facd-48cc-a221-76bc92e350aa	1eb254f0-47ba-49da-be9c-ea8ef79d4296	85a97fac-c1b3-4ea6-96e3-158628e3b551	0.000	0.000	7	2026-02-27 17:40:27.014	2026-03-15 10:59:32.213
\.


--
-- Data for Name: supplier_payments; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.supplier_payments (id, vendor_id, amount, payment_method, bank_account_id, reference, notes, created_at) FROM stdin;
\.


--
-- Data for Name: transfer_items; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.transfer_items (id, transfer_id, item_id, qty) FROM stdin;
\.


--
-- Data for Name: transfers; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.transfers (id, transfer_number, from_location_id, to_location_id, salesman_id, assigned_to_id, received_by_id, purpose, status, notes, created_by_id, sent_at, received_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.users (id, username, email, password_hash, full_name, role_id, default_location_id, is_active, last_login_at, created_at, updated_at, commission_rate) FROM stdin;
a44b9a75-30ba-4e5f-ba26-72d212dde10b	basement	basement@webpos.local	$2a$12$Rq5UPER83brUu.veXoOcT.X74mO/lJgcnD5ooskL8MQzcW8mGGeEK	Basement Manager	58ae2b9b-b389-453c-bc8d-8b5ba732048b	85a97fac-c1b3-4ea6-96e3-158628e3b551	t	\N	2026-02-24 09:37:29.48	2026-02-24 09:37:29.48	0.00
ea4ef3be-834b-4b08-8769-138e6e451957	admin	admin@webpos.local	$2a$12$De2oxb4XmpPrdFvLS3Wp.uZCyE6Pf6UeV4FlF4gLK2qc2byTjMR32	System Administrator	57f6f22b-f7e2-4742-820f-0639f0a954dc	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	t	2026-03-15 17:14:42.271	2026-02-24 09:37:28.064	2026-03-15 17:14:42.273	1.00
efbe8ff4-ad8a-4afb-9d7b-87d46030ceb7	salesman	salesman@webpos.local	$2a$12$BRQEE/x6WV8Phho4nr67l.0ik5MVhkLMUSlBY.TuXEdd4oyU.ArDe	Default Salesman	8d358045-2e06-4442-b11e-2407ec1adb93	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	t	2026-02-27 17:42:13.906	2026-02-24 09:37:29.058	2026-02-27 17:42:13.907	1.00
f274cc03-9bfc-41f9-a048-c78bf5dbcfa1	cashier	cashier@webpos.local	$2a$12$wFwnxP5vKC4bAAb4P/9Is.3Z1EkKAx0o4XJm8Ogyu8Pc1dVI/HLCC	Default Cashier	1ded283e-59d7-4827-9e8a-3c2248f498d3	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	t	2026-03-11 19:50:44.864	2026-02-24 09:37:28.64	2026-03-11 19:50:44.874	0.00
1bcb44f1-d51e-4572-98c4-af72865c58c4	asna12	sefshj@gmail.com	$2a$12$I4fp70giBZpgpQhsWPh64uZ8M6c3ppNiD7eGNfpDj0hx5QlimHbUK	sfhs jks	8d358045-2e06-4442-b11e-2407ec1adb93	3dad2e75-53d6-48db-8fb9-a328aeca3dbb	t	\N	2026-03-12 18:55:10.005	2026-03-12 18:55:10.005	0.20
\.


--
-- Data for Name: vendors; Type: TABLE DATA; Schema: public; Owner: pos_user
--

COPY public.vendors (id, name, contact_person, phone, email, address, balance, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: bank_account_transactions bank_account_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.bank_account_transactions
    ADD CONSTRAINT bank_account_transactions_pkey PRIMARY KEY (id);


--
-- Name: bank_accounts bank_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_pkey PRIMARY KEY (id);


--
-- Name: cash_flow_entries cash_flow_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.cash_flow_entries
    ADD CONSTRAINT cash_flow_entries_pkey PRIMARY KEY (id);


--
-- Name: commissions commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_pkey PRIMARY KEY (id);


--
-- Name: credit_payments credit_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.credit_payments
    ADD CONSTRAINT credit_payments_pkey PRIMARY KEY (id);


--
-- Name: credits credits_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.credits
    ADD CONSTRAINT credits_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: daily_sessions daily_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.daily_sessions
    ADD CONSTRAINT daily_sessions_pkey PRIMARY KEY (id);


--
-- Name: defect_notes defect_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.defect_notes
    ADD CONSTRAINT defect_notes_pkey PRIMARY KEY (id);


--
-- Name: defect_photos defect_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.defect_photos
    ADD CONSTRAINT defect_photos_pkey PRIMARY KEY (id);


--
-- Name: defect_vendor_moves defect_vendor_moves_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.defect_vendor_moves
    ADD CONSTRAINT defect_vendor_moves_pkey PRIMARY KEY (id);


--
-- Name: defects defects_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.defects
    ADD CONSTRAINT defects_pkey PRIMARY KEY (id);


--
-- Name: error_logs error_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: item_images item_images_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.item_images
    ADD CONSTRAINT item_images_pkey PRIMARY KEY (id);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: layaway_items layaway_items_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.layaway_items
    ADD CONSTRAINT layaway_items_pkey PRIMARY KEY (id);


--
-- Name: layaway_payments layaway_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.layaway_payments
    ADD CONSTRAINT layaway_payments_pkey PRIMARY KEY (id);


--
-- Name: layaways layaways_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.layaways
    ADD CONSTRAINT layaways_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: receipt_sequences receipt_sequences_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.receipt_sequences
    ADD CONSTRAINT receipt_sequences_pkey PRIMARY KEY (date_prefix);


--
-- Name: return_items return_items_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.return_items
    ADD CONSTRAINT return_items_pkey PRIMARY KEY (id);


--
-- Name: return_payments return_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.return_payments
    ADD CONSTRAINT return_payments_pkey PRIMARY KEY (id);


--
-- Name: returns returns_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sale_items sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_pkey PRIMARY KEY (id);


--
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- Name: special_incomes special_incomes_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.special_incomes
    ADD CONSTRAINT special_incomes_pkey PRIMARY KEY (id);


--
-- Name: stocks stocks_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.stocks
    ADD CONSTRAINT stocks_pkey PRIMARY KEY (id);


--
-- Name: supplier_payments supplier_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.supplier_payments
    ADD CONSTRAINT supplier_payments_pkey PRIMARY KEY (id);


--
-- Name: transfer_items transfer_items_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.transfer_items
    ADD CONSTRAINT transfer_items_pkey PRIMARY KEY (id);


--
-- Name: transfers transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_created_at_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX audit_logs_created_at_idx ON public.audit_logs USING btree (created_at);


--
-- Name: audit_logs_entity_type_created_at_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX audit_logs_entity_type_created_at_idx ON public.audit_logs USING btree (entity_type, created_at);


--
-- Name: audit_logs_entity_type_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX audit_logs_entity_type_idx ON public.audit_logs USING btree (entity_type);


--
-- Name: audit_logs_user_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX audit_logs_user_id_idx ON public.audit_logs USING btree (user_id);


--
-- Name: bank_account_transactions_created_at_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX bank_account_transactions_created_at_idx ON public.bank_account_transactions USING btree (created_at);


--
-- Name: bank_accounts_account_number_key; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE UNIQUE INDEX bank_accounts_account_number_key ON public.bank_accounts USING btree (account_number);


--
-- Name: commissions_created_at_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX commissions_created_at_idx ON public.commissions USING btree (created_at);


--
-- Name: commissions_sale_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX commissions_sale_id_idx ON public.commissions USING btree (sale_id);


--
-- Name: commissions_user_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX commissions_user_id_idx ON public.commissions USING btree (user_id);


--
-- Name: credits_customer_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX credits_customer_id_idx ON public.credits USING btree (customer_id);


--
-- Name: credits_due_date_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX credits_due_date_idx ON public.credits USING btree (due_date);


--
-- Name: credits_status_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX credits_status_idx ON public.credits USING btree (status);


--
-- Name: customers_id_number_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX customers_id_number_idx ON public.customers USING btree (id_number);


--
-- Name: customers_name_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX customers_name_idx ON public.customers USING btree (name);


--
-- Name: customers_phone_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX customers_phone_idx ON public.customers USING btree (phone);


--
-- Name: daily_sessions_business_date_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX daily_sessions_business_date_idx ON public.daily_sessions USING btree (business_date);


--
-- Name: daily_sessions_status_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX daily_sessions_status_idx ON public.daily_sessions USING btree (status);


--
-- Name: defects_customer_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX defects_customer_id_idx ON public.defects USING btree (customer_id);


--
-- Name: defects_defect_number_key; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE UNIQUE INDEX defects_defect_number_key ON public.defects USING btree (defect_number);


--
-- Name: defects_intake_date_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX defects_intake_date_idx ON public.defects USING btree (intake_date);


--
-- Name: defects_item_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX defects_item_id_idx ON public.defects USING btree (item_id);


--
-- Name: defects_status_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX defects_status_idx ON public.defects USING btree (status);


--
-- Name: error_logs_created_at_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX error_logs_created_at_idx ON public.error_logs USING btree (created_at);


--
-- Name: error_logs_severity_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX error_logs_severity_idx ON public.error_logs USING btree (severity);


--
-- Name: expenses_category_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX expenses_category_idx ON public.expenses USING btree (category);


--
-- Name: expenses_created_at_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX expenses_created_at_idx ON public.expenses USING btree (created_at);


--
-- Name: expenses_expense_date_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX expenses_expense_date_idx ON public.expenses USING btree (expense_date);


--
-- Name: expenses_session_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX expenses_session_id_idx ON public.expenses USING btree (session_id);


--
-- Name: item_images_item_id_key; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE UNIQUE INDEX item_images_item_id_key ON public.item_images USING btree (item_id);


--
-- Name: items_barcode_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX items_barcode_idx ON public.items USING btree (barcode);


--
-- Name: items_barcode_key; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE UNIQUE INDEX items_barcode_key ON public.items USING btree (barcode);


--
-- Name: items_brand_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX items_brand_idx ON public.items USING btree (brand);


--
-- Name: items_category_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX items_category_idx ON public.items USING btree (category);


--
-- Name: items_is_active_brand_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX items_is_active_brand_idx ON public.items USING btree (is_active, brand);


--
-- Name: items_is_active_category_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX items_is_active_category_idx ON public.items USING btree (is_active, category);


--
-- Name: items_name_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX items_name_idx ON public.items USING btree (name);


--
-- Name: items_sku_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX items_sku_idx ON public.items USING btree (sku);


--
-- Name: items_sku_key; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE UNIQUE INDEX items_sku_key ON public.items USING btree (sku);


--
-- Name: items_vendor_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX items_vendor_id_idx ON public.items USING btree (vendor_id);


--
-- Name: layaways_customer_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX layaways_customer_id_idx ON public.layaways USING btree (customer_id);


--
-- Name: layaways_layaway_number_key; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE UNIQUE INDEX layaways_layaway_number_key ON public.layaways USING btree (layaway_number);


--
-- Name: layaways_status_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX layaways_status_idx ON public.layaways USING btree (status);


--
-- Name: locations_name_key; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE UNIQUE INDEX locations_name_key ON public.locations USING btree (name);


--
-- Name: notifications_created_at_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX notifications_created_at_idx ON public.notifications USING btree (created_at);


--
-- Name: notifications_is_read_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX notifications_is_read_idx ON public.notifications USING btree (is_read);


--
-- Name: notifications_type_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX notifications_type_idx ON public.notifications USING btree (type);


--
-- Name: payments_bank_account_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX payments_bank_account_id_idx ON public.payments USING btree (bank_account_id);


--
-- Name: payments_sale_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX payments_sale_id_idx ON public.payments USING btree (sale_id);


--
-- Name: return_payments_bank_account_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX return_payments_bank_account_id_idx ON public.return_payments USING btree (bank_account_id);


--
-- Name: return_payments_return_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX return_payments_return_id_idx ON public.return_payments USING btree (return_id);


--
-- Name: returns_customer_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX returns_customer_id_idx ON public.returns USING btree (customer_id);


--
-- Name: returns_return_number_key; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE UNIQUE INDEX returns_return_number_key ON public.returns USING btree (return_number);


--
-- Name: returns_sale_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX returns_sale_id_idx ON public.returns USING btree (sale_id);


--
-- Name: roles_name_key; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);


--
-- Name: sale_items_item_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX sale_items_item_id_idx ON public.sale_items USING btree (item_id);


--
-- Name: sale_items_location_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX sale_items_location_id_idx ON public.sale_items USING btree (location_id);


--
-- Name: sale_items_sale_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX sale_items_sale_id_idx ON public.sale_items USING btree (sale_id);


--
-- Name: sales_cashier_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX sales_cashier_id_idx ON public.sales USING btree (cashier_id);


--
-- Name: sales_created_at_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX sales_created_at_idx ON public.sales USING btree (created_at);


--
-- Name: sales_customer_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX sales_customer_id_idx ON public.sales USING btree (customer_id);


--
-- Name: sales_location_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX sales_location_id_idx ON public.sales USING btree (location_id);


--
-- Name: sales_location_id_status_created_at_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX sales_location_id_status_created_at_idx ON public.sales USING btree (location_id, status, created_at);


--
-- Name: sales_receipt_number_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX sales_receipt_number_idx ON public.sales USING btree (receipt_number);


--
-- Name: sales_receipt_number_key; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE UNIQUE INDEX sales_receipt_number_key ON public.sales USING btree (receipt_number);


--
-- Name: sales_sale_number_key; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE UNIQUE INDEX sales_sale_number_key ON public.sales USING btree (sale_number);


--
-- Name: sales_salesman_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX sales_salesman_id_idx ON public.sales USING btree (salesman_id);


--
-- Name: sales_session_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX sales_session_id_idx ON public.sales USING btree (session_id);


--
-- Name: sales_status_created_at_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX sales_status_created_at_idx ON public.sales USING btree (status, created_at);


--
-- Name: sales_status_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX sales_status_idx ON public.sales USING btree (status);


--
-- Name: stocks_item_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX stocks_item_id_idx ON public.stocks USING btree (item_id);


--
-- Name: stocks_item_id_location_id_key; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE UNIQUE INDEX stocks_item_id_location_id_key ON public.stocks USING btree (item_id, location_id);


--
-- Name: stocks_location_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX stocks_location_id_idx ON public.stocks USING btree (location_id);


--
-- Name: stocks_qty_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX stocks_qty_idx ON public.stocks USING btree (qty);


--
-- Name: supplier_payments_bank_account_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX supplier_payments_bank_account_id_idx ON public.supplier_payments USING btree (bank_account_id);


--
-- Name: supplier_payments_vendor_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX supplier_payments_vendor_id_idx ON public.supplier_payments USING btree (vendor_id);


--
-- Name: transfers_created_at_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX transfers_created_at_idx ON public.transfers USING btree (created_at);


--
-- Name: transfers_created_by_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX transfers_created_by_id_idx ON public.transfers USING btree (created_by_id);


--
-- Name: transfers_from_location_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX transfers_from_location_id_idx ON public.transfers USING btree (from_location_id);


--
-- Name: transfers_status_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX transfers_status_idx ON public.transfers USING btree (status);


--
-- Name: transfers_to_location_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX transfers_to_location_id_idx ON public.transfers USING btree (to_location_id);


--
-- Name: transfers_transfer_number_key; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE UNIQUE INDEX transfers_transfer_number_key ON public.transfers USING btree (transfer_number);


--
-- Name: users_default_location_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX users_default_location_id_idx ON public.users USING btree (default_location_id);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_role_id_idx; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE INDEX users_role_id_idx ON public.users USING btree (role_id);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: pos_user
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: bank_account_transactions bank_account_transactions_from_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.bank_account_transactions
    ADD CONSTRAINT bank_account_transactions_from_account_id_fkey FOREIGN KEY (from_account_id) REFERENCES public.bank_accounts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: bank_account_transactions bank_account_transactions_to_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.bank_account_transactions
    ADD CONSTRAINT bank_account_transactions_to_account_id_fkey FOREIGN KEY (to_account_id) REFERENCES public.bank_accounts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cash_flow_entries cash_flow_entries_dest_bank_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.cash_flow_entries
    ADD CONSTRAINT cash_flow_entries_dest_bank_id_fkey FOREIGN KEY (dest_bank_id) REFERENCES public.bank_accounts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cash_flow_entries cash_flow_entries_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.cash_flow_entries
    ADD CONSTRAINT cash_flow_entries_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.daily_sessions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cash_flow_entries cash_flow_entries_source_bank_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.cash_flow_entries
    ADD CONSTRAINT cash_flow_entries_source_bank_id_fkey FOREIGN KEY (source_bank_id) REFERENCES public.bank_accounts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cash_flow_entries cash_flow_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.cash_flow_entries
    ADD CONSTRAINT cash_flow_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: commissions commissions_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: commissions commissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: credit_payments credit_payments_bank_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.credit_payments
    ADD CONSTRAINT credit_payments_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: credit_payments credit_payments_credit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.credit_payments
    ADD CONSTRAINT credit_payments_credit_id_fkey FOREIGN KEY (credit_id) REFERENCES public.credits(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: credits credits_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.credits
    ADD CONSTRAINT credits_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: credits credits_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.credits
    ADD CONSTRAINT credits_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: daily_sessions daily_sessions_closed_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.daily_sessions
    ADD CONSTRAINT daily_sessions_closed_by_id_fkey FOREIGN KEY (closed_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: daily_sessions daily_sessions_opened_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.daily_sessions
    ADD CONSTRAINT daily_sessions_opened_by_id_fkey FOREIGN KEY (opened_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: defect_notes defect_notes_defect_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.defect_notes
    ADD CONSTRAINT defect_notes_defect_id_fkey FOREIGN KEY (defect_id) REFERENCES public.defects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: defect_photos defect_photos_defect_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.defect_photos
    ADD CONSTRAINT defect_photos_defect_id_fkey FOREIGN KEY (defect_id) REFERENCES public.defects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: defect_vendor_moves defect_vendor_moves_defect_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.defect_vendor_moves
    ADD CONSTRAINT defect_vendor_moves_defect_id_fkey FOREIGN KEY (defect_id) REFERENCES public.defects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: defect_vendor_moves defect_vendor_moves_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.defect_vendor_moves
    ADD CONSTRAINT defect_vendor_moves_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: defects defects_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.defects
    ADD CONSTRAINT defects_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: defects defects_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.defects
    ADD CONSTRAINT defects_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: error_logs error_logs_resolved_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_resolved_by_id_fkey FOREIGN KEY (resolved_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: error_logs error_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: expenses expenses_bank_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: expenses expenses_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: expenses expenses_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.daily_sessions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: item_images item_images_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.item_images
    ADD CONSTRAINT item_images_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: items items_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: layaway_items layaway_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.layaway_items
    ADD CONSTRAINT layaway_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: layaway_items layaway_items_layaway_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.layaway_items
    ADD CONSTRAINT layaway_items_layaway_id_fkey FOREIGN KEY (layaway_id) REFERENCES public.layaways(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: layaway_payments layaway_payments_bank_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.layaway_payments
    ADD CONSTRAINT layaway_payments_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: layaway_payments layaway_payments_layaway_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.layaway_payments
    ADD CONSTRAINT layaway_payments_layaway_id_fkey FOREIGN KEY (layaway_id) REFERENCES public.layaways(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: layaways layaways_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.layaways
    ADD CONSTRAINT layaways_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payments payments_bank_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: return_items return_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.return_items
    ADD CONSTRAINT return_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: return_items return_items_return_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.return_items
    ADD CONSTRAINT return_items_return_id_fkey FOREIGN KEY (return_id) REFERENCES public.returns(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: return_payments return_payments_bank_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.return_payments
    ADD CONSTRAINT return_payments_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: return_payments return_payments_return_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.return_payments
    ADD CONSTRAINT return_payments_return_id_fkey FOREIGN KEY (return_id) REFERENCES public.returns(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: returns returns_bank_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: returns returns_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: returns returns_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sale_items sale_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sale_items sale_items_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sale_items sale_items_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sales sales_cancelled_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_cancelled_by_id_fkey FOREIGN KEY (cancelled_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sales sales_cashier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_cashier_id_fkey FOREIGN KEY (cashier_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sales sales_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sales sales_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sales sales_salesman_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_salesman_id_fkey FOREIGN KEY (salesman_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sales sales_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.daily_sessions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: special_incomes special_incomes_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.special_incomes
    ADD CONSTRAINT special_incomes_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: special_incomes special_incomes_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.special_incomes
    ADD CONSTRAINT special_incomes_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.daily_sessions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: stocks stocks_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.stocks
    ADD CONSTRAINT stocks_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stocks stocks_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.stocks
    ADD CONSTRAINT stocks_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: supplier_payments supplier_payments_bank_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.supplier_payments
    ADD CONSTRAINT supplier_payments_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: supplier_payments supplier_payments_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.supplier_payments
    ADD CONSTRAINT supplier_payments_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: transfer_items transfer_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.transfer_items
    ADD CONSTRAINT transfer_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: transfer_items transfer_items_transfer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.transfer_items
    ADD CONSTRAINT transfer_items_transfer_id_fkey FOREIGN KEY (transfer_id) REFERENCES public.transfers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: transfers transfers_assigned_to_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_assigned_to_id_fkey FOREIGN KEY (assigned_to_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transfers transfers_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: transfers transfers_from_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_from_location_id_fkey FOREIGN KEY (from_location_id) REFERENCES public.locations(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: transfers transfers_received_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_received_by_id_fkey FOREIGN KEY (received_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transfers transfers_to_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_to_location_id_fkey FOREIGN KEY (to_location_id) REFERENCES public.locations(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: users users_default_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_default_location_id_fkey FOREIGN KEY (default_location_id) REFERENCES public.locations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pos_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict Dic1fr5cXOl4aOzBMvUxJtXRhUQc2CaYSEwMvY21kIjwcY037h9cfT0WQ3oxeaY


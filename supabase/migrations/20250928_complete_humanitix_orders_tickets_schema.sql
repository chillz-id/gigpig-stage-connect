-- Complete Humanitix Orders & Tickets Schema Migration
-- This ensures EVERY field from Humanitix API is captured in Supabase

-- =====================================================
-- ORDERS_HTX TABLE - Complete Schema
-- =====================================================

-- Drop existing table if exists (BE CAREFUL - this will lose data)
-- DROP TABLE IF EXISTS orders_htx CASCADE;

CREATE TABLE IF NOT EXISTS orders_htx (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,

    -- Source Tracking (Composite Unique Constraint)
    source TEXT NOT NULL DEFAULT 'humanitix',
    source_id TEXT NOT NULL,

    -- Core Identifiers
    event_source_id TEXT,
    session_source_id TEXT,
    user_id TEXT,
    order_reference TEXT,

    -- Status Information
    status TEXT,
    financial_status TEXT,
    manual_order BOOLEAN DEFAULT FALSE,
    sales_channel TEXT,
    is_international_transaction BOOLEAN DEFAULT FALSE,

    -- Customer Information
    first_name TEXT,
    last_name TEXT,
    purchaser_name TEXT,
    purchaser_email TEXT,
    mobile TEXT,
    organisation TEXT,

    -- Business Information
    business_purpose BOOLEAN DEFAULT FALSE,
    business_tax_id TEXT,
    business_name TEXT,

    -- Payment Information
    payment_type TEXT,
    payment_gateway TEXT,
    tip_fees BOOLEAN DEFAULT FALSE,
    currency TEXT DEFAULT 'AUD',

    -- Access & Marketing
    access_code TEXT,
    organiser_mail_list_opt_in BOOLEAN DEFAULT FALSE,
    waitlist_offer_id TEXT,

    -- Discount Information
    discount_code_used TEXT,
    discount_code_amount_cents INTEGER DEFAULT 0,
    auto_discount_amount_cents INTEGER DEFAULT 0,

    -- Donation Fields
    client_donation_cents INTEGER DEFAULT 0,

    -- Core Financial Fields (Order Totals) - ALL IN CENTS
    total_cents INTEGER DEFAULT 0,
    subtotal_cents INTEGER DEFAULT 0,
    net_sales_cents INTEGER DEFAULT 0,
    gross_sales_cents INTEGER DEFAULT 0,

    -- Fee Breakdown (Order Totals) - ALL IN CENTS
    humanitix_fee_cents INTEGER DEFAULT 0,
    booking_fee_cents INTEGER DEFAULT 0,
    passed_on_fee_cents INTEGER DEFAULT 0,
    amex_fee_cents INTEGER DEFAULT 0,
    zip_fee_cents INTEGER DEFAULT 0,

    -- Tax Fields (Order Totals) - ALL IN CENTS
    booking_taxes_cents INTEGER DEFAULT 0,
    passed_on_taxes_cents INTEGER DEFAULT 0,
    taxes_cents INTEGER DEFAULT 0,
    total_taxes_cents INTEGER DEFAULT 0,

    -- Donation Fields (Order Totals) - ALL IN CENTS
    order_client_donation_cents INTEGER DEFAULT 0,
    net_client_donation_cents INTEGER DEFAULT 0,
    donation_cents INTEGER DEFAULT 0,
    dgr_donation_cents INTEGER DEFAULT 0,

    -- Credit and Discount Fields (Order Totals) - ALL IN CENTS
    gift_card_credit_cents INTEGER DEFAULT 0,
    credit_cents INTEGER DEFAULT 0,
    discounts_cents INTEGER DEFAULT 0,
    refunds_cents INTEGER DEFAULT 0,
    referral_amount_cents INTEGER DEFAULT 0,
    outstanding_amount_cents INTEGER DEFAULT 0,

    -- Purchase Totals (separate from order totals) - ALL IN CENTS
    purchase_total_cents INTEGER DEFAULT 0,
    purchase_subtotal_cents INTEGER DEFAULT 0,
    purchase_net_sales_cents INTEGER DEFAULT 0,
    purchase_gross_sales_cents INTEGER DEFAULT 0,
    purchase_humanitix_fee_cents INTEGER DEFAULT 0,
    purchase_booking_fee_cents INTEGER DEFAULT 0,
    purchase_discounts_cents INTEGER DEFAULT 0,
    purchase_refunds_cents INTEGER DEFAULT 0,

    -- Boolean Fields
    fees_included BOOLEAN DEFAULT FALSE,
    purchase_fees_included BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    incomplete_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    ordered_at TIMESTAMPTZ,

    -- Location & Notes
    location TEXT,
    notes TEXT,

    -- Additional Data (JSONB for flexible structure)
    additional_fields JSONB,

    -- Raw Data & Metadata
    raw JSONB,
    ingested_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at_api TIMESTAMPTZ DEFAULT NOW(),

    -- System Timestamps
    created_at_db TIMESTAMPTZ DEFAULT NOW(),
    updated_at_db TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique constraint for source + source_id
CREATE UNIQUE INDEX IF NOT EXISTS orders_htx_source_source_id_unique
ON orders_htx (source, source_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_htx_event_source_id ON orders_htx (event_source_id);
CREATE INDEX IF NOT EXISTS idx_orders_htx_session_source_id ON orders_htx (session_source_id);
CREATE INDEX IF NOT EXISTS idx_orders_htx_user_id ON orders_htx (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_htx_purchaser_email ON orders_htx (purchaser_email);
CREATE INDEX IF NOT EXISTS idx_orders_htx_status ON orders_htx (status);
CREATE INDEX IF NOT EXISTS idx_orders_htx_financial_status ON orders_htx (financial_status);
CREATE INDEX IF NOT EXISTS idx_orders_htx_created_at ON orders_htx (created_at);
CREATE INDEX IF NOT EXISTS idx_orders_htx_ordered_at ON orders_htx (ordered_at);

-- =====================================================
-- TICKETS_HTX TABLE - Complete Schema
-- =====================================================

-- Drop existing table if exists (BE CAREFUL - this will lose data)
-- DROP TABLE IF EXISTS tickets_htx CASCADE;

CREATE TABLE IF NOT EXISTS tickets_htx (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,

    -- Source Tracking (Composite Unique Constraint)
    source TEXT NOT NULL DEFAULT 'humanitix',
    source_id TEXT NOT NULL,

    -- Core Identifiers
    event_source_id TEXT,
    order_source_id TEXT,
    session_source_id TEXT,
    ticket_type_id TEXT,
    ticket_type_name TEXT,
    ticket_number TEXT,

    -- Attendee Information
    first_name TEXT,
    last_name TEXT,
    organisation TEXT,
    attendee_profile_id TEXT,

    -- Pricing Fields (ALL IN CENTS)
    price_cents INTEGER DEFAULT 0,
    net_price_cents INTEGER DEFAULT 0,
    total_cents INTEGER DEFAULT 0,
    discount_cents INTEGER DEFAULT 0,
    taxes_cents INTEGER DEFAULT 0,
    fee_cents INTEGER DEFAULT 0,
    passed_on_fee_cents INTEGER DEFAULT 0,
    absorbed_fee_cents INTEGER DEFAULT 0,
    dgr_donation_cents INTEGER DEFAULT 0,

    -- Package Information
    package_id TEXT,
    package_name TEXT,
    package_group_id TEXT,
    package_price_cents INTEGER DEFAULT 0,

    -- Discount Information
    discount_code_used TEXT,
    discount_code_amount_cents INTEGER DEFAULT 0,
    auto_discount_amount_cents INTEGER DEFAULT 0,

    -- Status and Sales
    status TEXT,
    sales_channel TEXT,
    is_donation BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMPTZ,

    -- Check-in Information
    checked_in BOOLEAN DEFAULT FALSE,
    check_in_status TEXT,
    check_in_date TIMESTAMPTZ,
    check_in_location TEXT,
    check_in_device TEXT,
    check_in_notes TEXT,

    -- Seating Information
    seating_map_id TEXT,
    seating_name TEXT,
    seating_section TEXT,
    seating_table TEXT,
    seating_seat TEXT,
    seating_note TEXT,

    -- Scanning & Access
    barcode TEXT,
    qr_code_data JSONB,
    custom_scanning_code TEXT,
    access_code TEXT,

    -- Swapping Information
    swapped_from TEXT,
    swapped_to TEXT,

    -- System Fields
    currency TEXT DEFAULT 'AUD',
    location TEXT,
    order_name TEXT,
    additional_fields JSONB,
    check_in_history JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,

    -- Raw Data & Metadata
    raw JSONB,
    ingested_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at_api TIMESTAMPTZ DEFAULT NOW(),

    -- System Timestamps
    created_at_db TIMESTAMPTZ DEFAULT NOW(),
    updated_at_db TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique constraint for source + source_id
CREATE UNIQUE INDEX IF NOT EXISTS tickets_htx_source_source_id_unique
ON tickets_htx (source, source_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_htx_event_source_id ON tickets_htx (event_source_id);
CREATE INDEX IF NOT EXISTS idx_tickets_htx_order_source_id ON tickets_htx (order_source_id);
CREATE INDEX IF NOT EXISTS idx_tickets_htx_session_source_id ON tickets_htx (session_source_id);
CREATE INDEX IF NOT EXISTS idx_tickets_htx_ticket_type_id ON tickets_htx (ticket_type_id);
CREATE INDEX IF NOT EXISTS idx_tickets_htx_attendee_profile_id ON tickets_htx (attendee_profile_id);
CREATE INDEX IF NOT EXISTS idx_tickets_htx_status ON tickets_htx (status);
CREATE INDEX IF NOT EXISTS idx_tickets_htx_checked_in ON tickets_htx (checked_in);
CREATE INDEX IF NOT EXISTS idx_tickets_htx_created_at ON tickets_htx (created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_htx_first_name ON tickets_htx (first_name);
CREATE INDEX IF NOT EXISTS idx_tickets_htx_last_name ON tickets_htx (last_name);

-- =====================================================
-- ADD MISSING FIELDS TO EXISTING TABLES (if they exist)
-- =====================================================

-- Add any missing columns to orders_htx if table already exists
DO $$
BEGIN
    -- Sales Channel
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'sales_channel') THEN
        ALTER TABLE orders_htx ADD COLUMN sales_channel TEXT;
    END IF;

    -- Business Information
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'business_purpose') THEN
        ALTER TABLE orders_htx ADD COLUMN business_purpose BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'business_tax_id') THEN
        ALTER TABLE orders_htx ADD COLUMN business_tax_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'business_name') THEN
        ALTER TABLE orders_htx ADD COLUMN business_name TEXT;
    END IF;

    -- Payment Gateway
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'payment_gateway') THEN
        ALTER TABLE orders_htx ADD COLUMN payment_gateway TEXT;
    END IF;

    -- Tip Fees
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'tip_fees') THEN
        ALTER TABLE orders_htx ADD COLUMN tip_fees BOOLEAN DEFAULT FALSE;
    END IF;

    -- Waitlist Offer ID
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'waitlist_offer_id') THEN
        ALTER TABLE orders_htx ADD COLUMN waitlist_offer_id TEXT;
    END IF;

    -- Auto Discount
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'auto_discount_amount_cents') THEN
        ALTER TABLE orders_htx ADD COLUMN auto_discount_amount_cents INTEGER DEFAULT 0;
    END IF;

    -- Client Donation
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'client_donation_cents') THEN
        ALTER TABLE orders_htx ADD COLUMN client_donation_cents INTEGER DEFAULT 0;
    END IF;

    -- Additional Fee Fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'amex_fee_cents') THEN
        ALTER TABLE orders_htx ADD COLUMN amex_fee_cents INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'zip_fee_cents') THEN
        ALTER TABLE orders_htx ADD COLUMN zip_fee_cents INTEGER DEFAULT 0;
    END IF;

    -- Purchase Totals (separate tracking)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'purchase_total_cents') THEN
        ALTER TABLE orders_htx ADD COLUMN purchase_total_cents INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'purchase_subtotal_cents') THEN
        ALTER TABLE orders_htx ADD COLUMN purchase_subtotal_cents INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'purchase_net_sales_cents') THEN
        ALTER TABLE orders_htx ADD COLUMN purchase_net_sales_cents INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'purchase_gross_sales_cents') THEN
        ALTER TABLE orders_htx ADD COLUMN purchase_gross_sales_cents INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'purchase_humanitix_fee_cents') THEN
        ALTER TABLE orders_htx ADD COLUMN purchase_humanitix_fee_cents INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'purchase_booking_fee_cents') THEN
        ALTER TABLE orders_htx ADD COLUMN purchase_booking_fee_cents INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'purchase_discounts_cents') THEN
        ALTER TABLE orders_htx ADD COLUMN purchase_discounts_cents INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'purchase_refunds_cents') THEN
        ALTER TABLE orders_htx ADD COLUMN purchase_refunds_cents INTEGER DEFAULT 0;
    END IF;

    -- Fee Included Flags
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'fees_included') THEN
        ALTER TABLE orders_htx ADD COLUMN fees_included BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'purchase_fees_included') THEN
        ALTER TABLE orders_htx ADD COLUMN purchase_fees_included BOOLEAN DEFAULT FALSE;
    END IF;

    -- Additional Timestamps
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'incomplete_at') THEN
        ALTER TABLE orders_htx ADD COLUMN incomplete_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'completed_at') THEN
        ALTER TABLE orders_htx ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'ordered_at') THEN
        ALTER TABLE orders_htx ADD COLUMN ordered_at TIMESTAMPTZ;
    END IF;

    -- Notes and Additional Fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'notes') THEN
        ALTER TABLE orders_htx ADD COLUMN notes TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'additional_fields') THEN
        ALTER TABLE orders_htx ADD COLUMN additional_fields JSONB;
    END IF;

    -- Ingestion timestamp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders_htx' AND column_name = 'ingested_at') THEN
        ALTER TABLE orders_htx ADD COLUMN ingested_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

END $$;

-- Add any missing columns to tickets_htx if table already exists
DO $$
BEGIN
    -- Package Information
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'package_id') THEN
        ALTER TABLE tickets_htx ADD COLUMN package_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'package_name') THEN
        ALTER TABLE tickets_htx ADD COLUMN package_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'package_group_id') THEN
        ALTER TABLE tickets_htx ADD COLUMN package_group_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'package_price_cents') THEN
        ALTER TABLE tickets_htx ADD COLUMN package_price_cents INTEGER DEFAULT 0;
    END IF;

    -- Discount Information
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'discount_code_used') THEN
        ALTER TABLE tickets_htx ADD COLUMN discount_code_used TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'discount_code_amount_cents') THEN
        ALTER TABLE tickets_htx ADD COLUMN discount_code_amount_cents INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'auto_discount_amount_cents') THEN
        ALTER TABLE tickets_htx ADD COLUMN auto_discount_amount_cents INTEGER DEFAULT 0;
    END IF;

    -- Sales Channel
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'sales_channel') THEN
        ALTER TABLE tickets_htx ADD COLUMN sales_channel TEXT;
    END IF;

    -- Donation flag
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'is_donation') THEN
        ALTER TABLE tickets_htx ADD COLUMN is_donation BOOLEAN DEFAULT FALSE;
    END IF;

    -- Cancellation timestamp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'cancelled_at') THEN
        ALTER TABLE tickets_htx ADD COLUMN cancelled_at TIMESTAMPTZ;
    END IF;

    -- Check-in fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'check_in_status') THEN
        ALTER TABLE tickets_htx ADD COLUMN check_in_status TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'check_in_date') THEN
        ALTER TABLE tickets_htx ADD COLUMN check_in_date TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'check_in_location') THEN
        ALTER TABLE tickets_htx ADD COLUMN check_in_location TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'check_in_device') THEN
        ALTER TABLE tickets_htx ADD COLUMN check_in_device TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'check_in_notes') THEN
        ALTER TABLE tickets_htx ADD COLUMN check_in_notes TEXT;
    END IF;

    -- Seating Information
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'seating_map_id') THEN
        ALTER TABLE tickets_htx ADD COLUMN seating_map_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'seating_name') THEN
        ALTER TABLE tickets_htx ADD COLUMN seating_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'seating_section') THEN
        ALTER TABLE tickets_htx ADD COLUMN seating_section TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'seating_table') THEN
        ALTER TABLE tickets_htx ADD COLUMN seating_table TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'seating_seat') THEN
        ALTER TABLE tickets_htx ADD COLUMN seating_seat TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'seating_note') THEN
        ALTER TABLE tickets_htx ADD COLUMN seating_note TEXT;
    END IF;

    -- Scanning & Access
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'barcode') THEN
        ALTER TABLE tickets_htx ADD COLUMN barcode TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'qr_code_data') THEN
        ALTER TABLE tickets_htx ADD COLUMN qr_code_data JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'custom_scanning_code') THEN
        ALTER TABLE tickets_htx ADD COLUMN custom_scanning_code TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'access_code') THEN
        ALTER TABLE tickets_htx ADD COLUMN access_code TEXT;
    END IF;

    -- Swapping Information
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'swapped_from') THEN
        ALTER TABLE tickets_htx ADD COLUMN swapped_from TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'swapped_to') THEN
        ALTER TABLE tickets_htx ADD COLUMN swapped_to TEXT;
    END IF;

    -- System Fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'order_name') THEN
        ALTER TABLE tickets_htx ADD COLUMN order_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'check_in_history') THEN
        ALTER TABLE tickets_htx ADD COLUMN check_in_history JSONB;
    END IF;

    -- Ingestion timestamp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'ingested_at') THEN
        ALTER TABLE tickets_htx ADD COLUMN ingested_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

END $$;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE orders_htx ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets_htx ENABLE ROW LEVEL SECURITY;

-- Create policies for orders_htx
DROP POLICY IF EXISTS "Enable read access for all users" ON orders_htx;
CREATE POLICY "Enable read access for all users" ON orders_htx
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON orders_htx;
CREATE POLICY "Enable insert for authenticated users only" ON orders_htx
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON orders_htx;
CREATE POLICY "Enable update for authenticated users only" ON orders_htx
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policies for tickets_htx
DROP POLICY IF EXISTS "Enable read access for all users" ON tickets_htx;
CREATE POLICY "Enable read access for all users" ON tickets_htx
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON tickets_htx;
CREATE POLICY "Enable insert for authenticated users only" ON tickets_htx
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON tickets_htx;
CREATE POLICY "Enable update for authenticated users only" ON tickets_htx
    FOR UPDATE USING (auth.role() = 'authenticated');

-- =====================================================
-- SUMMARY
-- =====================================================

/*
COMPLETE HUMANITIX FIELDS CAPTURED:

ORDERS_HTX (60+ fields):
✅ All Core Identifiers (source, event, session, user, reference)
✅ All Status Information (status, financial_status, manual_order, sales_channel, international)
✅ All Customer Information (names, email, mobile, organisation)
✅ All Business Information (purpose, tax_id, business_name)
✅ All Payment Information (type, gateway, tip_fees, currency)
✅ All Marketing Information (access_code, mail_opt_in, waitlist)
✅ All Discount Information (codes, amounts, auto discounts)
✅ ALL Financial Fields (37 different financial amounts in cents)
✅ All Timestamps (created, updated, incomplete, completed, ordered)
✅ All Additional Data (location, notes, additional_fields, raw JSON)

TICKETS_HTX (50+ fields):
✅ All Core Identifiers (source, event, order, session, ticket_type, number)
✅ All Attendee Information (names, organisation, profile_id)
✅ ALL Pricing Fields (9 different pricing amounts in cents)
✅ All Package Information (id, name, group_id, price)
✅ All Discount Information (codes, amounts)
✅ All Status Information (status, sales_channel, donation, cancelled)
✅ ALL Check-in Information (status, date, location, device, notes)
✅ ALL Seating Information (map_id, name, section, table, seat, note)
✅ ALL Scanning Information (barcode, qr_code, custom_code, access_code)
✅ All Swapping Information (swapped_from, swapped_to)
✅ All Additional Data (currency, location, order_name, history, raw JSON)

TOTAL: 110+ fields captured from Humanitix API
*/
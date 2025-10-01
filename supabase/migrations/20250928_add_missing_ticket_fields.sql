-- Add missing ticket fields from Humanitix API to tickets_htx table
-- Based on Humanitix OpenAPI spec Ticket schema

DO $$
BEGIN

-- Core API fields that might be missing
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'event_date_id') THEN
    ALTER TABLE tickets_htx ADD COLUMN event_date_id TEXT;
END IF;

-- Discount related fields (from discounts schema reference)
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'discounts') THEN
    ALTER TABLE tickets_htx ADD COLUMN discounts JSONB;
END IF;

-- Seating information already exists but ensure all fields are present
-- (seating_map_id, seating_name, seating_section, seating_table, seating_seat, seating_note already exist)

-- Ticket swap information already exists (swapped_from, swapped_to as JSONB)

-- Additional check-in fields that might be missing
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'check_in_id') THEN
    ALTER TABLE tickets_htx ADD COLUMN check_in_id TEXT;
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets_htx' AND column_name = 'check_in_user_id') THEN
    ALTER TABLE tickets_htx ADD COLUMN check_in_user_id TEXT;
END IF;

-- Location field already exists

-- Comments for clarity on existing fields
COMMENT ON COLUMN tickets_htx.source_id IS 'Ticket ID from Humanitix API (_id field)';
COMMENT ON COLUMN tickets_htx.order_source_id IS 'Order ID from Humanitix API (orderId field)';
COMMENT ON COLUMN tickets_htx.session_source_id IS 'Session/EventDate ID from Humanitix API (eventDateId field)';
COMMENT ON COLUMN tickets_htx.event_source_id IS 'Event ID from Humanitix API (eventId field)';

COMMENT ON COLUMN tickets_htx.ticket_type_id IS 'Ticket type ID from Humanitix API (ticketTypeId field)';
COMMENT ON COLUMN tickets_htx.ticket_type_name IS 'Ticket type name from Humanitix API (ticketTypeName field)';
COMMENT ON COLUMN tickets_htx.ticket_number IS 'Ticket number from Humanitix API (number field)';

COMMENT ON COLUMN tickets_htx.price_cents IS 'Base ticket price in cents (from price field)';
COMMENT ON COLUMN tickets_htx.net_price_cents IS 'Net price in cents (from netPrice field)';
COMMENT ON COLUMN tickets_htx.total_cents IS 'Total ticket price including fees in cents (from total field)';
COMMENT ON COLUMN tickets_htx.discount_cents IS 'Discount amount in cents (from discount field)';
COMMENT ON COLUMN tickets_htx.taxes_cents IS 'Tax amount in cents (from taxes field)';
COMMENT ON COLUMN tickets_htx.fee_cents IS 'Fee amount in cents (from fee field)';
COMMENT ON COLUMN tickets_htx.passed_on_fee_cents IS 'Passed on fee in cents (from passedOnFee field)';
COMMENT ON COLUMN tickets_htx.absorbed_fee_cents IS 'Absorbed fee in cents (from absorbedFee field)';
COMMENT ON COLUMN tickets_htx.dgr_donation_cents IS 'DGR donation in cents (from dgrDonation field)';

COMMENT ON COLUMN tickets_htx.package_id IS 'Package ID if ticket is part of package (from packageId field)';
COMMENT ON COLUMN tickets_htx.package_name IS 'Package name if ticket is part of package (from packageName field)';
COMMENT ON COLUMN tickets_htx.package_group_id IS 'Package group ID (from packageGroupId field)';
COMMENT ON COLUMN tickets_htx.package_price_cents IS 'Package price in cents (from packagePrice field)';

COMMENT ON COLUMN tickets_htx.first_name IS 'Attendee first name (from firstName field)';
COMMENT ON COLUMN tickets_htx.last_name IS 'Attendee last name (from lastName field)';
COMMENT ON COLUMN tickets_htx.organisation IS 'Attendee organisation (from organisation field)';
COMMENT ON COLUMN tickets_htx.attendee_profile_id IS 'Attendee profile ID (from attendeeProfileId field)';

COMMENT ON COLUMN tickets_htx.status IS 'Ticket status: complete, cancelled (from status field)';
COMMENT ON COLUMN tickets_htx.is_donation IS 'Whether ticket is a donation (from isDonation field)';
COMMENT ON COLUMN tickets_htx.cancelled_at IS 'When ticket was cancelled (from cancelledAt field)';

COMMENT ON COLUMN tickets_htx.sales_channel IS 'Sales channel (from salesChannel field)';
COMMENT ON COLUMN tickets_htx.currency IS 'Currency code (from currency field)';
COMMENT ON COLUMN tickets_htx.location IS 'Event location (from location field)';
COMMENT ON COLUMN tickets_htx.order_name IS 'Order name (from orderName field)';

COMMENT ON COLUMN tickets_htx.access_code IS 'Access code for ticket (from accessCode field)';
COMMENT ON COLUMN tickets_htx.custom_scanning_code IS 'Custom scanning code (from customScanningCode field)';
COMMENT ON COLUMN tickets_htx.qr_code_data IS 'QR code data as JSON (from qrCodeData field)';

COMMENT ON COLUMN tickets_htx.seating_map_id IS 'Seating map ID (from seatingLocation.seatingMapId)';
COMMENT ON COLUMN tickets_htx.seating_name IS 'Full seating description (from seatingLocation.name)';
COMMENT ON COLUMN tickets_htx.seating_section IS 'Seating section (from seatingLocation.section)';
COMMENT ON COLUMN tickets_htx.seating_table IS 'Seating table (from seatingLocation.table)';
COMMENT ON COLUMN tickets_htx.seating_seat IS 'Seating seat (from seatingLocation.seat)';
COMMENT ON COLUMN tickets_htx.seating_note IS 'Seating note (from seatingLocation.note)';

COMMENT ON COLUMN tickets_htx.checked_in IS 'Whether ticket has been checked in (from checkIn.checkedIn)';
COMMENT ON COLUMN tickets_htx.check_in_status IS 'Check-in status (from checkIn.status)';
COMMENT ON COLUMN tickets_htx.check_in_date IS 'Check-in timestamp (from checkIn.date)';
COMMENT ON COLUMN tickets_htx.check_in_location IS 'Check-in location (from checkIn.location)';
COMMENT ON COLUMN tickets_htx.check_in_device IS 'Check-in device (from checkIn.device)';
COMMENT ON COLUMN tickets_htx.check_in_notes IS 'Check-in notes (from checkIn.notes)';
COMMENT ON COLUMN tickets_htx.check_in_history IS 'Full check-in history as JSON (from checkInHistory field)';

COMMENT ON COLUMN tickets_htx.swapped_from IS 'Ticket swap source info as JSON (from swappedFrom field)';
COMMENT ON COLUMN tickets_htx.swapped_to IS 'Ticket swap destination info as JSON (from swappedTo field)';

COMMENT ON COLUMN tickets_htx.additional_fields IS 'Additional fields as JSON (from additionalFields field)';
COMMENT ON COLUMN tickets_htx.raw IS 'Complete raw API response as JSON';

COMMENT ON COLUMN tickets_htx.created_at IS 'Ticket creation timestamp (from createdAt field)';
COMMENT ON COLUMN tickets_htx.updated_at IS 'Ticket last update timestamp (from updatedAt field)';
COMMENT ON COLUMN tickets_htx.ingested_at IS 'When this record was ingested into Supabase';

END $$;
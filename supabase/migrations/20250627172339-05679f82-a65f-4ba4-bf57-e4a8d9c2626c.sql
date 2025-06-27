
-- Add essential columns to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 0;

-- Update some columns that might already exist but ensure they have proper defaults
UPDATE events SET tickets_sold = COALESCE(tickets_sold, 0) WHERE tickets_sold IS NULL;
UPDATE events SET comedian_slots = COALESCE(comedian_slots, 5) WHERE comedian_slots IS NULL;
UPDATE events SET ticket_price = COALESCE(ticket_price, 0) WHERE ticket_price IS NULL;

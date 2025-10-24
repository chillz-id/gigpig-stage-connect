-- Create manager_profiles table for manager-specific data
-- Managers represent comedians and handle their bookings and career management

CREATE TABLE IF NOT EXISTS public.manager_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  agency_name TEXT,
  agency_abn TEXT,
  agency_website TEXT,
  specialization TEXT[] DEFAULT '{}', -- e.g., ['stand_up', 'improv', 'corporate', 'mc']
  years_experience INTEGER,
  roster_size INTEGER DEFAULT 0,
  commission_rate DECIMAL(5,2), -- e.g., 15.00 for 15%
  bio TEXT,
  phone TEXT,
  office_address TEXT,
  services_offered TEXT[] DEFAULT '{}', -- e.g., ['booking_negotiation', 'career_development', 'marketing', 'tour_management']
  accepting_new_clients BOOLEAN DEFAULT true,
  linkedin_url TEXT,
  instagram_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create manager_comedian_relationships table to track which comedians a manager represents
CREATE TABLE IF NOT EXISTS public.manager_comedian_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES manager_profiles(id) ON DELETE CASCADE,
  comedian_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'active', 'inactive', 'terminated')) DEFAULT 'active',
  commission_rate DECIMAL(5,2), -- Can override manager's default rate
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  contract_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(manager_id, comedian_id)
);

-- Create manager_booking_requests table for booking requests made on behalf of comedians
CREATE TABLE IF NOT EXISTS public.manager_booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES manager_profiles(id) ON DELETE CASCADE,
  comedian_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  promoter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('draft', 'sent', 'accepted', 'declined', 'negotiating', 'confirmed', 'cancelled')) DEFAULT 'draft',
  requested_fee DECIMAL(10,2),
  agreed_fee DECIMAL(10,2),
  event_date DATE,
  event_details TEXT,
  manager_notes TEXT,
  response_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create manager_contracts table for contract management
CREATE TABLE IF NOT EXISTS public.manager_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES manager_profiles(id) ON DELETE CASCADE,
  comedian_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  contract_type TEXT CHECK (contract_type IN ('representation', 'event_booking', 'tour', 'other')) NOT NULL,
  contract_url TEXT NOT NULL,
  signed_date DATE,
  start_date DATE,
  end_date DATE,
  value DECIMAL(10,2),
  status TEXT CHECK (status IN ('draft', 'pending_signature', 'active', 'completed', 'terminated')) DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for manager_profiles
ALTER TABLE manager_profiles ENABLE ROW LEVEL SECURITY;

-- Public can view manager profiles (for discovery)
CREATE POLICY "Public can view manager profiles" ON manager_profiles
  FOR SELECT USING (true);

-- Managers can update their own profile
CREATE POLICY "Managers can update own profile" ON manager_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Managers can insert their own profile
CREATE POLICY "Managers can insert own profile" ON manager_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Enable RLS for manager_comedian_relationships
ALTER TABLE manager_comedian_relationships ENABLE ROW LEVEL SECURITY;

-- Managers and their comedians can view relationships
CREATE POLICY "View manager-comedian relationships" ON manager_comedian_relationships
  FOR SELECT USING (
    auth.uid() = manager_id OR
    auth.uid() = comedian_id OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role::text IN ('admin', 'promoter')
    )
  );

-- Managers can create relationships
CREATE POLICY "Managers can create relationships" ON manager_comedian_relationships
  FOR INSERT WITH CHECK (auth.uid() = manager_id);

-- Managers and comedians can update relationships
CREATE POLICY "Update manager-comedian relationships" ON manager_comedian_relationships
  FOR UPDATE USING (
    auth.uid() = manager_id OR
    auth.uid() = comedian_id
  );

-- Managers can delete relationships
CREATE POLICY "Managers can delete relationships" ON manager_comedian_relationships
  FOR DELETE USING (auth.uid() = manager_id);

-- Enable RLS for manager_booking_requests
ALTER TABLE manager_booking_requests ENABLE ROW LEVEL SECURITY;

-- Managers, comedians, and promoters can view relevant booking requests
CREATE POLICY "View manager booking requests" ON manager_booking_requests
  FOR SELECT USING (
    auth.uid() = manager_id OR
    auth.uid() = comedian_id OR
    auth.uid() = promoter_id OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role::text = 'admin'
    )
  );

-- Managers can create booking requests
CREATE POLICY "Managers can create booking requests" ON manager_booking_requests
  FOR INSERT WITH CHECK (auth.uid() = manager_id);

-- Managers and promoters can update booking requests
CREATE POLICY "Update manager booking requests" ON manager_booking_requests
  FOR UPDATE USING (
    auth.uid() = manager_id OR
    auth.uid() = promoter_id
  );

-- Managers can delete their booking requests
CREATE POLICY "Managers can delete booking requests" ON manager_booking_requests
  FOR DELETE USING (auth.uid() = manager_id);

-- Enable RLS for manager_contracts
ALTER TABLE manager_contracts ENABLE ROW LEVEL SECURITY;

-- Managers, comedians, and admins can view relevant contracts
CREATE POLICY "View manager contracts" ON manager_contracts
  FOR SELECT USING (
    auth.uid() = manager_id OR
    auth.uid() = comedian_id OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role::text = 'admin'
    )
  );

-- Managers can create contracts
CREATE POLICY "Managers can create contracts" ON manager_contracts
  FOR INSERT WITH CHECK (auth.uid() = manager_id);

-- Managers can update their contracts
CREATE POLICY "Managers can update contracts" ON manager_contracts
  FOR UPDATE USING (auth.uid() = manager_id);

-- Managers and admins can delete contracts
CREATE POLICY "Managers can delete contracts" ON manager_contracts
  FOR DELETE USING (
    auth.uid() = manager_id OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role::text = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX idx_manager_profiles_accepting_clients ON manager_profiles(accepting_new_clients);
CREATE INDEX idx_manager_comedian_relationships_manager ON manager_comedian_relationships(manager_id);
CREATE INDEX idx_manager_comedian_relationships_comedian ON manager_comedian_relationships(comedian_id);
CREATE INDEX idx_manager_comedian_relationships_status ON manager_comedian_relationships(status);
CREATE INDEX idx_manager_booking_requests_manager ON manager_booking_requests(manager_id);
CREATE INDEX idx_manager_booking_requests_comedian ON manager_booking_requests(comedian_id);
CREATE INDEX idx_manager_booking_requests_status ON manager_booking_requests(status);
CREATE INDEX idx_manager_contracts_manager ON manager_contracts(manager_id);
CREATE INDEX idx_manager_contracts_comedian ON manager_contracts(comedian_id);
CREATE INDEX idx_manager_contracts_status ON manager_contracts(status);

-- Create function to check if user has manager profile
CREATE OR REPLACE FUNCTION has_manager_profile(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM manager_profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql;

-- Create function to update manager roster size
CREATE OR REPLACE FUNCTION update_manager_roster_size()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE manager_profiles
  SET roster_size = (
    SELECT COUNT(*)
    FROM manager_comedian_relationships
    WHERE manager_id = COALESCE(NEW.manager_id, OLD.manager_id)
    AND status = 'active'
  )
  WHERE id = COALESCE(NEW.manager_id, OLD.manager_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_manager_profiles_updated_at
  BEFORE UPDATE ON manager_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manager_comedian_relationships_updated_at
  BEFORE UPDATE ON manager_comedian_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manager_booking_requests_updated_at
  BEFORE UPDATE ON manager_booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manager_contracts_updated_at
  BEFORE UPDATE ON manager_contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to auto-update roster size
CREATE TRIGGER update_manager_roster_size_trigger
  AFTER INSERT OR UPDATE OR DELETE ON manager_comedian_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_manager_roster_size();

-- Add helpful comments
COMMENT ON TABLE manager_profiles IS 'Stores manager-specific profile data for talent managers and agents';
COMMENT ON TABLE manager_comedian_relationships IS 'Tracks which comedians are represented by which managers';
COMMENT ON TABLE manager_booking_requests IS 'Booking requests made by managers on behalf of their comedian clients';
COMMENT ON TABLE manager_contracts IS 'Contract management for managers including representation agreements and event bookings';

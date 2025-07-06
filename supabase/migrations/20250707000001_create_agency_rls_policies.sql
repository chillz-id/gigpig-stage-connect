-- Create Row Level Security policies for Agency Management System

-- RLS policies for agencies table
CREATE POLICY "Agency owners can view their own agencies" ON public.agencies
  FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = id 
      AND mp.user_id = auth.uid()
      AND mp.is_active = true
    )
  );

CREATE POLICY "Agency owners can insert their own agencies" ON public.agencies
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Agency owners and managers can update their agencies" ON public.agencies
  FOR UPDATE USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = id 
      AND mp.user_id = auth.uid()
      AND mp.is_active = true
      AND mp.role IN ('agency_owner', 'primary_manager')
    )
  );

CREATE POLICY "Agency owners can delete their own agencies" ON public.agencies
  FOR DELETE USING (owner_id = auth.uid());

-- RLS policies for manager_profiles table
CREATE POLICY "Managers can view profiles in their agencies" ON public.manager_profiles
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = agency_id 
      AND mp.user_id = auth.uid()
      AND mp.is_active = true
    )
  );

CREATE POLICY "Agency owners can insert manager profiles" ON public.manager_profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    )
  );

CREATE POLICY "Agency owners and managers can update manager profiles" ON public.manager_profiles
  FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = agency_id 
      AND mp.user_id = auth.uid()
      AND mp.is_active = true
      AND mp.role IN ('agency_owner', 'primary_manager')
    )
  );

CREATE POLICY "Agency owners can delete manager profiles" ON public.manager_profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    )
  );

-- RLS policies for artist_management table
CREATE POLICY "Artists and managers can view artist management records" ON public.artist_management
  FOR SELECT USING (
    artist_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = agency_id 
      AND mp.user_id = auth.uid()
      AND mp.is_active = true
    )
  );

CREATE POLICY "Agency managers can insert artist management records" ON public.artist_management
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = agency_id 
      AND mp.user_id = auth.uid()
      AND mp.is_active = true
      AND mp.role IN ('agency_owner', 'primary_manager', 'co_manager')
    )
  );

CREATE POLICY "Agency managers can update artist management records" ON public.artist_management
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = agency_id 
      AND mp.user_id = auth.uid()
      AND mp.is_active = true
      AND mp.role IN ('agency_owner', 'primary_manager', 'co_manager')
    )
  );

CREATE POLICY "Agency owners can delete artist management records" ON public.artist_management
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    )
  );

-- RLS policies for deal_negotiations table
CREATE POLICY "Deal participants can view deal negotiations" ON public.deal_negotiations
  FOR SELECT USING (
    artist_id = auth.uid() OR
    promoter_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = agency_id 
      AND mp.user_id = auth.uid()
      AND mp.is_active = true
    ) OR
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id 
      AND e.promoter_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.event_co_promoters ecp 
      WHERE ecp.event_id = event_id 
      AND ecp.user_id = auth.uid()
      AND ecp.is_active = true
    )
  );

CREATE POLICY "Agency managers can insert deal negotiations" ON public.deal_negotiations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = agency_id 
      AND mp.user_id = auth.uid()
      AND mp.is_active = true
      AND mp.role IN ('agency_owner', 'primary_manager', 'co_manager')
    )
  );

CREATE POLICY "Deal participants can update deal negotiations" ON public.deal_negotiations
  FOR UPDATE USING (
    artist_id = auth.uid() OR
    promoter_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = agency_id 
      AND mp.user_id = auth.uid()
      AND mp.is_active = true
    ) OR
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id 
      AND e.promoter_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.event_co_promoters ecp 
      WHERE ecp.event_id = event_id 
      AND ecp.user_id = auth.uid()
      AND ecp.is_active = true
    )
  );

CREATE POLICY "Agency owners can delete deal negotiations" ON public.deal_negotiations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    )
  );

-- RLS policies for deal_messages table
CREATE POLICY "Deal participants can view deal messages" ON public.deal_messages
  FOR SELECT USING (
    sender_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.deal_negotiations dn 
      WHERE dn.id = deal_id 
      AND (
        dn.artist_id = auth.uid() OR
        dn.promoter_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.agencies a 
          WHERE a.id = dn.agency_id 
          AND a.owner_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM public.manager_profiles mp 
          WHERE mp.agency_id = dn.agency_id 
          AND mp.user_id = auth.uid()
          AND mp.is_active = true
        ) OR
        EXISTS (
          SELECT 1 FROM public.events e 
          WHERE e.id = dn.event_id 
          AND e.promoter_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM public.event_co_promoters ecp 
          WHERE ecp.event_id = dn.event_id 
          AND ecp.user_id = auth.uid()
          AND ecp.is_active = true
        )
      )
    )
  );

CREATE POLICY "Deal participants can insert deal messages" ON public.deal_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.deal_negotiations dn 
      WHERE dn.id = deal_id 
      AND (
        dn.artist_id = auth.uid() OR
        dn.promoter_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.agencies a 
          WHERE a.id = dn.agency_id 
          AND a.owner_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM public.manager_profiles mp 
          WHERE mp.agency_id = dn.agency_id 
          AND mp.user_id = auth.uid()
          AND mp.is_active = true
        ) OR
        EXISTS (
          SELECT 1 FROM public.events e 
          WHERE e.id = dn.event_id 
          AND e.promoter_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM public.event_co_promoters ecp 
          WHERE ecp.event_id = dn.event_id 
          AND ecp.user_id = auth.uid()
          AND ecp.is_active = true
        )
      )
    )
  );

CREATE POLICY "Message senders can update their own messages" ON public.deal_messages
  FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "Message senders can delete their own messages" ON public.deal_messages
  FOR DELETE USING (sender_id = auth.uid());

-- RLS policies for agency_analytics table
CREATE POLICY "Agency owners and managers can view agency analytics" ON public.agency_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = agency_id 
      AND mp.user_id = auth.uid()
      AND mp.is_active = true
    )
  );

CREATE POLICY "Agency owners can insert agency analytics" ON public.agency_analytics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    )
  );

CREATE POLICY "Agency owners and managers can update agency analytics" ON public.agency_analytics
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = agency_id 
      AND mp.user_id = auth.uid()
      AND mp.is_active = true
      AND mp.role IN ('agency_owner', 'primary_manager')
    )
  );

CREATE POLICY "Agency owners can delete agency analytics" ON public.agency_analytics
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    )
  );

-- Create function to check if user has agency management permissions
CREATE OR REPLACE FUNCTION public.has_agency_permission(
  _user_id UUID,
  _agency_id UUID,
  _required_role TEXT DEFAULT 'manager'
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is agency owner
  IF EXISTS (
    SELECT 1 FROM public.agencies a 
    WHERE a.id = _agency_id 
    AND a.owner_id = _user_id
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is a manager with appropriate role
  IF _required_role = 'manager' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = _agency_id 
      AND mp.user_id = _user_id
      AND mp.is_active = true
    );
  ELSIF _required_role = 'senior_manager' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = _agency_id 
      AND mp.user_id = _user_id
      AND mp.is_active = true
      AND mp.role IN ('agency_owner', 'primary_manager', 'co_manager')
    );
  ELSIF _required_role = 'primary_manager' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = _agency_id 
      AND mp.user_id = _user_id
      AND mp.is_active = true
      AND mp.role IN ('agency_owner', 'primary_manager')
    );
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user can access deal
CREATE OR REPLACE FUNCTION public.can_access_deal(
  _user_id UUID,
  _deal_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.deal_negotiations dn
    WHERE dn.id = _deal_id
    AND (
      dn.artist_id = _user_id OR
      dn.promoter_id = _user_id OR
      EXISTS (
        SELECT 1 FROM public.agencies a 
        WHERE a.id = dn.agency_id 
        AND a.owner_id = _user_id
      ) OR
      EXISTS (
        SELECT 1 FROM public.manager_profiles mp 
        WHERE mp.agency_id = dn.agency_id 
        AND mp.user_id = _user_id
        AND mp.is_active = true
      ) OR
      EXISTS (
        SELECT 1 FROM public.events e 
        WHERE e.id = dn.event_id 
        AND e.promoter_id = _user_id
      ) OR
      EXISTS (
        SELECT 1 FROM public.event_co_promoters ecp 
        WHERE ecp.event_id = dn.event_id 
        AND ecp.user_id = _user_id
        AND ecp.is_active = true
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.has_agency_permission(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_deal(UUID, UUID) TO authenticated;
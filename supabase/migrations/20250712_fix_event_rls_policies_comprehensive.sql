-- Fix Event RLS Policies - Comprehensive Solution
-- This migration consolidates all event RLS policies and fixes authentication errors

-- 1. First, drop ALL existing policies to prevent conflicts
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on events table
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'events'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.events', pol.policyname);
    END LOOP;
END $$;

-- 2. Add co_promoter_ids column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events' 
        AND column_name = 'co_promoter_ids'
    ) THEN
        ALTER TABLE public.events 
        ADD COLUMN co_promoter_ids uuid[] DEFAULT '{}';
    END IF;
END $$;

-- 3. Create new, consolidated RLS policies with clear names and purposes

-- Policy 1: Public can view published events (open, closed, completed)
CREATE POLICY "events_public_view" 
ON public.events 
FOR SELECT 
TO public
USING (
    status IN ('open', 'closed', 'completed')
);

-- Policy 2: Authenticated users can view all events (including drafts they own)
CREATE POLICY "events_authenticated_view" 
ON public.events 
FOR SELECT 
TO authenticated
USING (
    -- Can see all non-draft events
    status != 'draft'
    -- OR can see their own draft events
    OR auth.uid() = promoter_id
    OR auth.uid() = ANY(co_promoter_ids)
    -- OR is admin
    OR EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Policy 3: Event creation - must be authenticated and have promoter role
CREATE POLICY "events_create" 
ON public.events 
FOR INSERT 
TO authenticated
WITH CHECK (
    -- Must be creating event as themselves
    auth.uid() = promoter_id
    -- AND must have promoter or admin role
    AND EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('promoter', 'admin')
    )
);

-- Policy 4: Event updates - owners, co-promoters, and admins
CREATE POLICY "events_update" 
ON public.events 
FOR UPDATE 
TO authenticated
USING (
    -- Is the main promoter
    auth.uid() = promoter_id
    -- OR is a co-promoter
    OR auth.uid() = ANY(co_promoter_ids)
    -- OR is admin
    OR EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
)
WITH CHECK (
    -- Same permissions for WITH CHECK
    auth.uid() = promoter_id
    OR auth.uid() = ANY(co_promoter_ids)
    OR EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Policy 5: Event deletion - only owners and admins
CREATE POLICY "events_delete" 
ON public.events 
FOR DELETE 
TO authenticated
USING (
    -- Is the main promoter
    auth.uid() = promoter_id
    -- OR is admin
    OR EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- 4. Ensure promoter role assignment trigger exists and works correctly
CREATE OR REPLACE FUNCTION public.ensure_user_has_promoter_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user has promoter role, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = NEW.promoter_id 
        AND role = 'promoter'
    ) THEN
        -- Check if user has any role
        IF EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = NEW.promoter_id
        ) THEN
            -- If they only have 'member' role, upgrade to promoter
            IF EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = NEW.promoter_id 
                AND role = 'member'
                AND NOT EXISTS (
                    SELECT 1 FROM public.user_roles 
                    WHERE user_id = NEW.promoter_id 
                    AND role != 'member'
                )
            ) THEN
                -- Update member to promoter
                UPDATE public.user_roles 
                SET role = 'promoter' 
                WHERE user_id = NEW.promoter_id 
                AND role = 'member';
            ELSE
                -- User has other roles, add promoter role
                INSERT INTO public.user_roles (user_id, role)
                VALUES (NEW.promoter_id, 'promoter')
                ON CONFLICT (user_id, role) DO NOTHING;
            END IF;
        ELSE
            -- No roles exist, add promoter role
            INSERT INTO public.user_roles (user_id, role)
            VALUES (NEW.promoter_id, 'promoter')
            ON CONFLICT (user_id, role) DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS ensure_promoter_role_on_event_create ON public.events;
CREATE TRIGGER ensure_promoter_role_on_event_create
    AFTER INSERT ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_user_has_promoter_role();

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_promoter_id ON public.events(promoter_id);
CREATE INDEX IF NOT EXISTS idx_events_co_promoter_ids ON public.events USING GIN(co_promoter_ids);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON public.user_roles(user_id, role);

-- 6. Grant necessary permissions
GRANT ALL ON public.events TO authenticated;
GRANT SELECT ON public.events TO anon;

-- 7. Add helpful comments
COMMENT ON POLICY "events_public_view" ON public.events IS 
'Allows public/anonymous users to view published events (open, closed, completed status)';

COMMENT ON POLICY "events_authenticated_view" ON public.events IS 
'Allows authenticated users to view all non-draft events, plus their own draft events';

COMMENT ON POLICY "events_create" ON public.events IS 
'Allows authenticated users with promoter or admin role to create events';

COMMENT ON POLICY "events_update" ON public.events IS 
'Allows event owners, co-promoters, and admins to update events';

COMMENT ON POLICY "events_delete" ON public.events IS 
'Allows event owners and admins to delete events';

COMMENT ON COLUMN public.events.co_promoter_ids IS 
'Array of user IDs who are co-promoters of this event and have edit permissions';
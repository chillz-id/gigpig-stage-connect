-- Temporarily disable RLS on agencies table to test creation
-- This is for debugging only

-- Disable RLS temporarily
ALTER TABLE public.agencies DISABLE ROW LEVEL SECURITY;

-- Grant insert permissions for testing
GRANT INSERT ON public.agencies TO authenticated;
GRANT SELECT ON public.agencies TO authenticated;
GRANT UPDATE ON public.agencies TO authenticated;
GRANT DELETE ON public.agencies TO authenticated;
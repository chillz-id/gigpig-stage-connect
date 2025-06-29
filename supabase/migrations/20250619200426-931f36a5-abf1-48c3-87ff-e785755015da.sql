
-- Add foreign key constraints to properly link contact_requests to profiles
ALTER TABLE contact_requests 
DROP CONSTRAINT IF EXISTS contact_requests_requester_id_fkey;

ALTER TABLE contact_requests 
DROP CONSTRAINT IF EXISTS contact_requests_comedian_id_fkey;

-- Add the correct foreign key constraints
ALTER TABLE contact_requests 
ADD CONSTRAINT contact_requests_requester_id_fkey 
FOREIGN KEY (requester_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE contact_requests 
ADD CONSTRAINT contact_requests_comedian_id_fkey 
FOREIGN KEY (comedian_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Make participant_id nullable to allow pending invitations
ALTER TABLE deal_participants ALTER COLUMN participant_id DROP NOT NULL;

-- Add invitation tracking columns
ALTER TABLE deal_participants ADD COLUMN participant_email TEXT;
ALTER TABLE deal_participants ADD COLUMN invitation_status TEXT
  CHECK (invitation_status IN ('pending', 'accepted', 'declined'));
ALTER TABLE deal_participants ADD COLUMN invited_at TIMESTAMPTZ;

-- Add constraint: Must have either participant_id OR participant_email
ALTER TABLE deal_participants
  ADD CONSTRAINT check_participant_or_email
  CHECK (participant_id IS NOT NULL OR participant_email IS NOT NULL);

-- Create index for invitation queries
CREATE INDEX idx_deal_participants_invitation_status
  ON deal_participants(invitation_status) WHERE invitation_status IS NOT NULL;
CREATE INDEX idx_deal_participants_email
  ON deal_participants(participant_email) WHERE participant_email IS NOT NULL;

COMMENT ON COLUMN deal_participants.participant_email IS 'Email of invited partner (used when participant_id is NULL)';
COMMENT ON COLUMN deal_participants.invitation_status IS 'Invitation status for pending partners';
COMMENT ON COLUMN deal_participants.invited_at IS 'Timestamp when invitation was sent';

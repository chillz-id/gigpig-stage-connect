-- Create push_subscriptions table for PWA notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- Grant permissions
GRANT ALL ON push_subscriptions TO authenticated;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  stage_name TEXT,
  bio TEXT,
  location TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  membership TEXT DEFAULT 'free' CHECK (membership IN ('free', 'pro', 'premium')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user roles table
CREATE TYPE public.user_role AS ENUM ('comedian', 'promoter', 'admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  venue_name TEXT NOT NULL,
  venue_address TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 120,
  comedian_slots INTEGER DEFAULT 5,
  pay_per_comedian DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  requirements TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('draft', 'open', 'closed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  comedian_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  message TEXT,
  applied_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  UNIQUE (event_id, comedian_id)
);

-- Create vouches table
CREATE TABLE public.vouches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vouchee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (voucher_id, vouchee_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create payments/subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'cancelled', 'past_due')),
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'premium')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create orders table for one-time payments
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for events
CREATE POLICY "Anyone can view open events" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Promoters can manage own events" ON public.events FOR ALL TO authenticated USING (auth.uid() = promoter_id);

-- RLS Policies for applications
CREATE POLICY "Users can view applications for their events or own applications" ON public.applications FOR SELECT TO authenticated 
USING (
  auth.uid() = comedian_id OR 
  auth.uid() IN (SELECT promoter_id FROM public.events WHERE id = event_id)
);
CREATE POLICY "Comedians can insert own applications" ON public.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = comedian_id);
CREATE POLICY "Comedians can update own applications" ON public.applications FOR UPDATE TO authenticated USING (auth.uid() = comedian_id);
CREATE POLICY "Promoters can update applications for their events" ON public.applications FOR UPDATE TO authenticated 
USING (auth.uid() IN (SELECT promoter_id FROM public.events WHERE id = event_id));

-- RLS Policies for vouches
CREATE POLICY "Users can view all vouches" ON public.vouches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create vouches" ON public.vouches FOR INSERT TO authenticated WITH CHECK (auth.uid() = voucher_id);

-- RLS Policies for messages
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT TO authenticated 
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own received messages" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = recipient_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can manage subscriptions" ON public.subscriptions FOR ALL WITH CHECK (true);

-- RLS Policies for orders
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can manage orders" ON public.orders FOR ALL WITH CHECK (true);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1))
  );
  
  -- Set default role as comedian
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'comedian');
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile and role on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to send notifications
CREATE OR REPLACE FUNCTION public.send_notification(
  _user_id UUID,
  _type TEXT,
  _title TEXT,
  _message TEXT,
  _data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (_user_id, _type, _title, _message, _data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Schedule cleanup tasks (run daily at 2 AM)
SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 2 * * *',
  $$
  DELETE FROM public.notifications 
  WHERE created_at < now() - INTERVAL '30 days' 
    AND read_at IS NOT NULL;
  $$
);

-- Schedule reminder notifications for upcoming events (run every hour)
SELECT cron.schedule(
  'event-reminders',
  '0 * * * *',
  $$
  SELECT public.send_notification(
    e.promoter_id,
    'event_reminder',
    'Upcoming Event Reminder',
    'Your event "' || e.title || '" is happening in less than 24 hours.',
    json_build_object('event_id', e.id)::jsonb
  )
  FROM public.events e
  WHERE e.event_date > now() 
    AND e.event_date <= now() + INTERVAL '24 hours'
    AND e.status = 'open'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n 
      WHERE n.user_id = e.promoter_id 
        AND n.type = 'event_reminder'
        AND n.data->>'event_id' = e.id::text
        AND n.created_at > now() - INTERVAL '25 hours'
    );
  $$
);

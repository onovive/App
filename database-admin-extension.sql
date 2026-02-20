-- PeriodiQ Admin Dashboard Extension - Database Schema
-- Run this in your Supabase SQL Editor after the base database.sql

-- =============================================================================
-- PHASE 1: Extend Profiles Table for Admin Roles & Notifications
-- =============================================================================

-- Add admin role system
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Add notification preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"whatsapp_enabled": true, "email_enabled": true}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_verified BOOLEAN DEFAULT FALSE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone_number) WHERE phone_number IS NOT NULL;

-- =============================================================================
-- PHASE 2: Create Subscriptions Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  hunt_id UUID REFERENCES hunts(id) ON DELETE CASCADE NOT NULL,
  subscription_type TEXT NOT NULL DEFAULT 'one_time' CHECK (subscription_type IN ('one_time', 'recurring')),
  recurrence_pattern TEXT CHECK (recurrence_pattern IN ('weekly', 'biweekly', 'monthly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  next_occurrence TIMESTAMPTZ,
  last_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, hunt_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_hunt_id ON subscriptions(hunt_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_occurrence ON subscriptions(next_occurrence) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- =============================================================================
-- PHASE 3: Create Notifications Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  hunt_id UUID REFERENCES hunts(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('hunt_reminder', 'hunt_starting', 'hunt_started', 'hunt_completed', 'subscription_update')),
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'in_app')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  message_content TEXT NOT NULL,
  twilio_sid TEXT,
  error_message TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_hunt_id ON notifications(hunt_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);

-- =============================================================================
-- PHASE 4: Create Hunt Analytics Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS hunt_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hunt_id UUID REFERENCES hunts(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_registrations INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0,
  average_completion_time INTERVAL,
  last_calculated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hunt_analytics_hunt_id ON hunt_analytics(hunt_id);

-- =============================================================================
-- PHASE 5: Update RLS Policies for Admin Access
-- =============================================================================

-- Admin users can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin users can update any profile
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can view all hunts (already public, but explicit for clarity)
-- Admins can update any hunt
CREATE POLICY "Admins can update any hunt"
  ON hunts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can delete any hunt
CREATE POLICY "Admins can delete any hunt"
  ON hunts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can insert hunts
CREATE POLICY "Admins can create hunts"
  ON hunts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can manage all clues
CREATE POLICY "Admins can insert clues"
  ON clues FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update clues"
  ON clues FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete clues"
  ON clues FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can view all hunt participants
CREATE POLICY "Admins can view all hunt participants"
  ON hunt_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================================================
-- PHASE 6: RLS Policies for Subscriptions
-- =============================================================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions"
  ON subscriptions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================================================
-- PHASE 7: RLS Policies for Notifications
-- =============================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read, etc.)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- System/Admins can insert notifications (needed for notification scheduler)
CREATE POLICY "Admins can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================================================
-- PHASE 8: RLS Policies for Hunt Analytics
-- =============================================================================

ALTER TABLE hunt_analytics ENABLE ROW LEVEL SECURITY;

-- Admins can view analytics
CREATE POLICY "Admins can view analytics"
  ON hunt_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can insert/update analytics
CREATE POLICY "Admins can manage analytics"
  ON hunt_analytics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================================================
-- PHASE 9: Database Functions
-- =============================================================================

-- Function to update updated_at timestamp for subscriptions
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for subscriptions updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- Function to calculate hunt analytics
CREATE OR REPLACE FUNCTION refresh_hunt_analytics(p_hunt_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO hunt_analytics (
    hunt_id,
    total_registrations,
    total_completions,
    average_score,
    average_completion_time,
    last_calculated
  )
  SELECT
    p_hunt_id,
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    AVG(total_score) FILTER (WHERE status = 'completed'),
    AVG(completed_at - started_at) FILTER (WHERE status = 'completed'),
    NOW()
  FROM hunt_participants
  WHERE hunt_id = p_hunt_id
  ON CONFLICT (hunt_id) DO UPDATE SET
    total_registrations = EXCLUDED.total_registrations,
    total_completions = EXCLUDED.total_completions,
    average_score = EXCLUDED.average_score,
    average_completion_time = EXCLUDED.average_completion_time,
    last_calculated = EXCLUDED.last_calculated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- PHASE 10: Seed Data (OPTIONAL - Run manually after creating your first user)
-- =============================================================================

-- To make a user an admin, run this query with your user ID:
-- UPDATE profiles SET role = 'admin' WHERE id = 'YOUR_USER_ID_HERE';

-- Example: Get your user ID from the auth.users table or from the app
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
-- Then update:
-- UPDATE profiles SET role = 'admin' WHERE id = '12345678-1234-1234-1234-123456789abc';

-- =============================================================================
-- Migration Complete!
-- =============================================================================

-- Verify tables were created:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('subscriptions', 'notifications', 'hunt_analytics');

-- Verify indexes were created:
-- SELECT indexname FROM pg_indexes
-- WHERE schemaname = 'public'
-- AND tablename IN ('profiles', 'subscriptions', 'notifications', 'hunt_analytics');

-- Verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('subscriptions', 'notifications', 'hunt_analytics');

-- Add answer_type column to clues table to support image-based answers
ALTER TABLE public.clues 
ADD COLUMN IF NOT EXISTS answer_type TEXT DEFAULT 'text' CHECK (answer_type IN ('text', 'image', 'both'));

-- Add image_url column to submissions table to store uploaded images
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Comment on new columns
COMMENT ON COLUMN public.clues.answer_type IS 'Type of answer: text (text input), image (image upload), or both';
COMMENT ON COLUMN public.submissions.image_url IS 'URL of uploaded image for image-based answers';

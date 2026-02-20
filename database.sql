-- PeriodiQ Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hunts table
CREATE TABLE hunts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  duration_minutes INTEGER NOT NULL,
  max_participants INTEGER,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clues table
CREATE TABLE clues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hunt_id UUID REFERENCES hunts(id) ON DELETE CASCADE NOT NULL,
  order_number INTEGER NOT NULL,
  question TEXT NOT NULL,
  hint TEXT,
  expected_answer TEXT NOT NULL,
  validation_type TEXT NOT NULL DEFAULT 'exact' CHECK (validation_type IN ('exact', 'ai', 'keyword')),
  points INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hunt_id, order_number)
);

-- Hunt participants table
CREATE TABLE hunt_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hunt_id UUID REFERENCES hunts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'active', 'completed', 'abandoned')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  total_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hunt_id, user_id)
);

-- Submissions table
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hunt_participant_id UUID REFERENCES hunt_participants(id) ON DELETE CASCADE NOT NULL,
  clue_id UUID REFERENCES clues(id) ON DELETE CASCADE NOT NULL,
  answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  ai_feedback TEXT,
  points_earned INTEGER NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hunt_participant_id, clue_id)
);

-- Rankings table
CREATE TABLE rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hunt_id UUID REFERENCES hunts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rank INTEGER NOT NULL,
  total_score INTEGER NOT NULL,
  completion_time INTERVAL NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hunt_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_hunts_status ON hunts(status);
CREATE INDEX idx_hunts_start_time ON hunts(start_time);
CREATE INDEX idx_clues_hunt_id ON clues(hunt_id);
CREATE INDEX idx_hunt_participants_user_id ON hunt_participants(user_id);
CREATE INDEX idx_hunt_participants_hunt_id ON hunt_participants(hunt_id);
CREATE INDEX idx_submissions_hunt_participant ON submissions(hunt_participant_id);
CREATE INDEX idx_rankings_hunt_id ON rankings(hunt_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hunts ENABLE ROW LEVEL SECURITY;
ALTER TABLE clues ENABLE ROW LEVEL SECURITY;
ALTER TABLE hunt_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Hunts policies
CREATE POLICY "Hunts are viewable by everyone"
  ON hunts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create hunts"
  ON hunts FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Hunt creators can update their hunts"
  ON hunts FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Hunt creators can delete their hunts"
  ON hunts FOR DELETE
  USING (auth.uid() = created_by);

-- Clues policies
CREATE POLICY "Clues are viewable by hunt participants"
  ON clues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hunt_participants
      WHERE hunt_participants.hunt_id = clues.hunt_id
      AND hunt_participants.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM hunts
      WHERE hunts.id = clues.hunt_id
      AND hunts.created_by = auth.uid()
    )
  );

CREATE POLICY "Hunt creators can manage clues"
  ON clues FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM hunts
      WHERE hunts.id = clues.hunt_id
      AND hunts.created_by = auth.uid()
    )
  );

-- Hunt participants policies
CREATE POLICY "Users can view their own participations"
  ON hunt_participants FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM hunts
    WHERE hunts.id = hunt_participants.hunt_id
    AND hunts.created_by = auth.uid()
  ));

CREATE POLICY "Users can register for hunts"
  ON hunt_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation"
  ON hunt_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- Submissions policies
CREATE POLICY "Users can view their own submissions"
  ON submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hunt_participants
      WHERE hunt_participants.id = submissions.hunt_participant_id
      AND hunt_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can submit answers during active hunts"
  ON submissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hunt_participants
      WHERE hunt_participants.id = submissions.hunt_participant_id
      AND hunt_participants.user_id = auth.uid()
      AND hunt_participants.status = 'active'
    )
  );

-- Rankings policies
CREATE POLICY "Rankings are viewable by everyone"
  ON rankings FOR SELECT
  USING (true);

-- Function to calculate rankings (called after hunt completion + 24 hours)
CREATE OR REPLACE FUNCTION calculate_hunt_rankings(hunt_id_param UUID)
RETURNS void AS $$
BEGIN
  DELETE FROM rankings WHERE hunt_id = hunt_id_param;

  INSERT INTO rankings (hunt_id, user_id, rank, total_score, completion_time)
  SELECT
    hp.hunt_id,
    hp.user_id,
    ROW_NUMBER() OVER (
      ORDER BY hp.total_score DESC,
      (hp.completed_at - hp.started_at) ASC
    ) as rank,
    hp.total_score,
    (hp.completed_at - hp.started_at) as completion_time
  FROM hunt_participants hp
  WHERE hp.hunt_id = hunt_id_param
    AND hp.status = 'completed'
  ORDER BY rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update hunt status based on time
CREATE OR REPLACE FUNCTION update_hunt_status()
RETURNS void AS $$
BEGIN
  -- Update upcoming hunts to active
  UPDATE hunts
  SET status = 'active'
  WHERE status = 'upcoming'
    AND start_time <= NOW()
    AND end_time > NOW();

  -- Update active hunts to completed
  UPDATE hunts
  SET status = 'completed'
  WHERE status = 'active'
    AND end_time <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

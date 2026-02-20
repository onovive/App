-- Migration: Add avatar, display_name, and explorer_type fields to profiles
-- Run this in your Supabase SQL Editor

-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS avatar TEXT,
ADD COLUMN IF NOT EXISTS explorer_type TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Add check constraint for explorer_type (6 types)
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS explorer_type_check;

ALTER TABLE profiles
ADD CONSTRAINT explorer_type_check
CHECK (explorer_type IS NULL OR explorer_type IN ('urban_explorer', 'nature_seeker', 'history_buff', 'foodie_adventurer', 'photo_enthusiast', 'speed_runner'));

-- Note: username field already exists and will continue to be used
-- display_name is the new locked name field set during onboarding (CANNOT be changed after first login)
-- avatar is the emoji/icon selected during onboarding (CANNOT be changed after first login)
-- explorer_type is editable anytime from profile page (CAN be changed)
-- onboarding_completed tracks if user has completed first-time setup

-- Update existing users to mark them as onboarded (if any exist)
-- UPDATE profiles SET onboarding_completed = TRUE WHERE username IS NOT NULL;

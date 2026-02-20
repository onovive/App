-- Migration: Add avatar storage bucket and update avatar field
-- Run this in your Supabase SQL Editor

-- Update avatar column to store image URLs instead of emojis
-- The column already exists as TEXT, so we just need to update the storage bucket

-- Create storage bucket for user avatars (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on avatars bucket
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
);

-- Note: The avatar column in profiles table already exists as TEXT
-- It will now store the Supabase Storage public URL instead of emoji
-- Example: https://[project].supabase.co/storage/v1/object/public/avatars/abc123.png

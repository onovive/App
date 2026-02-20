-- Fix RLS policies for submissions and hunt_participants tables
-- Run this in your Supabase SQL Editor

-- Enable RLS on submissions table (if not already enabled)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can insert their own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can view their own participations" ON hunt_participants;
DROP POLICY IF EXISTS "Users can update their own participations" ON hunt_participants;

-- Allow users to view their own submissions
CREATE POLICY "Users can view their own submissions" ON submissions
FOR SELECT
TO authenticated
USING (
  hunt_participant_id IN (
    SELECT id FROM hunt_participants WHERE user_id = auth.uid()
  )
);

-- Allow users to insert their own submissions
CREATE POLICY "Users can insert their own submissions" ON submissions
FOR INSERT
TO authenticated
WITH CHECK (
  hunt_participant_id IN (
    SELECT id FROM hunt_participants WHERE user_id = auth.uid()
  )
);

-- Allow users to view their own participations
CREATE POLICY "Users can view their own participations" ON hunt_participants
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow users to update their own participations
CREATE POLICY "Users can update their own participations" ON hunt_participants
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow users to insert their own participations (for joining hunts)
CREATE POLICY "Users can insert their own participations" ON hunt_participants
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- STORAGE BUCKET POLICIES
-- =====================================================

-- Allow authenticated users to upload images to hunt-submissions folder
CREATE POLICY "Authenticated users can upload hunt submissions"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'hunt-submissions'
);

-- Allow public read access to all images in the bucket
CREATE POLICY "Public can view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'images');

-- Allow users to update their own uploaded images
CREATE POLICY "Users can update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images'
  AND auth.uid()::text = owner
)
WITH CHECK (
  bucket_id = 'images'
  AND auth.uid()::text = owner
);

-- Allow users to delete their own uploaded images
CREATE POLICY "Users can delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND auth.uid()::text = owner
);

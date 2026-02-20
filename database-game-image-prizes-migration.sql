-- Migration: Add game image and prizes list to hunts table
-- Run this in your Supabase SQL Editor

-- Add game image and prizes fields to hunts table
ALTER TABLE hunts
ADD COLUMN IF NOT EXISTS game_image_url TEXT,
ADD COLUMN IF NOT EXISTS prizes TEXT[]; -- Array of prize descriptions

-- Example prizes array:
-- prizes = ARRAY['$100 Cash Prize', 'VIP Access Pass', 'Exclusive Merchandise', 'Free Ticket']

-- Create storage bucket for game images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('game-images', 'game-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on game-images bucket
CREATE POLICY "Game images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'game-images');

CREATE POLICY "Admins can upload game images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'game-images'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update game images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'game-images'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete game images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'game-images'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

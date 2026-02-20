-- PeriodiQ Image-Based Hunt Migration
-- Run this AFTER the main database.sql to add image support

-- ============================================================================
-- ALTER EXISTING TABLES TO SUPPORT IMAGE-BASED HUNTS
-- ============================================================================

-- Add answer_type to clues table (text, image, or both)
ALTER TABLE clues ADD COLUMN IF NOT EXISTS answer_type TEXT DEFAULT 'text' CHECK (answer_type IN ('text', 'image', 'both'));

-- Add image URL field for image-based questions (optional: show reference image)
ALTER TABLE clues ADD COLUMN IF NOT EXISTS reference_image_url TEXT;

-- Add image fields to submissions table
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS image_storage_path TEXT;

-- Add validation result fields
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS ai_generated_detected BOOLEAN DEFAULT FALSE;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS web_match_detected BOOLEAN DEFAULT FALSE;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS object_match_detected BOOLEAN DEFAULT FALSE;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS validation_details JSONB;

-- ============================================================================
-- CREATE IMAGE VALIDATION LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS image_validation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  validation_type TEXT NOT NULL CHECK (validation_type IN ('ai_detection', 'web_search', 'object_recognition')),
  api_provider TEXT NOT NULL CHECK (api_provider IN ('sightengine', 'google_vision', 'gemini', 'openai')),
  result JSONB NOT NULL,
  is_valid BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_validation_logs_submission ON image_validation_logs(submission_id);
CREATE INDEX idx_validation_logs_type ON image_validation_logs(validation_type);

-- ============================================================================
-- UPDATE TYPE DEFINITIONS
-- ============================================================================

COMMENT ON COLUMN clues.answer_type IS 'Type of answer expected: text (typed answer), image (photo upload), or both';
COMMENT ON COLUMN clues.reference_image_url IS 'Optional reference image to show what object to photograph';
COMMENT ON COLUMN submissions.image_url IS 'Public URL of uploaded image (from Supabase Storage)';
COMMENT ON COLUMN submissions.image_storage_path IS 'Storage path in Supabase bucket';
COMMENT ON COLUMN submissions.ai_generated_detected IS 'Whether AI-generated image was detected (TRUE = invalid)';
COMMENT ON COLUMN submissions.web_match_detected IS 'Whether image was found on web (TRUE = invalid)';
COMMENT ON COLUMN submissions.object_match_detected IS 'Whether correct object was detected in image (TRUE = valid)';

-- ============================================================================
-- RLS POLICIES FOR NEW TABLE
-- ============================================================================

ALTER TABLE image_validation_logs ENABLE ROW LEVEL SECURITY;

-- Users can view validation logs for their own submissions
CREATE POLICY "Users can view their own validation logs"
  ON image_validation_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM submissions s
      JOIN hunt_participants hp ON s.hunt_participant_id = hp.id
      WHERE s.id = image_validation_logs.submission_id
      AND hp.user_id = auth.uid()
    )
  );

-- Only system can insert validation logs (via service role)
CREATE POLICY "Only system can insert validation logs"
  ON image_validation_logs FOR INSERT
  WITH CHECK (false); -- Will be inserted via service role key

-- ============================================================================
-- STORAGE BUCKET SETUP (Run in Supabase Dashboard → Storage)
-- ============================================================================

-- Create a storage bucket for hunt images
-- Run this in the Supabase Dashboard SQL Editor or via Storage UI:

/*
INSERT INTO storage.buckets (id, name, public)
VALUES ('hunt-images', 'hunt-images', true);

-- Storage policy: Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'hunt-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policy: Allow public to view images
CREATE POLICY "Allow public to view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'hunt-images');

-- Storage policy: Allow users to delete their own images
CREATE POLICY "Allow users to delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'hunt-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
*/

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to validate image submission
CREATE OR REPLACE FUNCTION validate_image_submission(
  p_submission_id UUID,
  p_ai_generated BOOLEAN,
  p_web_match BOOLEAN,
  p_object_match BOOLEAN,
  p_validation_details JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE submissions
  SET
    ai_generated_detected = p_ai_generated,
    web_match_detected = p_web_match,
    object_match_detected = p_object_match,
    validation_details = p_validation_details,
    is_correct = (NOT p_ai_generated AND NOT p_web_match AND p_object_match)
  WHERE id = p_submission_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SAMPLE IMAGE-BASED HUNT (Optional Test Data)
-- ============================================================================

-- Example: Photo Scavenger Hunt
/*
INSERT INTO hunts (title, description, difficulty, duration_minutes, start_time, end_time, status, created_by)
VALUES (
  'Photo Scavenger Hunt',
  'Capture real photos of objects around you! Images are validated to ensure they are authentic and original.',
  'medium',
  60,
  NOW(),
  NOW() + INTERVAL '3 hours',
  'active',
  'YOUR_USER_ID_HERE'
);

-- Add image-based clues
INSERT INTO clues (hunt_id, order_number, question, expected_answer, answer_type, validation_type, points)
VALUES
  ('HUNT_ID_HERE', 1, 'Take a photo of a red car', 'red car', 'image', 'ai', 20),
  ('HUNT_ID_HERE', 2, 'Photograph a tree with visible leaves', 'tree', 'image', 'ai', 20),
  ('HUNT_ID_HERE', 3, 'Capture an image of a coffee cup', 'coffee cup', 'image', 'ai', 15);
*/

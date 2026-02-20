-- PeriodiQ Seed Data
-- This file contains test data for all tables
-- Run this AFTER setting up the database schema and creating at least one user account

-- Note: Replace 'YOUR_USER_ID_HERE' with your actual user ID from auth.users
-- You can get your user ID by running: SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- ============================================================================
-- HUNTS - Sample Scavenger Hunts
-- ============================================================================

-- Hunt 1: Easy Nature Hunt (Active)
INSERT INTO hunts (id, title, description, difficulty, duration_minutes, max_participants, start_time, end_time, status, created_by)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Nature Detective',
  'Explore the wonders of nature in this beginner-friendly hunt. Perfect for families and nature enthusiasts!',
  'easy',
  30,
  100,
  NOW() - INTERVAL '1 hour',
  NOW() + INTERVAL '2 hours',
  'active',
  'YOUR_USER_ID_HERE'
);

-- Hunt 2: Medium City Explorer (Active)
INSERT INTO hunts (id, title, description, difficulty, duration_minutes, max_participants, start_time, end_time, status, created_by)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'City Explorer Challenge',
  'Discover hidden gems and interesting facts about your city. Moderate difficulty with local history and culture questions.',
  'medium',
  45,
  50,
  NOW() - INTERVAL '30 minutes',
  NOW() + INTERVAL '3 hours',
  'active',
  'YOUR_USER_ID_HERE'
);

-- Hunt 3: Hard Science Quest (Upcoming)
INSERT INTO hunts (id, title, description, difficulty, duration_minutes, max_participants, start_time, end_time, status, created_by)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'Science Genius Quest',
  'Think you know science? Test your knowledge with challenging questions about physics, chemistry, biology, and more!',
  'hard',
  60,
  30,
  NOW() + INTERVAL '2 hours',
  NOW() + INTERVAL '5 hours',
  'upcoming',
  'YOUR_USER_ID_HERE'
);

-- Hunt 4: Easy Movie Trivia (Completed)
INSERT INTO hunts (id, title, description, difficulty, duration_minutes, max_participants, start_time, end_time, status, created_by)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'Hollywood Classics Hunt',
  'A fun trip through movie history! Answer questions about your favorite films and actors.',
  'easy',
  25,
  NULL,
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '2 days 22 hours',
  'completed',
  'YOUR_USER_ID_HERE'
);

-- Hunt 5: Medium Tech Innovators (Upcoming)
INSERT INTO hunts (id, title, description, difficulty, duration_minutes, max_participants, start_time, end_time, status, created_by)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  'Tech Innovators Trail',
  'Journey through the history of technology and innovation. Who invented what? When? Find out!',
  'medium',
  40,
  75,
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '1 day 2 hours',
  'upcoming',
  'YOUR_USER_ID_HERE'
);

-- ============================================================================
-- CLUES - Questions for each hunt
-- ============================================================================

-- Clues for Hunt 1: Nature Detective (Easy)
INSERT INTO clues (hunt_id, order_number, question, hint, expected_answer, validation_type, points)
VALUES
  ('11111111-1111-1111-1111-111111111111', 1, 'What is the largest land animal on Earth?', 'It has a trunk and large ears', 'elephant', 'exact', 10),
  ('11111111-1111-1111-1111-111111111111', 2, 'What gas do plants absorb from the atmosphere?', 'Humans breathe out this gas', 'carbon dioxide', 'keyword', 15),
  ('11111111-1111-1111-1111-111111111111', 3, 'How many legs does a spider have?', 'More than 6, less than 10', '8', 'exact', 10),
  ('11111111-1111-1111-1111-111111111111', 4, 'What is the process by which plants make their food?', 'It involves sunlight and chlorophyll', 'photosynthesis', 'ai', 20),
  ('11111111-1111-1111-1111-111111111111', 5, 'What is the largest ocean on Earth?', 'It borders Asia and the Americas', 'Pacific Ocean', 'keyword', 15);

-- Clues for Hunt 2: City Explorer Challenge (Medium)
INSERT INTO clues (hunt_id, order_number, question, hint, expected_answer, validation_type, points)
VALUES
  ('22222222-2222-2222-2222-222222222222', 1, 'What year was the Statue of Liberty dedicated in New York?', 'Between 1880 and 1890', '1886', 'exact', 15),
  ('22222222-2222-2222-2222-222222222222', 2, 'Which city is known as the "City of Light"?', 'European capital famous for the Eiffel Tower', 'Paris', 'exact', 10),
  ('22222222-2222-2222-2222-222222222222', 3, 'What architectural style is characterized by pointed arches and flying buttresses?', 'Common in medieval European cathedrals', 'Gothic', 'ai', 20),
  ('22222222-2222-2222-2222-222222222222', 4, 'Name any famous landmark in Rome, Italy', 'Think ancient amphitheater or fountains', 'Colosseum,Trevi Fountain,Pantheon,Roman Forum', 'keyword', 15),
  ('22222222-2222-2222-2222-222222222222', 5, 'What is the tallest building in the world as of 2024?', 'Located in Dubai', 'Burj Khalifa', 'keyword', 20);

-- Clues for Hunt 3: Science Genius Quest (Hard)
INSERT INTO clues (hunt_id, order_number, question, hint, expected_answer, validation_type, points)
VALUES
  ('33333333-3333-3333-3333-333333333333', 1, 'What is the chemical symbol for gold?', 'Two letters from the Latin name', 'Au', 'exact', 15),
  ('33333333-3333-3333-3333-333333333333', 2, 'At what temperature do Celsius and Fahrenheit scales meet?', 'A negative number', '-40', 'exact', 20),
  ('33333333-3333-3333-3333-333333333333', 3, 'Who developed the theory of general relativity?', 'E=mc²', 'Albert Einstein', 'keyword', 15),
  ('33333333-3333-3333-3333-333333333333', 4, 'What is the powerhouse of the cell?', 'Responsible for energy production', 'mitochondria', 'exact', 20),
  ('33333333-3333-3333-3333-333333333333', 5, 'Explain quantum entanglement in simple terms', 'Think particles and correlation', 'Quantum entanglement is when two particles become connected and the state of one instantly affects the other regardless of distance', 'ai', 30);

-- Clues for Hunt 4: Hollywood Classics (Easy - Completed)
INSERT INTO clues (hunt_id, order_number, question, hint, expected_answer, validation_type, points)
VALUES
  ('44444444-4444-4444-4444-444444444444', 1, 'Who played Jack in the movie Titanic?', 'Also starred in Inception', 'Leonardo DiCaprio', 'keyword', 10),
  ('44444444-4444-4444-4444-444444444444', 2, 'What movie features the line "May the Force be with you"?', 'Space saga', 'Star Wars', 'keyword', 10),
  ('44444444-4444-4444-4444-444444444444', 3, 'What is the highest-grossing film of all time (as of 2023)?', 'Blue aliens on Pandora', 'Avatar', 'keyword', 15),
  ('44444444-4444-4444-4444-444444444444', 4, 'Name the actor who played Iron Man in the Marvel movies', 'His initials are RDJ', 'Robert Downey Jr', 'keyword', 10);

-- Clues for Hunt 5: Tech Innovators Trail (Medium - Upcoming)
INSERT INTO clues (hunt_id, order_number, question, hint, expected_answer, validation_type, points)
VALUES
  ('55555555-5555-5555-5555-555555555555', 1, 'Who is credited with inventing the telephone?', 'Patented in 1876', 'Alexander Graham Bell', 'keyword', 15),
  ('55555555-5555-5555-5555-555555555555', 2, 'What year was the first iPhone released?', '2000s, think mid-decade', '2007', 'exact', 15),
  ('55555555-5555-5555-5555-555555555555', 3, 'Who founded Microsoft?', 'Two people - need at least one name', 'Bill Gates,Paul Allen', 'keyword', 15),
  ('55555555-5555-5555-5555-555555555555', 4, 'What does "HTTP" stand for?', 'Used in web addresses', 'Hypertext Transfer Protocol', 'ai', 20),
  ('55555555-5555-5555-5555-555555555555', 5, 'Name the programming language created by Guido van Rossum', 'Named after a comedy group', 'Python', 'exact', 15);

-- ============================================================================
-- HUNT PARTICIPANTS - Sample participations
-- ============================================================================

-- User participates in Hunt 1 (Active - In Progress)
INSERT INTO hunt_participants (id, hunt_id, user_id, status, started_at, total_score)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'YOUR_USER_ID_HERE',
  'active',
  NOW() - INTERVAL '15 minutes',
  35
);

-- User registered for Hunt 2 but hasn't started
INSERT INTO hunt_participants (id, hunt_id, user_id, status)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '22222222-2222-2222-2222-222222222222',
  'YOUR_USER_ID_HERE',
  'registered'
);

-- User registered for Hunt 3 (Upcoming)
INSERT INTO hunt_participants (id, hunt_id, user_id, status)
VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '33333333-3333-3333-3333-333333333333',
  'YOUR_USER_ID_HERE',
  'registered'
);

-- User completed Hunt 4
INSERT INTO hunt_participants (id, hunt_id, user_id, status, started_at, completed_at, total_score)
VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '44444444-4444-4444-4444-444444444444',
  'YOUR_USER_ID_HERE',
  'completed',
  NOW() - INTERVAL '3 days 1 hour',
  NOW() - INTERVAL '3 days 40 minutes',
  45
);

-- ============================================================================
-- SUBMISSIONS - Sample answers for Hunt 1 and Hunt 4
-- ============================================================================

-- Submissions for Hunt 1 (In Progress - 3 clues answered)
INSERT INTO submissions (hunt_participant_id, clue_id, answer, is_correct, ai_feedback, points_earned)
SELECT
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  id,
  CASE
    WHEN order_number = 1 THEN 'elephant'
    WHEN order_number = 2 THEN 'carbon dioxide'
    WHEN order_number = 3 THEN '8'
  END,
  true,
  CASE
    WHEN order_number = 1 THEN 'Correct! The elephant is indeed the largest land animal.'
    WHEN order_number = 2 THEN 'Perfect! Plants absorb carbon dioxide during photosynthesis.'
    WHEN order_number = 3 THEN 'Excellent! Spiders are arachnids with 8 legs.'
  END,
  CASE
    WHEN order_number = 1 THEN 10
    WHEN order_number = 2 THEN 15
    WHEN order_number = 3 THEN 10
  END
FROM clues
WHERE hunt_id = '11111111-1111-1111-1111-111111111111'
  AND order_number <= 3;

-- Submissions for Hunt 4 (Completed - All clues answered)
INSERT INTO submissions (hunt_participant_id, clue_id, answer, is_correct, ai_feedback, points_earned)
SELECT
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  id,
  CASE
    WHEN order_number = 1 THEN 'Leonardo DiCaprio'
    WHEN order_number = 2 THEN 'Star Wars'
    WHEN order_number = 3 THEN 'Avatar'
    WHEN order_number = 4 THEN 'Robert Downey Jr'
  END,
  CASE
    WHEN order_number <= 4 THEN true
  END,
  CASE
    WHEN order_number = 1 THEN 'Correct! Leonardo DiCaprio portrayed Jack Dawson in Titanic.'
    WHEN order_number = 2 THEN 'Yes! This iconic line is from Star Wars.'
    WHEN order_number = 3 THEN 'Correct! Avatar is the highest-grossing film worldwide.'
    WHEN order_number = 4 THEN 'Perfect! Robert Downey Jr. brilliantly played Tony Stark/Iron Man.'
  END,
  CASE
    WHEN order_number = 1 THEN 10
    WHEN order_number = 2 THEN 10
    WHEN order_number = 3 THEN 15
    WHEN order_number = 4 THEN 10
  END
FROM clues
WHERE hunt_id = '44444444-4444-4444-4444-444444444444';

-- ============================================================================
-- RANKINGS - Sample rankings for completed Hunt 4
-- ============================================================================

-- Rankings for Hunt 4 (after 24 hours)
INSERT INTO rankings (hunt_id, user_id, rank, total_score, completion_time)
VALUES
  ('44444444-4444-4444-4444-444444444444', 'YOUR_USER_ID_HERE', 1, 45, '00:20:30');

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================

-- To use this seed data:
-- 1. Make sure you have created your Supabase account and signed up in the app
-- 2. Get your user ID by running:
--    SELECT id, email FROM auth.users;
-- 3. Replace all instances of 'YOUR_USER_ID_HERE' with your actual user ID
-- 4. Run this entire file in the Supabase SQL Editor
-- 5. Refresh your PeriodiQ app and you'll see all the test data!

-- Note: You can add more sample users by:
-- 1. Creating accounts through the app's registration page
-- 2. Adding their participations to different hunts
-- 3. Creating more diverse ranking scenarios

-- Quick verification queries:
-- SELECT * FROM hunts;
-- SELECT * FROM clues WHERE hunt_id = '11111111-1111-1111-1111-111111111111';
-- SELECT * FROM hunt_participants WHERE user_id = 'YOUR_USER_ID_HERE';
-- SELECT * FROM submissions;
-- SELECT * FROM rankings;

# PeriodiQ - Scavenger Hunt Application

PeriodiQ is a modern, real-time scavenger hunt application built with Next.js, Supabase, and AI-powered clue validation. Users can join hunts, solve clues, and compete on leaderboards.

## Features

### 🔐 Authentication Flow
- User registration with email/password
- Secure login system
- Profile setup and management
- Protected routes with middleware

### 🎯 Hunt Management
- Browse available hunts by status (upcoming, active, completed)
- View detailed hunt information
- Register for hunts
- Filter hunts by difficulty level

### 🎮 Live Hunt Gameplay
- Real-time clue solving interface
- Interactive hint system
- Progress tracking with visual indicators
- AI-powered answer validation
- Countdown timer management
- Auto-save progress

### 🏆 Ranking System
- Post-hunt leaderboard (available 24h after completion)
- Score and time-based ranking
- Personal performance statistics
- Medal system for top 3 positions

### 🎨 Design
- Clean green and white color scheme
- Fully responsive mobile-first design
- Smooth animations and transitions
- Intuitive user interface

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: OpenAI API (GPT-4o-mini)
- **Real-time**: Supabase Realtime

## Prerequisites

- Node.js 18+ installed
- A Supabase account ([sign up here](https://supabase.com))
- An OpenAI API key ([get one here](https://platform.openai.com/api-keys))

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Wait for the database to be provisioned
4. Go to **Project Settings** > **API**
5. Copy your project URL and anon/public key

### 3. Create Database Schema

1. In your Supabase project, go to the **SQL Editor**
2. Open the `database.sql` file in the project root
3. Copy all the SQL code and paste it into the SQL Editor
4. Click "Run" to execute the schema creation

This will create:
- All necessary tables (profiles, hunts, clues, hunt_participants, submissions, rankings)
- Row Level Security (RLS) policies
- Database functions for ranking calculations
- Automatic profile creation on user signup

### 4. Configure Environment Variables

1. Copy the example env file:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and add your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=your-openai-api-key
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
periodiq/
├── app/
│   ├── (auth)/              # Authentication pages
│   │   ├── login/
│   │   ├── register/
│   │   └── profile-setup/
│   ├── (dashboard)/         # Protected dashboard pages
│   │   ├── dashboard/
│   │   ├── hunts/[id]/
│   │   └── profile/
│   ├── api/validate-clue/   # AI validation endpoint
│   ├── layout.tsx
│   └── page.tsx             # Landing page
├── components/
│   ├── auth/                # Auth components
│   ├── hunt/                # Hunt components
│   ├── ranking/             # Ranking components
│   ├── layout/              # Layout components
│   └── ui/                  # Reusable UI components
├── lib/
│   ├── supabase/            # Supabase client setup
│   └── types/               # TypeScript types
└── database.sql             # Database schema
```

## Usage Guide

### For Users

1. **Sign Up**: Create an account with email/password
2. **Profile Setup**: Choose a username
3. **Browse Hunts**: View available hunts on the dashboard
4. **Join a Hunt**: Register for a hunt before it starts
5. **Play**: Start the hunt when it becomes active
6. **Solve Clues**: Answer clues to earn points
7. **View Rankings**: Check the leaderboard 24h after completion

### Creating Test Data

To test the application, you can manually insert test hunts via Supabase SQL Editor:

```sql
-- Create a test hunt (replace user_id with your actual user ID)
INSERT INTO hunts (title, description, difficulty, duration_minutes, start_time, end_time, status, created_by)
VALUES (
  'Sample Hunt',
  'A test scavenger hunt',
  'easy',
  30,
  NOW(),
  NOW() + INTERVAL '2 hours',
  'active',
  'your-user-id-here'
);

-- Add clues (replace hunt_id with the created hunt ID)
INSERT INTO clues (hunt_id, order_number, question, expected_answer, validation_type, points)
VALUES
  ('hunt-id-here', 1, 'What is 2+2?', '4', 'exact', 10),
  ('hunt-id-here', 2, 'What is the capital of France?', 'Paris', 'ai', 15),
  ('hunt-id-here', 3, 'Name a primary color', 'red,blue,yellow', 'keyword', 10);
```

## Features Detail

### AI Validation Types

1. **Exact Match**: Answer must match exactly (case-insensitive)
2. **Keyword Match**: Answer must contain one of the specified keywords
3. **AI Validation**: OpenAI evaluates semantic similarity

### Timer System

- Server-side time tracking prevents cheating
- Client-side countdown with visual warnings
- Auto-submission when time expires

### Ranking Calculation

- Triggered 24 hours after hunt completion
- Primary: Total score (higher is better)
- Tiebreaker: Completion time (faster is better)

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to add these in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

## Troubleshooting

### Authentication Issues

- Make sure email confirmation is disabled in Supabase Auth settings for development
- Check that RLS policies are properly set up

### AI Validation Not Working

- Verify your OpenAI API key is valid
- Check API key has sufficient credits
- The system will fallback to keyword matching if AI fails

### Database Errors

- Ensure all SQL migrations ran successfully
- Check RLS policies are enabled
- Verify foreign key relationships

---

Built with ❤️ using Next.js and Supabase

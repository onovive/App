# PeriodiQ Quick Start Guide

This guide will help you get PeriodiQ up and running with test data in under 10 minutes!

## Step 1: Install Dependencies

```bash
cd periodiq
npm install
```

## Step 2: Set Up Supabase

### Create a Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in:
   - **Project Name**: PeriodiQ
   - **Database Password**: (create a strong password and save it)
   - **Region**: Choose closest to you
4. Click "Create new project"
5. Wait 2-3 minutes for setup to complete

### Get Your API Keys

1. In your Supabase project, go to **Settings** (gear icon) → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

### Set Up the Database

1. In Supabase, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open the `database.sql` file from your project
4. Copy ALL the SQL code
5. Paste it into the SQL Editor
6. Click **Run** (or press Ctrl/Cmd + Enter)
7. You should see "Success. No rows returned"

### Disable Email Confirmation (For Development)

1. Go to **Authentication** → **Providers** → **Email**
2. **Disable** "Confirm email"
3. Click **Save**

## Step 3: Configure Environment Variables

1. Copy the example file:
```bash
cp .env.local.example .env.local
```

2. Open `.env.local` in your editor and add your values:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...
OPENAI_API_KEY=sk-xxxxx...  # Get from https://platform.openai.com/api-keys
```

## Step 4: Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 5: Create Your First Account

1. Click **Get Started** or **Sign In**
2. Click **Sign up** tab
3. Enter your email and password
4. Click **Create Account**
5. Choose a username
6. Click **Complete Setup**

## Step 6: Get Your User ID

1. Go back to Supabase Dashboard
2. Open **SQL Editor**
3. Create a new query and run:

```sql
SELECT id, email FROM auth.users;
```

4. Copy your `id` (it looks like: `12345678-1234-1234-1234-123456789abc`)

## Step 7: Add Test Data

1. Open the `seed-data.sql` file in your code editor
2. Press **Ctrl/Cmd + H** (Find and Replace)
3. Find: `YOUR_USER_ID_HERE`
4. Replace with: Your actual user ID (paste it)
5. **Replace All**
6. Copy the entire updated file
7. Go to Supabase **SQL Editor**
8. Paste and **Run**

## Step 8: Explore the App!

Refresh your PeriodiQ app and you'll now see:

- ✅ **5 sample hunts** with different statuses and difficulties
- ✅ **Multiple clues** for each hunt
- ✅ **Your participation** in several hunts
- ✅ **Sample submissions** with AI feedback
- ✅ **Rankings** for completed hunts

### What You Can Do Now:

1. **Browse Hunts**: View the dashboard with all available hunts
2. **Join a Hunt**: Click on "City Explorer Challenge" (active) → Start Hunt Now
3. **Solve Clues**: Answer questions and get instant AI feedback
4. **View Progress**: See your score and remaining time
5. **Check Rankings**: View the leaderboard for completed hunts
6. **Manage Profile**: See your stats and hunt history

## Test Data Overview

### Active Hunts (You can play now!)
- 🌿 **Nature Detective** (Easy, 30 min) - You're currently playing this one!
- 🏙️ **City Explorer Challenge** (Medium, 45 min) - Ready to start

### Upcoming Hunts (Register and wait)
- 🧪 **Science Genius Quest** (Hard, 60 min)
- 💻 **Tech Innovators Trail** (Medium, 40 min)

### Completed Hunts (View rankings)
- 🎬 **Hollywood Classics Hunt** (Easy, 25 min) - You completed this!

## Common Issues

### Issue: Can't see any hunts
**Solution**: Make sure you replaced `YOUR_USER_ID_HERE` in seed-data.sql with your actual user ID

### Issue: Authentication errors
**Solution**:
- Check that email confirmation is disabled in Supabase Auth settings
- Verify your .env.local has the correct Supabase keys

### Issue: "Table does not exist" error
**Solution**: Run the `database.sql` file first before the seed data

### Issue: AI validation not working
**Solution**:
- Make sure you added your OpenAI API key to .env.local
- Check that your OpenAI account has credits
- The app will fallback to keyword matching if AI fails

## Creating More Test Data

### Add Another User

1. Create a new account in the app
2. Get their user ID from Supabase
3. Add more participations in the seed-data.sql
4. Create competitive rankings!

### Add Your Own Hunt

```sql
INSERT INTO hunts (title, description, difficulty, duration_minutes, start_time, end_time, status, created_by)
VALUES (
  'My Custom Hunt',
  'Description here',
  'medium',
  30,
  NOW(),
  NOW() + INTERVAL '2 hours',
  'active',
  'your-user-id'
);
```

Then add clues for your hunt!

## Next Steps

- 🎨 Customize the green color scheme in `app/globals.css`
- 🏗️ Explore the clean component architecture
- 📱 Test the responsive design on mobile
- 🚀 Deploy to Vercel when ready!

## Need Help?

Check the main [README.md](README.md) for detailed documentation, troubleshooting, and deployment guides.

---

Enjoy hunting! 🎯

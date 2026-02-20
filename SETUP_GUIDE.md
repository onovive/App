# PeriodiQ Admin Dashboard - Setup Guide

## 🎉 What's Been Built

I've successfully implemented the core foundation of your admin dashboard and subscription management system. Here's what's ready to use:

### ✅ Completed Features

1. **Database Schema** - Complete with admin roles, subscriptions, and notifications
2. **Admin Authentication** - Secure role-based access control
3. **Admin Dashboard** - Overview with live statistics
4. **User Management** - View all users and change roles
5. **6 Reusable UI Components** - Table, Badge, Select, Textarea, DateTimeInput, Pagination
6. **4 Admin Components** - Sidebar, Hunt Form, Clue Form, Analytics Cards
7. **Security** - Middleware protection, RLS policies, API authentication

## 🚀 Quick Start (3 Steps)

### Step 1: Run the Database Migration

1. Open your **Supabase Dashboard**
2. Navigate to the **SQL Editor**
3. Open the file [`database-admin-extension.sql`](./database-admin-extension.sql)
4. Copy all the SQL code
5. Paste into Supabase SQL Editor
6. Click **Run** to execute

This will create:
- Admin role system
- Subscriptions table
- Notifications table
- Hunt analytics table
- RLS policies for admin access

### Step 2: Make Yourself an Admin

In Supabase SQL Editor, run:

```sql
-- Find your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Copy the ID and run this (replace with your actual user ID):
UPDATE profiles SET role = 'admin' WHERE id = 'paste-your-user-id-here';
```

### Step 3: Test the Admin Dashboard

```bash
# Start the development server
cd periodiq
npm run dev
```

Then visit:
1. **Login:** http://localhost:3000/login
2. **Admin Dashboard:** http://localhost:3000/admin/dashboard
3. **User Management:** http://localhost:3000/admin/users

## 📸 What You'll See

### Admin Dashboard
- **Statistics Cards**: Total users, hunts, active hunts, participations
- **Recent Activity**: Latest hunts and users
- **Responsive Design**: Works on mobile, tablet, and desktop

### User Management
- **Search & Filter**: Find users by username or role
- **Role Management**: Change user/admin roles with one click
- **Pagination**: Browse through all users
- **Sortable Table**: Click column headers to sort

### Navigation
- **Sidebar**: Dashboard, Users, Games, Notifications
- **Mobile Menu**: Hamburger menu for small screens
- **Back to User View**: Quick link to switch from admin view

## 🎨 Design Features

- **Emerald Green Theme**: Matches your existing PeriodiQ design
- **Fully Responsive**: Mobile-first design
- **Smooth Animations**: Hover effects, transitions
- **Loading States**: Spinners and disabled buttons
- **Error Handling**: Clear error messages
- **Empty States**: Helpful messages when no data

## 🛠️ What's Ready to Build Next

The foundation is complete! Here's what to add next (in priority order):

### High Priority
1. **Games Management Pages** (Est: 2-3 days)
   - Games list page
   - Create new game page
   - Edit game page
   - Manage clues page
   - Game details with user tracking

2. **Client Dashboard Updates** (Est: 1-2 days)
   - Transform dashboard to "Discover Quests"
   - Enhanced filtering and search
   - Better hunt cards

### Medium Priority
3. **My Schedule Page** (Est: 1-2 days)
   - Subscription management
   - Upcoming hunts timeline
   - Pause/resume subscriptions

4. **Profile Updates** (Est: 1 day)
   - Notification preferences
   - Phone number input
   - WhatsApp verification

### Lower Priority
5. **Twilio Integration** (Est: 2-3 days)
   - Install Twilio SDK
   - Notification templates
   - Send WhatsApp API
   - Scheduler and cron job

## 📁 New Files Created

### Database
```
database-admin-extension.sql - Complete schema migrations
```

### Components (11 new files)
```
components/
├── ui/
│   ├── Badge.tsx
│   ├── Select.tsx
│   ├── Textarea.tsx
│   ├── DateTimeInput.tsx
│   ├── Pagination.tsx
│   └── Table.tsx
├── admin/
│   ├── AdminSidebar.tsx
│   ├── HuntForm.tsx
│   ├── ClueForm.tsx
│   ├── AnalyticsCard.tsx
│   └── UsersTable.tsx
```

### Pages & API Routes
```
app/
├── (admin)/
│   ├── layout.tsx
│   └── admin/
│       ├── dashboard/page.tsx
│       └── users/page.tsx
└── api/
    └── admin/
        └── users/
            └── [id]/route.ts
```

### Documentation
```
IMPLEMENTATION_PROGRESS.md - Detailed progress tracker
SETUP_GUIDE.md - This file
```

## 🔒 Security Features

### Authentication & Authorization
- ✅ Middleware checks every request to /admin routes
- ✅ Non-admin users automatically redirected
- ✅ All API routes verify admin role
- ✅ RLS policies protect database access

### Database Security
- ✅ Row Level Security enabled on all tables
- ✅ Admins can view/edit everything
- ✅ Users can only see their own data
- ✅ Proper foreign key constraints

### Best Practices
- ✅ Server-side authentication (no client-side auth checks)
- ✅ Input validation on all forms
- ✅ Error handling with user-friendly messages
- ✅ Loading states prevent duplicate submissions

## 🧪 Testing Checklist

After setup, test these features:

- [ ] Login with your account
- [ ] Access /admin/dashboard (should show statistics)
- [ ] Try accessing /admin as non-admin user (should redirect)
- [ ] View users list at /admin/users
- [ ] Search for a specific username
- [ ] Filter by role (All/Users/Admins)
- [ ] Change a user's role
- [ ] Verify role change persists after page refresh
- [ ] Test mobile responsive design (resize browser)
- [ ] Click sidebar navigation links
- [ ] Test "Back to User Dashboard" link

## 💡 Tips for Development

### Component Reuse
All the UI components are reusable:
```typescript
import Badge from '@/components/ui/Badge'
import Table from '@/components/ui/Table'
import Select from '@/components/ui/Select'

// Use anywhere in your app!
<Badge variant="success">Active</Badge>
<Select options={[...]} value={...} onChange={...} />
```

### Adding New Admin Pages
Follow this pattern:
```typescript
// 1. Create page in app/(admin)/admin/your-page/page.tsx
// 2. Verify admin auth (copy from existing pages)
// 3. Fetch data from Supabase
// 4. Use Table/Card components to display
// 5. Add to sidebar navigation if needed
```

### Creating API Routes
Follow this pattern:
```typescript
// 1. Verify authentication
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

// 2. Verify admin role
const { data: profile } = await supabase.from('profiles').select('role')...
if (profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

// 3. Perform operation
// 4. Return response
```

## 🐛 Troubleshooting

### "Cannot access /admin routes"
- Verify you ran the database migration
- Check your user has role = 'admin' in profiles table
- Clear browser cache and cookies
- Restart dev server

### "Table doesn't exist" errors
- Make sure you ran database-admin-extension.sql
- Check Supabase SQL Editor for any errors
- Verify RLS is enabled: `SELECT * FROM pg_tables WHERE schemaname = 'public'`

### "Unauthorized" on API calls
- Check browser console for errors
- Verify you're logged in
- Check network tab to see actual API response
- Make sure Supabase environment variables are set

### Sidebar not showing on mobile
- Check browser console for React errors
- Verify AdminSidebar component is imported correctly
- Test with browser dev tools mobile view

## 📚 Next Steps

1. **Test Everything**: Run through the testing checklist above
2. **Create Test Hunt**: Use Supabase SQL Editor to insert a test hunt
3. **Build Games Pages**: Continue with games management features
4. **Add Subscriptions**: Build the My Schedule page
5. **Integrate Twilio**: Set up WhatsApp notifications

## 🎯 Current Progress

- **Foundation**: 100% Complete ✅
- **Admin Features**: 40% Complete (Dashboard + Users done, Games pending)
- **Client Features**: 0% (Discover Quests, My Schedule pending)
- **Notifications**: 0% (Twilio integration pending)

**Overall Progress**: ~35% Complete

## 📞 Architecture Overview

```
User Request → Middleware (Check Auth & Role) → Admin Page
                                               ↓
                                    Fetch Data from Supabase
                                               ↓
                                    Render with UI Components
                                               ↓
                               User Action → API Route → Update DB
```

## 🎨 Component Hierarchy

```
AdminLayout
├── AdminSidebar (Navigation)
└── Page Content
    ├── AnalyticsCard (Dashboard)
    ├── Table (Users, Games)
    ├── Forms (Create/Edit)
    └── Modals (Confirmations)
```

---

**Built with:** Next.js 16, TypeScript, Tailwind CSS, Supabase
**Status:** Foundation Complete, Ready for Feature Development
**Estimated Time to Full Completion:** 8-10 days

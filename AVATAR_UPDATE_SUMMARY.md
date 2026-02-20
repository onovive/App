# Avatar System Update - Image-Based Avatars

## Changes Made ✅

### 1. New Components Created

**[components/ui/AvatarUpload.tsx](components/ui/AvatarUpload.tsx)**
- Circular avatar upload component matching your screenshot design
- Camera icon overlay button (bottom-right)
- Image preview within circle
- Upload to Supabase Storage (`avatars` bucket)
- File validation (2MB max, image files only)
- Loading states with spinner
- Matches exact mobile UI from screenshots

### 2. Updated Components

**[components/auth/OnboardingForm.tsx](components/auth/OnboardingForm.tsx)**
- ✅ Replaced emoji avatar selection with image upload
- ✅ Updated Explorer Types to match screenshot labels:
  - URBAN EXPLORER (Green)
  - TRAILBLAZER (Blue)
  - MYSTERY HUNTER (Orange)
  - GEO SPY (Purple)
  - RIDDLE SOLVER (Red)
  - DIGITAL DETECTIVE (Cyan)
- ✅ Grid layout: 2 columns mobile, 3 columns tablet+
- ✅ Italian labels: "Info Utente (Richiesto)" and "Seleziona il tuo Explorer Type"
- ✅ All fields now required (name, avatar, explorer type)
- ✅ CONTINUE button (gray when disabled, emerald when enabled)

### 3. Database Migration

**[database-avatar-storage-migration.sql](database-avatar-storage-migration.sql)**
- Creates `avatars` storage bucket
- Sets up RLS policies for avatar uploads
- Public read access for all avatars
- Authenticated users can upload/update/delete their own avatars
- Avatar column already exists in profiles table (stores URL now instead of emoji)

## UI Design Matching Screenshots

### Avatar Upload Circle
```tsx
- Size: 132px × 132px (w-32 h-32)
- Border: 4px white border + shadow
- Placeholder: User icon + "Add Photo" text
- Camera Button: 48px circle, bottom-right overlay
- Background: Gray when empty, image when uploaded
```

### Explorer Type Buttons
```tsx
- Layout: Grid 2 columns (mobile), 3 columns (tablet+)
- Style: Rounded-xl, bold white text
- Colors: Solid background (emerald, blue, orange, purple, red, cyan)
- Hover: Scale up 105%, shadow
- Selected: Scale 105% + white ring (ring-4)
- Text: ALL CAPS labels
```

### Form Layout
```tsx
1. Title: "Info Utente (Richiesto):"
2. Avatar Upload (centered)
3. Name Input (placeholder: "Scegli il tuo nome utente")
4. Title: "Seleziona il tuo Explorer Type (Richiesto):"
5. Explorer Type Grid
6. CONTINUE Button (full-width, large)
```

## Migration Steps

### 1. Run Database Migration
```sql
-- Open Supabase SQL Editor
-- Copy and paste: database-avatar-storage-migration.sql
-- Execute
```

This creates:
- `avatars` storage bucket (public access)
- RLS policies for authenticated uploads

### 2. Test Avatar Upload
1. Go to onboarding page
2. Click camera icon on avatar circle
3. Select an image file (< 2MB)
4. See preview in circle
5. Image uploads to Supabase Storage
6. URL saved to profile

## Storage Structure

```
Supabase Storage
└── avatars/
    ├── avatars/
    │   ├── abc123-1234567890.png
    │   ├── def456-1234567891.jpg
    │   └── ...
```

## Database Schema

```sql
profiles table:
- avatar: TEXT (stores full Supabase Storage URL)
  Example: "https://[project].supabase.co/storage/v1/object/public/avatars/avatars/abc123.png"

- display_name: TEXT (user's chosen name)
- explorer_type: TEXT (urban_explorer, trailblazer, etc.)
- onboarding_completed: BOOLEAN
```

## Mobile Responsiveness

### Breakpoints
- Mobile: 375px-640px (2-column explorer types)
- Tablet: 640px-768px (3-column explorer types)
- Desktop: 768px+ (3-column explorer types)

### Touch Targets
- Avatar camera button: 48px × 48px ✅
- Explorer type buttons: Min 44px height ✅
- Continue button: 52px height ✅

## Features

✅ Image upload with preview
✅ Camera icon overlay (matches screenshot)
✅ File validation (type & size)
✅ Loading states
✅ Error handling
✅ Circular avatar display
✅ Explorer type color-coded buttons
✅ Italian labels
✅ All fields required
✅ Mobile-first responsive design
✅ Matches exact screenshot UI

## Testing Checklist

- [ ] Run avatar storage migration
- [ ] Upload avatar image
- [ ] Verify image appears in circle
- [ ] Select explorer type
- [ ] Enter name
- [ ] Click CONTINUE
- [ ] Verify profile saved
- [ ] Check avatar displays in dashboard
- [ ] Test on mobile (375px width)
- [ ] Test file size validation (>2MB should fail)
- [ ] Test file type validation (non-images should fail)

## Next Steps

1. Run the migration in Supabase
2. Test avatar upload flow
3. Update any other places that display avatars to use the image URL
4. Ensure avatar images display correctly in:
   - Dashboard header
   - Rankings/leaderboard
   - Profile page
   - Any other user displays

---

All changes match your screenshot design! 🎉

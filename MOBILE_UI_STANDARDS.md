# Mobile UI Design Standards - PeriodiQ

## Design Principles (Based on Screenshots)

### Color Palette
- **Primary Green**: `#10b981` (emerald-600)
- **Background**: `#ffffff` white with subtle gradients
- **Text Primary**: `#1f2937` (gray-900)
- **Text Secondary**: `#6b7280` (gray-500)
- **Borders**: `#e5e7eb` (gray-200)
- **Success**: `#10b981` (emerald-500)
- **Error**: `#ef4444` (red-500)
- **Warning**: `#f59e0b` (amber-500)

### Typography
- **Headings**: Bold, large (text-3xl to text-4xl)
- **Body**: Medium weight, readable size (text-base)
- **Helper Text**: Smaller, gray (text-sm text-gray-500)
- **Labels**: Semibold, uppercase for buttons

### Spacing
- **Container Padding**: `p-4` (16px) on mobile
- **Card Padding**: `p-6 md:p-8` for larger content
- **Gap Between Elements**: `gap-4` to `gap-6`
- **Section Spacing**: `space-y-6` to `space-y-8`

### Components

#### 1. Buttons
```tsx
// Primary Button (Green)
className="w-full bg-emerald-600 text-white font-semibold py-4 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"

// Secondary Button (Outline)
className="w-full border-2 border-gray-300 text-gray-700 font-semibold py-4 rounded-xl hover:bg-gray-50 transition-colors"

// Explorer Type Buttons (Colored)
className="p-4 rounded-xl border-2 font-semibold transition-all text-white"
// Colors: emerald-600, blue-500, orange-500, purple-600, red-500, cyan-500
```

#### 2. Input Fields
```tsx
className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-base"
```

#### 3. Cards
```tsx
className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
```

#### 4. Image Upload
```tsx
// Avatar Circle
className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center relative"

// Upload Button Overlay
className="absolute bottom-0 right-0 w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center"
```

#### 5. Lists (Rankings, Submissions)
```tsx
// List Item
className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"

// Rank Badge
className="w-8 h-8 flex items-center justify-center font-bold"
// 1st: text-yellow-600
// 2nd: text-gray-600
// 3rd: text-orange-600
```

#### 6. Status Indicators
```tsx
// Success (Green check)
className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg"

// Error (Red X)
className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg"

// Warning (Yellow)
className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg"
```

## Mobile-First Breakpoints

```css
// Tailwind default breakpoints
sm: 640px   // Small tablets
md: 768px   // Tablets
lg: 1024px  // Laptops
xl: 1280px  // Desktops
2xl: 1536px // Large screens
```

## Page Layout Structure

### Standard Mobile Page
```tsx
<div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
  {/* Header - if needed */}
  <header className="sticky top-0 bg-white/95 backdrop-blur-sm z-50 border-b border-gray-200">
    {/* Back button, title, actions */}
  </header>

  {/* Main Content */}
  <main className="container mx-auto px-4 py-6 max-w-3xl">
    {/* Page Title */}
    <div className="text-center mb-8">
      <h1 className="text-4xl font-bold text-gray-900">PeriodiQ</h1>
      <p className="text-gray-600 mt-2">Subtitle or description</p>
    </div>

    {/* Content Cards */}
    <div className="space-y-6">
      {/* Card components */}
    </div>
  </main>
</div>
```

## Key UI Patterns from Screenshots

### 1. Onboarding/Profile Setup
- Centered layout with max-width container
- Large circular avatar with upload button
- Input fields with helper text below
- Grid of selection buttons (2-3 columns on mobile)
- Full-width primary action button at bottom
- Disabled state until all required fields filled

### 2. Image Upload Interface
- Numbered list of clues/items
- Each item in a card with border
- Image preview with aspect ratio maintained
- "EDIT" button in blue for each item
- "CHECK RESULTS" button at bottom

### 3. Rankings/Leaderboard
- Header with back button
- Title centered
- Info banner (green background)
- Total participants count
- Table with columns: POS, PLAYER, CLUES, TIME
- Alternating row colors for readability
- Avatar + username for each player
- Medal emojis/colors for top 3

### 4. Results/Summary
- Congratulations message
- Stats box with bordered sections
- List of findings with checkmarks/X marks
- Color-coded: green for correct, red for incorrect
- Thumbnail images for each clue
- Status message in yellow box
- Return to dashboard button

## Responsive Grid Patterns

### Explorer Type Selection (Screenshot 2)
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
  {/* 2 columns on mobile, 3 on tablet+ */}
</div>
```

### Stats Grid
```tsx
<div className="grid grid-cols-2 gap-4">
  {/* Always 2 columns for key-value pairs */}
</div>
```

### Clue Upload Grid
```tsx
<div className="space-y-4">
  {/* Stack vertically on mobile */}
</div>
```

## Animation & Transitions

- **Hover States**: `hover:scale-105 transition-transform duration-200`
- **Button Press**: `active:scale-95`
- **Background Changes**: `transition-colors duration-200`
- **Border Focus**: `focus:ring-2 focus:ring-emerald-200 transition-all`

## Accessibility

- Minimum touch target: 44px × 44px
- Color contrast ratio: 4.5:1 minimum
- Focus visible on all interactive elements
- Labels for all form inputs
- Alt text for images
- Semantic HTML (header, main, nav, etc.)

## Component Library Checklist

✅ All components must:
1. Be mobile-first (design for 375px width first)
2. Scale up gracefully to larger screens
3. Have proper touch targets (min 44px)
4. Include loading states
5. Show error states clearly
6. Have disabled states
7. Support keyboard navigation
8. Include proper ARIA labels

## Testing Checklist

- [ ] Test on iPhone SE (375px width)
- [ ] Test on iPhone 14 Pro (393px width)
- [ ] Test on Android (360px typical)
- [ ] Test on iPad (768px)
- [ ] Test on Desktop (1280px+)
- [ ] Test in portrait and landscape
- [ ] Test with large text enabled
- [ ] Test with touch/mouse/keyboard

# Tuckinn Admin UI/UX Fix Plan

## Issues Identified

### 1. Table Layout Issues
- **No horizontal scroll wrapper** - Tables overflow on smaller screens
- **Text truncation missing** - Product names and descriptions cause layout breaks
- **Fixed column widths** - Cause overlapping on mobile
- **Action buttons** - Too many buttons squished in rightmost column

### 2. Typography & Spacing
- **Inconsistent padding** - Cards have different internal spacing
- **Text size issues** - Some text too small (10px role badges)
- **Line height** - Descriptions not properly truncated

### 3. Mobile Responsiveness
- **Sidebar covers content** on mobile - No proper responsive breakpoints
- **Touch targets too small** - Buttons and links need min 44px
- **Forms overflow** - Create/edit forms not responsive

### 4. Component Polish
- **Image placeholders** - Need consistent fallback UI
- **Loading states** - Skeleton not matching content shape
- **Empty states** - Too many variations

---

## Fixes Required

### Products Page (`app/(admin)/catalog/products/page.tsx`)

1. Add `overflow-x-auto` wrapper around table
2. Add `min-w-0` and `truncate` to text cells
3. Move actions to a dropdown menu (reduce button count)
4. Add responsive breakpoints for column visibility

### Categories Page (`app/(admin)/catalog/categories/page.tsx`)

1. Fix inline editing layout - input fields overflow on mobile
2. Add drag handles for reordering (clearer UX)
3. Improve visibility toggle alignment

### Orders Page (`app/(admin)/orders/page.tsx`)

1. Fix card-based order list - too much info squished
2. Add proper responsive grid for order cards
3. Improve status badge sizing

### Sidebar (`components/sidebar.tsx`)

1. Fix mobile hamburger positioning
2. Add proper backdrop blur
3. Improve touch targets (min 44px)

### Global Styles (`app/globals.css`)

1. Add responsive table utilities
2. Fix custom scrollbar - may cause layout shift
3. Ensure consistent focus states

---

## Implementation Priority

**P1 (Critical - Fix First):**
1. Products table overflow + truncation
2. Sidebar mobile positioning

**P2 (Important):**
3. Categories inline editing layout
4. Orders list responsiveness

**P3 (Polish):**
5. Global style consistency
6. Animation improvements

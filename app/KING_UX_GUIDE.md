# The New King SIM - UX Style Guide

**Ancient Mediterranean Design System**
Updated: October 29, 2025

---

## Core Design Philosophy

The New King SIM recreates the world of Ancient Cyprus (5th-4th century BCE). Our interface must evoke the gravitas, elegance, and timeless quality of ancient Mediterranean civilizations while remaining accessible and functional for modern educational use.

### Design Principles

1. **Historical Authenticity Over Modern Trends**
   - Avoid contemporary UI patterns that break immersion
   - No modern tech aesthetics (glassmorphism, neumorphism, etc.)
   - Think: "What would an ancient scroll or temple inscription look like?"

2. **Clarity Through Simplicity**
   - Clean, text-based layouts
   - Clear hierarchy using typography and spacing
   - Natural, readable fonts (Playfair Display for headings, Inter for body)

3. **Mediterranean Color Palette**
   - Warm earth tones dominate the interface
   - Avoid harsh blues, bright neons, or tech-style grays
   - See "Color System" section below

---

## ❌ **CRITICAL RULE: NO MODERN ICONS OR PICTOGRAMS**

### What to Avoid

**NEVER use modern icon libraries** like:
- ❌ Lucide React icons (Crown, TrendingUp, Users, AlertCircle, BarChart, etc.)
- ❌ Font Awesome icons
- ❌ Material Design icons
- ❌ Feather icons
- ❌ Progress bars with rounded corners and gradients
- ❌ Modern data visualization (pie charts, bar graphs, line charts)
- ❌ Loading spinners with animated circles
- ❌ Hamburger menus (☰)
- ❌ Modern UI glyphs (chevrons, carets, arrows styled as >, <, etc.)

**Why?** These icons instantly break the historical immersion and make the interface feel like a modern app rather than an ancient world simulation.

### What to Use Instead

✅ **Emoji** (used sparingly and thoughtfully):
- 👑 Crown (for King, winner, nominations)
- ⚖️ Scales (for balance, tie votes, justice)
- 🗳️ Ballot box (for voting)
- ✅ ❌ Check/cross marks (for yes/no)
- ⚠️ Warning sign (for alerts, failures)
- 📜 Scroll (for documents, history)
- ⏳ Hourglass (for time/waiting)
- 🏛️ Classical building (for city, governance)

✅ **Clean Text-Based Design**:
```jsx
// Good: Simple, clear text
<div className="text-2xl font-bold text-amber-900">
  Winner: Aristarchus
</div>

// Bad: Modern icon + text
<div className="flex items-center gap-2">
  <Crown className="w-6 h-6" />
  <span>Winner: Aristarchus</span>
</div>
```

✅ **Borders, Cards, and Visual Hierarchy**:
```jsx
// Good: Use borders and background colors to create hierarchy
<div className="bg-amber-50 border-4 border-amber-600 rounded-xl p-6">
  <h3 className="text-3xl font-heading font-bold text-amber-900 mb-3">
    Vote Results
  </h3>
  <p className="text-amber-800">Winner determined by 2/3 majority</p>
</div>
```

✅ **Simple Number Display**:
```jsx
// Good: Large, clear numbers
<div className="flex items-center justify-between">
  <span className="text-lg font-semibold">Aristarchus</span>
  <span className="text-2xl font-bold text-amber-900">7 votes</span>
</div>

// Bad: Progress bar
<div className="w-full bg-gray-200 rounded-full h-3">
  <div className="h-3 rounded-full bg-amber-500" style={{ width: '70%' }} />
</div>
```

---

## Color System

### Primary Palette (Mediterranean Earth Tones)

**Amber/Gold (Primary)**
- `amber-50`: #FFFBEB (backgrounds, highlights)
- `amber-100`: #FEF3C7
- `amber-200`: #FDE68A
- `amber-300`: #FCD34D
- `amber-400`: #FBBF24
- `amber-500`: #F59E0B
- `amber-600`: #D97706 (primary actions, emphasis)
- `amber-700`: #B45309
- `amber-800`: #92400E (text, headings)
- `amber-900`: #78350F (dark text, strong emphasis)

**Terracotta/Orange (Accents)**
- `orange-50`: #FFF7ED
- `orange-100`: #FFEDD5
- `orange-600`: #EA580C (warm accents)
- `orange-800`: #9A3412

**Neutral (Stone/Parchment)**
- `neutral-50`: #FAFAF9 (light backgrounds)
- `neutral-100`: #F5F5F4
- `neutral-200`: #E7E5E4 (borders)
- `neutral-600`: #57534E (secondary text)
- `neutral-700`: #44403C
- `neutral-900`: #1C1917 (body text)

**Success States**
- Use `amber-700` or `amber-800` for confirmed/completed states
- Avoid bright "toxic green" (#16A34A) - not Mediterranean!
- If green is needed, use muted olive tones only for critical success indicators

### Clan Colors

Each clan has a distinctive color that should be used for:
- Clan emblems/logos
- Clan member borders
- Clan-specific UI elements

Examples from Kourion scenario:
- **Kourionites**: `#8B4513` (Saddle Brown)
- **Achaeans**: `#4169E1` (Royal Blue)
- **Phoenicians**: `#800080` (Purple)
- **Satraps**: `#FFD700` (Gold)

### Color Usage Guidelines

1. **Backgrounds**: Use `amber-50`, `orange-50`, or `neutral-50` for card backgrounds
2. **Borders**: Use `amber-600`, `amber-400`, or `neutral-200` with 2-4px thickness
3. **Text**:
   - Headings: `amber-900`, `neutral-900`
   - Body: `neutral-700`, `amber-800`
   - Secondary: `neutral-600`, `amber-700`
4. **Buttons**: `amber-600` with `hover:amber-700`
5. **Success/Warnings**: Green for success, amber for warnings, avoid red except for critical errors

---

## Typography

### Font Families

**Heading Font**: `font-heading` → Playfair Display (serif)
- Use for titles, phase names, character names
- Conveys classical elegance and authority

**Body Font**: `font-sans` → Inter (sans-serif)
- Use for paragraphs, descriptions, UI text
- Maintains readability and accessibility

### Font Sizes

```jsx
// Page Titles
<h1 className="text-4xl font-heading font-bold">

// Section Headings
<h2 className="text-3xl font-heading font-bold">

// Subsection Headings
<h3 className="text-xl font-heading font-bold">

// Body Text
<p className="text-base">

// Large Emphasis
<div className="text-2xl font-semibold">

// Small Text
<span className="text-sm">
```

### Font Weights

- **Bold** (`font-bold`): Headings, emphasis, winners
- **Semibold** (`font-semibold`): Subheadings, important text
- **Medium** (`font-medium`): Default for UI elements
- **Regular** (`font-normal`): Body text, descriptions

---

## Layout Components

### Cards

```jsx
// Standard Card
<div className="bg-white rounded-lg border-2 border-neutral-200 p-6">
  {/* Content */}
</div>

// Emphasized Card (Gold border)
<div className="bg-amber-50 rounded-xl border-4 border-amber-600 p-8">
  {/* Content */}
</div>

// Clan-Specific Card
<div
  className="bg-white rounded-lg border-4 p-6"
  style={{ borderColor: clanColor }}
>
  {/* Content */}
</div>
```

### Buttons

```jsx
// Primary Button
<button className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium">
  Take Action
</button>

// Secondary Button
<button className="px-6 py-3 bg-white text-amber-900 border-2 border-amber-600 rounded-lg hover:bg-amber-50 transition-colors font-medium">
  Cancel
</button>

// Success Button
<button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
  Confirm
</button>
```

### Banners/Alerts

```jsx
// Info Banner (Amber)
<div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
  <div className="font-heading font-bold text-amber-900 mb-2">
    ⚠️ Important Notice
  </div>
  <p className="text-amber-800">{message}</p>
</div>

// Success Banner (Green)
<div className="bg-green-50 border-2 border-green-600 rounded-lg p-4">
  <div className="font-heading font-bold text-green-900 mb-2">
    ✅ Success
  </div>
  <p className="text-green-800">{message}</p>
</div>
```

---

## Voting & Results Display

### Vote Results (Choose Person)

**Good Example:**
```jsx
<div className="bg-gradient-to-br from-amber-50 to-orange-50 border-4 border-amber-400 rounded-xl p-8 text-center">
  <div className="text-6xl mb-2">👑</div>
  <h3 className="text-4xl font-heading font-bold text-amber-900 mb-3">
    Aristarchus
  </h3>
  <p className="text-2xl text-amber-800 font-semibold">
    7 votes (58%)
  </p>
</div>

{/* Vote Breakdown */}
<div className="space-y-3">
  {candidates.map(candidate => (
    <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-5">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <span className="text-lg font-semibold text-amber-900">
            {candidate.name}
          </span>
          <div className="text-sm text-amber-700">
            {candidate.percentage}% of votes
          </div>
        </div>
        <div className="text-2xl font-bold text-amber-900">
          {candidate.voteCount}
        </div>
      </div>
    </div>
  ))}
</div>
```

**Bad Example (Avoid):**
```jsx
// ❌ Don't use: Modern icons + progress bars
<div className="flex items-center gap-2">
  <Crown className="w-6 h-6" />
  <span>Winner: Aristarchus</span>
</div>

<div className="w-full bg-gray-200 rounded-full h-3">
  <div className="h-3 rounded-full bg-amber-500" style={{ width: '70%' }} />
</div>
```

---

## Animation Guidelines

### Allowed Animations

1. **Fade In/Out** (`opacity` transitions)
2. **Scale** (for emphasis, like role reveal)
3. **Slide** (for modals, phase transitions)
4. **Color Transitions** (for hover states)

### Animation Timing

- **Quick**: 150-200ms (hover, button press)
- **Normal**: 300-500ms (modal open/close, fade in/out)
- **Slow**: 1000-2000ms (dramatic reveals, phase changes)

### Example

```jsx
<motion.div
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 1 }}
>
  {/* Reveal content */}
</motion.div>
```

---

## Accessibility

1. **Color Contrast**: Ensure WCAG AA compliance
   - Amber-900 (#78350F) on white: ✅ Pass
   - Amber-600 (#D97706) on white: ✅ Pass
   - Amber-300 (#FCD34D) on white: ❌ Fail (too light)

2. **Font Sizes**: Minimum 14px for body text

3. **Interactive Elements**: Minimum 44x44px touch target

4. **Screen Readers**: Use semantic HTML
   - `<button>` for actions
   - `<h1>`, `<h2>`, etc. for headings
   - `alt` text for images

---

## Examples: Before & After

### Vote Results Display

**Before (Modern Style):**
```jsx
<div className="flex items-center gap-2">
  <Crown className="w-5 h-5 text-amber-500" />
  <span>Aristarchus</span>
  <TrendingUp className="w-4 h-4" />
</div>
<div className="w-full bg-gray-200 rounded-full h-3">
  <div className="bg-amber-500 h-3 rounded-full" style={{ width: '70%' }} />
</div>
```

**After (Mediterranean Style):**
```jsx
<div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-5">
  <div className="flex items-center justify-between">
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">👑</span>
        <span className="text-lg font-semibold text-amber-900">
          Aristarchus
        </span>
      </div>
      <div className="text-sm text-amber-700">70% of votes</div>
    </div>
    <div className="text-2xl font-bold text-amber-900">7</div>
  </div>
</div>
```

### Modal Header

**Before:**
```jsx
<div className="bg-gradient-to-r from-amber-600 to-amber-700 p-6 flex justify-between">
  <h2 className="text-white">Vote Results</h2>
  <X className="w-6 h-6 text-white" />
</div>
```

**After:**
```jsx
<div className="bg-gradient-to-br from-amber-50 to-orange-50 border-b-4 border-amber-600 p-6">
  <div className="text-center">
    <h2 className="text-3xl font-heading font-bold text-amber-900 mb-2">
      Vote Results
    </h2>
  </div>
  <button className="absolute top-4 right-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium">
    Close
  </button>
</div>
```

---

## Quick Reference Checklist

When creating or reviewing UI components, ask:

- [ ] **No modern icon libraries?** (Crown, TrendingUp, X, etc.)
- [ ] **Using Mediterranean colors?** (amber, orange, neutral earth tones)
- [ ] **Emoji used sparingly?** (only for key concepts like 👑, ⚖️, 🗳️)
- [ ] **No progress bars?** (use text + numbers instead)
- [ ] **Clear text hierarchy?** (font-heading for titles, proper sizing)
- [ ] **Borders thick enough?** (2-4px for emphasis)
- [ ] **Rounded corners moderate?** (rounded-lg or rounded-xl, not rounded-full everywhere)
- [ ] **Historical feel?** (Could this exist in ancient times visually?)

---

## Maintenance

This guide should be updated when:
1. New UI patterns are established
2. Color palette is expanded
3. New component types are created
4. User feedback reveals confusion

**Last Updated**: October 29, 2025
**Version**: 1.0
**Owner**: Development Team

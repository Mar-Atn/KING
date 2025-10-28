# KING UX STYLE GUIDE
**The New King SIM Web Application**  
**Version 1.0 - Design System & Interface Specifications**  
**Date: October 25, 2025**

---

## DOCUMENT PURPOSE

This document defines the complete visual design system and user interface specifications for The New King SIM Web App, based on the Relume-generated design system (Version 2).

**Single source of truth for:**
- Design tokens (colors, typography, spacing)
- Component library and usage guidelines  
- Screen-by-screen layout specifications
- Responsive design patterns
- Ancient Cyprus theme integration
- Accessibility standards

**Related Documents:**
- `KING_PRD.md` - Product requirements
- `KING_TECH_GUIDE.md` - Technical architecture  
- `KING_AI_DESIGN.md` - AI participant system

---

## DESIGN PHILOSOPHY

### Core Principle
**"Modern civic interface with classical dignity"**

The New King interface balances:
1. **Functional Clarity** - Instant comprehension for facilitators and participants
2. **Professional Polish** - Corporate learning quality standards
3. **Thematic Atmosphere** - Subtle Ancient Cyprus elements enhance immersion

### Two User Experiences

**Facilitator (Desktop-First):**
- Dense information, multiple panels
- Real-time monitoring dashboards
- Advanced controls

**Participant (Mobile-First):**  
- Single-focus, phase-driven
- Large touch targets (44px minimum)
- Contextual content only

---

## 1. DESIGN TOKENS

### 1.1 Color Palette

```css
/* Primary Colors */
--primary: #2C5F7C;        /* Mediterranean Blue */
--primary-hover: #244F67;
--primary-light: #E8F1F5;

--secondary: #C9704F;      /* Chestnut Rose */
--secondary-hover: #B35F3F;
--secondary-light: #F5EBE6;

--accent: #D4AF37;         /* Antique Gold */
--accent-hover: #B8952E;
--accent-light: #F9F4E6;

/* Clan Colors */
--clan-military: #CD7F32;     /* Bronze */
--clan-merchants: #DAA520;    /* Goldenrod */
--clan-philosophers: #6A5ACD; /* Slate Blue */
--clan-landlords: #8FBC8F;    /* Sage Green */
--clan-bankers: #4682B4;      /* Steel Blue */
--clan-artificers: #BC8F8F;   /* Rosy Brown */

/* Neutrals - Stone & Parchment */
--neutral-50: #F9F8F6;
--neutral-100: #F0EDE8;
--neutral-200: #E2DCD3;
--neutral-700: #3D3A36;
--neutral-900: #1A1A1A;

/* Semantic */
--success: #4A7C59;
--warning: #C97435;
--error: #B94A48;
```

### 1.2 Typography

```css
/* Fonts */
--font-heading: 'Cinzel', Georgia, serif;
--font-body: 'Inter', Lato, sans-serif;

/* Sizes */
--text-display: 2rem;      /* 32px */
--text-h1: 1.5rem;         /* 24px */
--text-h2: 1.25rem;        /* 20px */
--text-h3: 1.125rem;       /* 18px */
--text-body: 1rem;         /* 16px */
--text-small: 0.875rem;    /* 14px */
--text-tiny: 0.75rem;      /* 12px */
```

### 1.3 Spacing Scale

```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
```

### 1.4 Other Tokens

```css
/* Border Radius */
--radius-sm: 0.25rem;  /* 4px */
--radius-md: 0.5rem;   /* 8px */
--radius-lg: 0.75rem;  /* 12px */
--radius-full: 9999px;

/* Shadows */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px rgba(0,0,0,0.1);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1);

/* Transitions */
--transition-base: 250ms cubic-bezier(0.4,0,0.2,1);
```

---

## 2. COMPONENT LIBRARY

### 2.1 Buttons

**Primary Button:**
```jsx
<button className="px-6 py-3 bg-primary text-white rounded-md font-medium hover:bg-primary-hover transition-base shadow-sm">
  Primary Action
</button>
```

**Secondary Button:**
```jsx
<button className="px-6 py-3 bg-secondary text-white rounded-md font-medium hover:bg-secondary-hover transition-base">
  Secondary Action
</button>
```

**Outline Button:**
```jsx
<button className="px-6 py-3 bg-transparent text-primary border-2 border-primary rounded-md font-medium hover:bg-primary-light transition-base">
  Outline Action
</button>
```

**Ghost Button:**
```jsx
<button className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-md transition-base">
  Ghost Action
</button>
```

### 2.2 Cards

**Basic Card:**
```jsx
<div className="bg-white rounded-lg shadow-md p-6 border border-neutral-200">
  <h3 className="text-h3 font-heading mb-2">Title</h3>
  <p className="text-body text-neutral-600">Content</p>
</div>
```

**Role Card:**
```jsx
<div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-clan-military">
  <div className="flex items-start gap-4">
    <img src="avatar.jpg" className="w-16 h-16 rounded-full" />
    <div>
      <h3 className="text-h3 font-heading">Leonidas</h3>
      <p className="text-small text-neutral-600">Military Clan</p>
      <span className="inline-block mt-2 px-3 py-1 bg-clan-military-light text-clan-military rounded-full text-tiny">
        General of Armies
      </span>
    </div>
  </div>
</div>
```

**Meeting Invitation Card:**
```jsx
<div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-accent">
  <h3 className="text-h3 font-heading mb-3">🤝 Meeting Invitation</h3>
  <div className="space-y-2 mb-4 text-small">
    <div className="flex justify-between">
      <span className="text-neutral-600">From:</span>
      <span className="font-medium">Themistocles</span>
    </div>
    <div className="flex justify-between">
      <span className="text-neutral-600">Topic:</span>
      <span className="font-medium">Alliance Discussion</span>
    </div>
  </div>
  <div className="flex gap-3">
    <button className="flex-1 px-4 py-2 bg-primary text-white rounded-md">Accept</button>
    <button className="flex-1 px-4 py-2 border-2 border-neutral-300 rounded-md">Decline</button>
  </div>
</div>
```

### 2.3 Forms

**Text Input:**
```jsx
<div className="space-y-2">
  <label className="block text-small font-medium text-neutral-700">Label</label>
  <input 
    type="text"
    className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-md focus:border-primary focus:ring-2 focus:ring-primary-light"
    placeholder="Placeholder"
  />
</div>
```

**Radio Button (Vote):**
```jsx
<label className="flex items-center p-4 bg-white border-2 border-neutral-200 rounded-lg cursor-pointer hover:border-primary">
  <input type="radio" name="vote" className="w-5 h-5 text-primary" />
  <div className="ml-4 flex items-center gap-3">
    <img src="avatar.jpg" className="w-10 h-10 rounded-full" />
    <div>
      <p className="font-medium">Leonidas</p>
      <p className="text-small text-neutral-600">Military Clan</p>
    </div>
  </div>
</label>
```

### 2.4 Status Indicators

**Phase Progress:**
```jsx
<div className="w-full">
  <div className="flex justify-between mb-2 text-small">
    <span className="font-medium">Phase 3 / 12</span>
    <span className="text-neutral-600">Free Consultations</span>
  </div>
  <div className="w-full h-2 bg-neutral-200 rounded-full">
    <div className="h-full bg-primary rounded-full" style="width: 25%"></div>
  </div>
</div>
```

**Timer:**
```jsx
<div className="flex items-center gap-3 px-4 py-3 bg-neutral-100 rounded-lg">
  <span className="text-2xl">⏱</span>
  <div>
    <p className="text-tiny text-neutral-600">Time Remaining</p>
    <p className="text-h1 font-mono font-bold text-primary">15:42</p>
  </div>
</div>
```

**Status Badge:**
```jsx
<!-- Active -->
<span className="inline-flex items-center gap-2 px-3 py-1 bg-success-light text-success rounded-full text-small">
  <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
  Active
</span>
```

### 2.5 Navigation

**Participant Header:**
```jsx
<header className="sticky top-0 bg-white border-b shadow-sm">
  <div className="flex items-center justify-between px-4 py-3">
    <div className="flex items-center gap-4">
      <span className="text-2xl">👑</span>
      <span className="font-heading font-bold text-primary">The New King</span>
      <span className="text-small font-medium">Phase 3: Free Consultations</span>
    </div>
    <div className="flex items-center gap-2 px-3 py-1 bg-neutral-100 rounded-full">
      <span>⏱</span>
      <span className="font-mono font-bold text-primary">12:34</span>
    </div>
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-small font-medium">Leonidas</p>
        <p className="text-tiny text-neutral-600">Military Clan</p>
      </div>
      <img src="avatar.jpg" className="w-10 h-10 rounded-full border-2 border-clan-military" />
    </div>
  </div>
</header>
```

**Facilitator Sidebar:**
```jsx
<aside className="w-64 h-screen bg-neutral-900 text-white flex flex-col">
  <div className="p-6 border-b border-neutral-800">
    <div className="flex items-center gap-2">
      <span className="text-2xl">👑</span>
      <span className="font-heading font-bold">The New King</span>
    </div>
    <p className="text-tiny text-neutral-400 mt-1">Facilitator Console</p>
  </div>
  <nav className="flex-1 p-4 space-y-1">
    <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md bg-primary">
      <span>📊</span><span className="text-small font-medium">Overview</span>
    </a>
    <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-neutral-800">
      <span>👥</span><span className="text-small">Participants</span>
    </a>
  </nav>
</aside>
```

---

## 3. KEY SCREENS

### 3.1 Login Screen
- Centered layout (max-width 400px)
- Email/password inputs
- Primary "Sign In" button
- QR code option

### 3.2 Role Assignment
- Animated reveal (spinning scroll)
- Character avatar (large)
- Role name, age, position, clan
- "View Role Details" button

### 3.3 Participant Dashboard (Phase-Driven)
**Structure:**
- Header: Phase name + timer + user info
- Main: Phase-specific content
- Footer: Quick actions

**Free Consultation Phase:**
- "Invite to Meeting" button
- Active meetings list
- Pending invitations
- Completed meetings

**Voting Phase:**
- Radio button ballot
- Candidate cards with avatars
- "View Speech" links
- Abstain option
- Submit button

### 3.4 Facilitator Console (Desktop)
**Layout:**
- Left sidebar (64px): Navigation
- Main area: Dashboard/tabs
- Right panel (256px): Timer, stats, quick actions

**Overview Tab:**
- Phase control (pause, extend, skip, end)
- Phase progress bar
- Participant grid (status indicators)
- Active meetings list (4 visible)
- Recent activity log

**Voting Tab:**
- Real-time vote tally
- Bar chart visualization
- List of who hasn't voted
- Close/calculate buttons

### 3.5 Meeting Interface
- Participant avatars with status (speaking/listening)
- Live auto-scrolling transcript
- Controls: Mute, Chat, Add Participant
- Leave button
- Timer (remaining time)

### 3.6 Reflection & Debrief
- Multiple text areas (goals, strategies, insights)
- "Talk to Zenon" button (AI dialogue)
- Submit button

**Final Debrief:**
- King announcement with crown icon
- Key decisions summary
- Coalition network diagram
- Clan responses (oath status)
- Generate personal feedback button

---

## 4. RESPONSIVE DESIGN

### Breakpoints
```css
--sm: 640px   /* Large phones */
--md: 768px   /* Tablets */
--lg: 1024px  /* Laptops */
--xl: 1440px  /* Desktops */
```

### Mobile (320px-768px)
- Single column
- Sticky header
- Bottom navigation
- 44px minimum touch targets
- Simplified meeting interface

### Desktop (1024px+)
- Three-panel facilitator layout
- Dense information display
- Hover states
- Keyboard shortcuts

---

## 5. ANCIENT CYPRUS THEME

### Subtle Integration
- Meander pattern borders (section dividers)
- Parchment texture overlay (5-10% opacity on role briefs)
- Column capital icons (🏛️ for headers)
- Classical serif for headings only

### Color Philosophy
- Warm earth tones (terracotta, gold, bronze)
- Stone neutrals (not pure white/black)
- Mediterranean blue as primary

### Icons
- 👑 King/royalty
- 🏛️ Sections
- 📜 Documents
- 🗳️ Voting
- ⚖️ Justice
- 🌾 Agriculture
- ⚓ Trade

---

## 6. ACCESSIBILITY (WCAG 2.1 AA)

### Color Contrast
- Text: 4.5:1 minimum
- UI components: 3:1 minimum
- Primary on white: 8.2:1 ✓

### Keyboard Navigation
- All interactive elements tabbable
- Visible focus states (2px outline)
- Shortcuts for facilitator

### Screen Readers
- Semantic HTML
- ARIA labels on icons
- Status announcements

### Motion
- Respect `prefers-reduced-motion`
- Optional animations only

---

## 7. DEVELOPER HANDOFF

### Tailwind Config
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2C5F7C', hover: '#244F67', light: '#E8F1F5' },
        secondary: { DEFAULT: '#C9704F', hover: '#B35F3F', light: '#F5EBE6' },
        accent: { DEFAULT: '#D4AF37', hover: '#B8952E', light: '#F9F4E6' },
        clan: {
          military: { DEFAULT: '#CD7F32', light: '#F5EDE5' },
          merchants: { DEFAULT: '#DAA520', light: '#F9F3E3' },
          // ... others
        },
      },
      fontFamily: {
        heading: ['Cinzel', 'Georgia', 'serif'],
        body: ['Inter', 'Lato', 'sans-serif'],
      },
    },
  },
}
```

### Assets Needed
- Character avatars: 256x256px PNG
- Clan emblems: 128x128px SVG
- Background textures: Tileable patterns
- Icons: SVG, single color

### Fonts
- Cinzel: Google Fonts (400, 600, 700)
- Inter: Google Fonts (400, 500, 600, 700)

---

## QUICK REFERENCE

### Colors
```
Primary: #2C5F7C
Secondary: #C9704F
Accent: #D4AF37
Military: #CD7F32
Merchants: #DAA520
Philosophers: #6A5ACD
Landlords: #8FBC8F
Bankers: #4682B4
Artificers: #BC8F8F
```

### Typography
```
Display: 32px
H1: 24px
H2: 20px
Body: 16px
Small: 14px
Tiny: 12px
```

### Spacing
```
4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
```

---

*End of Document – KING UX Style Guide v1.0*

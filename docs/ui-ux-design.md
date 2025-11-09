# UI/UX Design Documentation

This document contains all UI/UX design specifications, design system, and implementation guidelines for the LearnerAI microservice frontend.

## Table of Contents
1. [Design System Overview](#design-system-overview)
2. [Frontend Implementation Guidelines](#frontend-implementation-guidelines)
3. [Component Specifications](#component-specifications)
4. [Page Layouts](#page-layouts)
5. [Design Assets](#design-assets)

---

## Design System Overview

### Color Palette

#### Emerald Brand Colors
- `emeraldbrand-50`: #f0fdfa
- `emeraldbrand-100`: #ccfbf1
- `emeraldbrand-200`: #99f6e4
- `emeraldbrand-300`: #5eead4
- `emeraldbrand-400`: #2dd4bf
- `emeraldbrand-500`: #14b8a6
- `emeraldbrand-600`: #0d9488
- `emeraldbrand-700`: #047857
- `emeraldbrand-800`: #065f46
- `emeraldbrand-900`: #064e3b

#### Primary Colors
- `primary-blue`: #065f46
- `primary-purple`: #047857
- `primary-cyan`: #0f766e

#### Accent Colors
- `accent-gold`: #d97706
- `accent-green`: #047857
- `accent-orange`: #f59e0b

#### Gold Brand Colors
- `goldbrand-400`: #d97706
- `goldbrand-500`: #f59e0b

#### Background Colors
- `bg-primary`: #f8fafc (Light) / #0f172a (Dark)
- `bg-secondary`: #e2e8f0 (Light) / #1e293b (Dark)
- `bg-tertiary`: #cbd5e1 (Light) / #334155 (Dark)
- `bg-card`: #ffffff (Light) / #1e293b (Dark)

#### Text Colors
- `text-primary`: #1e293b (Light) / #f8fafc (Dark)
- `text-secondary`: #475569 (Light) / #cbd5e1 (Dark)
- `text-muted`: #64748b (Light) / #94a3b8 (Dark)
- `text-accent`: #334155 (Light) / #e2e8f0 (Dark)

#### Gamification Colors
- `xp-color`: #f59e0b
- `level-color`: #047857
- `badge-color`: #10b981
- `streak-color`: #ef4444

### Gradients

- `gradient-primary`: linear-gradient(135deg, #065f46, #047857)
- `gradient-secondary`: linear-gradient(135deg, #0f766e, #047857)
- `gradient-accent`: linear-gradient(135deg, #d97706, #f59e0b)
- `gradient-card`: linear-gradient(145deg, #ffffff, #f0fdfa) (Light) / linear-gradient(145deg, #1e293b, #334155) (Dark)

### Shadows

- `shadow-glow`: 0 0 30px rgba(6, 95, 70, 0.3) (Light) / 0 0 30px rgba(13, 148, 136, 0.4) (Dark)
- `shadow-card`: 0 10px 40px rgba(0, 0, 0, 0.1) (Light) / 0 10px 40px rgba(0, 0, 0, 0.6) (Dark)
- `shadow-hover`: 0 20px 60px rgba(6, 95, 70, 0.2) (Light) / 0 20px 60px rgba(13, 148, 136, 0.3) (Dark)

### Typography

- **Primary Font**: Inter (sans-serif)
- **Display Font**: Space Grotesk (sans-serif)

### Spacing Scale

- `spacing-xs`: 0.5rem (8px)
- `spacing-sm`: 1rem (16px)
- `spacing-md`: 1.5rem (24px)
- `spacing-lg`: 2rem (32px)
- `spacing-xl`: 3rem (48px)
- `spacing-2xl`: 4rem (64px)

---

## Frontend Implementation Guidelines

### Technical Stack

- **Framework**: React
- **Language**: JavaScript (NOT TypeScript)
- **Syntax**: JSX
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (utility classes only, no raw CSS files)
- **Deployment**: Vercel (Frontend)

### Design Cohesion Requirements

The UI must maintain high design cohesion with other existing microservices:

1. **Header/Navigation Bar**: Must match the general layout, size, and color usage of the larger system
2. **Page Layouts**: General structure, padding, and content block styling must be consistent
3. **Button Styles**: Consistent sizing, colors (including hover/active states), and rounding across the entire application
4. **Logo Placement**: Must match the size and placement of the corporate logo used in other microservices
5. **Theming**: Full support for both Light Mode (default) and Dark Mode is mandatory. All components must use the defined color palette for automatic theme switching

### Asset Management

- **Logo Source**: Corporate logo images are hosted by the Backend API (Railway)
- **Asset Access**: Frontend (Vercel) must use Railway API endpoint for asset retrieval
- **Security**: Requires API Key (e.g., `RAILWAY_ASSET_KEY`) configured as Environment Variable in Vercel
- **Logo**: EDUCORE AI logo provided in both light and dark versions

### Implementation Tasks

1. **Tailwind Config Integration**: Integrate provided color and style definitions. All component styling must use defined custom colors (e.g., `text-primary`, `bg-card`, `emeraldbrand-500`)

2. **Global Styles**: Define basic layout files to support:
   - Primary typography (font-space-grotesk or font-inter)
   - Theme toggling mechanism (Light/Dark Mode) structurally ready

3. **Cohesive Component Generation**:
   - **Header Component (Header.jsx)**: Responsive header with logo (fetched via Railway API) and navigation links. Must match corporate standard appearance
   - **Primary Button Component (PrimaryButton.jsx)**: Reusable button using goldbrand or primary-cyan colors, matching visual style (size, padding, shadow)
   - **Card Component (Card.jsx)**: Reusable card/panel using bg-card color, boxShadow.card, and gradient-card for visual depth

---

## Component Specifications

### Header Component

**Requirements:**
- Fixed position at top
- Backdrop blur effect
- Responsive navigation
- Logo fetched from Railway API
- Theme toggle button
- User profile section (if authenticated)
- Navigation links appropriate for LearnerAI:
  - Dashboard (for company admins)
  - My Courses (for learners)
  - Learning Paths
  - Settings

**Styling:**
- Use `bg-card` with backdrop-filter blur
- Border bottom with subtle color
- Navigation links with hover effects using `primary-cyan`
- Logo using Space Grotesk font with gradient-primary

### Primary Button Component

**Requirements:**
- Uses `gradient-primary` or `goldbrand` colors
- Consistent sizing and padding
- Hover effects with `shadow-hover`
- Active states
- Rounded corners (8px border-radius)
- Smooth transitions

**Variants:**
- Primary: `gradient-primary` background
- Secondary: Transparent with border
- Accent: `gradient-accent` for special actions

### Card Component

**Requirements:**
- Uses `bg-card` background
- `gradient-card` for depth
- `shadow-card` for elevation
- Border with subtle opacity
- Rounded corners (12px border-radius)
- Hover effects with `shadow-hover`
- Padding: `spacing-lg` or `spacing-xl`

### Dashboard Card

**Requirements:**
- Uses `gradient-card` background
- Border with rgba(255, 255, 255, 0.1)
- Rounded corners (12px)
- Padding: `spacing-xl`
- Hover effect: translateY(-5px) with border-color change to `primary-cyan`
- Icon container: 60px × 60px with `gradient-primary` background

### User Card

**Requirements:**
- Uses `bg-tertiary` background
- Border with rgba(255, 255, 255, 0.1)
- Rounded corners (16px)
- Padding: `spacing-xl`
- Hover effect: translateY(-12px) scale(1.03)
- User icon: 80px × 80px with `gradient-primary` background

---

## Page Layouts

### Company Dashboard

**Purpose**: Display all users in a company with their learning paths

**Layout Structure:**
1. **Header**: Fixed header with LearnerAI branding and navigation
2. **Search & Filter Bar**: 
   - Search input for user names
   - Filter dropdowns (by department, role, course status)
   - Positioned below header
3. **User List Section**:
   - Grid or list layout of user cards
   - Each card shows:
     - User name and role
     - Number of courses
     - Quick stats
   - Clickable to expand and view learning paths
4. **Learning Path Display**:
   - Expandable section per user
   - Shows full learning path per course
   - Displays complete path structure:
     - Expanded competencies
     - Micro/Nano skill breakdown
     - Detailed learning steps
   - Uses cards or accordion-style layout

**Design Elements:**
- Use `dashboard-grid` for user cards
- Search bar with `bg-card` and `shadow-card`
- Filter buttons using `btn-secondary` style
- User cards using `user-card` styling
- Learning path sections using `card` component

### User View (Learner Interface)

**Purpose**: Display learner's registered courses and learning paths

**Layout Structure:**
1. **Header**: Fixed header with LearnerAI branding and navigation
2. **Course Selection Section**:
   - Dropdown/search interface for course selection
   - Shows all registered courses
   - Search functionality
   - Filter options
3. **Learning Path Timeline**:
   - Vertical step-by-step timeline layout
   - Each step displayed as a card below the previous one
   - Visual connections between steps
   - Clear indicators for:
     - Completed steps (checkmark, muted colors)
     - Current step (highlighted with `primary-cyan`, active state)
     - Upcoming steps (standard styling)
   - Each step card shows:
     - Step number/order
     - Skill/competency name
     - Description
     - Progress indicator (if applicable)
     - Icon or visual element

**Design Elements:**
- Course dropdown using `bg-card` with `shadow-card`
- Timeline container with vertical layout
- Step cards using `card` component with:
  - Left border or connector line using `primary-cyan`
  - Icon on left side (40px × 40px with `gradient-primary`)
  - Content area with step details
  - Smooth animations on load
- Completed steps: Muted colors, checkmark icon
- Current step: Highlighted border, `primary-cyan` accent, active animation
- Upcoming steps: Standard `bg-card` styling

**Timeline Visual Design:**
- Vertical line connecting all steps (using `primary-cyan` color)
- Step cards positioned along the timeline
- Spacing: `spacing-lg` between steps
- Responsive: Stacks properly on mobile
- Smooth scroll animations when path loads

---

## Design Assets

### Logo

**Brand**: EDUCORE AI

**Versions:**
- Light version: For dark backgrounds
- Dark version: For light backgrounds

**Implementation:**
- Logo fetched from Railway API endpoint
- Requires `RAILWAY_ASSET_KEY` environment variable
- Display in header at standard size and placement
- Responsive sizing for mobile

### Icons

**Icon System:**
- Use consistent icon library (Font Awesome or similar)
- Icon sizes:
  - Small: 16px
  - Medium: 24px
  - Large: 40px
  - Extra Large: 60px

**Icon Colors:**
- Default: `text-secondary`
- Hover: `text-primary`
- Accent: `primary-cyan`
- Success: `accent-green`
- Warning: `accent-orange`

---

## Theming

### Light Mode (Default)

- Background: `bg-primary` (#f8fafc)
- Cards: `bg-card` (#ffffff)
- Text: `text-primary` (#1e293b)
- Gradients: Standard emerald gradients
- Shadows: Subtle shadows with low opacity

### Dark Mode

- Background: `bg-primary` (#0f172a)
- Cards: `bg-card` (#1e293b)
- Text: `text-primary` (#f8fafc)
- Gradients: Brighter emerald gradients for visibility
- Shadows: Enhanced shadows with higher opacity

### Theme Toggle

- Position: Header, right side
- Style: Circular button (40px × 40px)
- Background: `bg-tertiary`
- Hover: `primary-cyan` background with scale(1.1)
- Icon: Sun/Moon icon
- Smooth transition on theme change

---

## Responsive Design

### Breakpoints

- Mobile Portrait: up to 575px
- Mobile Landscape: 576px - 767px
- Tablet Portrait: 768px - 991px
- Tablet Landscape: 992px - 1199px
- Desktop: 1200px - 1399px
- Large Desktop: 1400px+
- Ultra-wide: 1920px+

### Mobile Adaptations

- Header: Compact navigation, hamburger menu if needed
- Dashboard: Single column layout
- Timeline: Full width cards, simplified connectors
- Search/Filter: Stacked vertically
- Buttons: Full width on small screens
- Cards: Reduced padding, simplified layouts

---

## Accessibility Features

### Required Features

1. **Focus Indicators**: 3px solid outline with `primary-cyan` color
2. **Skip Links**: For keyboard navigation
3. **Screen Reader Support**: ARIA labels and semantic HTML
4. **Color Contrast**: WCAG AA compliant
5. **Keyboard Navigation**: All interactive elements accessible via keyboard
6. **Touch Targets**: Minimum 44px × 44px for mobile

### Optional Enhancements

1. **Color Blind Friendly Mode**: Alternative color schemes
2. **High Contrast Mode**: Enhanced contrast for visibility
3. **Large Font Mode**: Increased font sizes and spacing
4. **Reduced Motion**: Respect `prefers-reduced-motion` media query

---

## Animations & Transitions

### Standard Transitions

- Duration: 0.3s ease
- Properties: background-color, color, border-color, box-shadow, transform

### Hover Effects

- Cards: translateY(-5px to -12px) with shadow enhancement
- Buttons: translateY(-2px) with glow effect
- Links: Underline animation from center

### Loading States

- Spinner: Circular border animation
- Skeleton loaders: Pulse animation for content placeholders
- Page transitions: Fade in/out

### Timeline Animations

- Step cards: Fade in with translateY on scroll
- Progress indicators: Width animation
- Checkmarks: Scale animation on completion

---

## Implementation Checklist

### Required Files

- [ ] `tailwind.config.js` (integrated with provided config)
- [ ] `src/components/Header.jsx`
- [ ] `src/components/PrimaryButton.jsx`
- [ ] `src/components/Card.jsx`
- [ ] `src/components/DashboardCard.jsx`
- [ ] `src/components/UserCard.jsx`
- [ ] `src/components/LearningPathTimeline.jsx`
- [ ] `src/components/StepCard.jsx`
- [ ] `src/pages/CompanyDashboard.jsx`
- [ ] `src/pages/UserView.jsx`
- [ ] `src/App.jsx` (main layout)
- [ ] `src/index.css` (Tailwind directives and font imports)

### Required Features

- [ ] Light/Dark mode toggle
- [ ] Responsive design for all breakpoints
- [ ] Accessibility features (focus indicators, ARIA labels)
- [ ] Logo fetching from Railway API
- [ ] Theme persistence (localStorage)
- [ ] Smooth animations and transitions
- [ ] Loading states
- [ ] Error states
- [ ] Empty states

---

## Design References

### Shared UI Styles

All components must reference and use the shared UI styles provided in `sharedUI.txt`, including:
- CSS custom properties for theming
- Component class definitions
- Responsive breakpoints
- Accessibility features
- Animation keyframes

### Corporate Design Standard

- Match header/navigation structure from other microservices
- Use consistent button styles across all microservices
- Maintain logo placement and sizing standards
- Follow established page layout patterns

---

## Notes

- All styling must be done via Tailwind CSS utility classes
- No raw CSS files should be generated (except index.css for Tailwind directives)
- All components must support both Light and Dark modes
- Design must be cohesive with existing microservices
- Logo must be fetched dynamically from Railway API
- All interactive elements must have proper hover and focus states


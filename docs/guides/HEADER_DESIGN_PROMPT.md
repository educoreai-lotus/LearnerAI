# Header Design Prompt - EDUCORE AI
## Complete Design System Specification

This is a **MANDATORY** design system requirement that must be implemented exactly as specified.

## Header Component Specifications

### Dimensions & Layout

**Header Container:**
- **Width:** 100%
- **Height:** 80px (fixed)
- **Min Width:** 320px
- **Max Width:** 1280px
- **Min Height:** 80px
- **Max Height:** 80px
- **Position:** Fixed
- **Z-index:** 50
- **Border Radius:** 0

### Typography

- **Font Family:** `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
- **Font Size:** 16px
- **Line Height:** 24px
- **Letter Spacing:** 0
- **Text Style:** base
- **Text Weight:** medium

### Surface Colors

**Light Mode:**
- Background: `rgba(255, 255, 255, 0.95)`
- Solid Background: `#ffffff`
- Border: `1px solid #e2e8f0`
- Shadow: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)`

**Dark Mode:**
- Background: `rgba(15, 23, 42, 0.95)`
- Solid Background: `#0f172a`
- Border: `1px solid rgba(255, 255, 255, 0.1)`
- Shadow: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)`

### Visual Effects

- **Backdrop Blur:** `backdrop-blur-md`
- **Transition:** All elements use `transition: all 0.3s ease`

### Spacing System

**Padding:**
- Mobile: 16px
- Tablet: 24px
- Desktop: 32px
- Wide: 32px

**Margin:**
- Mobile: 0
- Tablet: 0
- Desktop: 0
- Wide: 0

**Gap (between elements):**
- Mobile: 8px
- Tablet: 12px
- Desktop: 16px
- Wide: 16px

### Icon Specifications

- **Icon Size:** 20px
- **Icon Spacing:** 8px (gap between icon and text)

### Interactive States

**Hover:**
- Background: transparent (maintains parent background)

**Pressed:** (to be defined per component)

**Disabled:** (to be defined per component)

## Header Structure

### Container Layout

```
Header (Fixed, 80px height, 100% width, max-width 1280px)
├── Nav Container (max-width 1200px, centered, flex justify-between)
    ├── Left Side
    │   ├── Logo (Space Grotesk font, gradient text)
    │   └── Navigation Links
    └── Right Side
        ├── Header Controls
        │   ├── Notifications Button
        │   ├── User Profile
        │   └── Theme Toggle
```

### Left Side - Logo & Navigation

**Logo:**
- Font: `'Space Grotesk', sans-serif`
- Size: `1.5rem` (24px)
- Weight: `700` (bold)
- Background: `var(--gradient-primary)` = `linear-gradient(135deg, #065f46, #047857)`
- Text Effect: Gradient text with `-webkit-background-clip: text` and `-webkit-text-fill-color: transparent`
- Cursor: pointer
- Clickable: navigates to /home

**Navigation Links (nav-links):**
- Display: flex
- List style: none
- Gap: `var(--spacing-lg)` (2rem / 32px)
- Link styling:
  - Color: `var(--text-secondary)` (#475569 day, #cbd5e1 night)
  - Text decoration: none
  - Font weight: 500
  - Display: flex with align-items: center
  - Gap: `var(--spacing-xs)` (0.5rem / 8px)
  - Padding: `var(--spacing-xs) var(--spacing-sm)` (0.5rem 1rem)
  - Border radius: 6px
  - Position: relative
- Link icons:
  - Font size: 0.9rem
  - Width: 16px
  - Text align: center
- Link hover:
  - Color: `var(--text-primary)` (#1e293b day, #f8fafc night)
  - Background: `rgba(8, 145, 178, 0.1)`
- Link underline effect (::after):
  - Width: 0 (expands to 80% on hover)
  - Height: 2px
  - Background: `var(--gradient-primary)`
  - Position: absolute, bottom: -5px, centered
  - Transition: width 0.3s ease

### Right Side - Header Controls

**Container (header-controls):**
- Display: flex
- Align items: center
- Gap: `var(--spacing-sm)` (1rem / 16px)

**1. Notifications Button:**
- Dimensions: 40px × 40px
- Shape: Perfect circle (rounded-full)
- Icon: Bell/notification SVG
- Icon size: 20px × 20px
- Colors:
  - Day mode: Transparent background, Icon `var(--text-secondary)`
  - Night mode: Transparent background, Icon `var(--text-secondary)`
  - Hover: Background `rgba(8, 145, 178, 0.1)`, Icon `var(--text-primary)`
- Notification badge:
  - Position: Absolute, top-1, right-1
  - Size: 8px × 8px
  - Color: `var(--accent-green)` (#047857)
  - Shape: Perfect circle
  - Border: 2px solid background color

**2. User Profile:**
- Display: flex
- Align items: center
- Gap: `var(--spacing-sm)` (1rem)
- Margin right: `var(--spacing-md)` (1.5rem)

**User Avatar:**
- Dimensions: 40px × 40px
- Shape: Perfect circle (rounded-full)
- Background: `var(--gradient-primary)` = `linear-gradient(135deg, #065f46, #047857)`
- Display: flex, align-items: center, justify-content: center
- Color: white
- Font size: 1rem
- Position: relative
- Animation: pulse 2s ease-in-out infinite
- Special classes:
  - `.trainer`: `linear-gradient(135deg, #8b4513, #d2691e)`
  - `.organization`: `linear-gradient(135deg, #1e40af, #3b82f6)`

**User Details:**
- Display: flex
- Flex direction: column
- Align items: flex-start

**User Name:**
- Font weight: 600
- Color: `var(--text-primary)`
- Font size: 0.9rem

**User Role:**
- Font size: 0.8rem
- Color: `var(--text-secondary)`
- Text transform: uppercase
- Letter spacing: 0.5px

**3. Theme Toggle:**
- Dimensions: 40px × 40px
- Shape: Perfect circle (rounded-full)
- Background: `var(--bg-tertiary)`
- Border: `1px solid rgba(255, 255, 255, 0.1)`
- Display: flex, align-items: center, justify-content: center
- Cursor: pointer
- Color: `var(--text-primary)`
- Transition: all 0.3s ease
- Hover:
  - Background: `var(--primary-cyan)` (#0f766e)
  - Transform: scale(1.1)
  - Box shadow: `var(--shadow-glow)` = `0 0 30px rgba(6, 95, 70, 0.3)`
- Focus:
  - Outline: 2px solid `var(--primary-cyan)`
  - Outline offset: 2px
- Night mode border: `rgba(255, 255, 255, 0.2)`
- Day mode border: `rgba(0, 0, 0, 0.1)`
- Icons:
  - Day mode: Moon icon (20px × 20px)
  - Night mode: Sun icon (20px × 20px)

### Color Palette Reference

**Primary Colors:**
- `--primary-blue`: #065f46
- `--primary-purple`: #047857
- `--primary-cyan`: #0f766e

**Accent Colors:**
- `--accent-gold`: #d97706
- `--accent-green`: #047857
- `--accent-orange`: #f59e0b

**Gradients:**
- `--gradient-primary`: `linear-gradient(135deg, #065f46, #047857)`
- `--gradient-secondary`: `linear-gradient(135deg, #0f766e, #047857)`
- `--gradient-accent`: `linear-gradient(135deg, #d97706, #f59e0b)`
- `--gradient-card`: `linear-gradient(145deg, #ffffff, #f0fdfa)` (day) / `linear-gradient(145deg, #1e293b, #334155)` (night)

**Background Colors:**
- `--bg-primary`: #f8fafc (day) / #0f172a (night)
- `--bg-secondary`: #e2e8f0 (day) / #1e293b (night)
- `--bg-tertiary`: #cbd5e1 (day) / #334155 (night)
- `--bg-card`: #ffffff (day) / #1e293b (night)

**Text Colors:**
- `--text-primary`: #1e293b (day) / #f8fafc (night)
- `--text-secondary`: #475569 (day) / #cbd5e1 (night)
- `--text-muted`: #64748b (day) / #94a3b8 (night)
- `--text-accent`: #334155 (day) / #e2e8f0 (night)

**Shadows:**
- `--shadow-glow`: `0 0 30px rgba(6, 95, 70, 0.3)` (day) / `0 0 30px rgba(13, 148, 136, 0.4)` (night)
- `--shadow-card`: `0 10px 40px rgba(0, 0, 0, 0.1)` (day) / `0 10px 40px rgba(0, 0, 0, 0.6)` (night)
- `--shadow-hover`: `0 20px 60px rgba(6, 95, 70, 0.2)` (day) / `0 20px 60px rgba(13, 148, 136, 0.3)` (night)

### Responsive Breakpoints

**Mobile (up to 575px):**
- Padding: 16px
- Gap: 8px
- Navigation links: Hidden (hamburger menu)
- User profile: Smaller avatar (30px), smaller text

**Tablet (576px - 991px):**
- Padding: 24px
- Gap: 12px
- Navigation links: Visible with reduced gap

**Desktop (992px - 1399px):**
- Padding: 32px
- Gap: 16px
- Full navigation visible

**Wide (1400px+):**
- Padding: 32px
- Gap: 16px
- Max-width: 1280px (centered)

### Animations

**Pulse Animation (User Avatar):**
```css
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

**Ripple Animation (User Icon):**
```css
@keyframes ripple {
  0% { opacity: 1; transform: scale(0.8); }
  100% { opacity: 0; transform: scale(1.2); }
}
```

### Accessibility Requirements

- All interactive elements must have focus states
- Focus outline: 2px solid `var(--primary-cyan)` with 2px offset
- All buttons must have ARIA labels
- Minimum touch target: 44px × 44px on mobile
- Color contrast ratios must meet WCAG AA standards

### Implementation Notes

1. **MANDATORY:** Header must be exactly 80px height
2. **MANDATORY:** Max-width must be 1280px
3. **MANDATORY:** All spacing values must use the specified spacing system
4. **MANDATORY:** All colors must use CSS variables for theme switching
5. **MANDATORY:** Backdrop blur must be `backdrop-blur-md`
6. **MANDATORY:** Z-index must be 50
7. **MANDATORY:** Position must be fixed
8. **MANDATORY:** Font family must be exactly as specified
9. All transitions must be 0.3s ease
10. Logo must use gradient text effect
11. Navigation links must have hover underline effect
12. Theme toggle must scale on hover
13. User avatar must have pulse animation
14. All icons must be 20px × 20px
15. Icon spacing must be 8px

---

**This is a MANDATORY design system specification. All values must be implemented exactly as specified.**


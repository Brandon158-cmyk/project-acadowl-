# Acadowl Design System — "Veritas Nexus" v4.1
> **Codename: Veritas Nexus — Compact Clarity Edition**
> This document is the **absolute source of truth** for all developers, UX engineers, and AI agents building on the Acadowl platform.
> v4.1 supersedes all previous versions. Every visual decision in this document is derived directly from the Convex dashboard design system.

---

## Foreword

> *"The best administrative UI is invisible. The user sees their data, not the interface. Veritas Nexus v4.1 achieves this through warm neutrals, Inter at small sizes, and a border system that defines every surface without competing with content. The page background is warm off-white. Every white panel that sits on it gets a single, clearly-warm 1px border. That border — #D0CBC4 — is the single most important design decision in this system. It is visible enough to provide definition, warm enough to feel considered, and never harsh enough to draw attention to itself."*

---

## 1. Design Philosophy

### 1.1 Surfaces and Their Borders
**Every white surface that sits on the page background gets a full 1px border on all four sides.** This is non-negotiable. A card without a border on the `#EEECEA` background looks broken, not minimal. Borders are structure, not decoration.

### 1.2 Warm, Not Cool
Every neutral — background, border, muted text — pulls slightly warm (toward brown/tan), never cool (toward blue-gray). The system reads as paper and ink, not screen and chrome.

### 1.3 Flat and Defined by Borders
Zero decorative shadows. All depth is communicated through the contrast between `#EEECEA` (background) and `#FFFFFF` (surface), with `#D0CBC4` borders providing crisp edge definition.

### 1.4 One Accent Color
Deep Indigo `#3730A3` is the only interactive color. Primary buttons, active navigation, focus rings, and links. Nothing else is colored.

### 1.5 Compact Information Density
Base font size is 13px. Button height ~32px. Table rows ~38px. This is a productivity tool — every pixel of vertical space is valuable.

---

## 2. Color System

### 2.1 Core Palette

| Token | Hex | RGB | Usage |
|---|---|---|---|
| `app-bg` | `#EEECEA` | `238, 236, 234` | Page shell background — warm off-white. Every screen. |
| `surface` | `#FFFFFF` | `255, 255, 255` | All cards, panels, sidebars, modals, table bodies, inputs |
| `surface-subtle` | `#F4F1EE` | `244, 241, 238` | Table thead, hover states within surfaces |
| `surface-hover` | `#EDEAE6` | `237, 234, 230` | Hovered rows, nav item hover |
| `text-primary` | `#1A1A1A` | `26, 26, 26` | All primary text |
| `text-secondary` | `#6B6B6B` | `107, 107, 107` | Muted labels, timestamps, inactive nav |
| `text-tertiary` | `#9E9E9E` | `158, 158, 158` | Placeholder text, disabled labels |
| `accent` | `#3730A3` | `55, 48, 163` | Primary buttons, active nav, links, focus rings |
| `accent-hover` | `#2E27A0` | `46, 39, 160` | Hover on accent |
| `accent-bg` | `#EEF2FF` | `238, 242, 255` | Active nav background, accent tint areas |
| `accent-text` | `#4338CA` | `67, 56, 202` | Link text, ghost button text |

---

### 2.2 The Border System — The Most Important Section

There are **exactly three border values** in this system. Each has a defined scope. Using the wrong one is a design violation.

```
border-panel:  1px solid #D0CBC4   ← Panel / card outlines
border-inner:  1px solid #E5DFD8   ← Dividers WITHIN a surface
border-row:    1px solid #EDEAE6   ← Table row dividers only
```

---

#### `border-panel` — `#D0CBC4`

**The primary border. Used on every white surface sitting on `app-bg`.**

This border is warm, medium-gray. It is intentionally and clearly visible — not ghosted. It defines where each white surface begins and ends against the warm off-white background. Without it, the UI looks unfinished.

Applies to: cards, panels, modals, **input fields**, dropdown menus, the main content wrapper, filter chips, sidebar (`border-r`), topbar (`border-b`), the table wrapper `<div>`, region selector buttons, search inputs.

```css
/* Tailwind */  border border-[#D0CBC4]
/* CSS      */  border: 1px solid #D0CBC4;
/* Sidebar  */  border-right: 1px solid #D0CBC4;
/* Topbar   */  border-bottom: 1px solid #D0CBC4;
```

---

#### `border-inner` — `#E5DFD8`

**Internal dividers within surfaces — white-on-white separation.**

Lighter than `border-panel` because it sits inside a white surface. It only needs to suggest a section break, not define an edge against a contrasting background.

Applies to: card header bottom border, toolbar bottom border within a card, table `<thead>` bottom border, form group separators, the pagination section top border.

```css
/* Tailwind */  border-b border-[#E5DFD8]
/* CSS      */  border-bottom: 1px solid #E5DFD8;
```

---

#### `border-row` — `#EDEAE6`

**Table row dividers only.** The lightest border in the system.

Applies to: `<tbody>` row dividers exclusively.

```css
/* Tailwind */  divide-y divide-[#EDEAE6]
/* CSS      */  border-bottom: 1px solid #EDEAE6;
```

---

#### Border Decision Chart

```
WHAT YOU ARE BORDERING                 TOKEN          HEX
──────────────────────────────────────────────────────────────
Card outline                        →  border-panel   #D0CBC4
Panel / main content area outline   →  border-panel   #D0CBC4
Sidebar right edge                  →  border-panel   #D0CBC4
Topbar bottom edge                  →  border-panel   #D0CBC4
Input field border (all states)     →  border-panel   #D0CBC4
Dropdown menu border                →  border-panel   #D0CBC4
Filter chip border                  →  border-panel   #D0CBC4
Modal border                        →  border-panel   #D0CBC4
Search input border                 →  border-panel   #D0CBC4
Region selector button border       →  border-panel   #D0CBC4
──────────────────────────────────────────────────────────────
Card header bottom divider          →  border-inner   #E5DFD8
Toolbar bottom divider              →  border-inner   #E5DFD8
Form section separator              →  border-inner   #E5DFD8
Table <thead> bottom border         →  border-inner   #E5DFD8
Pagination section top border       →  border-inner   #E5DFD8
──────────────────────────────────────────────────────────────
Table <tbody> row dividers          →  border-row     #EDEAE6
──────────────────────────────────────────────────────────────
```

#### Border Rules (Non-Negotiable)

- ✅ **Every white surface on `app-bg`** → always has `border-panel` on all four sides
- ✅ **Sidebar** → `border-r` only, using `border-panel`
- ✅ **Topbar** → `border-b` only, using `border-panel`
- ✅ **Inputs are surfaces** → they get `border-panel`, not a lighter value
- ❌ **Never** use Tailwind's default `border-gray-200` or `border-gray-300` — too cool/blue
- ❌ **Never** omit the border on a white surface sitting on `app-bg`
- ❌ **Never** use `border-2` anywhere
- ❌ **Never** mix border tokens — each has one purpose

---

### 2.3 Semantic Feedback Colors

| Role | Text | Background | Border | Usage |
|---|---|---|---|---|
| Success | `#15803D` | `#F0FDF4` | `#BBF7D0` | Active badges, saved states |
| Warning | `#B45309` | `#FFFBEB` | `#FDE68A` | Pending, missing data |
| Error | `#BE123C` | `#FFF1F2` | `#FECDD3` | Failures, validation |
| Info | `#1D4ED8` | `#EFF6FF` | `#BFDBFE` | System notices |

### 2.4 Status Badge Colors

| Status | Background | Text |
|---|---|---|
| Active / Live | `#F0FDF4` | `#15803D` |
| Pending | `#FFFBEB` | `#B45309` |
| Suspended / Error | `#FFF1F2` | `#BE123C` |
| Inactive / Archived | `#F3F4F6` | `#6B6B6B` |
| Development env | `#F0FDF4` | `#15803D` |

---

## 3. Typography

### 3.1 Font Family

**Inter is the sole typeface for the entire system.** No serif. No dual-font split. One typeface only.

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
```

Inter is engineered specifically for screen legibility at small sizes (11–14px). Its optical metrics, apertures, and stroke contrast are tuned exactly for dense, data-heavy interfaces — which is precisely what Acadowl is. At 13px it is more readable than any other general-purpose typeface.

**Loading in Next.js:**
```js
import { Inter } from 'next/font/google'
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})
```

**For monospaced content** (IDs, slugs, code, terminal output):
```css
font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
```

---

### 3.2 Type Scale

All sizes are **px, not rem**. Lock to px for compact tool UIs.

| Role | Size | Weight | Color Token | Letter-spacing | Usage |
|---|---|---|---|---|---|
| Page Title | `18px` | `600` | `text-primary` | `-0.01em` | Main `<h1>` — one per page |
| Section Heading | `15px` | `600` | `text-primary` | `normal` | Card headers, modal titles |
| Body Base | `14px` | `400` | `text-primary` | `normal` | Primary descriptions |
| Body Dense | `13px` | `400` | `text-primary` | `normal` | **Default**: table cells, sidebar items, form fields, most UI text |
| Form Label | `12px` | `500` | `text-secondary` | `normal` | All form field labels |
| Caption | `12px` | `400` | `text-secondary` | `normal` | Timestamps, secondary metadata |
| Table Header `<th>` | `12px` | `500` | `text-secondary` | `+0.04em` | Always uppercase + tracking |
| Badge / Chip | `11px` | `500` | contextual | `+0.02em` | Status badges, env chips |
| Mono ID | `12px` | `400` | `text-secondary` | `normal` | Document IDs, slugs, reference codes |

---

### 3.3 Hierarchy Rule

**Hierarchy is built through weight and color, not size.**

A page title at `18px` is only 4–5px larger than body at `13px`. Visual distinction comes from `font-weight: 600` vs `400`, and `text-primary` vs `text-secondary`. Do not use large sizes to create hierarchy — this is the single biggest difference from v3 and the source of the compact developer-tool feel.

### 3.4 Rules

- ✅ `antialiased` on root `<body>` always
- ✅ `font-mono` for all IDs, slugs, reference codes
- ✅ `<th>` cells: the only place for `uppercase` + `tracking-wider`
- ❌ Never `text-2xl` or larger in any admin context
- ❌ Never font-weight below `400`
- ❌ Never center-align table or body text

---

## 4. Spatial System

### 4.1 Spacing Scale

| Token | px | Primary Usage |
|---|---|---|
| `gap-0.5` | `2px` | Micro: icon-to-label inside badges |
| `gap-1` | `4px` | Badge internal padding |
| `gap-1.5` | `6px` | Button icon-to-text gap |
| `gap-2` | `8px` | Dense table cell padding, tight form gaps |
| `gap-3` | `12px` | Compact padding, nav item gap |
| `gap-4` | `16px` | Standard element spacing |
| `gap-5` | `20px` | Standard card padding |
| `gap-6` | `24px` | Section-to-section gap on a page |
| `gap-8` | `32px` | Major page-level separation |

### 4.2 Page Layout

```
Page outer padding:   p-6 (24px all sides)
Content max-width:    max-w-7xl (1280px)
Sidebar width:        240px fixed
Topbar height:        48px (h-12)
Grid column gap:      gap-4 (16px)
Section gap:          gap-6 (24px)
Standard card body:   p-5 (20px)
Large card sections:  p-6 (24px)
```

---

## 5. Elevation & Shadows

### 5.1 Two-Layer System

```
Layer 0 — Page background:  #EEECEA  (warm off-white)
Layer 1 — All surfaces:     #FFFFFF  + border: 1px solid #D0CBC4
```

The contrast between background and white surface, defined by the warm border, is the entire depth system. No shadows on any layer 1 element.

### 5.2 Shadow Rules

| Usage | Class |
|---|---|
| Cards, inputs, panels, buttons (default) | `shadow-none` |
| Primary button only | `shadow-sm` |
| Dropdowns, tooltips, floating menus | `shadow-md` |
| Modals and dialogs | `shadow-lg` |

### 5.3 Border Radius

| Token | px | Usage |
|---|---|---|
| `rounded` | `4px` | Badges, chips, tiny tags |
| `rounded-md` | `6px` | Buttons, inputs, small dropdowns |
| `rounded-lg` | `8px` | Cards, panels, modals, table wrappers |
| `rounded-xl` | `12px` | Large project cards, feature panels |
| `rounded-full` | `9999px` | Toggle-style tab group selectors |

---

## 6. Component Anatomy

### 6.1 Cards and Panels

```html
<div class="bg-white border border-[#D0CBC4] rounded-lg">
  <!-- Header: uses border-inner -->
  <div class="px-5 py-3.5 border-b border-[#E5DFD8]">
    <h2 class="text-[15px] font-semibold text-[#1A1A1A]">Card Title</h2>
  </div>
  <!-- Body -->
  <div class="p-5">
    <!-- content -->
  </div>
</div>
```

### 6.2 Buttons

| Variant | Background | Text | Border | Hover |
|---|---|---|---|---|
| **Primary** | `#3730A3` | `#FFFFFF` | none | `bg-[#2E27A0]` |
| **Secondary** | `#FFFFFF` | `#1A1A1A` | `border border-[#D0CBC4]` | `bg-[#F4F1EE]` |
| **Ghost** | transparent | `#4338CA` | none | `bg-[#EEF2FF]` |
| **Destructive** | `#FFFFFF` | `#BE123C` | `border border-[#FECDD3]` | `bg-[#FFF1F2]` |

Universal rules:
- Font: `text-[13px] font-medium`
- Padding: `px-3 py-1.5` → height ~32px
- Radius: `rounded-md` (6px)
- Transition: `transition-all duration-150`
- Active: `active:scale-95` always
- Shadow: `shadow-sm` on Primary only
- Icon gap: `gap-1.5`, Icon size: `16px`

### 6.3 Input Fields

```html
<div class="flex flex-col gap-1">
  <label class="text-[12px] font-medium text-[#6B6B6B]">
    Field Label
  </label>
  <input class="
    bg-white border border-[#D0CBC4] rounded-md
    px-3 py-1.5 text-[13px] text-[#1A1A1A]
    placeholder:text-[#9E9E9E]
    focus:outline-none
    focus:ring-2 focus:ring-[#3730A3]/15
    focus:border-[#3730A3]/40
    transition-all duration-150
  " />
</div>
```

Inputs use `border-panel` (`#D0CBC4`) — inputs are surfaces, not just controls.

| State | Border | Background | Ring |
|---|---|---|---|
| Default | `#D0CBC4` | `#FFFFFF` | none |
| Focus | `#3730A3` at 40% | `#FFFFFF` | `ring-2 ring-[#3730A3]/15` |
| Error | `#FECDD3` | `#FFF1F2` at 50% | `ring-2 ring-[#BE123C]/10` |
| Disabled | `#E5DFD8` | `#F4F1EE` | none |

**Error messages:**
```html
<p class="flex items-center gap-1 text-[11px] font-medium text-[#BE123C] mt-1">
  <AlertCircle size={11} />
  Specific explanation of what went wrong.
</p>
```

---

## 7. Navigation & Sidebar

### 7.1 Sidebar

```
bg-white
border-r: 1px solid #D0CBC4   (border-panel on right edge only)
width: 240px, fixed
padding: p-3
```

### 7.2 Nav Items

```
Default:  text-[13px] font-normal text-[#6B6B6B]
          px-3 py-2 rounded-md flex items-center gap-2

Hover:    bg-[#EDEAE6] text-[#1A1A1A]

Active:   bg-[#EEF2FF] text-[#3730A3] font-medium
```

Section group dividers: `border-t border-[#E5DFD8] my-2`
Section labels: `text-[11px] font-semibold text-[#9E9E9E] uppercase tracking-wider px-3 py-1`

### 7.3 Topbar

```
bg-white
border-b: 1px solid #D0CBC4   (border-panel on bottom edge only)
height: 48px (h-12)
px-4
```

| Element | Style |
|---|---|
| App name | `text-[14px] font-semibold text-[#1A1A1A]` |
| Env badge | `text-[11px] font-medium px-2 py-0.5 rounded bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]` |
| Deployment ID | `text-[13px] text-[#6B6B6B]` |
| Nav links | `text-[13px] text-[#6B6B6B] hover:text-[#1A1A1A]` |

---

## 8. Data Tables

### 8.1 Table Wrapper — Mandatory

```html
<div class="border border-[#D0CBC4] rounded-lg overflow-hidden">
  <table class="w-full">...</table>
</div>
```

The wrapper provides `border-panel` and `rounded-lg`. The `<table>` itself has no border. This is the correct pattern — always.

### 8.2 Table Anatomy

| Element | Classes |
|---|---|
| `<thead> <tr>` | `bg-[#F4F1EE] border-b border-[#E5DFD8]` |
| `<th>` | `text-[12px] font-medium text-[#6B6B6B] uppercase tracking-[0.04em] px-4 py-2.5 text-left` |
| `<th>` column separator | `border-r border-[#E5DFD8] last:border-r-0` (optional, use for high-column-count tables) |
| `<tbody>` | `divide-y divide-[#EDEAE6] bg-white` |
| `<tr>` hover | `hover:bg-[#F4F1EE] transition-colors duration-100` |
| `<td>` default | `text-[13px] text-[#1A1A1A] px-4 py-2.5` |
| `<td>` secondary | `text-[13px] text-[#6B6B6B]` |
| `<td>` mono/ID | `font-mono text-[12px] text-[#6B6B6B]` |
| `<td>` name/primary | `text-[13px] font-medium text-[#1A1A1A]` |
| Numeric | `text-right tabular-nums` |

### 8.3 Toolbar (inside table card, above `<thead>`)

```html
<div class="flex items-center gap-2 px-4 py-2.5 border-b border-[#E5DFD8]">
  <!-- search, filters -->
  <!-- right side: primary "+ Add" button -->
</div>
```

Uses `border-inner` (`#E5DFD8`) — it's a divider within the surface.

### 8.4 Pagination Footer

```html
<div class="flex items-center justify-between px-4 py-2.5 border-t border-[#E5DFD8]">
  <span class="text-[12px] text-[#6B6B6B]">Showing 1–50 of 1,200 records</span>
  <div class="flex items-center gap-1">
    <!-- Previous / Next: secondary small buttons -->
  </div>
</div>
```

### 8.5 Density

| Mode | `<td>` padding | When |
|---|---|---|
| Standard | `py-2.5` | Default |
| Compact | `py-2` | 30+ rows |

---

## 9. Filter Chips

```html
<button class="
  flex items-center gap-1.5 px-3 py-1.5
  bg-white border border-[#D0CBC4] rounded-md
  text-[13px] text-[#1A1A1A]
  hover:bg-[#F4F1EE]
  transition-all duration-150
">
  <Icon size={13} class="text-[#6B6B6B]" />
  Uploaded at: <span class="font-medium">Any time</span>
  <ChevronDown size={13} class="text-[#6B6B6B]" />
</button>
```

Filter chips use `border-panel` — they are interactive surfaces.

---

## 10. Empty States

```html
<div class="flex flex-col items-center justify-center py-20 gap-3">
  <div class="bg-[#FFF1F2] rounded-xl p-3">
    <FileIcon size={24} class="text-[#BE123C]" />
  </div>
  <p class="text-[16px] font-semibold text-[#1A1A1A]">No files yet.</p>
  <p class="text-[13px] text-[#6B6B6B]">Helpful description of what goes here.</p>
  <a class="text-[13px] text-[#4338CA] hover:underline flex items-center gap-1">
    <ExternalLink size={12} /> Learn more
  </a>
</div>
```

Icon containers use semantic background colors (error red for empty, indigo for general, green for success).

---

## 11. Iconography

Lucide React exclusively.

| Size | Context |
|---|---|
| `size={12}` | Inside badges, inline with `11px` text |
| `size={14}` | Inline with `13px` body, inside inputs |
| `size={16}` | Sidebar nav, button icons, standard UI icons |
| `size={20}` | Section headings, empty state icons |
| `size={24}` | Large empty state illustrations |

---

## 12. Motion

| Pattern | Implementation |
|---|---|
| Hover color | `transition-colors duration-100` |
| Button press | `active:scale-95 transition-transform duration-100` |
| Dropdown open | Opacity fade only, `duration-100` |
| Modal enter | Opacity + 4px upward translate, `duration-150` |
| Page content | No entrance animation |

- ❌ No duration above `200ms`
- ❌ No spring physics or bounce
- ❌ No page-level Framer Motion transitions
- ❌ No staggered table animations

---

## 13. Accessibility

- [ ] All text passes WCAG AA (4.5:1)
- [ ] Focus ring: `focus-visible:ring-2 focus-visible:ring-[#3730A3]/20`
- [ ] Icon-only buttons: `aria-label` required
- [ ] Inputs: `htmlFor` / `id` pairing
- [ ] Error messages: `aria-describedby` linkage
- [ ] Modals: focus trap + restore on close
- [ ] All interactive elements: `Tab` reachable

---

## 14. Tailwind Configuration

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'app-bg':          '#EEECEA',
        'surface':         '#FFFFFF',
        'surface-subtle':  '#F4F1EE',
        'surface-hover':   '#EDEAE6',

        // Three-tier border system
        'border-panel':    '#D0CBC4',   // cards, inputs, sidebar, topbar
        'border-inner':    '#E5DFD8',   // section dividers WITHIN surfaces
        'border-row':      '#EDEAE6',   // table row dividers only

        'text-primary':    '#1A1A1A',
        'text-secondary':  '#6B6B6B',
        'text-tertiary':   '#9E9E9E',

        'accent':          '#3730A3',
        'accent-hover':    '#2E27A0',
        'accent-bg':       '#EEF2FF',
        'accent-text':     '#4338CA',

        'success':         '#15803D',
        'success-bg':      '#F0FDF4',
        'success-border':  '#BBF7D0',
        'warning':         '#B45309',
        'warning-bg':      '#FFFBEB',
        'error':           '#BE123C',
        'error-bg':        '#FFF1F2',
        'error-border':    '#FECDD3',
        'info':            '#1D4ED8',
        'info-bg':         '#EFF6FF',
        'info-border':     '#BFDBFE',
      },

      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
      },

      fontSize: {
        '2xs':  ['11px', { lineHeight: '1.4', letterSpacing: '0.02em' }],
        'xs':   ['12px', { lineHeight: '1.5' }],
        'sm':   ['13px', { lineHeight: '1.5' }],
        'base': ['14px', { lineHeight: '1.6' }],
        'lg':   ['15px', { lineHeight: '1.5' }],
        'xl':   ['18px', { lineHeight: '1.4', letterSpacing: '-0.01em' }],
      },

      borderRadius: {
        DEFAULT: '4px',
        'md':    '6px',
        'lg':    '8px',
        'xl':    '12px',
        'full':  '9999px',
      },

      boxShadow: {
        'sm':   '0 1px 2px rgba(0, 0, 0, 0.05)',
        'md':   '0 4px 8px rgba(0, 0, 0, 0.08)',
        'lg':   '0 8px 24px rgba(0, 0, 0, 0.10)',
      },
    },
  },
};
```

---

## 15. Migration Notes from v4.0

| v4.0 | v4.1 |
|---|---|
| `border border-[#E5E3DF]` — too light, too cool | `border border-[#D0CBC4]` — visible, warm |
| "barely-there" borders | Clearly defined warm gray borders |
| Geist as primary font | **Inter exclusively** |
| `text-sm` (14px) as base | `text-[13px]` as primary body/UI text |
| Vague "use the right border" | Named three-tier system with a decision chart |
| No mention of table wrapper | Table wrapper `<div>` with `border-panel` is mandatory |
| Inputs got lighter borders | Inputs use `border-panel` — inputs are surfaces |
# Acadowl Design System — "Veritas Nexus" v2.0
> **Codename: Veritas Nexus** replaces all references to any specific external institution.  
> This document is the **absolute source of truth** for developers, UX engineers, and AI agents building on the Acadowl platform.

---

## Foreword

> *"Designing for a tier-1 academic institution requires more than aesthetic refinement — it demands **Cognitive Elegance**. Administrators, educators, and students interact with this platform daily, processing dense, high-stakes data. Our mandate is to reduce administrative cognitive load while projecting the gravitas of an established academic legacy. Every pixel, easing curve, and typographic scale in Veritas Nexus has been rigorously tested against WCAG 2.1 AA standards and high-density data requirements. This is not just a UI kit — it is a behavioral architecture."*
>
> — Lead UX Architect, Global Academic Systems Taskforce

---

## 1. Design Philosophy & UX Principles

Acadowl is built on three non-negotiable pillars:

### 1.1 Inclusive by Default
Accessibility is never an afterthought. Contrast ratios **must** pass WCAG AAA for all text. Focus rings must always be visible — never suppressed. Screen reader ARIA labels are **mandatory** for every icon-only button or interactive element.

### 1.2 Frictionless Efficiency
Design for keyboard navigation first. Minimize clicks for repetitive administrative tasks (e.g., marking attendance). Visual hierarchies must guide the eye directly to the primary action without scanning. Dense data views must remain scannable at a glance.

### 1.3 Institutional Trust
Avoid playful or overly trendy UI patterns. Use solid borders, clear typography, and definitive feedback states. The system must feel as permanent and reliable as the institution it serves — structured, deliberate, and authoritative.

---

## 2. Color System

### 2.1 Core Brand Palette

| Token Name | Hex | RGB | Usage |
|---|---|---|---|
| `school-primary` / Veritas Crimson | `#A51C30` | `165, 28, 48` | Primary brand color, CTA buttons, key active states |
| `crimson-dark` | `#7A1523` | `122, 21, 35` | Hover states on primary, deep active navigation, high-emphasis backgrounds |
| `parchment` | `#F9F8F6` | `249, 248, 246` | Main application page background |
| `onyx` | `#111827` | `17, 24, 39` | Primary body text, high-contrast UI elements, structural sidebars |
| `slate` | `#6B7280` | `107, 114, 128` | Secondary text, borders, inactive states, placeholder text |
| Gold Leaf | `#D4AF37` | `212, 175, 55` | Accents, awards, premium feature highlights, warning-adjacent states |

### 2.2 Semantic Feedback Colors

| Role | Foreground Hex | Background Hex | Usage |
|---|---|---|---|
| Success (Emerald) | `#059669` | `#ecfdf5` | Confirmations, positive trends, successful saves |
| Warning (Amber) | `#D97706` | `#fffbeb` | Destructive warnings, pending states, missing data |
| Error (Rose) | `#E11D48` | `#fff1f2` | Failed actions, critical system errors, destructive actions |
| Info (Blue) | `#2563EB` | `#eff6ff` | System updates, neutral information, helpful tips |

### 2.3 Color Rules (Non-Negotiable)

- ✅ Use `#F9F8F6` (Parchment) as the main page background — it reduces optical fatigue compared to pure white.
- ✅ Use `#111827` (Onyx) for structural sidebars and primary text — never pure black `#000000`.
- ✅ Use `#A51C30` (Veritas Crimson) only for the primary action in any given context.
- ❌ **Never** use pure `#000000` or pure `#FFFFFF` for large backgrounds.
- ❌ **Never** use Gold Leaf as a primary CTA color — it is strictly an accent.
- ❌ Semantic colors (Success, Warning, Error, Info) must only be used for their designated feedback contexts.

---

## 3. Typography

Acadowl uses a **dual-font system**:

- **Playfair Display** (Serif) — establishes academic authority for all Display and Heading levels. Used only for headings.
- **Inter** (Sans-serif) — ensures maximum legibility for dense data, body copy, inputs, and UI elements.

### 3.1 Type Scale

| Role | Tailwind Class | Size | Line Height | Font & Weight | Letter Spacing |
|---|---|---|---|---|---|
| Display 2 | `text-6xl` | 3.75rem / 60px | 1.1 | Playfair Display, SemiBold (600) | `-0.02em` |
| Display 1 | `text-5xl` | 3rem / 48px | 1.1 | Playfair Display, SemiBold (600) | `-0.02em` |
| Heading 1 | `text-4xl` | 2.25rem / 36px | 1.2 | Playfair Display, SemiBold (600) | `-0.01em` |
| Heading 2 | `text-3xl` | 1.875rem / 30px | 1.2 | Playfair Display, SemiBold (600) | `normal` |
| Heading 3 | `text-2xl` | 1.5rem / 24px | 1.3 | Playfair Display, SemiBold (600) | `normal` |
| Heading 4 | `text-xl` | 1.25rem / 20px | 1.4 | Inter, SemiBold (600) | `normal` |
| Body Large | `text-lg` | 1.125rem / 18px | 1.6 | Inter, Regular/Medium (400–500) | `normal` |
| Body Base | `text-base` | 1rem / 16px | 1.6 | Inter, Regular/Medium (400–500) | `normal` |
| Body Small | `text-sm` | 0.875rem / 14px | 1.5 | Inter, Regular/Medium (400–500) | `normal` |
| Caption / Label | `text-xs` | 0.75rem / 12px | 1.5 | Inter, Medium/SemiBold (500–600) | `+0.02em` |

### 3.2 Typography Rules

- **Measure**: Keep body text line lengths between 60–80 characters for optimal readability.
- **Tracking**: Use `tracking-tight` for large serif headings; use `tracking-wider` on uppercase UI labels and table column headers.
- **Antialiasing**: Always apply `antialiased` class to the root `<body>` tag.
- **Heading font**: Playfair Display is exclusively for visual hierarchy. Never use it for body text, form labels, table cells, or inputs.

### 3.3 Typography Anti-Patterns

- ❌ Never use Playfair Display for body text, input fields, data tables, or captions.
- ❌ Do not use font weights below 400 (Regular) — it degrades contrast and legibility.
- ❌ Never center-align paragraphs longer than 3 lines.

---

## 4. Spatial System & Grid

### 4.1 Baseline Grid

Acadowl strictly adheres to an **8pt baseline grid**. All margins, paddings, component heights, and gap values must be multiples of **4px or 8px**. This mathematical rhythm creates subconscious order across every screen.

### 4.2 Spacing Scale

| Tailwind Token | px Value | rem Value | Primary Usage |
|---|---|---|---|
| `p-1` / `gap-1` | 4px | 0.25rem | Micro: icon-to-label gaps, inner badge spacing |
| `p-2` / `gap-2` | 8px | 0.5rem | Tight: dense table inner padding, small chips |
| `p-3` / `gap-3` | 12px | 0.75rem | Compact: small input padding, badge padding |
| `p-4` / `gap-4` | 16px | 1rem | Standard: buttons, inputs, list items |
| `p-6` / `gap-6` | 24px | 1.5rem | Cards: standard card padding, section gaps |
| `p-8` / `gap-8` | 32px | 2rem | Large cards, major section separators |
| `p-12` | 48px | 3rem | Layout: page-level margins and spacing |
| `p-16` | 64px | 4rem | Hero padding, major layout landmarks |

### 4.3 12-Column Layout Grid

The application shell uses a **fluid 12-column grid** with fixed gutters.

- **Max Width**: Constrain main content areas to `max-w-6xl` (1152px) or `max-w-7xl` (1280px). This prevents infinite horizontal stretching on ultrawide monitors.
- **Gutters**: Use `gap-6` (24px) for desktop grid columns, scaling to `gap-4` (16px) on mobile.
- **Page Margins**: Always use `p-6 md:p-8` as the outer page wrapper padding to provide visual breathing room.

---

## 5. Elevation & Depth Architecture

Acadowl employs a **"Tactile Flat"** aesthetic. Structure is defined primarily through subtle borders (`border border-gray-200`) rather than decoration. Shadows are reserved strictly for interactive or elevated z-index elements.

### 5.1 Border Radius Tokens

| Token | Size | px | Usage |
|---|---|---|---|
| `rounded-md` | Medium | 6px | Checkboxes, small badges, inner icon containers |
| `rounded-lg` | Large | 8px | **Standard default**: buttons, form inputs, dropdown menus |
| `rounded-xl` | Extra Large | 12px | Data cards, widgets, small modals |
| `rounded-2xl` | 2X Large | 16px | Large layout blocks, main content wrappers, page sections |

### 5.2 Shadow Hierarchy

| Tailwind Class | Usage |
|---|---|
| `shadow-sm` | Default state for all cards, buttons, and inputs. Always pair with `border border-gray-200`. |
| `shadow-md` | Hover states for interactive cards, small dropdowns, tooltips. |
| `shadow-lg` | Modals, dialogs, floating command palettes. Indicates the highest z-index layer. |

> **Rule**: Never apply `shadow-lg` to non-elevated elements. Shadows must communicate z-index, not decoration.

---

## 6. Component Anatomy

Interactive elements must be highly visible, accessible, and forgiving. Buttons and inputs form the administrative backbone.

### 6.1 Button Hierarchy

Every page must have a clear primary action. Use the hierarchy below strictly — never use two Primary buttons in the same visible context.

| Variant | Background | Text | Border | Hover | Use When |
|---|---|---|---|---|---|
| **Primary** | `bg-school-primary` (`#A51C30`) | `text-white` | none | `hover:bg-crimson-dark` | The single most important action on the screen |
| **Secondary** | `bg-white` | `text-onyx` | `border border-gray-300` | `hover:bg-gray-50` | Confirming or cancelling alongside a Primary |
| **Tertiary / Ghost** | transparent | `text-school-primary` | none | `hover:bg-red-50` | Low-emphasis actions like "Add Row", inline links |
| **Destructive** | `bg-white` | `text-red-600` | `border border-red-200` | `hover:bg-red-50` | Delete, remove, revoke — always requires confirmation |

**Universal Button Rules:**
- All buttons must have `transition-all duration-200` for smooth state changes.
- All buttons must have `active:scale-95` for physical click feedback.
- All buttons must have a minimum height of `py-2.5` (40px total with text) for touch target compliance.
- Always include `shadow-sm` on Primary and Secondary variants.
- Icon buttons without visible labels **must** include an `aria-label` attribute.

### 6.2 Input Field States

| State | Border | Background | Ring | Notes |
|---|---|---|---|---|
| Default | `border-gray-300` | `bg-white` | none | Standard resting state |
| Focus | `border-school-primary` | `bg-white` | `ring-2 ring-school-primary/20` | **Never remove focus outlines.** |
| Error | `border-red-300` | `bg-red-50/50` | `ring-2 ring-red-500/20` | Pair with inline error message below the field |
| Disabled | `border-gray-200` | `bg-gray-50` | none | `cursor-not-allowed`, `text-gray-500` |

**Input Error Messages:**
Error text below an invalid field must:
- Use `text-xs text-red-600 font-medium`
- Include an `<AlertCircle size={14} />` icon inline before the message text
- Explain specifically what is wrong (e.g., "This field requires a valid email address.")

### 6.3 Form Label Standards
- Labels use `text-sm font-medium text-gray-700`
- Disabled field labels use `text-sm font-medium text-gray-500`
- Labels always sit **above** the input, separated by `mb-1`

---

## 7. Data Density & Tables

School management involves massive datasets. Tables must be scannable, sortable, and visually quiet. Let the data speak; suppress the UI chrome.

### 7.1 Table Anatomy Rules

| Element | Required Class(es) |
|---|---|
| `<thead>` row | `bg-gray-50 border-b border-gray-200` |
| `<th>` cells | `text-xs uppercase tracking-wider text-gray-500 font-semibold p-3` or `p-4` |
| `<tbody>` dividers | `divide-y divide-gray-100` — no vertical borders between columns |
| `<tr>` hover | `hover:bg-gray-50/50 transition-colors` |
| ID / Reference columns | `font-mono text-sm text-gray-500` |
| Name / Text columns | `font-medium text-gray-900` |
| Numeric & Action columns | `text-right` |

### 7.2 Table Density Modes

- **Comfortable** — Use `p-4` on `<td>` cells. Default for most admin screens.
- **Compact** — Use `p-2` on `<td>` cells. Use only when displaying more than 20 rows simultaneously.

### 7.3 Status Badges in Tables

Status badges inside table rows follow this pattern:
```
px-2 py-0.5 rounded-full text-xs font-medium
```
Pair with semantic background/text colors:
- Active: `bg-green-100 text-green-800`
- Inactive / Archived: `bg-gray-100 text-gray-800`
- Pending: `bg-amber-100 text-amber-800`
- Suspended: `bg-red-100 text-red-800`

### 7.4 Pagination
Always use **explicit pagination** with a count label (e.g., "Showing 1–50 of 1,200 records"). Never use infinite scroll in administrative tables — it breaks footer access and makes locating specific records by page unreliable.

---

## 8. Iconography

Acadowl exclusively uses **Lucide React** for all icons. Never mix in other icon libraries (e.g., Heroicons, Phosphor, Font Awesome). Never alter stroke weights.

### 8.1 Sizing Rules

| Size | Tailwind / Prop | Context |
|---|---|---|
| `size={16}` | `size-4` | Inline with text, inside small buttons, inside form inputs |
| `size={20}` | `size-5` | Sidebar navigation items, standard standalone icons |
| `size={24}` | `size-6` | Empty state illustrations, section heading accompaniments |

### 8.2 Standard Icon Metaphors

Use these icons consistently across the application. Swapping these for alternatives is not permitted.

| Concept | Icon |
|---|---|
| Students / Users | `<Users />` |
| Staff / Teachers | `<GraduationCap />` |
| Attendance | `<CalendarCheck />` |
| Academics / Subjects | `<BookOpen />` |
| Fees / Finance | `<CreditCard />` |
| Settings / Configuration | `<Settings />` |
| View / Preview | `<Eye />` |
| Details / Description | `<AlignLeft />` |
| Devices / Portals | `<MonitorSmartphone />` |
| Search | `<Search />` |
| Add / Create | `<Plus />` |
| Loading | `<Loader2 />` (with `animate-spin`) |
| Error / Alert | `<AlertCircle />` |
| Success | `<CheckCircle2 />` |
| Info | `<Info />` |

---

## 9. Motion Choreography

Motion must be purposeful — guiding the user's attention without causing distraction or motion sickness. Acadowl uses **Tailwind CSS utilities** for micro-interactions and **Framer Motion (`motion/react`)** for complex choreographies.

### 9.1 Standard Transitions

| Pattern | Implementation | Usage |
|---|---|---|
| Hover / color change | `transition-all duration-200 ease-in-out` | Universal hover states, border color shifts, background changes |
| Button press | `active:scale-95` | Applied to all buttons. Provides tactile physical click feedback |
| Page / section entrance | `initial={{ opacity: 0, y: 40 }}` → `animate={{ opacity: 1, y: 0 }}` with `duration: 0.5` | Page-level content blocks |
| Modal entrance | `initial={{ opacity: 0, y: 10 }}` → `animate={{ opacity: 1, y: 0 }}` with `duration: 0.3, ease: "easeOut"` | Modals, dialogs, drawers |

### 9.2 Motion Rules

- ✅ Use `whileInView` with `viewport={{ once: true }}` for scroll-triggered section reveals.
- ✅ Use staggered children animations for lists of cards or table rows loading in.
- ❌ **Never** use bouncing (`type: "spring"` with high stiffness) or elastic easing on functional UI.
- ❌ **Never** animate layout shifts that cause content reflow (e.g., don't animate `height: auto`).
- ❌ **Never** use `duration` values above `500ms` for interactive feedback — it feels sluggish.

---

## 10. Voice, Tone & Error Handling

### 10.1 Tone of Voice

Speak with the confidence of an established institution. Language must be **precise, academic, yet accessible**. Avoid startup jargon, excessive exclamation marks, casual slang, and emojis in system feedback.

**Do not blame the user.** Error messages must always explain what happened and provide a path to resolution.

### 10.2 Message Examples

| Context | ✅ Correct | ❌ Incorrect |
|---|---|---|
| Save success | "The student's academic record has been successfully updated." | "Awesome! You totally crushed updating that record! 🎉" |
| Conflict error | "Unable to save timetable. Mr. Phiri is already assigned to a class during Period 2. Please select a different time slot." | "Oops! Something went wrong. Try again later." |
| Delete confirmation | "This will permanently remove the student record. This action cannot be undone." | "Are you sure? This might break things!" |
| Loading state | "Loading student records…" | "Hang tight, crunching the numbers! 🚀" |

### 10.3 Error Message Anatomy

Every inline error or toast notification must include:
1. **What** went wrong — in plain language.
2. **Why** it went wrong — if technically explainable.
3. **How** to fix it — a concrete next step or action.

Dead-end errors ("Something went wrong") are prohibited without an accompanying support reference or recovery action.

---

## 11. Accessibility Checklist

Before shipping any screen or component, verify:

- [ ] All text passes **WCAG AA contrast** minimum (4.5:1 for normal text, 3:1 for large text).
- [ ] All primary text passes **WCAG AAA** (7:1 ratio).
- [ ] Every interactive element has a visible **focus ring** — `focus:ring-2 focus:ring-school-primary/20`.
- [ ] All icon-only buttons have an `aria-label`.
- [ ] Form inputs are associated with labels via `htmlFor` / `id` pairing.
- [ ] Error messages are linked to inputs via `aria-describedby`.
- [ ] Modals trap focus and restore it on close.
- [ ] All interactive elements are reachable via `Tab` key navigation.

---

## Appendix: Tailwind CSS Custom Tokens

Add the following custom tokens to your `tailwind.config.js` to enable design system tokens as utility classes:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'school-primary': '#A51C30',
        'crimson-dark': '#7A1523',
        'parchment': '#F9F8F6',
        'onyx': '#111827',
        'slate-ui': '#6B7280',
        'gold-leaf': '#D4AF37',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};
```

---
name: acadowl-ui
description: >
  Use this skill whenever you are building, modifying, or reviewing any UI or UX component
  for the Acadowl school management system. This includes pages, layouts, modals, forms,
  tables, dashboards, navigation, buttons, inputs, badges, charts, and any other visual or
  interactive element. Triggers: "build a component", "create a page", "design a form",
  "add a table", "make a modal", "update the UI", "create a dashboard", or any request
  that produces visible interface output in the Acadowl codebase.
---

# Acadowl UI Skill — "Veritas Nexus" Design System

You are building UI for **Acadowl**, an academic school management platform with a design language
called **Veritas Nexus v2.0**. This skill gives you everything you need to produce compliant,
production-grade components for this system.

## Stack

- **Framework**: Next.js (App Router, `'use client'` where needed)
- **Styling**: Tailwind CSS with custom design tokens (see below)
- **Base Components**: shadcn/ui — always install via `shadcn` CLI, then **immediately modify** to match Veritas Nexus tokens. Do not ship a shadcn default.
- **Icons**: Lucide React exclusively. Never import from any other icon library.
- **Animation**: `motion/react` (Framer Motion) for complex choreography. Tailwind utilities for micro-interactions.
- **Fonts**: Playfair Display (serif, headings only) + Inter (sans, everything else)

---

## Tailwind Token Reference

These custom tokens are available as utility classes. Use them — never hardcode hex values inline.

```
bg-school-primary    → #A51C30  (Veritas Crimson — primary actions, active states)
bg-crimson-dark      → #7A1523  (hover on primary, deep active nav)
bg-parchment         → #F9F8F6  (page background — use instead of bg-white on page root)
text-onyx            → #111827  (primary text)
bg-onyx              → #111827  (sidebar, structural shells)
text-slate-ui        → #6B7280  (secondary text, placeholders)
bg-gold-leaf         → #D4AF37  (accent only — not for CTAs)
font-serif           → Playfair Display
font-sans            → Inter
```

---

## Non-Negotiable Rules

Read all of these before writing a single line of code.

### Colors
- Page backgrounds → always `bg-parchment`. Never `bg-white` on a full page.
- Sidebars, shells → always `bg-onyx`.
- Primary CTA → always `bg-school-primary` with `hover:bg-crimson-dark`.
- Never use `#000000` or `#ffffff` for large surfaces.
- Semantic colors (green/amber/red/blue) are only for their designated feedback context.

### Typography
- Headings (h1–h3) → `font-serif font-semibold` (Playfair Display).
- Body, labels, inputs, table cells → `font-sans` (Inter). Never use serif here.
- Table column headers → `text-xs uppercase tracking-wider text-gray-500 font-semibold`.
- Monospace data (IDs, timestamps, codes) → `font-mono`.
- Minimum font weight: 400. Never use `font-thin` or `font-light`.
- Body line length: target 60–80 characters. Constrain with `max-w-prose` or `max-w-3xl`.

### Spacing
- All spacing must be a multiple of 4px (Tailwind steps: 1, 2, 3, 4, 6, 8, 12, 16).
- Standard card padding: `p-6` (desktop), `p-4` (mobile).
- Standard button padding: `px-4 py-2.5`.
- Section gaps in layouts: `gap-6` desktop, `gap-4` mobile.

### Border Radius
- Buttons, inputs, dropdowns → `rounded-lg` (8px).
- Cards, widgets, modals → `rounded-xl` (12px).
- Large layout blocks → `rounded-2xl` (16px).
- Badges, small chips → `rounded-md` (6px) or `rounded-full`.

### Shadows
- Default resting card/button → `shadow-sm` + `border border-gray-200`.
- Hover state on interactive cards → `shadow-md`.
- Modals and floating overlays → `shadow-lg`.
- Never use shadow for decoration. Shadows communicate z-index elevation only.

### Accessibility
- All icon-only buttons → must have `aria-label`.
- All form inputs → must be associated to a `<label>` via `htmlFor`/`id`.
- Focus rings → never removed. Use `focus:ring-2 focus:ring-school-primary/20 focus:border-school-primary`.
- Error states → always pair with an inline message using `aria-describedby`.
- Contrast → all body text must pass WCAG AA (4.5:1). Headings must pass AAA (7:1).

---

## Component Patterns

### Buttons — Exact Implementation

```tsx
// PRIMARY — One per page context maximum
<button className="bg-school-primary hover:bg-crimson-dark text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm active:scale-95 flex items-center gap-2">
  Save Record
</button>

// SECONDARY
<button className="bg-white hover:bg-gray-50 text-onyx border border-gray-300 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm active:scale-95">
  Cancel
</button>

// TERTIARY / GHOST
<button className="text-school-primary hover:bg-red-50 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 active:scale-95 flex items-center gap-2">
  <Plus size={18} /> Add Row
</button>

// DESTRUCTIVE
<button className="bg-white hover:bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm active:scale-95">
  Delete
</button>
```

### Form Inputs — Exact Implementation

```tsx
// DEFAULT
<div>
  <label htmlFor="field-id" className="block text-sm font-medium text-gray-700 mb-1">
    Label Text
  </label>
  <input
    id="field-id"
    type="text"
    placeholder="Placeholder..."
    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
               focus:outline-none focus:ring-2 focus:ring-school-primary/20 focus:border-school-primary
               transition-all shadow-sm"
  />
</div>

// ERROR STATE
<div>
  <label htmlFor="field-id" className="block text-sm font-medium text-gray-700 mb-1">
    Label Text
  </label>
  <input
    id="field-id"
    type="text"
    aria-describedby="field-id-error"
    className="w-full border border-red-300 text-red-900 rounded-lg px-4 py-2.5 text-sm
               focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500
               transition-all shadow-sm bg-red-50/50"
  />
  <p id="field-id-error" className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
    <AlertCircle size={14} /> Specific explanation of what is wrong.
  </p>
</div>

// DISABLED
<input
  disabled
  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm
             bg-gray-50 text-gray-500 cursor-not-allowed shadow-none"
/>
```

### Cards

```tsx
// STANDARD CARD
<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
  {/* content */}
</div>

// INTERACTIVE (hover) CARD
<div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md
                transition-all duration-200 cursor-pointer p-6">
  {/* content */}
</div>

// LARGE LAYOUT SECTION CARD
<div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
  {/* content */}
</div>
```

### Data Tables — Exact Implementation

```tsx
<div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
  {/* Optional toolbar */}
  <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
    <h4 className="font-semibold text-onyx">Table Title</h4>
    {/* actions */}
  </div>

  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200">
          <th className="p-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">ID</th>
          <th className="p-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">Name</th>
          <th className="p-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">Status</th>
          <th className="p-4 text-xs uppercase tracking-wider text-gray-500 font-semibold text-right">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        <tr className="hover:bg-gray-50/50 transition-colors">
          <td className="p-4 font-mono text-sm text-gray-500">STU-001</td>
          <td className="p-4 font-medium text-gray-900">Jane Doe</td>
          <td className="p-4">
            <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">Active</span>
          </td>
          <td className="p-4 text-right">
            <button className="text-school-primary text-sm font-medium hover:underline">Edit</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  {/* Pagination footer */}
  <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
    <span>Showing 1–50 of 1,200 records</span>
    {/* pagination controls */}
  </div>
</div>
```

**Table Rules:**
- No vertical column borders — horizontal `divide-y divide-gray-100` only.
- Numbers and action links → `text-right`.
- Always include explicit pagination. Never use infinite scroll.

### Status Badges

```tsx
// Active
<span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">Active</span>
// Inactive
<span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Inactive</span>
// Pending
<span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">Pending</span>
// Suspended
<span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-medium">Suspended</span>
```

### Sidebar Navigation

```tsx
<aside className="w-72 bg-onyx text-white flex-shrink-0 sticky top-0 h-screen flex flex-col z-50">
  {/* Brand header */}
  <div className="p-6 border-b border-gray-800">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-school-primary rounded-lg flex items-center justify-center">
        <GraduationCap size={20} className="text-white" />
      </div>
      <span className="font-serif text-xl font-semibold tracking-wide">Acadowl</span>
    </div>
  </div>

  {/* Nav items */}
  <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
    {/* Section label */}
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2 mt-4">
      Section Name
    </p>
    {/* Active nav item */}
    <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg
                       bg-school-primary text-white shadow-sm transition-all">
      <div className="flex items-center gap-3">
        <Users size={18} />
        <span className="font-medium text-sm">Students</span>
      </div>
      <ChevronRight size={16} className="opacity-70" />
    </button>
    {/* Inactive nav item */}
    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                       text-gray-300 hover:bg-gray-800 hover:text-white transition-all">
      <BookOpen size={18} />
      <span className="font-medium text-sm">Academics</span>
    </button>
  </nav>
</aside>
```

### Page Layout Shell

```tsx
// Standard admin page
<div className="min-h-screen flex bg-parchment">
  {/* Sidebar here */}
  <main className="flex-1 overflow-y-auto p-6 md:p-8">
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-semibold text-onyx">Page Title</h1>
        <p className="text-gray-500 mt-1">Supporting description of this section.</p>
      </div>
      {/* Page content */}
    </div>
  </main>
</div>
```

### Motion Patterns

```tsx
// Page section entrance (use on every major section)
<motion.section
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.5 }}
>
  {/* content */}
</motion.section>

// Modal / dialog entrance
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
  {/* modal content */}
</motion.div>

// Sidebar slide-in
<motion.aside
  initial={{ x: -50, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
>
  {/* sidebar */}
</motion.aside>
```

---

## shadcn/ui Usage Policy

shadcn components are the **base only** — you must always customize them to match Veritas Nexus tokens before use.

### Required modifications after install:

**Button** (`components/ui/button.tsx`):
- Replace default variant colors with `bg-school-primary hover:bg-crimson-dark` for primary.
- Add `active:scale-95` to the base button classes.
- Ensure `rounded-lg` is set (not `rounded-md`).

**Input** (`components/ui/input.tsx`):
- Replace focus ring with `focus:ring-2 focus:ring-school-primary/20 focus:border-school-primary`.
- Set base border to `border-gray-300`.
- Ensure `rounded-lg` (not `rounded-md`).

**Dialog/Modal** (`components/ui/dialog.tsx`):
- Add `shadow-lg rounded-2xl` to the content wrapper.
- Ensure entrance animation uses `duration-300 ease-out`.

**Badge** (`components/ui/badge.tsx`):
- Remap variants to match the status badge color system (green/gray/amber/red/blue).
- Use `rounded-full` instead of `rounded-md`.

**Table** (`components/ui/table.tsx`):
- Add `text-xs uppercase tracking-wider text-gray-500 font-semibold` to `<TableHead>`.
- Add `hover:bg-gray-50/50 transition-colors` to `<TableRow>`.
- Wrap in `bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden`.

> If a shadcn component would require more than 3 override patches to match these guidelines,
> **build the component from scratch** instead. Clarity and compliance outweigh convenience.

---

## Icon Reference (Lucide React Only)

```
size={16} → inline with text, small buttons, form inputs
size={20} → sidebar nav, standard icons
size={24} → empty states, section headers

Students/Users      → <Users />
Teachers/Staff      → <GraduationCap />
Attendance          → <CalendarCheck />
Academics           → <BookOpen />
Finance/Fees        → <CreditCard />
Settings            → <Settings />
View/Preview        → <Eye />
Description/Detail  → <AlignLeft />
Devices/Portals     → <MonitorSmartphone />
Search              → <Search />
Add/Create          → <Plus />
Loading             → <Loader2 className="animate-spin" />
Error               → <AlertCircle />
Success             → <CheckCircle2 />
Info                → <Info />
```

---

## Voice & Feedback Messages

All system feedback must follow this pattern:

| ✅ Use | ❌ Avoid |
|---|---|
| Clear, institution-grade language | Startup slang, casual tone |
| Explain what happened + how to fix | Dead-end "Something went wrong" |
| "The record has been saved successfully." | "Awesome! Great job! 🎉" |
| "Unable to save. [Specific reason]. [Action to resolve]." | "Oops! Try again later." |
| "This action is permanent and cannot be undone." | "Are you sure? This might break things!" |

---

## Pre-Ship Checklist

Before delivering any component or screen, verify all of the following:

- [ ] Page background is `bg-parchment`, not `bg-white` or `bg-gray-100`
- [ ] All headings use `font-serif font-semibold`
- [ ] No hardcoded hex values — all colors use Tailwind tokens
- [ ] Every interactive element has `transition-all duration-200`
- [ ] All buttons have `active:scale-95`
- [ ] Focus rings are present and use `ring-school-primary/20`
- [ ] All icon-only buttons have `aria-label`
- [ ] Form inputs are paired with labels via `htmlFor`/`id`
- [ ] Error messages use `AlertCircle` + red text and `aria-describedby`
- [ ] Tables use `divide-y divide-gray-100` — no vertical column lines
- [ ] Tables have explicit pagination, not infinite scroll
- [ ] Motion uses `duration-200` for micro-interactions, `duration-300–500` for entrances
- [ ] No spring/bounce easing on functional UI elements
- [ ] shadcn components have been overridden to match Veritas Nexus tokens
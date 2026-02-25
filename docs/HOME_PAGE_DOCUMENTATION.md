# Poetree Publication — Home Page Documentation

This document describes the **Home page** (`/`) of Poetree Publication: content, features, colors, layout, and UI behavior.

---

## 1. Page Overview

- **Route:** `/`
- **Component:** `src/pages/Home.jsx`
- **Layout:** Full-width, scrollable single page with a fixed **Navbar** at the top and **Footer** at the bottom.
- **Animations:** Framer Motion is used in the “Animations” section (fade-in, slide-up on scroll).

---

## 2. What the Home Page Contains

The Home page is built from **five main sections** plus Navbar and Footer.

| # | Section name        | Purpose |
|---|---------------------|--------|
| 1 | Hero                | Main headline, tagline, and primary CTAs |
| 2 | Features            | Four product offerings (Question Papers, Prebuilt Questions, Worksheets, Answer Sheets) |
| 3 | Animations          | Promo for learning videos/animations (no login) + link to `/animations` |
| 4 | For Teachers & Students | Two columns: what teachers get vs what students get |
| 5 | CTA (Call to Action) | Final “Ready to create better papers?” with Get Started / Sign In / Brochure |

---

## 3. What Poetree Provides (As Shown on Home)

### 3.1 Four main features (cards)

| Feature             | Description | Icon (Lucide) |
|---------------------|-------------|----------------|
| **Question Papers** | Create and customize exam papers with multiple question types; build from scratch or use saved papers. | `FileText` |
| **Prebuilt Questions** | Ready-made templates; pick a template, customize questions, generate papers in minutes. | `BookOpen` |
| **Practice Worksheets** | Worksheets by subject and standard for daily practice and revision. | `FilePlus` |
| **Answer Sheets**     | Download answer sheets and solutions aligned with subject, board, and standard. | `ClipboardCheck` |

### 3.2 For Teachers

- Create question papers with MCQs, short & long answers, fill-in-blanks.
- Use prebuilt templates or build from scratch.
- Filter by subject, subject title, board & standard.
- Manage worksheets and answer sheets in one place.

### 3.3 For Students

- Access question papers and worksheets by class & subject.
- Practice with worksheets and view answer sheets.
- Clear filtering by subject, board and standard.
- Everything in one dashboard—no clutter.

### 3.4 Other offerings (from Home)

- **Learning animations & videos:** Subject-wise educational videos and animations; **no login required** — linked from “Watch animations” to `/animations`.
- **Brochure:** “Download Brochure” button; link comes from `BROCHURE_PDF_URL` in `src/config/api.js` (env: `VITE_BROCHURE_PDF_URL`). If not set, button is disabled and shows “Brochure link will be added soon”.

---

## 4. Colors Used on the Home Page

Colors are implemented with **Tailwind CSS** classes. Approximate mapping:

### 4.1 Hero section

| Element | Tailwind class | Description |
|--------|----------------|-------------|
| Background | `bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900` | Dark gradient: slate → blue → indigo |
| Overlay image | `bg-[url('/s1.jpg')]` with `opacity-20` | Background image, faint |
| Overlay gradient | `from-slate-900/90`, `to-slate-900/50` | Dark overlay top/bottom |
| Badge | `bg-white/10`, `text-white/90` | Semi-transparent white |
| Headline (main) | `text-white` | White |
| Headline (accent) | `bg-gradient-to-r from-blue-300 to-indigo-300` (clip-text) | Blue–indigo gradient text |
| Subtext | `text-slate-300` | Light gray |
| Primary button | `bg-blue-500`, `hover:bg-blue-600`, `shadow-blue-500/30` | Blue solid |
| Secondary / Brochure | `bg-white/10`, `hover:bg-white/20`, `border-white/20` | Glass-style white |

### 4.2 Features section

| Element | Tailwind class | Description |
|--------|----------------|-------------|
| Section background | `bg-slate-50` | Very light gray |
| Heading | `text-slate-800` | Dark slate |
| Subtext | `text-slate-600` | Medium gray |
| Card 1 (Question Papers) | `bg-blue-50`, `bg-blue-100` (icon), blue gradient ref | Light blue |
| Card 2 (Prebuilt Questions) | `bg-indigo-50`, `bg-indigo-100` (icon) | Light indigo |
| Card 3 (Worksheets) | `bg-emerald-50`, `bg-emerald-100` (icon) | Light emerald |
| Card 4 (Answer Sheets) | `bg-amber-50`, `bg-amber-100` (icon) | Light amber |
| Card border | `border-slate-100`, `hover:border-slate-200` | Light borders |
| Link | `text-blue-600`, `hover:text-blue-700` | Blue link |

### 4.3 Animations section

| Element | Tailwind class | Description |
|--------|----------------|-------------|
| Section background | `bg-gradient-to-br from-violet-50 via-white to-fuchsia-50/50` | Violet–white–fuchsia gradient |
| Badge | `bg-violet-100`, `text-violet-700` | Light violet |
| Heading | `text-slate-800` | Dark slate |
| Card | `bg-white`, `border-violet-100`, `shadow-violet-500/10` | White card, violet border/shadow |
| Icon box | `from-violet-500 to-fuchsia-500` (gradient) | Violet–fuchsia |
| CTA button | `bg-violet-500`, `text-white`, `hover:bg-violet-600` | Violet solid |

### 4.4 For Teachers & Students section

| Element | Tailwind class | Description |
|--------|----------------|-------------|
| Section background | `bg-white` | White |
| Teachers card | `from-blue-50 to-indigo-50`, `border-blue-100` | Blue–indigo gradient |
| Teachers icon | `bg-blue-500`, `text-white` | Blue icon |
| Teachers checkmarks | `text-blue-500` | Blue |
| Students card | `from-emerald-50 to-teal-50`, `border-emerald-100` | Emerald–teal gradient |
| Students icon | `bg-emerald-500`, `text-white` | Emerald icon |
| Students checkmarks | `text-emerald-500` | Emerald |
| Body text | `text-slate-700`, `text-slate-800` | Dark gray/slate |

### 4.5 CTA section

| Element | Tailwind class | Description |
|--------|----------------|-------------|
| Background | `bg-gradient-to-br from-slate-800 to-indigo-900` | Dark slate → indigo |
| Heading | `text-white` | White |
| Subtext | `text-slate-300` | Light gray |
| Primary button | `bg-blue-500`, `hover:bg-blue-600`, `text-white` | Blue |
| Secondary / Brochure | `bg-white/10`, `hover:bg-white/20`, `border-white/20` | Glass-style white |

### 4.6 Navbar (on Home)

| Element | Tailwind class | Description |
|--------|----------------|-------------|
| Background | `bg-white` (typical) | White |
| Links | `text-slate-600`, `hover:text-slate-900`, `hover:bg-slate-100` | Gray with hover |
| Primary CTA | `bg-blue-600`, `hover:bg-blue-700`, `text-white` | Blue |
| Logout | `hover:text-red-600`, `hover:bg-red-50`, `hover:border-red-200` | Red on hover |

### 4.7 Footer

| Element | Tailwind class | Description |
|--------|----------------|-------------|
| Background | `bg-slate-900` | Dark slate |
| Brand / headings | `text-white`, `text-slate-300` (uppercase labels) | White / light gray |
| Body / links | `text-slate-400`, `hover:text-white` | Muted gray, white on hover |
| Map strip | `bg-slate-800/80`, `text-slate-300` | Dark strip |

---

## 5. How the UI Looks and Behaves

### 5.1 Layout and structure

- **Navbar:** Top, full width; logo/name on the left; on the right: Animations, Login, Get Started (or when logged in: Dashboard, Animations, Profile, Logout).
- **Hero:** Centered content, ~85vh min height; badge, headline (two lines), subtext, then three buttons in a row (Get Started, Sign In, Download Brochure).
- **Features:** Centered max-width container; section title and subtitle, then 2×2 grid of feature cards (responsive: 1 column on small screens).
- **Animations:** Same max-width; “Free to watch” badge, heading, short description, then one large card with play icon, “Watch animations” title, short text, and “Watch now” button linking to `/animations`.
- **Teachers & Students:** Two columns (side by side on md+, stacked on small); each column is a card with icon, title, and bullet list with checkmarks.
- **CTA:** Centered block; headline, short text, same three buttons as Hero (Get Started, Sign In, Download Brochure).
- **Footer:** Multi-column (brand, Get started links, Product list, Contact with address and phone); bottom strip with “View on Google Maps” link.

### 5.2 Responsive behavior

- **Hero:** Text scales (`text-4xl` → `md:text-5xl` → `lg:text-6xl`); buttons wrap with `flex-wrap`.
- **Features:** `grid-cols-1 md:grid-cols-2`.
- **Teachers & Students:** `grid-cols-1 md:grid-cols-2`.
- **Animations card:** `flex-col sm:flex-row` so it stacks on small screens.
- **Navbar:** Hamburger menu on small screens; horizontal links on `md+`.

### 5.3 Interactions

- **Buttons:** Hover states (darker background / border / shadow as listed in colors).
- **Feature cards:** `hover:shadow-xl`, `hover:border-slate-200`.
- **Animations card:** `hover:shadow-2xl`, `hover:border-violet-200`, play icon `group-hover:scale-105`, “Watch now” `group-hover:bg-violet-600`, arrow `group-hover:translate-x-1`.
- **Brochure:** If `BROCHURE_PDF_URL` is set, opens in new tab; otherwise `cursor-not-allowed` and no navigation.
- **Links:** “Create your account and start” in Features goes to `/auth/register`; “Watch now” goes to `/animations`; Get Started → `/auth/register`, Sign In → `/auth/login`.

### 5.4 Assets and dependencies

- **Image:** Hero uses `/s1.jpg` (public folder) as background.
- **Icons:** Lucide React (`FileText`, `BookOpen`, `FilePlus`, `ClipboardCheck`, `GraduationCap`, `UserCircle`, `ArrowRight`, `CheckCircle2`, `Sparkles`, `FileDown`, `Play`, `Film`).
- **Motion:** Framer Motion for the Animations section (opacity + y on scroll).

---

## 6. Quick reference — Sections and links

| Section        | Main message | Primary action(s) |
|----------------|--------------|--------------------|
| Hero           | Create Papers. Teach Smarter. | Get Started, Sign In, Download Brochure |
| Features       | Everything you need in one place | “Create your account and start” → Register |
| Animations     | Learning animations & videos (no login) | “Watch now” → `/animations` |
| Teachers & Students | Built for teachers and students | Informational only |
| CTA            | Ready to create better papers? | Get Started, Sign In, Download Brochure |

---

## 7. Config and content that affect the Home page

- **Brochure:** `src/config/api.js` → `BROCHURE_PDF_URL` (or `VITE_BROCHURE_PDF_URL`). If empty, brochure button is disabled.
- **Footer:** Address, phone, and map link are in `src/components/Footer.jsx` (constants at top of file).

---

*Document generated from `src/pages/Home.jsx`, `src/components/Navbar.jsx`, `src/components/Footer.jsx`, and `src/config/api.js`.*

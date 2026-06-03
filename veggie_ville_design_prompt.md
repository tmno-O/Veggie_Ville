# Veggie Ville — Claude Design Prompt
## UI Design System & Screen Specification

---

## PROJECT OVERVIEW

**Project Name:** Veggie Ville
**Tagline:** *Fresh from your neighbors*
**Type:** Community marketplace web app where neighbors sell and swap home-grown produce — vegetables, fruits, herbs, honey, and eggs.

**Core Design Principles:**
- Fresh, natural and organic
- Warm, earthy and welcoming
- Clean, readable and accessible
- Community-driven and trustworthy

---

## BRAND VALUES (use as visual direction)

| Value | Icon concept | Meaning |
|---|---|---|
| Natural | Leaf | Organic & fresh |
| Community | People group | People first |
| Trustworthy | Shield | Safe & reliable |
| Sustainable | Seedling | Better together |
| Warm & Approachable | Sun | Friendly & local |

---

## COLOR SYSTEM

### Primary Tokens (use these in components)

| Token | Hex | Usage |
|---|---|---|
| `color-primary` | `#2E9E60` | Primary buttons, links, active nav |
| `color-primary-hover` | `#228A4E` | Button hover state |
| `color-bg-primary` | `#F0FAF4` | Selected card backgrounds |
| `color-secondary` | `#E5A800` | Accent badges, highlights |
| `color-secondary-light` | `#FFFBF0` | Warning backgrounds |
| `color-accent` | `#D4522A` | Seller tags, category pills |
| `color-error` | `#E03030` | Validation errors, expired items |
| `color-error-light` | `#FFF2F2` | Error message backgrounds |
| `color-info` | `#2090E8` | Info banners, demo badge |
| `color-info-light` | `#EFF8FF` | Info backgrounds |
| `color-text-primary` | `#242220` | Headlines, body text |
| `color-text-secondary` | `#6E6B65` | Captions, meta text |
| `color-text-disabled` | `#ABABA0` | Disabled inputs |
| `color-bg-secondary` | `#FAFAF8` | Card backgrounds |
| `color-bg-tertiary` | `#F2F1EE` | Section backgrounds |
| `color-border` | `#E4E2DC` | Card borders, dividers |
| `color-border-focus` | `#4DB37D` | Input focus ring |

### Full Palette Reference

**Garden Green (Primary)**
`#F0FAF4` · `#D6F0E0` · `#AEDDC2` · `#7EC9A0` · `#4DB37D` · `#2E9E60` · `#228A4E` · `#1A723E` · `#125930` · `#0A3D20`

**Harvest Amber (Secondary)**
`#FFFBF0` · `#FEF3D0` · `#FCE59E` · `#FAD468` · `#F7C030` · `#E5A800` · `#C48E00` · `#A37500` · `#7A5800` · `#513900`

**Earth Terracotta (Accent)**
`#FDF2EF` · `#FAD9CF` · `#F5B5A2` · `#EE8E72` · `#E56A45` · `#D4522A` · `#B84220` · `#963419` · `#722613` · `#4D190D`

**Warm Stone (Neutral)**
`#FAFAF8` · `#F2F1EE` · `#E4E2DC` · `#CCC9C0` · `#ABABA0` · `#8A8780` · `#6E6B65` · `#56534E` · `#3B3936` · `#242220`

**Fresh Red (Error/Semantic)**
`#FFF2F2` · `#FDDADA` · `#FAB4B4` · `#F68686` · `#F05555` · `#E03030` · `#C02020` · `#9E1818` · `#781212` · `#500C0C`

**Sky Blue (Info/Semantic)**
`#EFF8FF` · `#D6EDFC` · `#AEDAFA` · `#7DC3F7` · `#4DAAF4` · `#2090E8` · `#1676CC` · `#1060A8` · `#0C4A84` · `#083160`

---

## TYPOGRAPHY GUIDELINES

- **Headlines / H1–H2:** Bold, `color-text-primary` (`#242220`), slightly rounded feel — use a humanist sans-serif (e.g., Inter, DM Sans, or Nunito)
- **Body text:** Regular weight, `color-text-primary`, 16px base size, 1.5 line-height
- **Captions / meta:** `color-text-secondary` (`#6E6B65`), 14px
- **Labels / tags:** `color-text-secondary`, 12px uppercase tracking
- **Price / highlight text:** `color-primary` (`#2E9E60`), semibold

---

## COMPONENT SPECIFICATIONS

### 1. Primary Button
- Background: `#2E9E60` (Green 500)
- Text: White, semibold
- Border radius: 8px
- Hover: `#228A4E` (Green 600)
- Disabled: Stone 300 bg + Stone 500 text
- Padding: 12px 24px

### 2. Product Card
- Background: White
- Border: `#E4E2DC` (Stone 200), 0.5px, radius 12px
- Image area: Stone 100 background
- Product name: `color-text-primary`, semibold
- Price: Green 600, bold — format `$3.50 / lb`
- Star rating: Amber/yellow stars
- Seller name: "Grown by [Name]" in Green, small
- Heart/favorite icon: top-right corner
- Size badge: Green 100 bg, Green 700 text
- **Expiry Tag States:**
  - Normal (>7 days): Stone 100 bg + Stone 600 text — "Best before May 28, 2025"
  - Expiring soon (≤5 days): Amber 100 bg + Amber 700 text — orange tint
  - Expired: Red 100 bg + Red 600 text, bold

### 3. Category Pill
- Active: Green 500 bg + White text
- Inactive: Stone 100 bg + Stone 700 text
- Border radius: 999px (fully rounded)
- Examples: "Vegetables", "Fruits", "Herbs", "Honey", "Eggs"

### 4. Input Field
- Border: Stone 300
- Focus border: Green 400, 2px ring
- Label: Stone 700
- Placeholder: Stone 400
- Error border: Red 500 + Red 600 error text below
- Border radius: 8px
- Padding: 10px 14px

### 5. Info Banner (Demo/Alert)
- Background: Blue 50 (`#EFF8FF`)
- Text: Blue 700
- Border: Blue 200
- Icon: Blue 500 info circle
- Badge: Blue 500 bg, White text — e.g., "Demo Mode"
- Message: "Demo mode is active – Payment bypassed / No real payment will be processed."

### 6. Navbar
- Background: White
- Active link: Green 600, with underline or dot indicator
- Inactive links: Stone 600
- Cart badge: Green 500 bg, White text, circle
- Logo: Leaf icon + "Community Garden Share" wordmark in dark green
- Tagline under logo: Green 600 italic — *"Fresh from your neighbors"*
- Links: Browse · Categories · How It Works · About

---

## SCREENS TO DESIGN

### Screen 1 — Homepage / Landing
**Purpose:** First impression, encourage browsing and sign-up

**Sections:**
1. **Hero** — Full-width banner with illustration of garden/produce basket. Headline: *"Fresh from your neighbors"*. Subtext: "Buy, sell and swap home-grown produce in your community." Two CTAs: [Browse Listings] (primary green button) + [Start Selling] (outline button)
2. **Value Props Row** — 5 icon+label cards: Natural · Community · Trustworthy · Sustainable · Warm & Approachable
3. **Featured Listings** — Horizontal scroll or 4-column grid of Product Cards
4. **Category Browser** — Grid of Category Pills or illustrated category cards (Vegetables, Fruits, Herbs, Honey, Eggs)
5. **How It Works** — 3-step illustrated section: Post your harvest → Browse nearby → Meet & exchange
6. **Testimonials / Community Stories** — 2–3 neighbor quote cards with avatar, name, neighborhood
7. **CTA Banner** — "Start sharing today" with green background and sign-up button
8. **Footer** — Logo, tagline, nav links, social icons, Stone background

---

### Screen 2 — Browse / Marketplace Listings
**Purpose:** Discover and filter produce for sale

**Layout:** Left sidebar filters + Right main grid

**Sidebar:**
- Search input with magnifier icon
- Category filter (pill checkboxes): All / Vegetables / Fruits / Herbs / Honey / Eggs
- Distance slider: "Within X km"
- Price range slider
- Availability toggle: Show only in-stock
- Sort by: Newest / Price low-high / Closest / Expiring soon

**Main Grid:**
- 3-column responsive product card grid
- Each card uses Product Card component spec above
- Pagination or infinite scroll
- Empty state: illustration + "No listings found. Try adjusting your filters."

---

### Screen 3 — Product Detail Page
**Purpose:** Full listing view, buy or contact seller

**Layout:** 2-column (image left, details right) on desktop

**Left column:**
- Large product image (Stone 100 bg)
- Thumbnail strip if multiple photos
- Expiry tag badge (Normal / Expiring Soon / Expired)

**Right column:**
- Category pill (e.g., "Vegetables")
- Product name — H1, bold
- Star rating + review count
- Price — large, Green 600 bold
- Quantity selector (1 lb default)
- "Add to Cart" primary button
- Divider
- Seller card: avatar + "Grown by Sarah" + Green verified badge + "View Profile" link
- Description block
- Tags: organic, pesticide-free, etc. (Terracotta pills)
- Pickup/delivery info

**Below fold:**
- Reviews section
- "More from this seller" horizontal card row
- "You may also like" card row

---

### Screen 4 — Seller Profile Page
**Purpose:** Build trust, show seller's produce

**Header:** Cover photo (garden photo), circular avatar, seller name, neighborhood, member since date, green verified badge if applicable

**Stats row:** Listings · Sales · Rating (e.g., 4.8★)

**Tabs:** Active Listings · Reviews · About

**Active Listings tab:** Same product card grid as Browse screen

**About tab:** Bio text, what they grow, pickup preferences

---

### Screen 5 — Post a Listing
**Purpose:** Let sellers create a new produce listing

**Multi-step form or single long form:**

1. **Photos** — drag/drop upload zone, up to 5 images, Stone 100 bg, dashed border
2. **Details:**
   - Product name (text input)
   - Category (pill selector — Vegetables / Fruits / Herbs / Honey / Eggs)
   - Description (textarea)
   - Tags (e.g., organic, pesticide-free — pill multi-select)
3. **Pricing & Quantity:**
   - Price input with unit selector (per lb / per bunch / per item / per dozen)
   - Available quantity
   - Best before date (date picker — triggers expiry tag color logic)
4. **Pickup / Delivery:**
   - Pickup only toggle
   - Pickup address (auto-fill from profile)
   - Available times
5. **Preview & Submit:**
   - Live card preview (matches Product Card component)
   - [Post Listing] primary green button
   - [Save Draft] text link

---

### Screen 6 — Cart & Checkout
**Purpose:** Review cart and complete purchase

**Cart page:**
- List of cart items (mini card: image + name + price + quantity stepper + remove)
- Order summary sidebar: subtotal, delivery fee, total
- [Proceed to Checkout] green button

**Checkout page:**
- Pickup / delivery selection
- Contact info fields
- Payment method (card inputs with proper error states)
- Order summary
- [Place Order] green button
- Demo mode info banner at top if in demo mode

---

### Screen 7 — User Dashboard (Buyer + Seller)
**Purpose:** Manage listings, orders, messages

**Sidebar nav:** Overview · My Listings · My Orders · Messages · Earnings · Settings

**Overview tab:**
- Welcome banner: "Good morning, [Name]!"
- Stats cards: Active Listings · Completed Sales · Pending Orders · Total Earned
- Recent activity feed
- Quick action buttons: [+ Post Listing] · [Browse Market]

**My Listings tab:**
- Table or card grid of seller's own listings
- Status pills: Active (green) / Expiring Soon (amber) / Expired (red) / Draft (stone)
- Edit / Delete actions per row

---

## ACCESSIBILITY REQUIREMENTS (WCAG AA)

| Pair | Ratio | Status |
|---|---|---|
| Green 500 on White | 4.52:1 | ✅ AA Normal Text |
| Green 600 on White | 5.66:1 | ✅ AA Normal Text |
| Stone 500 on White | 5.31:1 | ✅ AA Normal Text |
| Stone 500 on Stone 100 | 3.02:1 | ✅ AA Large Text |
| Blue 500 on White | 4.55:1 | ✅ AA Normal Text |
| White on Green 500 | 4.74:1 | ✅ AA Normal Text |

All interactive elements must have visible focus rings using `color-border-focus` (`#4DB37D`).
Minimum touch target: 44×44px.

---

## DARK MODE MAPPING (optional future screen)

| Role | Light | Dark |
|---|---|---|
| BG Primary | `#FFFFFF` | `#1F1E1C` |
| BG Secondary | `#FAFAF8` | `#2B2A28` |
| Surface/Card | `#F2F1EE` | `#2F2E2C` |
| Text Primary | `#FAFAF8` | `#FAFAF8` |
| Text Secondary | `#BEBBB6` | `#BEBBB6` |
| Border | `#3E3C39` | `#3E3C39` |
| Primary | `#2E9E60` | `#2E9E60` |
| Accent | `#E5A800` | `#E5A800` |
| Info | `#2090E8` | `#2090E8` |
| Error | `#E03030` | `#E03030` |

---

## ILLUSTRATION & IMAGERY STYLE

- Warm, hand-crafted feel — flat illustration or soft watercolor-inspired
- Subject matter: vegetables, fruits, garden baskets, neighborhood scenes, farmers markets
- Color palette: pull from brand greens, ambers, and terracottas
- Avoid cold/sterile stock photography
- For product images: always display on Stone 100 (`#F2F1EE`) background

---

## RESPONSIVE BREAKPOINTS

| Breakpoint | Width | Notes |
|---|---|---|
| Mobile | 375–767px | Single column, bottom nav |
| Tablet | 768–1023px | 2-column grid, side drawer |
| Desktop | 1024px+ | Full sidebar, 3–4 column grid |

---

## SAMPLE COPY & DATA (use for mockups)

**Products:**
- Fresh Homegrown Roma Tomatoes — Grown by Sarah — $3.50/lb — ★★★★★ (24) — Best before May 28, 2025
- Purple Basil Bunch — Grown by Marco — $2.00/bunch — ★★★★☆ (12) — Expiring soon May 20
- Raw Backyard Honey (500g) — Grown by The Nguyens — $12.00/jar — ★★★★★ (8)
- Free-Range Eggs (dozen) — Grown by Claire — $5.50/dozen — ★★★★★ (31)

**Seller:** Sarah · Chiang Mai Community Garden · Member since 2023 · ⭐ 4.9 · 47 sales

---

*End of Veggie Ville Design Prompt — Version 1.0*

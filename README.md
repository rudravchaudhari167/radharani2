# VRINDAV — Threads of Devotion

**"Divine Style. Eternal Bond."**

A production-quality modern 3D fashion e-commerce website inspired by Radha & Krishna.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion |
| 3D | Three.js, React Three Fiber, Drei |
| State | Zustand |
| Database | Supabase (PostgreSQL) + PostgREST |
| Payments | Razorpay (test mode) |
| Auth | Custom JWT with httpOnly cookies |
| Icons | Lucide React |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (free tier is fine) — create one at https://supabase.com
- Razorpay test account (for real payment testing, optional)

### 1. Clone & Install

```bash
cd vrindav
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

```bash
# Supabase (required — all data lives here).
# Get these from https://supabase.com/dashboard → Project → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

NEXTAUTH_SECRET=generate-a-64-char-random-string

# Razorpay (test mode — get from https://dashboard.razorpay.com)
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXX
```

> **Important:** Without Razorpay test keys the app runs in *sandbox mode*
> for the payment flow. In sandbox mode, the full checkout → verify → order
> journey completes locally without real payment processing.

### Supabase Setup (Database + Auth)

VRINDAV stores all data in Supabase Postgres and uses its table-level auth
for the optional **"Continue with Google"** flow. All customer/admin
authentication still uses VRINDAV's own **bcrypt + JWT** cookie.

1. Run `supabase/schema.sql` in the **Supabase SQL editor**
   (Project → SQL → New query → paste → Run). This creates all tables,
   enums, indexes, RLS policies, and RPC helpers.
2. Set the three Supabase environment variables above.
3. `SUPABASE_SERVICE_ROLE_KEY` is used **server-side only** (never in the
   browser) and powers all API routes, the seed script, and `create-admin`.

When Supabase Auth is enabled:
- A "Continue with Google" button appears on `/login` and `/register`; the
  callback at `/api/auth/supabase/callback` upserts the user into the Supabase
  `users` table and issues the same httpOnly JWT cookie.
- Users created through Supabase are always `role: USER`; admins can never be
  created through that flow.
- Leave the keys empty to disable Google sign-in; email/phone + password (JWT)
  authentication keeps working against the same `users` table.

### 3. Seed Products

```bash
npm run seed
```

Seeds **33 products** across MEN, WOMEN, UNISEX, KIDS, ACCESSORIES and **4 coupon codes** (WELCOME10, KRISHNA10, FESTIVE20, SAVE500). Requires the three Supabase env vars above (it uses the service-role key).

### 4. Create Admin Account

```bash
npm run create-admin
```

Prompts for admin email and password. The account is stored with `role: ADMIN`.

**Interactive:**
```
Admin email: admin@vrindav.com
Admin password (leave blank to auto-generate): [type or press Enter]
```

**Non-interactive:**
```bash
echo -e "admin@vrindav.com\nYourSecureP@ss" | npm run create-admin
```

> **Security:** Only one admin account can be created. Duplicate admins are
> rejected. Passwords are bcrypt-hashed (12 rounds). Admin never accepts
> phone login and is never accessible through customer registration.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo Credentials

**Customer:** `test@example.com` / `Password123!` (register a new account or use seeded test user)

**Admin:** `admin@vrindav.com` / use the password you set during `npm run create-admin`

**Test Coupons:** `WELCOME10`, `KRISHNA10`, `FESTIVE20`, `SAVE500`

---

## Pages

### Customer
| Route | Description |
|-------|-------------|
| `/` | Home — 3D hero, new arrivals, categories |
| `/shop` | All products with filters, sorting, pagination |
| `/shop/[category]` | Category-filtered product listing |
| `/product/[slug]` | Product details with 3D viewer |
| `/cart` | Shopping cart with coupon apply |
| `/wishlist` | Saved products |
| `/checkout` | Delivery info, shipping, payment |
| `/order-success` | Payment confirmation + order summary |
| `/orders` | Order history |
| `/orders/[id]` | Single order detail + timeline |
| `/track-order` | Track order by ID |
| `/account` | Account dashboard |
| `/account/addresses` | Manage delivery addresses |
| `/account/settings` | Profile, password change |
| `/login` | Email or phone login |
| `/register` | Customer registration |
| `/forgot-password` | Password recovery |
| `/about` | Brand story |
| `/contact` | Contact form + FAQ |

### Admin
| Route | Description |
|-------|-------------|
| `/admin/login` | Secure admin login |
| `/admin` | Dashboard — stats, charts, recent orders |
| `/admin/products` | List, search, delete products |
| `/admin/products/new` | Create product form |
| `/admin/products/edit/[id]` | Edit product form |
| `/admin/orders` | Order list with status filter |
| `/admin/orders/[id]` | Order detail, update status |
| `/admin/users` | User list, enable/disable |
| `/admin/coupons` | Create/edit/delete coupons |
| `/admin/settings` | Store settings, audit logs, password |

---

## Features

- **3D hero scene** — React Three Fiber with moon, stars, peacock feathers, particles
- **Rose petal cursor** — Canvas particle system on mouse/touch movement
- **Product 3D viewer** — Interactive 3D product presentation
- **Smart search** — Debounced real-time search with suggestions
- **Advanced filters** — Category, price, size, color, rating, stock
- **Server-side price calculation** — Cart total never trusted from client
- **Razorpay payments** — Full integration with signature verification
- **Coupon system** — Percentage/fixed discounts with min order + expiry
- **Admin security** — Role verification, rate limiting, audit logs
- **Mobile responsive** — 2-column mobile, 4-column desktop grid
- **Accessibility** — `prefers-reduced-motion`, keyboard navigation

---

## Coupon Codes

| Code | Type | Discount | Min Order |
|------|------|----------|-----------|
| WELCOME10 | 10% off | up to ₹500 | ₹999 |
| KRISHNA10 | 10% off | up to ₹750 | ₹1499 |
| FESTIVE20 | 20% off | up to ₹1500 | ₹2499 |
| SAVE500 | ₹500 off | ₹500 | ₹2999 |

---

## Build & Production

```bash
npm run build   # Type-check + production build
npm start       # Start production server (port 3000)
```

---

## Project Structure

```
vrindav/
├── src/
│   ├── app/              # Next.js App Router pages + API routes
│   │   ├── api/          # REST API (auth, products, cart, admin, etc.)
│   │   ├── admin/        # Admin panel pages
│   │   ├── shop/         # Shop, category, product pages
│   │   └── ...           # Customer pages
│   ├── components/       # Reusable UI components
│   │   ├── Navbar/       # Sticky glassmorphism navbar
│   │   ├── Footer/       # Brand footer
│   │   ├── Hero3D/       # 3D hero scene (R3F + Drei)
│   │   ├── RosePetal/    # Canvas petal cursor
│   │   ├── ProductCard/  # Product cards with 3D tilt
│   │   └── ...           # AccountLayout, AdminLayout, etc.
│   ├── lib/              # Utilities, auth, supabase clients, stores
│   │   ├── supabase-server.ts  # Server (service-role) + anon clients
│   │   ├── supabase-shapes.ts  # Postgres row → API camelCase mappers
│   │   ├── auth.ts       # JWT auth helpers (bcrypt + cookies)
│   │   ├── razorpay.ts   # Razorpay client
│   │   ├── store.ts      # Auth Zustand store
│   │   ├── cart-store.ts # Cart Zustand store
│   │   └── wishlist-store.ts
├── scripts/
│   ├── seed.ts           # Product + coupon seeder (Supabase)
│   └── create-admin.ts   # Interactive admin creator (Supabase)
├── .env.example          # Env var template
└── README.md
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server-side service role key (never exposed) |
| `NEXTAUTH_SECRET` | ✅ | JWT signing secret (random 32+ char string) |
| `RAZORPAY_KEY_ID` | ⚠️ | Razorpay test key (sandbox if placeholder) |
| `RAZORPAY_KEY_SECRET` | ⚠️ | Razorpay test secret (sandbox if placeholder) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | ⚠️ | Client-side Razorpay key |

---

## License

Proprietary — VRINDAV. All rights reserved.
# radharani

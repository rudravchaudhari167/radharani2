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
| Database | MongoDB + Mongoose |
| Payments | Razorpay (test mode) |
| Auth | Custom JWT with httpOnly cookies |
| Icons | Lucide React |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 6+ (local or Atlas)
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
DATABASE_URL=mongodb://localhost:27017/vrindav
NEXTAUTH_SECRET=generate-a-64-char-random-string
NEXTAUTH_URL=http://localhost:3000

# Razorpay (test mode — get from https://dashboard.razorpay.com)
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXX

# Optional: admin seeded via create-admin script
ADMIN_EMAIL=admin@vrindav.com
ADMIN_PASSWORD_HASH=$2b$12$...

# Supabase Auth (optional — leave empty to keep MongoDB/JWT auth only).
# Get these from https://supabase.com/dashboard → Project → Settings → API
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

> **Important:** Without Razorpay test keys the app runs in *sandbox mode*
> for the payment flow. In sandbox mode, the full checkout → verify → order
> journey completes locally without real payment processing.

### Supabase Auth (optional)

VRINDAV ships with two authentication backends that work side by side:

1. **MongoDB + JWT (default)** — email/phone registration, bcrypt-hashed
   passwords, httpOnly cookies. Fully functional with zero external setup.
2. **Supabase Auth (optional)** — add `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local` to enable a
   **"Continue with Google"** button on the login and register pages. Supabase
   handles the OAuth/email-password session; VRINDAV then **upserts the user
   into MongoDB** with `role: USER` and issues the same httpOnly JWT cookie, so
   carts, orders and admin checks keep working unchanged.

When Supabase is enabled:
- Signing up or in through Supabase always provisions the account with
  `role: USER` in MongoDB. Admins can **never** be created through Supabase.
- Google sign-in completes at `/api/auth/supabase/callback`, which exchanges
  the OAuth code, creates/updates the MongoDB user, and redirects back to the
  app signed in.
- Leave both keys empty to disable Supabase entirely and use only
  MongoDB/JWT auth (recommended for a fully offline/local deployment).

### 3. MongoDB Setup

**Option A — Local MongoDB**

```bash
# Install MongoDB (macOS)
brew install mongodb-community@7.0
brew services start mongodb-community@7.0

# Or with Docker
docker run -d -p 27017:27017 --name vrindav mongo:7
```

**Option B — MongoDB Atlas**

Set `DATABASE_URL` in `.env.local`:

```
DATABASE_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net/vrindav
```

### 4. Seed Products

```bash
npm run seed
```

Seeds **33 products** across MEN, WOMEN, UNISEX, KIDS, ACCESSORIES and **4 coupon codes** (WELCOME10, KRISHNA10, FESTIVE20, SAVE500).

### 5. Create Admin Account

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

### 6. Run Development Server

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
│   ├── lib/              # Utilities, auth, db, stores
│   │   ├── db.ts         # MongoDB connection
│   │   ├── auth.ts       # JWT auth helpers
│   │   ├── razorpay.ts   # Razorpay client
│   │   ├── store.ts      # Auth Zustand store
│   │   ├── cart-store.ts # Cart Zustand store
│   │   └── wishlist-store.ts
│   └── models/           # Mongoose schemas
├── scripts/
│   ├── seed.ts           # Product + coupon seeder
│   └── create-admin.ts   # Interactive admin creator
├── .env.example          # Env var template
└── README.md
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | MongoDB connection URI |
| `NEXTAUTH_SECRET` | ✅ | JWT secret (random 32+ char string) |
| `NEXTAUTH_URL` | ✅ | App base URL (`http://localhost:3000`) |
| `RAZORPAY_KEY_ID` | ⚠️ | Razorpay test key (sandbox if placeholder) |
| `RAZORPAY_KEY_SECRET` | ⚠️ | Razorpay test secret (sandbox if placeholder) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | ⚠️ | Client-side Razorpay key |
| `ADMIN_EMAIL` | ❌ | Set after running `create-admin` |
| `ADMIN_PASSWORD_HASH` | ❌ | Set after running `create-admin` |

---

## License

Proprietary — VRINDAV. All rights reserved.
# radharani

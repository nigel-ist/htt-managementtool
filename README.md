# TIL Platform — Phase 1 Scaffold

Multi-tenant SaaS platform built with Next.js 14, Supabase, and Vercel.

## Quick start

### 1. Prerequisites

- Node.js 18+
- A Supabase project (https://supabase.com)
- A Vercel account
- A GitHub repository

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in every value:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` — from your Supabase project dashboard
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from your Supabase project dashboard
- `SUPABASE_SERVICE_ROLE_KEY` — **server-only, never expose to browser**
- `ANTHROPIC_API_KEY` — **server-only, never expose to browser**
- `RESEND_API_KEY` — transactional email (https://resend.com)
- `RESEND_FROM_EMAIL` — verified sender email, e.g. `noreply@theinnovationlab.io`
- `NEXT_PUBLIC_PLATFORM_DOMAIN` — e.g. `theinnovationlab.io`

### 3. Database setup

In your Supabase project, run the migration:

**Supabase Dashboard → SQL Editor → paste and run:**
```
supabase/migrations/001_platform_schema.sql
```

After running the migration:

**Register the JWT claims Edge Function as an auth hook:**
1. Deploy the function: Supabase Dashboard → Edge Functions → Deploy `custom-claims`
2. Go to: Authentication → Hooks → Add hook
3. Hook: `Before JWT signed` → select `custom-claims`

**Create your first IL Admin user:**
1. Create the user via Supabase Auth (Authentication → Users → Add user)
2. Run in SQL Editor (replace the UUID):
```sql
INSERT INTO il_admins (user_id, il_role) VALUES ('<your-user-uuid>', 'super_admin');
```

**Create the Brinkman tenant:**
```sql
INSERT INTO tenants (name, slug, tier)
VALUES ('Brinkman Management', 'brinkman', 'growth');
```

### 4. Deploy to Vercel

```bash
# Push to GitHub first
git add .
git commit -m "Initial TIL platform scaffold"
git push

# Then connect to Vercel
# Vercel Dashboard → New Project → Import GitHub repo
# Add all environment variables from .env.local
```

Or use the Vercel CLI:
```bash
npm i -g vercel
vercel --prod
```

### 5. Install dependencies and run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Project structure

```
til-platform/
├── app/
│   ├── [tenant]/           # Tenant workspace (dynamic slug)
│   │   ├── layout.tsx      # Loads branding, injects CSS vars, renders shell
│   │   └── dashboard/
│   │       └── page.tsx    # Tenant home dashboard
│   ├── admin/              # IL Admin console (is_il_admin required)
│   │   ├── layout.tsx
│   │   ├── page.tsx        # Redirects to /admin/tenants
│   │   ├── tenants/
│   │   │   ├── page.tsx    # All tenants list
│   │   │   └── [slug]/     # Tenant detail + branding + modules
│   │   └── users/
│   │       └── page.tsx    # All users across tenants
│   ├── auth/
│   │   └── login/
│   │       └── page.tsx    # Email/password + magic link + Google OAuth
│   ├── api/
│   │   ├── auth/
│   │   │   ├── callback/   # OAuth/magic link callback
│   │   │   └── signout/    # Sign out
│   │   └── admin/
│   │       └── tenants/[tenantId]/
│   │           ├── branding/  # PUT branding
│   │           └── modules/   # PUT module toggles
│   ├── layout.tsx
│   ├── page.tsx            # Root: redirects based on auth state
│   └── globals.css         # Design tokens + base styles
├── components/
│   ├── nav/
│   │   ├── sidebar.tsx     # Tenant sidebar nav
│   │   └── topbar.tsx      # Topbar with breadcrumb
│   └── ui/
│       ├── button.tsx
│       ├── input.tsx
│       ├── badge.tsx
│       └── card.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # Browser client
│   │   ├── server.ts       # Server client + service client
│   │   └── middleware.ts   # Middleware client
│   ├── types/
│   │   └── database.ts     # All TypeScript types
│   └── utils/
│       └── tenant.ts       # Slug resolution helpers
├── middleware.ts            # Edge middleware: auth, tenant routing
└── supabase/
    ├── migrations/
    │   └── 001_platform_schema.sql
    └── functions/
        └── custom-claims/
            └── index.ts    # JWT claims Edge Function
```

## Multi-tenancy

Tenants are resolved from the URL:
- **Subdomain:** `brinkman.theinnovationlab.io` → slug `brinkman`
- **Path prefix:** `theinnovationlab.io/brinkman/dashboard` → slug `brinkman`
- **Custom domain:** resolved server-side from `tenant_branding.custom_domain`

Tenant branding (colours, fonts) is stored in `tenant_branding` and injected as CSS custom properties at page load. No rebuilds needed to update a tenant's appearance.

## Authentication

Three methods are supported on the login page:
- **Email + password** — standard Supabase auth
- **Magic link** — passwordless email login
- **Google OAuth** — configure provider in Supabase Dashboard → Auth → Providers

All methods redirect through `/api/auth/callback`, which exchanges the code for a session.

## RBAC

Five roles, enforced by Supabase RLS policies via JWT claims:
- `il_admin` — Innovation Lab staff, cross-tenant access
- `owner` — Tenant owner, full workspace control
- `admin` — Tenant admin, manages members and settings
- `editor` — Can create and edit content
- `viewer` — Read-only access

## Phase roadmap

- **Phase 1 (this):** Scaffold, auth, multi-tenancy, IL admin console
- **Phase 2:** Tenant member management, invitations, products/innovations/staff CRUD
- **Phase 3:** HTT baseline diagnostic, AI Insights, module system
- **Phase 4:** Advanced features (SSO, custom domains, API access)
- **Phase 5:** HTT standalone product + Newbridge lead engine

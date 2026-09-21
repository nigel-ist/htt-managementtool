/**
 * Next.js Middleware — runs at the Vercel edge before every request.
 *
 * Responsibilities:
 * 1. Keep the Supabase session cookie fresh (required by @supabase/ssr)
 * 2. Resolve the active tenant from hostname or URL path
 * 3. Protect /admin routes (IL admins only)
 * 4. Redirect unauthenticated users to /login
 * 5. Inject tenant slug into request headers for use by Server Components
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware'
import { resolveTenantSlug, isCustomDomain } from '@/lib/utils/tenant'

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl

  // ── 1. Refresh Supabase session ──────────────────────────────
  let response = NextResponse.next({ request })
  const supabase = createMiddlewareClient(request, response)
  const { data: { user } } = await supabase.auth.getUser()

  // ── 2. Resolve JWT claims (injected by Edge Function hook) ───
  let claims: {
    tenant_id?: string | null
    role?: string | null
    is_il_admin?: boolean
    il_role?: string | null
  } | null = null

  if (user) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      try {
        const payload = JSON.parse(
          Buffer.from(session.access_token.split('.')[1], 'base64').toString()
        )
        claims = payload
      } catch {
        // Malformed token — treat as unauthenticated
      }
    }
  }

  // ── 3. Protect /admin routes ─────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    if (!claims?.is_il_admin) {
      // Authenticated but not IL admin — redirect to their tenant dashboard
      const tenantSlug = claims?.tenant_id
        ? null // we'd need to look up slug from tenant_id here — simplified for now
        : null
      return NextResponse.redirect(new URL('/', request.url))
    }
    // Pass through for IL admins
    return response
  }

  // ── 4. Resolve tenant slug ───────────────────────────────────
  const tenantSlug = isCustomDomain(hostname)
    ? null // Custom domains are resolved server-side via DB lookup
    : resolveTenantSlug(hostname, pathname)

  // ── 5. Public routes — no auth required ─────────────────────
  const PUBLIC_PATHS = ['/login', '/auth/', '/api/auth/', '/_next/', '/favicon.ico']
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))

  if (isPublic) {
    // Inject tenant slug for public pages that need branding
    if (tenantSlug) {
      response.headers.set('x-tenant-slug', tenantSlug)
    }
    return response
  }

  // ── 6. Require authentication for all other routes ───────────
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  // ── 7. Inject context headers for Server Components ──────────
  if (tenantSlug) {
    response.headers.set('x-tenant-slug', tenantSlug)
  }
  if (claims?.tenant_id) {
    response.headers.set('x-tenant-id', claims.tenant_id)
  }
  if (claims?.role) {
    response.headers.set('x-tenant-role', claims.role)
  }
  if (claims?.is_il_admin) {
    response.headers.set('x-is-il-admin', 'true')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - Static files (_next/static, _next/image, favicon.ico, public/)
     * - API routes handled by their own auth
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

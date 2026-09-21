/**
 * Tenant resolution utilities.
 * Used by middleware and server components to identify the active tenant.
 */

const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ?? 'theinnovationlab.io'

/**
 * Extract tenant slug from the request hostname or pathname.
 *
 * Priority order:
 * 1. Subdomain: brinkman.theinnovationlab.io → 'brinkman'
 * 2. Path prefix: app.theinnovationlab.io/brinkman/... → 'brinkman'
 * 3. Custom domain: brinkman.ca → looked up in DB by custom_domain column
 *
 * Returns null if no tenant can be determined (root domain, /admin, /login, etc.)
 */
export function resolveTenantSlug(hostname: string, pathname: string): string | null {
  // Strip port if present (localhost:3000)
  const host = hostname.split(':')[0]

  // Check for subdomain
  if (host.endsWith(`.${PLATFORM_DOMAIN}`)) {
    const subdomain = host.replace(`.${PLATFORM_DOMAIN}`, '')
    // Exclude the root app subdomain and admin subdomain
    if (subdomain && subdomain !== 'app' && subdomain !== 'admin' && subdomain !== 'www') {
      return subdomain
    }
  }

  // Check for path prefix (app.theinnovationlab.io/[tenant]/...)
  // Exclude reserved paths
  const RESERVED_PATHS = ['admin', 'api', 'login', 'auth', '_next', 'favicon.ico', 'public']
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length > 0 && !RESERVED_PATHS.includes(segments[0])) {
    return segments[0]
  }

  return null
}

/**
 * Is this a custom domain (not the platform domain)?
 */
export function isCustomDomain(hostname: string): boolean {
  const host = hostname.split(':')[0]
  return (
    host !== PLATFORM_DOMAIN &&
    !host.endsWith(`.${PLATFORM_DOMAIN}`) &&
    host !== 'localhost' &&
    !host.startsWith('192.168.') &&
    host !== '127.0.0.1'
  )
}

/**
 * Build tenant-scoped URL for redirects
 */
export function tenantUrl(slug: string, path: string = ''): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `https://app.${PLATFORM_DOMAIN}/${slug}`
    : `http://localhost:3000/${slug}`
  return `${base}${path}`
}

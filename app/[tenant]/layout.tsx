/**
 * Tenant layout — wraps all /[tenant]/* pages.
 *
 * Responsibilities:
 * 1. Verify the tenant slug is valid (404 if not)
 * 2. Check the current user is a member of this tenant (or an IL admin)
 * 3. Load tenant_branding and inject CSS custom property overrides into <head>
 * 4. Render the shell (sidebar + topbar) around children
 *    Uses AppShell (client) for mobile drawer support.
 */
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServerJWTClaims } from '@/lib/supabase/server'
import type { TenantBranding } from '@/lib/types/database'
import { getAccessibleModules } from '@/lib/modules/access'
import AppShell from '@/components/nav/app-shell'
import Sidebar from '@/components/nav/sidebar'
import Topbar from '@/components/nav/topbar'

interface TenantLayoutProps {
  children: React.ReactNode
  params: { tenant: string }
}

async function getTenantBranding(slug: string): Promise<{
  tenantId: string
  tenantName: string
  branding: TenantBranding | null
} | null> {
  const supabase = await createClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, is_active')
    .eq('slug', slug)
    .single()

  if (!tenant || !tenant.is_active) return null

  const { data: branding } = await supabase
    .from('tenant_branding')
    .select('*')
    .eq('tenant_id', tenant.id)
    .single()

  return { tenantId: tenant.id, tenantName: tenant.name, branding }
}

function buildBrandingCss(branding: TenantBranding | null): string {
  if (!branding) return ''

  const vars: string[] = []

  if (branding.primary_color) {
    const hex = branding.primary_color.replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    vars.push(`  --color-primary: ${r} ${g} ${b};`)
  }

  if (branding.secondary_color) {
    const hex = branding.secondary_color.replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    vars.push(`  --color-secondary: ${r} ${g} ${b};`)
  }

  if (branding.accent_color) {
    const hex = branding.accent_color.replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    vars.push(`  --color-accent: ${r} ${g} ${b};`)
  }

  if (branding.font_heading) vars.push(`  --font-heading: '${branding.font_heading}';`)
  if (branding.font_body)    vars.push(`  --font-body: '${branding.font_body}';`)

  if (vars.length === 0) return ''
  return `:root {\n${vars.join('\n')}\n}`
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const { tenant: slug } = params

  const tenantData = await getTenantBranding(slug)
  if (!tenantData) notFound()

  const claims = await getServerJWTClaims()
  if (!claims) redirect(`/login?redirect=/${slug}/dashboard`)

  const isIlAdmin = claims.is_il_admin
  const isMember  = claims.tenant_id === tenantData.tenantId

  if (!isIlAdmin && !isMember) redirect('/')

  const accessibleModules = await getAccessibleModules(
    tenantData.tenantId,
    claims.sub,
    claims.role,
    isIlAdmin
  )

  const brandingCss = buildBrandingCss(tenantData.branding)

  const customFonts: string[] = []
  if (tenantData.branding?.font_heading) customFonts.push(tenantData.branding.font_heading)
  if (tenantData.branding?.font_body)    customFonts.push(tenantData.branding.font_body)

  const sidebar = (
    <Sidebar
      tenantSlug={slug}
      tenantName={tenantData.tenantName}
      userRole={claims.role ?? undefined}
      isIlAdmin={isIlAdmin}
      accessibleModules={Array.from(accessibleModules)}
    />
  )

  return (
    <>
      {brandingCss && (
        <style dangerouslySetInnerHTML={{ __html: brandingCss }} suppressHydrationWarning />
      )}
      {customFonts.length > 0 && (
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?${customFonts.map(f => `family=${encodeURIComponent(f)}:wght@300;400;500;600`).join('&')}&display=swap`}
        />
      )}

      <AppShell
        sidebar={sidebar}
        topbar={(onMenuOpen) => (
          <Topbar
            tenantName={tenantData.tenantName}
            tenantSlug={slug}
            isIlAdmin={isIlAdmin}
            onMenuOpen={onMenuOpen}
          />
        )}
      >
        {children}
      </AppShell>
    </>
  )
}

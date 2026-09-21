/**
 * Root page — redirects based on auth state.
 * Authenticated IL admins → /admin
 * Authenticated tenant members → /[tenant-slug]/dashboard
 * Unauthenticated → /login
 */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServerJWTClaims } from '@/lib/supabase/server'

export default async function RootPage() {
  const claims = await getServerJWTClaims()

  if (!claims) {
    redirect('/login')
  }

  if (claims.is_il_admin) {
    redirect('/admin')
  }

  if (claims.tenant_id) {
    // Look up the tenant slug from the tenant_id
    const supabase = await createClient()
    const { data: tenant } = await supabase
      .from('tenants')
      .select('slug')
      .eq('id', claims.tenant_id)
      .single()

    if (tenant?.slug) {
      redirect(`/${tenant.slug}/dashboard`)
    }
  }

  // Authenticated but no tenant assigned — show a waiting state
  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))]">
      <div className="text-center max-w-md px-6">
        <div className="w-12 h-12 rounded-full bg-[rgb(var(--color-primary)/0.1)] flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[rgb(var(--color-primary))]">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h1 className="font-heading text-2xl text-[rgb(var(--text-1))] mb-2">
          Account pending
        </h1>
        <p className="text-[rgb(var(--text-2))] text-sm leading-relaxed">
          Your account has been created but hasn&apos;t been added to a workspace yet.
          Contact your Innovation Lab administrator to get access.
        </p>
      </div>
    </div>
  )
}

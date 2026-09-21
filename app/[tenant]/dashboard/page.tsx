/**
 * Tenant dashboard — the home screen for a tenant's workspace.
 *
 * Phase 1: Shows a summary card grid (products, innovations, staff skills)
 * with real counts pulled from the DB. Empty states guide users to add data.
 */
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getServerJWTClaims } from '@/lib/supabase/server'

interface DashboardPageProps {
  params: { tenant: string }
}

interface StatCard {
  label: string
  count: number
  description: string
  href: string
  emptyLabel: string
}

async function getDashboardStats(tenantId: string) {
  const supabase = await createClient()

  const [productsRes, innovationsRes, skillsRes] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('innovations').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('staff_skills').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
  ])

  return {
    products: productsRes.count ?? 0,
    innovations: innovationsRes.count ?? 0,
    staffSkills: skillsRes.count ?? 0,
  }
}

async function StatsGrid({ tenantSlug }: { tenantSlug: string }) {
  const claims = await getServerJWTClaims()
  if (!claims?.tenant_id && !claims?.is_il_admin) return null

  // For IL admins viewing a tenant, look up the tenant_id by slug
  const supabase = await createClient()
  let tenantId = claims.tenant_id

  if (!tenantId) {
    const { data } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
    tenantId = data?.id ?? null
  }

  if (!tenantId) return null

  const stats = await getDashboardStats(tenantId)

  const cards: StatCard[] = [
    {
      label: 'Products',
      count: stats.products,
      description: 'Active products in your catalogue',
      href: `/${tenantSlug}/products`,
      emptyLabel: 'Add your first product',
    },
    {
      label: 'Innovations',
      count: stats.innovations,
      description: 'Ideas and initiatives in the pipeline',
      href: `/${tenantSlug}/innovations`,
      emptyLabel: 'Log your first innovation',
    },
    {
      label: 'Staff Skills',
      count: stats.staffSkills,
      description: 'Skill records across your team',
      href: `/${tenantSlug}/staff`,
      emptyLabel: 'Add team skill data',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {cards.map(card => (
        <a
          key={card.label}
          href={card.href}
          className="block bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-5 hover:border-[rgb(var(--color-primary)/0.4)] transition-colors group"
        >
          <div className="text-3xl font-semibold text-[rgb(var(--text-1))] mb-1 tabular-nums">
            {card.count}
          </div>
          <div className="text-sm font-medium text-[rgb(var(--text-1))] mb-0.5 group-hover:text-[rgb(var(--color-primary))] transition-colors">
            {card.label}
          </div>
          <div className="text-xs text-[rgb(var(--text-3))]">
            {card.count === 0 ? card.emptyLabel : card.description}
          </div>
        </a>
      ))}
    </div>
  )
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { tenant: tenantSlug } = params

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="font-heading text-2xl text-[rgb(var(--text-1))] mb-1">Dashboard</h1>
        <p className="text-sm text-[rgb(var(--text-3))]">
          Overview of your workspace
        </p>
      </div>

      <Suspense fallback={
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-5 animate-pulse">
              <div className="h-8 w-12 bg-[rgb(var(--surface-2))] rounded mb-2" />
              <div className="h-4 w-20 bg-[rgb(var(--surface-2))] rounded mb-1" />
              <div className="h-3 w-32 bg-[rgb(var(--surface-2))] rounded" />
            </div>
          ))}
        </div>
      }>
        <StatsGrid tenantSlug={tenantSlug} />
      </Suspense>

      {/* Getting started guide — shown until tenant has data */}
      <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-6">
        <h2 className="font-semibold text-[rgb(var(--text-1))] mb-4">Getting started</h2>
        <ol className="space-y-3">
          {[
            { step: '1', label: 'Add your products', detail: 'Build out your product catalogue so the team can see what you offer.', href: `/${tenantSlug}/products` },
            { step: '2', label: 'Log innovations', detail: 'Capture ideas and initiatives — from early concept through to delivery.', href: `/${tenantSlug}/innovations` },
            { step: '3', label: 'Map staff skills', detail: 'Record the capabilities across your team to identify gaps and strengths.', href: `/${tenantSlug}/staff` },
          ].map(item => (
            <li key={item.step} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[rgb(var(--color-primary)/0.1)] text-[rgb(var(--color-primary))] text-xs font-semibold flex items-center justify-center mt-0.5">
                {item.step}
              </span>
              <div>
                <a
                  href={item.href}
                  className="text-sm font-medium text-[rgb(var(--text-1))] hover:text-[rgb(var(--color-primary))] transition-colors"
                >
                  {item.label}
                </a>
                <p className="text-xs text-[rgb(var(--text-3))] mt-0.5">{item.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export function generateMetadata({ params }: DashboardPageProps) {
  return { title: 'Dashboard' }
}

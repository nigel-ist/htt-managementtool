import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getServerJWTClaims } from '@/lib/supabase/server'
import Link from 'next/link'

interface DashboardPageProps {
  params: { tenant: string }
}

async function getDashboardStats(tenantId: string) {
  const supabase = await createClient()

  const tables = [
    'products', 'innovations', 'staff_skills', 'htt_baselines',
    'current_state_scores', 'future_state', 'roles',
    'ideas', 'market_intel', 'competitors',
    'finance_entries', 'compensation_bands', 'surveys',
    'board_meetings', 'relationships', 'downloads',
  ] as const

  const results = await Promise.all(
    tables.map(t =>
      supabase.from(t).select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId)
    )
  )

  const counts = Object.fromEntries(tables.map((t, i) => [t, results[i].count ?? 0]))

  // Also get finance totals
  const { data: financeRows } = await supabase
    .from('finance_entries')
    .select('category, amount')
    .eq('tenant_id', tenantId)

  let revenue = 0, expenses = 0
  for (const row of financeRows ?? []) {
    if (row.category === 'revenue') revenue += Number(row.amount)
    else if (row.category === 'expense') expenses += Number(row.amount)
  }

  return { counts, revenue, expenses }
}

const MODULE_GROUPS = [
  {
    title: 'Core',
    color: 'border-blue-200 dark:border-blue-800',
    accent: 'text-blue-600 dark:text-blue-400',
    modules: [
      { key: 'products', label: 'Products', route: 'products', icon: '📦', desc: 'Product catalogue' },
      { key: 'innovations', label: 'Innovations', route: 'innovations', icon: '💡', desc: 'Ideas & initiatives' },
      { key: 'staff_skills', label: 'Staff Skills', route: 'staff', icon: '👥', desc: 'Team capabilities' },
      { key: 'htt_baselines', label: 'HTT', route: 'htt', icon: '🧠', desc: 'How to Think assessments' },
    ],
  },
  {
    title: 'Strategy',
    color: 'border-purple-200 dark:border-purple-800',
    accent: 'text-purple-600 dark:text-purple-400',
    modules: [
      { key: 'current_state_scores', label: 'Current State', route: 'current-state', icon: '📊', desc: 'Capability scores' },
      { key: 'future_state', label: 'Future State', route: 'future-state', icon: '🎯', desc: 'Strategic goals' },
      { key: 'roles', label: 'Roles', route: 'roles', icon: '🏷️', desc: 'Role definitions' },
      { key: 'ideas', label: 'Ideas', route: 'ideas', icon: '✨', desc: 'Submitted ideas' },
    ],
  },
  {
    title: 'Market',
    color: 'border-amber-200 dark:border-amber-800',
    accent: 'text-amber-600 dark:text-amber-400',
    modules: [
      { key: 'market_intel', label: 'Market Intel', route: 'market-intel', icon: '📡', desc: 'Intelligence entries' },
      { key: 'competitors', label: 'Competition', route: 'competition', icon: '⚡', desc: 'Tracked competitors' },
      { key: 'surveys', label: 'Surveys', route: 'surveys', icon: '📋', desc: 'Feedback surveys' },
      { key: 'relationships', label: 'Relationships', route: 'relationships', icon: '🤝', desc: 'Network contacts' },
    ],
  },
  {
    title: 'Operations',
    color: 'border-emerald-200 dark:border-emerald-800',
    accent: 'text-emerald-600 dark:text-emerald-400',
    modules: [
      { key: 'finance_entries', label: 'Finance', route: 'finance', icon: '💰', desc: 'Financial entries' },
      { key: 'compensation_bands', label: 'Compensation', route: 'compensation', icon: '💼', desc: 'Salary bands' },
      { key: 'board_meetings', label: 'Board', route: 'board', icon: '🏛️', desc: 'Board meetings' },
      { key: 'downloads', label: 'Downloads', route: 'downloads', icon: '📁', desc: 'Shared files' },
    ],
  },
]

async function DashboardContent({ tenantSlug }: { tenantSlug: string }) {
  const claims = await getServerJWTClaims()
  if (!claims?.tenant_id && !claims?.is_il_admin) return null

  const supabase = await createClient()
  let tenantId = claims.tenant_id

  if (!tenantId) {
    const { data } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single()
    tenantId = data?.id ?? null
  }

  if (!tenantId) return null

  const { counts, revenue, expenses } = await getDashboardStats(tenantId)

  const totalEntries = Object.values(counts).reduce((a, b) => a + b, 0)
  const net = revenue - expenses

  return (
    <div className="space-y-8">
      {/* Top summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
          <p className="text-xs text-[rgb(var(--text-2))] mb-1">Total Records</p>
          <p className="text-2xl font-bold text-[rgb(var(--text-1))] tabular-nums">{totalEntries}</p>
          <p className="text-xs text-[rgb(var(--text-3))]">across all modules</p>
        </div>
        <div className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
          <p className="text-xs text-[rgb(var(--text-2))] mb-1">Revenue</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {revenue > 0 ? `$${(revenue / 1000).toFixed(0)}k` : '—'}
          </p>
          <p className="text-xs text-[rgb(var(--text-3))]">total logged</p>
        </div>
        <div className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
          <p className="text-xs text-[rgb(var(--text-2))] mb-1">Expenses</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">
            {expenses > 0 ? `$${(expenses / 1000).toFixed(0)}k` : '—'}
          </p>
          <p className="text-xs text-[rgb(var(--text-3))]">total logged</p>
        </div>
        <div className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
          <p className="text-xs text-[rgb(var(--text-2))] mb-1">Net</p>
          <p className={`text-2xl font-bold tabular-nums ${net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {revenue > 0 || expenses > 0 ? `${net >= 0 ? '+' : ''}$${(net / 1000).toFixed(0)}k` : '—'}
          </p>
          <p className="text-xs text-[rgb(var(--text-3))]">revenue minus expenses</p>
        </div>
      </div>

      {/* Module groups */}
      {MODULE_GROUPS.map((group) => (
        <div key={group.title}>
          <h2 className={`text-xs font-semibold uppercase tracking-widest mb-3 ${group.accent}`}>{group.title}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {group.modules.map((mod) => {
              const count = counts[mod.key as keyof typeof counts] ?? 0
              return (
                <Link
                  key={mod.key}
                  href={`/${tenantSlug}/${mod.route}`}
                  className={`block p-4 rounded-xl border bg-[rgb(var(--surface))] hover:border-[rgb(var(--accent))] transition-colors ${group.color}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xl">{mod.icon}</span>
                    <span className="text-2xl font-bold text-[rgb(var(--text-1))] tabular-nums">{count}</span>
                  </div>
                  <p className="text-sm font-medium text-[rgb(var(--text-1))]">{mod.label}</p>
                  <p className="text-xs text-[rgb(var(--text-3))]">{mod.desc}</p>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
            <div className="h-3 w-20 bg-[rgb(var(--border))] rounded mb-2" />
            <div className="h-8 w-16 bg-[rgb(var(--border))] rounded mb-1" />
            <div className="h-2 w-24 bg-[rgb(var(--border))] rounded" />
          </div>
        ))}
      </div>
      {[1,2,3,4].map(g => (
        <div key={g}>
          <div className="h-3 w-20 bg-[rgb(var(--border))] rounded mb-3" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
                <div className="h-6 w-6 bg-[rgb(var(--border))] rounded mb-2" />
                <div className="h-4 w-16 bg-[rgb(var(--border))] rounded mb-1" />
                <div className="h-3 w-24 bg-[rgb(var(--border))] rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { tenant: tenantSlug } = await Promise.resolve(params)

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[rgb(var(--text-1))]">Dashboard</h1>
        <p className="text-sm text-[rgb(var(--text-2))] mt-0.5">Overview across all modules</p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent tenantSlug={tenantSlug} />
      </Suspense>
    </div>
  )
}

export function generateMetadata() {
  return { title: 'Dashboard' }
}

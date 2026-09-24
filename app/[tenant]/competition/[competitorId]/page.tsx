import { notFound, redirect } from 'next/navigation'
import { getCompetitor, updateCompetitor, deleteCompetitor } from '../actions'
import { COMPETITOR_TIERS, TIER_META } from '../types'
import Link from 'next/link'

export default async function CompetitorDetailPage({ params }: { params: { tenant: string; competitorId: string } }) {
  const { tenant, competitorId } = await Promise.resolve(params)
  const competitor = await getCompetitor(tenant, competitorId)
  if (!competitor) notFound()

  const tier = TIER_META[competitor.tier]

  async function handleUpdate(formData: FormData) {
    'use server'
    await updateCompetitor(tenant, competitorId, formData)
    redirect(`/${tenant}/competition/${competitorId}`)
  }

  async function handleDelete() {
    'use server'
    await deleteCompetitor(tenant, competitorId)
    redirect(`/${tenant}/competition`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href={`/${tenant}/competition`} className="text-sm text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))]">
          ← Back to Competition
        </Link>
      </div>

      {/* Read view header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-[rgb(var(--text-1))]">{competitor.name}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tier.color}`}>
              {tier.label}
            </span>
            {competitor.website && (
              <a
                href={competitor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[rgb(var(--accent))] hover:underline truncate"
              >
                {competitor.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      {competitor.summary && (
        <div className="mb-5 p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--text-3))] mb-2">Summary</p>
          {competitor.summary.split('\n\n').map((para, i) => (
            <p key={i} className="text-sm text-[rgb(var(--text-1))] leading-relaxed">{para}</p>
          ))}
        </div>
      )}

      {/* Strengths / Weaknesses */}
      {(competitor.strengths.length > 0 || competitor.weaknesses.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          {competitor.strengths.length > 0 && (
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2">Strengths</p>
              <ul className="space-y-1">
                {competitor.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-[rgb(var(--text-1))] flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">+</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {competitor.weaknesses.length > 0 && (
            <div className="p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
              <p className="text-xs font-semibold uppercase tracking-widest text-red-700 dark:text-red-400 mb-2">Weaknesses</p>
              <ul className="space-y-1">
                {competitor.weaknesses.map((w, i) => (
                  <li key={i} className="text-sm text-[rgb(var(--text-1))] flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">−</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {competitor.notes && (
        <div className="mb-5 p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--text-3))] mb-2">Notes</p>
          {competitor.notes.split('\n\n').map((para, i) => (
            <p key={i} className="text-sm text-[rgb(var(--text-1))] leading-relaxed">{para}</p>
          ))}
        </div>
      )}

      {/* Tags */}
      {competitor.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {competitor.tags.map(tag => (
            <span key={tag} className="px-2.5 py-0.5 rounded-full text-xs bg-[rgb(var(--surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-2))]">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Collapsible edit form */}
      <details className="group mb-6">
        <summary className="flex items-center gap-2 cursor-pointer list-none text-sm font-medium text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))] select-none">
          <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Edit competitor
        </summary>
        <form action={handleUpdate} className="space-y-5 mt-4 pt-4 border-t border-[rgb(var(--border))]">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Name *</label>
              <input name="name" required defaultValue={competitor.name} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Tier</label>
              <select name="tier" defaultValue={competitor.tier} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]">
                {COMPETITOR_TIERS.map(t => <option key={t} value={t}>{TIER_META[t].label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Website</label>
            <input name="website" type="url" defaultValue={competitor.website ?? ''} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Summary</label>
            <textarea name="summary" rows={3} defaultValue={competitor.summary ?? ''} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">Strengths (one per line)</label>
              <textarea name="strengths" rows={4} defaultValue={competitor.strengths.join('\n')} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-red-600 dark:text-red-400 mb-1">Weaknesses (one per line)</label>
              <textarea name="weaknesses" rows={4} defaultValue={competitor.weaknesses.join('\n')} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Notes</label>
            <textarea name="notes" rows={3} defaultValue={competitor.notes ?? ''} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Tags (one per line)</label>
            <textarea name="tags" rows={2} defaultValue={competitor.tags.join('\n')} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="px-5 py-2 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium hover:opacity-90 transition-opacity">
              Save Changes
            </button>
          </div>
        </form>
      </details>

      {/* Danger zone */}
      <div className="mt-4 pt-6 border-t border-[rgb(var(--border))]">
        <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
        <form action={handleDelete}>
          <button type="submit" className="px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            Delete Competitor
          </button>
        </form>
      </div>
    </div>
  )
}

import { getCompetitors } from './actions'
import { TIER_META } from './types'
import Link from 'next/link'

export default async function CompetitionPage({ params }: { params: { tenant: string } }) {
  const { tenant } = await Promise.resolve(params)
  const competitors = await getCompetitors(tenant)

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--text-1))]">Competition</h1>
          <p className="text-sm text-[rgb(var(--text-2))] mt-0.5">Track competitors and market positioning</p>
        </div>
        <Link
          href={`/${tenant}/competition/new`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + Add Competitor
        </Link>
      </div>

      {competitors.length === 0 ? (
        <div className="text-center py-20 text-[rgb(var(--text-2))]">
          <p className="text-lg mb-2">No competitors tracked yet</p>
          <p className="text-sm">Add your first competitor to start mapping the landscape.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {competitors.map((c) => {
            const tier = TIER_META[c.tier]
            return (
              <Link
                key={c.id}
                href={`/${tenant}/competition/${c.id}`}
                className="block p-5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] hover:border-[rgb(var(--accent))] transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h2 className="font-semibold text-[rgb(var(--text-1))] text-lg leading-tight">{c.name}</h2>
                  <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${tier.color}`}>
                    {tier.label}
                  </span>
                </div>
                {c.website && (
                  <p className="text-xs text-[rgb(var(--text-2))] mb-2 truncate">{c.website}</p>
                )}
                {c.summary && (
                  <p className="text-sm text-[rgb(var(--text-2))] line-clamp-2 mb-3">{c.summary}</p>
                )}
                {(c.strengths.length > 0 || c.weaknesses.length > 0) && (
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[rgb(var(--border))]">
                    <div>
                      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">Strengths</p>
                      <ul className="space-y-0.5">
                        {c.strengths.slice(0, 2).map((s, i) => (
                          <li key={i} className="text-xs text-[rgb(var(--text-2))] truncate">• {s}</li>
                        ))}
                        {c.strengths.length > 2 && <li className="text-xs text-[rgb(var(--text-3))]">+{c.strengths.length - 2} more</li>}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Weaknesses</p>
                      <ul className="space-y-0.5">
                        {c.weaknesses.slice(0, 2).map((w, i) => (
                          <li key={i} className="text-xs text-[rgb(var(--text-2))] truncate">• {w}</li>
                        ))}
                        {c.weaknesses.length > 2 && <li className="text-xs text-[rgb(var(--text-3))]">+{c.weaknesses.length - 2} more</li>}
                      </ul>
                    </div>
                  </div>
                )}
                {c.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {c.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-[rgb(var(--bg))] text-[rgb(var(--text-2))] border border-[rgb(var(--border))]">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

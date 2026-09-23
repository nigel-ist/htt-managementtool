import { getRelationships } from './actions'
import { CATEGORY_META } from './types'
import Link from 'next/link'

export default async function RelationshipsPage({ params }: { params: { tenant: string } }) {
  const { tenant } = await Promise.resolve(params)
  const relationships = await getRelationships(tenant)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--text-1))]">Relationship Network</h1>
          <p className="text-sm text-[rgb(var(--text-2))] mt-0.5">Partners, investors, customers and key contacts</p>
        </div>
        <Link href={`/${tenant}/relationships/new`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium hover:opacity-90 transition-opacity">
          + Add Contact
        </Link>
      </div>

      {relationships.length === 0 ? (
        <div className="text-center py-20 text-[rgb(var(--text-2))]">
          <p className="text-lg mb-2">No contacts yet</p>
          <p className="text-sm">Build your relationship network by adding contacts.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {relationships.map((r) => {
            const meta = CATEGORY_META[r.category]
            return (
              <Link
                key={r.id}
                href={`/${tenant}/relationships/${r.id}`}
                className="block p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] hover:border-[rgb(var(--accent))] transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h2 className="font-semibold text-[rgb(var(--text-1))]">{r.name}</h2>
                    {r.organisation && <p className="text-xs text-[rgb(var(--text-2))]">{r.organisation}</p>}
                  </div>
                  <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>{meta.label}</span>
                </div>
                {r.contact_email && (
                  <p className="text-xs text-[rgb(var(--text-2))] truncate">{r.contact_email}</p>
                )}
                {r.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {r.tags.slice(0, 3).map(t => (
                      <span key={t} className="px-2 py-0.5 rounded-full text-xs bg-[rgb(var(--bg))] text-[rgb(var(--text-2))] border border-[rgb(var(--border))]">{t}</span>
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

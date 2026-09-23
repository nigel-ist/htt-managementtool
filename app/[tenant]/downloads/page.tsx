import { getDownloads } from './actions'
import { CATEGORY_META } from './types'
import Link from 'next/link'

export default async function DownloadsPage({ params }: { params: { tenant: string } }) {
  const { tenant } = await Promise.resolve(params)
  const downloads = await getDownloads(tenant)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--text-1))]">Downloads</h1>
          <p className="text-sm text-[rgb(var(--text-2))] mt-0.5">Shared files and resources</p>
        </div>
        <Link href={`/${tenant}/downloads/new`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium hover:opacity-90 transition-opacity">
          + Add File
        </Link>
      </div>

      {downloads.length === 0 ? (
        <div className="text-center py-20 text-[rgb(var(--text-2))]">
          <p className="text-lg mb-2">No files yet</p>
          <p className="text-sm">Add shared files and resources for your team.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {downloads.map((d) => {
            const meta = CATEGORY_META[d.category]
            return (
              <div key={d.id} className="flex items-center gap-4 p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>{meta.label}</span>
                    <h2 className="font-semibold text-[rgb(var(--text-1))] truncate">{d.title}</h2>
                  </div>
                  {d.description && <p className="text-sm text-[rgb(var(--text-2))] truncate">{d.description}</p>}
                  {d.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {d.tags.slice(0, 3).map(t => (
                        <span key={t} className="px-2 py-0.5 rounded-full text-xs bg-[rgb(var(--bg))] text-[rgb(var(--text-2))] border border-[rgb(var(--border))]">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={d.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[rgb(var(--accent))] text-white text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    Download
                  </a>
                  <Link href={`/${tenant}/downloads/${d.id}`} className="px-3 py-1.5 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-2))] text-xs hover:bg-[rgb(var(--bg))] transition-colors">
                    Edit
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

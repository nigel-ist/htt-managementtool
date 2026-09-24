import { notFound, redirect } from 'next/navigation'
import { getDownload, updateDownload, deleteDownload } from '../actions'
import { DOWNLOAD_CATEGORIES, CATEGORY_META } from '../types'
import Link from 'next/link'

export default async function DownloadDetailPage({ params }: { params: { tenant: string; downloadId: string } }) {
  const { tenant, downloadId } = await Promise.resolve(params)
  const dl = await getDownload(tenant, downloadId)
  if (!dl) notFound()

  const category = CATEGORY_META[dl.category]

  async function handleUpdate(formData: FormData) {
    'use server'
    await updateDownload(tenant, downloadId, formData)
    redirect(`/${tenant}/downloads/${downloadId}`)
  }
  async function handleDelete() {
    'use server'
    await deleteDownload(tenant, downloadId)
    redirect(`/${tenant}/downloads`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href={`/${tenant}/downloads`} className="text-sm text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))]">
          ← Back to Downloads
        </Link>
      </div>

      {/* Read view header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[rgb(var(--text-1))]">{dl.title}</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${category.color}`}>
            {category.label}
          </span>
          <span className="text-xs text-[rgb(var(--text-3))]">{dl.file_name}</span>
        </div>
      </div>

      {/* Download button */}
      <div className="mb-5">
        <a
          href={dl.file_url}
          target="_blank"
          rel="noopener noreferrer"
          download={dl.file_name}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download file
        </a>
      </div>

      {/* Description */}
      {dl.description && (
        <div className="mb-5 p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--text-3))] mb-2">Description</p>
          {dl.description.split('\n\n').map((para, i) => (
            <p key={i} className="text-sm text-[rgb(var(--text-1))] leading-relaxed">{para}</p>
          ))}
        </div>
      )}

      {/* Tags */}
      {dl.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {dl.tags.map(tag => (
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
          Edit download
        </summary>
        <form action={handleUpdate} className="space-y-5 mt-4 pt-4 border-t border-[rgb(var(--border))]">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Title *</label>
            <input name="title" required defaultValue={dl.title} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Category</label>
            <select name="category" defaultValue={dl.category} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]">
              {DOWNLOAD_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_META[c].label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Description</label>
            <textarea name="description" rows={3} defaultValue={dl.description ?? ''} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">File URL *</label>
            <input name="file_url" type="url" required defaultValue={dl.file_url} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">File Name *</label>
            <input name="file_name" required defaultValue={dl.file_name} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Tags (one per line)</label>
            <textarea name="tags" rows={2} defaultValue={dl.tags.join('\n')} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
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
            Delete Download
          </button>
        </form>
      </div>
    </div>
  )
}

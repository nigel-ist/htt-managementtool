import { notFound, redirect } from 'next/navigation'
import { getDownload, updateDownload, deleteDownload } from '../actions'
import { DOWNLOAD_CATEGORIES, CATEGORY_META } from '../types'
import Link from 'next/link'

export default async function DownloadDetailPage({ params }: { params: { tenant: string; downloadId: string } }) {
  const { tenant, downloadId } = await Promise.resolve(params)
  const dl = await getDownload(tenant, downloadId)
  if (!dl) notFound()

  async function handleUpdate(formData: FormData) {
    'use server'
    await updateDownload(tenant, downloadId, formData)
    redirect(`/${tenant}/downloads`)
  }
  async function handleDelete() {
    'use server'
    await deleteDownload(tenant, downloadId)
    redirect(`/${tenant}/downloads`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/${tenant}/downloads`} className="text-sm text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))]">← Back to Downloads</Link>
        <h1 className="text-2xl font-semibold text-[rgb(var(--text-1))] mt-2">Edit Download</h1>
      </div>
      <form action={handleUpdate} className="space-y-5">
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
          <button type="submit" className="px-5 py-2 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium hover:opacity-90 transition-opacity">Save Changes</button>
          <Link href={`/${tenant}/downloads`} className="px-5 py-2 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-1))] text-sm font-medium hover:bg-[rgb(var(--bg))] transition-colors">Cancel</Link>
        </div>
      </form>
      <div className="mt-10 pt-6 border-t border-[rgb(var(--border))]">
        <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
        <form action={handleDelete}>
          <button type="submit" className="px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Delete Download</button>
        </form>
      </div>
    </div>
  )
}

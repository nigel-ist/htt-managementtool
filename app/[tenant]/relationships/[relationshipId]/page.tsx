import { notFound, redirect } from 'next/navigation'
import { getRelationship, updateRelationship, deleteRelationship } from '../actions'
import { RELATIONSHIP_CATEGORIES, CATEGORY_META } from '../types'
import Link from 'next/link'

export default async function RelationshipDetailPage({ params }: { params: { tenant: string; relationshipId: string } }) {
  const { tenant, relationshipId } = await Promise.resolve(params)
  const rel = await getRelationship(tenant, relationshipId)
  if (!rel) notFound()

  const category = CATEGORY_META[rel.category]

  async function handleUpdate(formData: FormData) {
    'use server'
    await updateRelationship(tenant, relationshipId, formData)
    redirect(`/${tenant}/relationships/${relationshipId}`)
  }
  async function handleDelete() {
    'use server'
    await deleteRelationship(tenant, relationshipId)
    redirect(`/${tenant}/relationships`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href={`/${tenant}/relationships`} className="text-sm text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))]">
          ← Back to Relationships
        </Link>
      </div>

      {/* Read view header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[rgb(var(--text-1))]">{rel.name}</h1>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {rel.organisation && (
            <span className="text-sm text-[rgb(var(--text-2))]">{rel.organisation}</span>
          )}
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${category.color}`}>
            {category.label}
          </span>
        </div>
      </div>

      {/* Contact info */}
      {(rel.contact_email || rel.contact_phone) && (
        <div className="mb-5 p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--text-3))] mb-3">Contact</p>
          <div className="space-y-2">
            {rel.contact_email && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[rgb(var(--text-3))] w-12">Email</span>
                <a href={`mailto:${rel.contact_email}`} className="text-sm text-[rgb(var(--accent))] hover:underline">
                  {rel.contact_email}
                </a>
              </div>
            )}
            {rel.contact_phone && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[rgb(var(--text-3))] w-12">Phone</span>
                <a href={`tel:${rel.contact_phone}`} className="text-sm text-[rgb(var(--text-1))] hover:underline">
                  {rel.contact_phone}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {rel.notes && (
        <div className="mb-5 p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--text-3))] mb-2">Notes</p>
          {rel.notes.split('\n\n').map((para, i) => (
            <p key={i} className="text-sm text-[rgb(var(--text-1))] leading-relaxed">{para}</p>
          ))}
        </div>
      )}

      {/* Tags */}
      {rel.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {rel.tags.map(tag => (
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
          Edit contact
        </summary>
        <form action={handleUpdate} className="space-y-5 mt-4 pt-4 border-t border-[rgb(var(--border))]">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Name *</label>
              <input name="name" required defaultValue={rel.name} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Organisation</label>
              <input name="organisation" defaultValue={rel.organisation ?? ''} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Category</label>
            <select name="category" defaultValue={rel.category} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]">
              {RELATIONSHIP_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_META[c].label}</option>)}
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Email</label>
              <input name="contact_email" type="email" defaultValue={rel.contact_email ?? ''} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Phone</label>
              <input name="contact_phone" type="tel" defaultValue={rel.contact_phone ?? ''} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Notes</label>
            <textarea name="notes" rows={3} defaultValue={rel.notes ?? ''} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Tags (one per line)</label>
            <textarea name="tags" rows={2} defaultValue={rel.tags.join('\n')} className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none" />
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
            Delete Contact
          </button>
        </form>
      </div>
    </div>
  )
}

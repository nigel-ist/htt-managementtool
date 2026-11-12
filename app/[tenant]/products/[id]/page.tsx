import { notFound } from 'next/navigation'
import { getProduct, updateProduct, deleteProduct } from '../actions'
import { PRODUCT_TYPES, TYPE_META, BUSINESSES, CATEGORY_TAGS, SCORE_FIELDS } from '../types'
import Link from 'next/link'
import ProductAIPanel from '../product-ai-panel'
import PricingEditor from '../pricing-editor'

export default async function ProductDetailPage({ params }: { params: { tenant: string; id: string } }) {
  const { tenant, id } = await Promise.resolve(params)
  const product = await getProduct(tenant, id)
  if (!product) notFound()

  const d = product.data ?? {}
  const scores = d.scores ?? {}

  async function handleUpdate(formData: FormData) {
    'use server'
    await updateProduct(tenant, id, formData)
  }

  async function handleDelete() {
    'use server'
    await deleteProduct(tenant, id)
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]'
  const labelCls = 'block text-sm font-medium text-[rgb(var(--text-1))] mb-1'
  const sectionCls = 'pt-6 mt-6 border-t border-[rgb(var(--border))]'

  return (
    <div className="max-w-3xl mx-auto pb-16">
      <div className="mb-6">
        <Link href={`/${tenant}/products`} className="text-sm text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))]">
          ← Back to Products
        </Link>
        <h1 className="text-2xl font-semibold text-[rgb(var(--text-1))] mt-2">{product.name}</h1>
      </div>

      <form action={handleUpdate} className="space-y-5">
        {/* Core */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Name *</label>
            <input name="name" required defaultValue={product.name} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Stage</label>
            <select name="type" defaultValue={product.type} className={inputCls}>
              {PRODUCT_TYPES.map((t) => (
                <option key={t} value={t}>{TYPE_META[t].label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea name="description" rows={3} defaultValue={product.description ?? ''} className={`${inputCls} resize-none`} />
        </div>

        {/* Business Units */}
        <div className={sectionCls}>
          <p className={labelCls}>Brinkman Business Units</p>
          <div className="flex flex-wrap gap-3 mt-2">
            {BUSINESSES.map((b) => (
              <label key={b.code} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="business_units"
                  value={b.code}
                  defaultChecked={(d.business_units ?? []).includes(b.code)}
                  className="w-4 h-4 rounded accent-[rgb(var(--accent))]"
                />
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${b.color}`}>{b.code}</span>
                <span className="text-xs text-[rgb(var(--text-2))]">{b.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Category Tags */}
        <div className={sectionCls}>
          <p className={labelCls}>Category Tags</p>
          <div className="flex flex-wrap gap-3 mt-2">
            {CATEGORY_TAGS.map((c) => (
              <label key={c.code} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="category_tags"
                  value={c.code}
                  defaultChecked={(d.category_tags ?? []).includes(c.code)}
                  className="w-4 h-4 rounded accent-[rgb(var(--accent))]"
                />
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.color}`}>{c.code}</span>
                <span className="text-xs text-[rgb(var(--text-2))]">{c.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className={sectionCls}>
          <label className={labelCls}>Key Features</label>
          <p className="text-xs text-[rgb(var(--text-3))] mb-1">One per line</p>
          <textarea name="features" rows={4} defaultValue={(d.features ?? []).join('\n')} className={`${inputCls} resize-none`} placeholder="Feature one&#10;Feature two&#10;Feature three" />
        </div>

        {/* Deliverables */}
        <div>
          <label className={labelCls}>Deliverables / Outcomes</label>
          <p className="text-xs text-[rgb(var(--text-3))] mb-1">One per line</p>
          <textarea name="deliverables" rows={4} defaultValue={(d.deliverables ?? []).join('\n')} className={`${inputCls} resize-none`} placeholder="Deliverable one&#10;Deliverable two" />
        </div>

        {/* Differentiators */}
        <div>
          <label className={labelCls}>Market Differentiators</label>
          <p className="text-xs text-[rgb(var(--text-3))] mb-1">One per line</p>
          <textarea name="differentiators" rows={3} defaultValue={(d.differentiators ?? []).join('\n')} className={`${inputCls} resize-none`} placeholder="What sets this apart from competitors?" />
        </div>

        {/* Pricing */}
        <div className={sectionCls}>
          <label className={labelCls}>Pricing</label>
          <PricingEditor initial={d.pricing ?? []} />
          <div className="mt-3">
            <label className="text-xs text-[rgb(var(--text-2))] mb-1 block">Pricing Notes</label>
            <textarea name="pricing_notes" rows={2} defaultValue={d.pricing_notes ?? ''} className={`${inputCls} resize-none`} placeholder="e.g. Volume discounts available, project-based pricing" />
          </div>
        </div>

        {/* Scores */}
        <div className={sectionCls}>
          <h3 className="text-sm font-semibold text-[rgb(var(--text-1))] mb-1">Brinkman Scores</h3>
          <p className="text-xs text-[rgb(var(--text-3))] mb-4">0–100 scale. Brinkman Fit is the primary health indicator.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {SCORE_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-[rgb(var(--text-2))] mb-1">{label}</label>
                <input
                  type="number"
                  name={`score_${key}`}
                  min={0} max={100}
                  defaultValue={scores[key] ?? ''}
                  placeholder="—"
                  className={inputCls}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <div className="flex gap-3 pt-4 sticky bottom-0 bg-[rgb(var(--bg))] py-4 border-t border-[rgb(var(--border))] -mx-4 px-4">
          <button type="submit" className="px-5 py-2 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium hover:opacity-90 transition-opacity">
            Save Changes
          </button>
          <Link href={`/${tenant}/products`} className="px-5 py-2 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-1))] text-sm font-medium hover:bg-[rgb(var(--bg))] transition-colors">
            Cancel
          </Link>
        </div>
      </form>

      {/* Per-product AI panel */}
      <ProductAIPanel tenantSlug={tenant} product={product} />

      {/* Danger Zone */}
      <div className="mt-10 pt-6 border-t border-[rgb(var(--border))]">
        <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
        <form action={handleDelete}>
          <button type="submit" className="px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            Delete Product
          </button>
        </form>
      </div>
    </div>
  )
}

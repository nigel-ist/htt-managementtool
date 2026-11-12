import { createProduct } from '../actions'
import { PRODUCT_TYPES, TYPE_META, BUSINESSES, CATEGORY_TAGS } from '../types'
import Link from 'next/link'
import PricingEditor from '../pricing-editor'

export default async function NewProductPage({ params }: { params: { tenant: string } }) {
  const { tenant } = await Promise.resolve(params)

  async function handleCreate(formData: FormData) {
    'use server'
    await createProduct(tenant, formData)
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
        <h1 className="text-2xl font-semibold text-[rgb(var(--text-1))] mt-2">Add Product</h1>
      </div>

      <form action={handleCreate} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Name *</label>
            <input name="name" required placeholder="Product name" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Stage</label>
            <select name="type" defaultValue="current" className={inputCls}>
              {PRODUCT_TYPES.map((t) => (
                <option key={t} value={t}>{TYPE_META[t].label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea name="description" rows={3} placeholder="What does this product do? Who is it for?" className={`${inputCls} resize-none`} />
        </div>

        {/* Business Units */}
        <div className={sectionCls}>
          <p className={labelCls}>Brinkman Business Units</p>
          <div className="flex flex-wrap gap-3 mt-2">
            {BUSINESSES.map((b) => (
              <label key={b.code} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="business_units" value={b.code} className="w-4 h-4 rounded accent-[rgb(var(--accent))]" />
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
                <input type="checkbox" name="category_tags" value={c.code} className="w-4 h-4 rounded accent-[rgb(var(--accent))]" />
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
          <textarea name="features" rows={4} className={`${inputCls} resize-none`} placeholder="Feature one&#10;Feature two&#10;Feature three" />
        </div>

        <div>
          <label className={labelCls}>Deliverables / Outcomes</label>
          <p className="text-xs text-[rgb(var(--text-3))] mb-1">One per line</p>
          <textarea name="deliverables" rows={3} className={`${inputCls} resize-none`} placeholder="Deliverable one&#10;Deliverable two" />
        </div>

        <div>
          <label className={labelCls}>Market Differentiators</label>
          <p className="text-xs text-[rgb(var(--text-3))] mb-1">One per line</p>
          <textarea name="differentiators" rows={3} className={`${inputCls} resize-none`} placeholder="What sets this apart from competitors?" />
        </div>

        {/* Pricing */}
        <div className={sectionCls}>
          <label className={labelCls}>Pricing</label>
          <PricingEditor initial={[]} />
          <div className="mt-3">
            <label className="text-xs text-[rgb(var(--text-2))] mb-1 block">Pricing Notes</label>
            <textarea name="pricing_notes" rows={2} className={`${inputCls} resize-none`} placeholder="e.g. Volume discounts available, project-based pricing" />
          </div>
        </div>

        <div className="flex gap-3 pt-4 sticky bottom-0 bg-[rgb(var(--bg))] py-4 border-t border-[rgb(var(--border))] -mx-4 px-4">
          <button type="submit" className="px-5 py-2 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium hover:opacity-90 transition-opacity">
            Add Product
          </button>
          <Link href={`/${tenant}/products`} className="px-5 py-2 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-1))] text-sm font-medium hover:bg-[rgb(var(--bg))] transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

import { createProduct } from '../actions'
import { PRODUCT_TYPES, TYPE_META } from '../types'
import Link from 'next/link'

export default async function NewProductPage({ params }: { params: { tenant: string } }) {
  const { tenant } = await Promise.resolve(params)

  async function handleCreate(formData: FormData) {
    'use server'
    await createProduct(tenant, formData)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/${tenant}/products`} className="text-sm text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))]">
          ← Back to Products
        </Link>
        <h1 className="text-2xl font-semibold text-[rgb(var(--text-1))] mt-2">Add Product</h1>
      </div>

      <form action={handleCreate} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Name *</label>
            <input
              name="name"
              required
              placeholder="Product name"
              className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Stage</label>
            <select
              name="type"
              defaultValue="current"
              className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]"
            >
              {PRODUCT_TYPES.map((t) => (
                <option key={t} value={t}>{TYPE_META[t].label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-1))] mb-1">Description</label>
          <textarea
            name="description"
            rows={4}
            placeholder="What does this product do? Who is it for?"
            className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Add Product
          </button>
          <Link
            href={`/${tenant}/products`}
            className="px-5 py-2 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-1))] text-sm font-medium hover:bg-[rgb(var(--bg))] transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

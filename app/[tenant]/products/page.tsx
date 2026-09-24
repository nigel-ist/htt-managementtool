import { getProducts } from './actions'
import { PRODUCT_TYPES, TYPE_META } from './types'
import Link from 'next/link'

export default async function ProductsPage({ params }: { params: { tenant: string } }) {
  const { tenant } = await Promise.resolve(params)
  const products = await getProducts(tenant)

  const grouped = PRODUCT_TYPES.reduce<Record<string, typeof products>>((acc, type) => {
    acc[type] = products.filter((p) => p.type === type)
    return acc
  }, {} as Record<string, typeof products>)

  const hasAny = products.length > 0

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--text-1))]">Products</h1>
          <p className="text-sm text-[rgb(var(--text-2))] mt-0.5">Manage your product portfolio across lifecycle stages</p>
        </div>
        <Link
          href={`/${tenant}/products/new`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + Add Product
        </Link>
      </div>

      {!hasAny ? (
        <div className="text-center py-20 text-[rgb(var(--text-2))]">
          <p className="text-lg mb-2">No products yet</p>
          <p className="text-sm">Add your first product to start building your portfolio.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {PRODUCT_TYPES.map((type) => {
            const items = grouped[type]
            if (items.length === 0) return null
            const meta = TYPE_META[type]
            return (
              <section key={type}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-sm font-semibold text-[rgb(var(--text-1))] uppercase tracking-wide">{meta.label}</h2>
                  <span className="text-xs text-[rgb(var(--text-3))]">{items.length}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((p) => (
                    <Link
                      key={p.id}
                      href={`/${tenant}/products/${p.id}`}
                      className="block p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] hover:border-[rgb(var(--accent))] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-medium text-[rgb(var(--text-1))] leading-tight">{p.name}</h3>
                        <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
                          {meta.label}
                        </span>
                      </div>
                      {p.description && (
                        <p className="text-sm text-[rgb(var(--text-2))] line-clamp-2">{p.description}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

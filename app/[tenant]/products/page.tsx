import { getProducts } from './actions'
import { PRODUCT_TYPES, TYPE_META, BUSINESSES, CATEGORY_TAGS } from './types'
import Link from 'next/link'
import ProductsClient from './products-client'
import ProductAnalysisPanel from './analysis-panel'

export default async function ProductsPage({ params, searchParams }: {
  params: { tenant: string }
  searchParams: { tab?: string }
}) {
  const { tenant } = await Promise.resolve(params)
  const { tab = 'matrix' } = await Promise.resolve(searchParams)
  const products = await getProducts(tenant)

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--text-1))]">Products</h1>
          <p className="text-sm text-[rgb(var(--text-2))] mt-0.5">
            {products.length} product{products.length !== 1 ? 's' : ''} across {PRODUCT_TYPES.filter((t) => products.some((p) => p.type === t)).length} stages
          </p>
        </div>
        <Link
          href={`/${tenant}/products/new`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + Add Product
        </Link>
      </div>

      {/* Client-side tabbed content */}
      <ProductsClient
        products={products}
        tenantSlug={tenant}
        initialTab={tab}
      />

      <ProductAnalysisPanel tenantSlug={tenant} products={products} />
    </div>
  )
}

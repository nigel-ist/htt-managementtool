import { getCompensationBands } from './actions'
import { EMPLOYMENT_META } from './types'
import Link from 'next/link'

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

export default async function CompensationPage({ params }: { params: { tenant: string } }) {
  const { tenant } = await Promise.resolve(params)
  const bands = await getCompensationBands(tenant)

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--text-1))]">Compensation</h1>
          <p className="text-sm text-[rgb(var(--text-2))] mt-0.5">Salary bands and compensation framework</p>
        </div>
        <Link href={`/${tenant}/compensation/new`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium hover:opacity-90 transition-opacity">
          + Add Band
        </Link>
      </div>

      {bands.length === 0 ? (
        <div className="text-center py-20 text-[rgb(var(--text-2))]">
          <p className="text-lg mb-2">No compensation bands yet</p>
          <p className="text-sm">Add your first band to build a compensation framework.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[rgb(var(--border))] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[rgb(var(--surface))] border-b border-[rgb(var(--border))]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-[rgb(var(--text-2))]">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-[rgb(var(--text-2))] hidden sm:table-cell">Level</th>
                  <th className="text-left px-4 py-3 font-medium text-[rgb(var(--text-2))] hidden md:table-cell">Dept</th>
                  <th className="text-left px-4 py-3 font-medium text-[rgb(var(--text-2))] hidden sm:table-cell">Type</th>
                  <th className="text-right px-4 py-3 font-medium text-[rgb(var(--text-2))]">Band</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--border))]">
                {bands.map((b) => (
                  <tr key={b.id} className="hover:bg-[rgb(var(--surface))] transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/${tenant}/compensation/${b.id}`} className="font-medium text-[rgb(var(--text-1))] hover:text-[rgb(var(--accent))]">
                        {b.role_title}
                      </Link>
                      {b.location && <p className="text-xs text-[rgb(var(--text-3))]">{b.location}</p>}
                    </td>
                    <td className="px-4 py-3 text-[rgb(var(--text-2))] hidden sm:table-cell">{b.level ?? '—'}</td>
                    <td className="px-4 py-3 text-[rgb(var(--text-2))] hidden md:table-cell">{b.department ?? '—'}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-[rgb(var(--bg))] text-[rgb(var(--text-2))] border border-[rgb(var(--border))]">
                        {EMPLOYMENT_META[b.employment_type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[rgb(var(--text-1))]">
                      {fmt(b.min_salary, b.currency)} – {fmt(b.max_salary, b.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

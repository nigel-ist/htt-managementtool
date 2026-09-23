import { getFinanceEntries } from './actions'
import { CATEGORY_META, PERIOD_META } from './types'
import Link from 'next/link'

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount)
}

export default async function FinancePage({ params }: { params: { tenant: string } }) {
  const { tenant } = await Promise.resolve(params)
  const entries = await getFinanceEntries(tenant)

  const totals = entries.reduce((acc, e) => {
    const sign = e.category === 'expense' ? -1 : 1
    acc[e.category] = (acc[e.category] ?? 0) + e.amount * sign
    return acc
  }, {} as Record<string, number>)

  const netRevenue = (totals.revenue ?? 0) - (totals.expense ?? 0)

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--text-1))]">Finance</h1>
          <p className="text-sm text-[rgb(var(--text-2))] mt-0.5">Track revenue, expenses and financial entries</p>
        </div>
        <Link href={`/${tenant}/finance/new`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium hover:opacity-90 transition-opacity">
          + Add Entry
        </Link>
      </div>

      {entries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
            <p className="text-xs text-[rgb(var(--text-2))] mb-1">Revenue</p>
            <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(totals.revenue ?? 0, 'USD')}</p>
          </div>
          <div className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
            <p className="text-xs text-[rgb(var(--text-2))] mb-1">Expenses</p>
            <p className="text-xl font-semibold text-red-600 dark:text-red-400">{formatCurrency(totals.expense ?? 0, 'USD')}</p>
          </div>
          <div className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
            <p className="text-xs text-[rgb(var(--text-2))] mb-1">Net</p>
            <p className={`text-xl font-semibold ${netRevenue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(netRevenue, 'USD')}</p>
          </div>
          <div className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
            <p className="text-xs text-[rgb(var(--text-2))] mb-1">Entries</p>
            <p className="text-xl font-semibold text-[rgb(var(--text-1))]">{entries.length}</p>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="text-center py-20 text-[rgb(var(--text-2))]">
          <p className="text-lg mb-2">No financial entries yet</p>
          <p className="text-sm">Add your first entry to start tracking finances.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[rgb(var(--border))] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[rgb(var(--surface))] border-b border-[rgb(var(--border))]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-[rgb(var(--text-2))]">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-[rgb(var(--text-2))] hidden sm:table-cell">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-[rgb(var(--text-2))] hidden md:table-cell">Period</th>
                  <th className="text-right px-4 py-3 font-medium text-[rgb(var(--text-2))]">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-[rgb(var(--text-2))] hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--border))]">
                {entries.map((e) => {
                  const cat = CATEGORY_META[e.category]
                  return (
                    <tr key={e.id} className="hover:bg-[rgb(var(--surface))] transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/${tenant}/finance/${e.id}`} className="font-medium text-[rgb(var(--text-1))] hover:text-[rgb(var(--accent))]">
                          {e.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cat.color}`}>{cat.label}</span>
                      </td>
                      <td className="px-4 py-3 text-[rgb(var(--text-2))] hidden md:table-cell">{PERIOD_META[e.period]}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-[rgb(var(--text-1))]">
                        {formatCurrency(e.amount, e.currency)}
                      </td>
                      <td className="px-4 py-3 text-[rgb(var(--text-2))] hidden md:table-cell">{new Date(e.entry_date).toLocaleDateString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

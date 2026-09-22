'use client'

/**
 * Settings > Module Access client.
 * Shows each enabled module with a "Minimum role" selector.
 * Saving upserts the tenant_module_roles rows.
 */
import { useState, useTransition } from 'react'
import { MODULE_META, ROLE_ORDER, ROLE_LABELS } from '@/lib/modules/constants'
import { saveModuleRoleSettings } from './actions'

interface Props {
  tenantSlug: string
  enabledModules: string[]
  roleDefaults: Record<string, string>
}

// Group order
const GROUP_ORDER = ['Core', 'HTT', 'Strategy', 'Engagement', 'Governance', 'Other']

export default function ModulesAccessClient({ tenantSlug, enabledModules, roleDefaults }: Props) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(enabledModules.map(k => [k, roleDefaults[k] ?? 'viewer']))
  )

  function handleChange(moduleKey: string, minRole: string) {
    setValues(v => ({ ...v, [moduleKey]: minRole }))
    setSaved(false)
  }

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSaved(false)

    const fd = new FormData()
    for (const [k, v] of Object.entries(values)) fd.set(k, v)

    startTransition(async () => {
      const result = await saveModuleRoleSettings(tenantSlug, fd)
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    })
  }

  if (enabledModules.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-[rgb(var(--text-3))]">
        No modules are enabled for this tenant yet.
        <br />
        IL admins can enable modules in the IL Admin Console.
      </div>
    )
  }

  // Group modules
  const grouped: Record<string, string[]> = {}
  for (const key of enabledModules) {
    const group = MODULE_META[key]?.group ?? 'Other'
    if (!grouped[group]) grouped[group] = []
    grouped[group].push(key)
  }

  return (
    <form onSubmit={handleSave}>
      <div className="space-y-6">

        <div className="bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded-lg px-4 py-3 text-sm text-[rgb(var(--text-2))]">
          <strong className="text-[rgb(var(--text-1))]">How this works:</strong> Set the minimum role needed to
          see each module in the sidebar. Individual members can be granted or denied access
          on top of these defaults in the <a href={`/${tenantSlug}/settings/members`} className="text-[rgb(var(--color-primary))] hover:underline">Members</a> tab.
        </div>

        {error && (
          <div className="px-3 py-2.5 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {GROUP_ORDER.filter(g => grouped[g]?.length).map(group => (
          <div key={group}>
            <h2 className="text-xs font-semibold text-[rgb(var(--text-3))] uppercase tracking-wider mb-2">
              {group}
            </h2>
            <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg overflow-hidden divide-y divide-[rgb(var(--border))]">
              {grouped[group].map(key => {
                const meta = MODULE_META[key]
                const current = values[key] ?? 'viewer'

                return (
                  <div key={key} className="flex items-center gap-4 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[rgb(var(--text-1))]">
                        {meta?.label ?? key}
                      </div>
                      <div className="text-xs text-[rgb(var(--text-3))] mt-0.5">
                        {meta?.description}
                      </div>
                    </div>

                    {/* Role selector */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-[rgb(var(--text-3))] hidden sm:block">Visible to</span>
                      <div className="flex rounded-md border border-[rgb(var(--border))] overflow-hidden">
                        {ROLE_ORDER.map(role => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => handleChange(key, role)}
                            className={[
                              'px-2.5 py-1 text-xs font-medium transition-colors',
                              current === role
                                ? 'bg-[rgb(var(--color-primary))] text-white'
                                : 'bg-[rgb(var(--surface-2))] text-[rgb(var(--text-2))] hover:bg-[rgb(var(--border))]',
                              // Show a "+" label: clicking Viewer means Viewer+ (everyone)
                            ].join(' ')}
                          >
                            {ROLE_LABELS[role]}{role !== 'owner' ? '+' : ''}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-[rgb(var(--color-primary))] rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Saving…' : 'Save changes'}
          </button>
          {saved && (
            <span className="text-sm text-[rgb(var(--color-accent))]">✓ Saved</span>
          )}
        </div>
      </div>
    </form>
  )
}

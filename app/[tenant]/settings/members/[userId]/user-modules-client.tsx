'use client'

/**
 * Per-user module override editor.
 *
 * For each module, shows:
 *   - What the user's role would give them ("Role default: visible / hidden")
 *   - An override control: [Role default] [Grant] [Deny]
 *
 * Saving writes to tenant_module_user_overrides.
 */
import { useState, useTransition } from 'react'
import { MODULE_META, ROLE_LABELS } from '@/lib/modules/constants'
import type { UserModuleState } from '../actions'
import { saveUserModuleOverrides } from '../actions'

// Group order
const GROUP_ORDER = ['Core', 'HTT', 'Strategy', 'Engagement', 'Governance', 'Other']

interface Props {
  tenantSlug: string
  userId: string
  userEmail: string
  userRole: string | null
  states: UserModuleState[]
}

type OverrideValue = 'default' | 'grant' | 'deny'

export default function UserModulesClient({
  tenantSlug,
  userId,
  userEmail,
  userRole,
  states,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Local state: 'default' | 'grant' | 'deny'
  const [overrides, setOverrides] = useState<Record<string, OverrideValue>>(
    Object.fromEntries(
      states.map(s => [
        s.moduleKey,
        s.override === true ? 'grant' : s.override === false ? 'deny' : 'default',
      ])
    )
  )

  function handleChange(moduleKey: string, value: OverrideValue) {
    setOverrides(o => ({ ...o, [moduleKey]: value }))
    setSaved(false)
  }

  function handleSave() {
    setError(null)
    setSaved(false)

    const payload: Record<string, boolean | null> = {}
    for (const [k, v] of Object.entries(overrides)) {
      payload[k] = v === 'grant' ? true : v === 'deny' ? false : null
    }

    startTransition(async () => {
      const result = await saveUserModuleOverrides(tenantSlug, userId, payload)
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    })
  }

  // Group modules
  const grouped: Record<string, UserModuleState[]> = {}
  for (const s of states) {
    const group = MODULE_META[s.moduleKey]?.group ?? 'Other'
    if (!grouped[group]) grouped[group] = []
    grouped[group].push(s)
  }

  const hasChanges = states.some(s => {
    const current = overrides[s.moduleKey] ?? 'default'
    const original = s.override === true ? 'grant' : s.override === false ? 'deny' : 'default'
    return current !== original
  })

  return (
    <div className="space-y-6">
      {/* Member header */}
      <div className="flex items-center gap-3 pb-2 border-b border-[rgb(var(--border))]">
        <a
          href={`/${tenantSlug}/settings/members`}
          className="text-sm text-[rgb(var(--text-3))] hover:text-[rgb(var(--text-2))] transition-colors"
        >
          ← Members
        </a>
        <span className="text-[rgb(var(--border))]">/</span>
        <div>
          <span className="text-sm font-medium text-[rgb(var(--text-1))]">{userEmail}</span>
          {userRole && (
            <span className="ml-2 text-xs text-[rgb(var(--text-3))] capitalize">{ROLE_LABELS[userRole] ?? userRole}</span>
          )}
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded-lg px-4 py-3 text-sm text-[rgb(var(--text-2))]">
        Overrides for this person override the role-level defaults.
        Set to <strong>Role default</strong> to remove any override and fall back to what their role allows.
      </div>

      {error && (
        <div className="px-3 py-2.5 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {states.length === 0 && (
        <div className="text-center py-8 text-sm text-[rgb(var(--text-3))]">
          No modules are enabled for this tenant yet.
        </div>
      )}

      {/* Module groups */}
      {GROUP_ORDER.filter(g => grouped[g]?.length).map(group => (
        <div key={group}>
          <h2 className="text-xs font-semibold text-[rgb(var(--text-3))] uppercase tracking-wider mb-2">
            {group}
          </h2>
          <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg overflow-hidden divide-y divide-[rgb(var(--border))]">
            {grouped[group].map(s => {
              const meta = MODULE_META[s.moduleKey]
              const current = overrides[s.moduleKey] ?? 'default'

              // What this user would see purely by role
              const roleLabel = s.roleDefault ? 'visible by role' : 'hidden by role'
              const roleLabelColor = s.roleDefault
                ? 'text-green-600 dark:text-green-400'
                : 'text-[rgb(var(--text-3))]'

              // Effective access after override
              let effective: boolean
              if (current === 'grant') effective = true
              else if (current === 'deny') effective = false
              else effective = s.roleDefault

              return (
                <div key={s.moduleKey} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[rgb(var(--text-1))]">
                        {meta?.label ?? s.moduleKey}
                      </span>
                      {/* Effective status indicator */}
                      <span className={`text-xs ${effective ? 'text-green-600 dark:text-green-400' : 'text-[rgb(var(--text-3))]'}`}>
                        {effective ? '● visible' : '○ hidden'}
                      </span>
                    </div>
                    <div className={`text-xs mt-0.5 ${roleLabelColor}`}>
                      {roleLabel}
                    </div>
                  </div>

                  {/* Override selector */}
                  <div className="flex rounded-md border border-[rgb(var(--border))] overflow-hidden flex-shrink-0">
                    {(['default', 'grant', 'deny'] as OverrideValue[]).map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleChange(s.moduleKey, opt)}
                        className={[
                          'px-3 py-1 text-xs font-medium transition-colors',
                          current === opt
                            ? opt === 'deny'
                              ? 'bg-red-500 text-white'
                              : opt === 'grant'
                              ? 'bg-green-600 text-white'
                              : 'bg-[rgb(var(--color-primary))] text-white'
                            : 'bg-[rgb(var(--surface-2))] text-[rgb(var(--text-2))] hover:bg-[rgb(var(--border))]',
                        ].join(' ')}
                      >
                        {opt === 'default' ? 'Role default' : opt === 'grant' ? 'Grant' : 'Deny'}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Save */}
      {states.length > 0 && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || !hasChanges}
            className="px-4 py-2 text-sm font-medium text-white bg-[rgb(var(--color-primary))] rounded hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? 'Saving…' : 'Save overrides'}
          </button>
          {saved && <span className="text-sm text-[rgb(var(--color-accent))]">✓ Saved</span>}
        </div>
      )}
    </div>
  )
}

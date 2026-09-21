'use client'

/**
 * Module toggle form — enables/disables platform modules per tenant.
 */
import { useState } from 'react'
import { MODULE_KEYS } from '@/lib/types/database'

const MODULE_LABELS: Record<string, { label: string; description: string; group: string }> = {
  products:          { label: 'Products',           description: 'Product catalogue management',            group: 'Core' },
  innovations:       { label: 'Innovations',         description: 'Innovation pipeline tracker',            group: 'Core' },
  staff_skills:      { label: 'Staff Skills',        description: 'Team capability mapping',               group: 'Core' },
  strategy:          { label: 'Strategy',            description: 'Strategic planning tools',              group: 'Strategy' },
  okrs:              { label: 'OKRs',                description: 'Objectives and key results',            group: 'Strategy' },
  roadmap:           { label: 'Roadmap',             description: 'Product and initiative roadmaps',       group: 'Strategy' },
  htt_baseline:      { label: 'HTT Baseline',        description: 'How to Think diagnostic assessment',   group: 'HTT' },
  htt_coaching:      { label: 'HTT Coaching',        description: 'AI coaching and capability guidance',  group: 'HTT' },
  htt_benchmarks:    { label: 'HTT Benchmarks',      description: 'Anonymised sector benchmarks',         group: 'HTT' },
  ai_insights:       { label: 'AI Insights',         description: 'AI-powered analysis and suggestions',  group: 'AI' },
  reports:           { label: 'Reports',             description: 'Automated reporting and exports',       group: 'Reporting' },
  integrations:      { label: 'Integrations',        description: 'Third-party integrations',             group: 'Advanced' },
  custom_branding:   { label: 'Custom Branding',     description: 'White-label branding controls',        group: 'Advanced' },
  sso:               { label: 'SSO',                 description: 'Single sign-on via SAML/OIDC',        group: 'Advanced' },
  api_access:        { label: 'API Access',          description: 'Programmatic platform access',         group: 'Advanced' },
  advanced_analytics:{ label: 'Advanced Analytics',  description: 'Detailed usage and performance data',  group: 'Advanced' },
  white_label:       { label: 'White Label',         description: 'Remove Innovation Lab branding',       group: 'Advanced' },
}

interface ModulesFormProps {
  tenantId: string
  enabledModules: string[]
}

export default function TenantModulesForm({ tenantId, enabledModules }: ModulesFormProps) {
  const [enabled, setEnabled] = useState(new Set(enabledModules))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(key: string) {
    setEnabled(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/modules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled_modules: Array.from(enabled) }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save modules')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Group modules
  const groups = Array.from(new Set(MODULE_KEYS.map(k => MODULE_LABELS[k]?.group ?? 'Other')))

  return (
    <div className="space-y-4">
      {error && (
        <div className="px-3 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {groups.map(group => {
        const groupKeys = MODULE_KEYS.filter(k => (MODULE_LABELS[k]?.group ?? 'Other') === group)
        return (
          <div key={group}>
            <h3 className="text-xs font-medium text-[rgb(var(--text-3))] uppercase tracking-wide mb-2">{group}</h3>
            <div className="space-y-1">
              {groupKeys.map(key => {
                const meta = MODULE_LABELS[key]
                const isOn = enabled.has(key)
                return (
                  <label key={key} className="flex items-center gap-3 py-2 cursor-pointer group">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isOn}
                      onClick={() => toggle(key)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)] ${
                        isOn ? 'bg-[rgb(var(--color-primary))]' : 'bg-[rgb(var(--border))]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isOn ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <div>
                      <span className="text-sm text-[rgb(var(--text-1))]">{meta?.label ?? key}</span>
                      <span className="ml-2 text-xs text-[rgb(var(--text-3))]">{meta?.description}</span>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-[rgb(var(--color-primary))] rounded hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save modules'}
        </button>
        {saved && <span className="text-sm text-[rgb(var(--color-accent))]">✓ Saved</span>}
      </div>
    </div>
  )
}

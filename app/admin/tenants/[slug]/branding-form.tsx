'use client'

/**
 * Tenant branding editor — client component.
 * Color pickers, font inputs. Saves via API route.
 */
import { useState } from 'react'
import type { TenantBranding } from '@/lib/types/database'

interface BrandingFormProps {
  tenantId: string
  branding: TenantBranding | null
}

export default function TenantBrandingForm({ tenantId, branding }: BrandingFormProps) {
  const [primaryColor, setPrimaryColor] = useState(branding?.primary_color ?? '#5B6EFF')
  const [secondaryColor, setSecondaryColor] = useState(branding?.secondary_color ?? '#A855F7')
  const [accentColor, setAccentColor] = useState(branding?.accent_color ?? '#059669')
  const [fontHeading, setFontHeading] = useState(branding?.font_heading ?? '')
  const [fontBody, setFontBody] = useState(branding?.font_body ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/branding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          accent_color: accentColor,
          font_heading: fontHeading || null,
          font_body: fontBody || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save branding')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {error && (
        <div className="px-3 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Primary', value: primaryColor, onChange: setPrimaryColor },
          { label: 'Secondary', value: secondaryColor, onChange: setSecondaryColor },
          { label: 'Accent', value: accentColor, onChange: setAccentColor },
        ].map(field => (
          <div key={field.label}>
            <label className="block text-xs font-medium text-[rgb(var(--text-2))] mb-1.5">
              {field.label} color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={field.value}
                onChange={e => field.onChange(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-[rgb(var(--border))]"
              />
              <input
                type="text"
                value={field.value}
                onChange={e => field.onChange(e.target.value)}
                pattern="^#[0-9A-Fa-f]{6}$"
                className="flex-1 px-2 py-1.5 text-xs bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded text-[rgb(var(--text-1))] font-mono focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)]"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Heading font', value: fontHeading, onChange: setFontHeading, placeholder: 'DM Serif Display' },
          { label: 'Body font', value: fontBody, onChange: setFontBody, placeholder: 'IBM Plex Sans' },
        ].map(field => (
          <div key={field.label}>
            <label className="block text-xs font-medium text-[rgb(var(--text-2))] mb-1.5">
              {field.label}
            </label>
            <input
              type="text"
              value={field.value}
              onChange={e => field.onChange(e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 text-sm bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded text-[rgb(var(--text-1))] placeholder:text-[rgb(var(--text-3))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)]"
            />
            <p className="mt-1 text-xs text-[rgb(var(--text-3))]">Google Fonts name</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-[rgb(var(--color-primary))] rounded hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save branding'}
        </button>
        {saved && (
          <span className="text-sm text-[rgb(var(--color-accent))]">✓ Saved</span>
        )}
      </div>
    </form>
  )
}

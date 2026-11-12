/**
 * /auth/onboarding — Shown after invitation acceptance for new users who
 * don't yet have a full_name set. Captures: full name + ToS.
 */
'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function OnboardingForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/'

  const [fullName, setFullName] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!termsAccepted) { setError('You must accept the terms of use to continue.'); return }
    if (!fullName.trim()) { setError('Please enter your full name.'); return }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim(), terms_accepted_at: new Date().toISOString() },
    })

    if (updateError) { setError(updateError.message); setLoading(false); return }

    await fetch('/api/onboarding/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName.trim(), terms_accepted_at: new Date().toISOString() }),
    })

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-heading text-2xl text-[rgb(var(--text-1))] mb-1">
            The Innovation<span className="text-[rgb(var(--color-primary))]">Lab</span>
          </div>
          <p className="text-sm text-[rgb(var(--text-3))]">Almost there</p>
        </div>

        <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-full bg-[rgb(var(--color-primary)/0.1)] flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--color-primary))" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <h1 className="font-semibold text-[rgb(var(--text-1))]">Set up your profile</h1>
              <p className="text-xs text-[rgb(var(--text-3))]">Just a couple of things before you dive in</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--text-2))] mb-1.5">Full name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required autoFocus placeholder="Jane Smith"
                className="w-full px-3 py-2 text-sm bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded text-[rgb(var(--text-1))] placeholder:text-[rgb(var(--text-3))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)] focus:border-[rgb(var(--color-primary))]" />
            </div>
            <div>
              <label className="flex gap-2.5 items-start cursor-pointer">
                <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[rgb(var(--border))] text-[rgb(var(--color-primary))] cursor-pointer flex-shrink-0" />
                <span className="text-xs text-[rgb(var(--text-2))] leading-relaxed">
                  I agree to the{' '}
                  <Link href="/legal/terms" target="_blank" className="text-[rgb(var(--color-primary))] hover:underline">Terms of Use</Link>
                  {' '}and{' '}
                  <Link href="/legal/privacy" target="_blank" className="text-[rgb(var(--color-primary))] hover:underline">Privacy Policy</Link>
                </span>
              </label>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2 px-4 text-sm font-medium text-white bg-[rgb(var(--color-primary))] rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Saving…' : 'Continue to workspace'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return <Suspense><OnboardingForm /></Suspense>
}

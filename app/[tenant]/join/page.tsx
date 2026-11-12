/**
 * /[tenant]/join — Self-registration with an invite code.
 */
'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function JoinForm() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const tenant = params.tenant as string
  const prefilledCode = searchParams.get('code') ?? ''

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState(prefilledCode)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (!termsAccepted) { setError('You must accept the terms of use to continue.'); return }
    if (!code.trim()) { setError('An invite code is required to join this workspace.'); return }

    setLoading(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          pending_tenant_slug: tenant,
          pending_invite_code: code.trim().toUpperCase(),
          terms_accepted_at: new Date().toISOString(),
        },
        emailRedirectTo: `${window.location.origin}/api/auth/callback?redirect=/${tenant}/dashboard`,
      },
    })

    if (signUpError) { setError(signUpError.message); setLoading(false) }
    else setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))] px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-full bg-[rgb(var(--color-accent)/0.1)] flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--color-accent))" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[rgb(var(--text-1))] mb-2">Check your email</h2>
          <p className="text-sm text-[rgb(var(--text-2))] mb-1">
            We sent a confirmation link to <strong>{email}</strong>.
          </p>
          <p className="text-sm text-[rgb(var(--text-3))]">
            Click the link to activate your account. Once confirmed, an admin will approve your access.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))] px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-heading text-2xl text-[rgb(var(--text-1))] mb-1">
            The Innovation<span className="text-[rgb(var(--color-primary))]">Lab</span>
          </div>
          <p className="text-sm text-[rgb(var(--text-3))]">Join workspace</p>
        </div>

        <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-6">
          <h1 className="font-semibold text-[rgb(var(--text-1))] mb-5">Create your account</h1>

          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--text-2))] mb-1.5">Full name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Jane Smith"
                className="w-full px-3 py-2 text-sm bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded text-[rgb(var(--text-1))] placeholder:text-[rgb(var(--text-3))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)] focus:border-[rgb(var(--color-primary))]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--text-2))] mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                className="w-full px-3 py-2 text-sm bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded text-[rgb(var(--text-1))] placeholder:text-[rgb(var(--text-3))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)] focus:border-[rgb(var(--color-primary))]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--text-2))] mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="At least 8 characters"
                className="w-full px-3 py-2 text-sm bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded text-[rgb(var(--text-1))] placeholder:text-[rgb(var(--text-3))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)] focus:border-[rgb(var(--color-primary))]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--text-2))] mb-1.5">Confirm password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="••••••••"
                className="w-full px-3 py-2 text-sm bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded text-[rgb(var(--text-1))] placeholder:text-[rgb(var(--text-3))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)] focus:border-[rgb(var(--color-primary))]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--text-2))] mb-1.5">Invite code</label>
              <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} required placeholder="XXXX-XXXX"
                className="w-full px-3 py-2 text-sm font-mono bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded text-[rgb(var(--text-1))] placeholder:text-[rgb(var(--text-3))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)] focus:border-[rgb(var(--color-primary))]" />
            </div>
            <div className="pt-1">
              <label className="flex gap-2.5 items-start cursor-pointer">
                <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[rgb(var(--border))] text-[rgb(var(--color-primary))] focus:ring-[rgb(var(--color-primary)/0.4)] cursor-pointer flex-shrink-0" />
                <span className="text-xs text-[rgb(var(--text-2))] leading-relaxed">
                  I agree to the{' '}
                  <Link href="/legal/terms" target="_blank" className="text-[rgb(var(--color-primary))] hover:underline">Terms of Use</Link>
                  {' '}and{' '}
                  <Link href="/legal/privacy" target="_blank" className="text-[rgb(var(--color-primary))] hover:underline">Privacy Policy</Link>
                  , and I understand that my account will require admin approval before I can access the workspace.
                </span>
              </label>
            </div>
            <div className="pt-1">
              <button type="submit" disabled={loading}
                className="w-full py-2 px-4 text-sm font-medium text-white bg-[rgb(var(--color-primary))] rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-[rgb(var(--text-3))] mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-[rgb(var(--color-primary))] hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default function JoinPage() {
  return <Suspense><JoinForm /></Suspense>
}

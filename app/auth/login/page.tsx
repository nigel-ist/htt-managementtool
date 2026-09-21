/**
 * Login page.
 * Supports email + password and Google OAuth.
 * Reads ?redirect query param to send user to the right place after login.
 */
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'signin' | 'magic'>('signin')

  const supabase = createClient()

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push(redirectTo)
      router.refresh()
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setMode('magic')
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))] px-4">
      <div className="w-full max-w-sm">

        {/* Logo / wordmark */}
        <div className="text-center mb-8">
          <div className="font-heading text-2xl text-[rgb(var(--text-1))] mb-1">
            The Innovation<span className="text-[rgb(var(--color-primary))]">Lab</span>
          </div>
          <p className="text-sm text-[rgb(var(--text-3))]">Platform</p>
        </div>

        <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-6">

          {mode === 'magic' ? (
            /* Magic link sent state */
            <div className="text-center py-4">
              <div className="w-10 h-10 rounded-full bg-[rgb(var(--color-accent)/0.1)] flex items-center justify-center mx-auto mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--color-accent))" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h2 className="font-semibold text-[rgb(var(--text-1))] mb-1">Check your email</h2>
              <p className="text-sm text-[rgb(var(--text-2))]">
                We sent a login link to <strong>{email}</strong>
              </p>
              <button
                onClick={() => setMode('signin')}
                className="mt-4 text-sm text-[rgb(var(--color-primary))] hover:underline"
              >
                Use a different method
              </button>
            </div>
          ) : (
            <>
              <h1 className="font-semibold text-[rgb(var(--text-1))] mb-5">Sign in</h1>

              {error && (
                <div className="mb-4 px-3 py-2.5 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              {/* Email / password form */}
              <form onSubmit={handleEmailLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[rgb(var(--text-2))] mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 text-sm bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded text-[rgb(var(--text-1))] placeholder:text-[rgb(var(--text-3))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)] focus:border-[rgb(var(--color-primary))]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[rgb(var(--text-2))] mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-sm bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded text-[rgb(var(--text-1))] placeholder:text-[rgb(var(--text-3))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.4)] focus:border-[rgb(var(--color-primary))]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 text-sm font-medium text-white bg-[rgb(var(--color-primary))] rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[rgb(var(--border))]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-2 bg-[rgb(var(--surface))] text-xs text-[rgb(var(--text-3))]">or</span>
                </div>
              </div>

              {/* Magic link */}
              <button
                onClick={handleMagicLink}
                disabled={!email || loading}
                className="w-full mb-2 py-2 px-4 text-sm font-medium text-[rgb(var(--text-1))] bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded hover:bg-[rgb(var(--border))] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Send magic link to {email || 'email above'}
              </button>

              {/* Google OAuth */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-2 px-4 text-sm font-medium text-[rgb(var(--text-1))] bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded hover:bg-[rgb(var(--border))] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-[rgb(var(--text-3))] mt-4">
          Need access? Contact your Innovation Lab administrator.
        </p>
      </div>
    </div>
  )
}

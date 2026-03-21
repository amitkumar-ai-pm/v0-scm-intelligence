'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Lock } from 'lucide-react'

export function LoginForm() {
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/'
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(data.error || `Request failed (${res.status})`)
        return
      }
      const safe = from.startsWith('/') && !from.startsWith('//') ? from : '/'
      window.location.href = safe
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border/60 bg-card/50 p-8 shadow-lg backdrop-blur-sm">
        <div className="mb-6 flex items-center gap-2 text-foreground">
          <Lock className="h-6 w-6 text-primary" aria-hidden />
          <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">
          This application is restricted. Enter the access password provided by the administrator.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="sr-only">Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary/30 focus:ring-2"
              placeholder="Access password"
              required
              disabled={loading}
            />
          </label>
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-95 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

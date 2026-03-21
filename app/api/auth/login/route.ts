import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { SESSION_COOKIE_NAME, SESSION_SUBJECT } from '@/lib/auth/constants'
import { isProductionAuthConfigured } from '@/lib/auth/env'
import { verifyPasswordConstantTime } from '@/lib/auth/password'
import { getRequestIp } from '@/lib/auth/request'
import { getLoginRatelimit } from '@/lib/ratelimit'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function POST(request: Request) {
  if (!isProductionAuthConfigured()) {
    return NextResponse.json({ error: 'Service misconfigured' }, { status: 503 })
  }

  const ip = getRequestIp(request)
  const loginRl = getLoginRatelimit()
  if (loginRl) {
    const { success, reset } = await loginRl.limit(ip)
    if (!success) {
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
      return NextResponse.json(
        { error: 'Too many login attempts. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
      )
    }
  } else if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Rate limit unavailable' }, { status: 503 })
  }

  let body: { password?: string }
  try {
    body = (await request.json()) as { password?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const password = typeof body.password === 'string' ? body.password : ''
  const expected = process.env.SITE_ACCESS_PASSWORD ?? ''
  if (!expected || !verifyPasswordConstantTime(password, expected)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  }

  const token = await new SignJWT({})
    .setSubject(SESSION_SUBJECT)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(process.env.AUTH_SECRET))

  const response = NextResponse.json({ ok: true })
  const isProd = process.env.NODE_ENV === 'production'
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return response
}

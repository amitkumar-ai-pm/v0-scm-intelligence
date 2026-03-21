import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { SESSION_COOKIE_NAME, SESSION_SUBJECT } from '@/lib/auth/constants'
import { isProductionAuthConfigured } from '@/lib/auth/env'
import { getRequestIp } from '@/lib/auth/request'
import { getGlobalRatelimit } from '@/lib/ratelimit'

function getEncodedSecret(): Uint8Array | null {
  const s = process.env.AUTH_SECRET
  if (!s || s.length < 32) return null
  return new TextEncoder().encode(s)
}

async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const enc = getEncodedSecret()
    if (!enc) return false
    const { payload } = await jwtVerify(token, enc, { algorithms: ['HS256'] })
    return payload.sub === SESSION_SUBJECT
  } catch {
    return false
  }
}

function misconfiguredResponse(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Service misconfigured' }, { status: 503 })
  }
  return new NextResponse('Service misconfigured', { status: 503 })
}

const PUBLIC_PATHS = new Set(['/login', '/api/auth/login', '/api/auth/logout'])

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname)
}

function unauthorized(request: NextRequest, pathname: string) {
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.searchParams.set('from', pathname)
  return NextResponse.redirect(url)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true') {
    return NextResponse.next()
  }

  if (!isProductionAuthConfigured()) {
    return misconfiguredResponse(request)
  }

  const globalRl = getGlobalRatelimit()
  if (globalRl) {
    const ip = getRequestIp(request)
    const { success, reset } = await globalRl.limit(ip)
    if (!success) {
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Too many requests' },
          { status: 429, headers: { 'Retry-After': String(retryAfter) } },
        )
      }
      return new NextResponse('Too many requests', {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      })
    }
  } else if (process.env.NODE_ENV === 'production') {
    return misconfiguredResponse(request)
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  if (!token) {
    return unauthorized(request, pathname)
  }
  const valid = await verifySessionToken(token)
  if (!valid) {
    return unauthorized(request, pathname)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}

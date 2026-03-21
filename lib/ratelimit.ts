import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let globalRl: Ratelimit | null = null
let loginRl: Ratelimit | null = null

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

/** Sliding window: default 120 req / minute / IP (all routes). */
export function getGlobalRatelimit(): Ratelimit | null {
  if (globalRl) return globalRl
  const redis = getRedis()
  if (!redis) return null
  globalRl = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(120, '1 m'),
    prefix: 'scm:global',
    analytics: true,
  })
  return globalRl
}

/** Stricter: 5 login attempts / 15 min / IP. */
export function getLoginRatelimit(): Ratelimit | null {
  if (loginRl) return loginRl
  const redis = getRedis()
  if (!redis) return null
  loginRl = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    prefix: 'scm:login',
    analytics: true,
  })
  return loginRl
}

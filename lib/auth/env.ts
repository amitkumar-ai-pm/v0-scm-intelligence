/** Production requires all of: JWT secret, site password, Upstash (rate limits). */
export function isProductionAuthConfigured(): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  return !!(
    process.env.AUTH_SECRET &&
    process.env.AUTH_SECRET.length >= 32 &&
    process.env.SITE_ACCESS_PASSWORD &&
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  )
}

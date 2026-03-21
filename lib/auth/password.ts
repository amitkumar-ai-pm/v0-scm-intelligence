import { createHash, timingSafeEqual } from 'node:crypto'

/** Compare password to env value without leaking length via timing (hashes first). */
export function verifyPasswordConstantTime(input: string, expectedFromEnv: string): boolean {
  const h1 = createHash('sha256').update(input, 'utf8').digest()
  const h2 = createHash('sha256').update(expectedFromEnv, 'utf8').digest()
  return h1.length === h2.length && timingSafeEqual(h1, h2)
}

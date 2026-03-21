import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import OpenAI from 'openai'
import { z } from 'zod'

/** Server cache for /api/insights — first request pays full cost (news + LLM); repeats within this window are fast. */
const INSIGHTS_CACHE_REVALIDATE_SECONDS = Number(process.env.INSIGHTS_CACHE_SECONDS ?? '90')

/** How far back to align NewsAPI `from`/`to`. NewsData.io `latest` covers the past ~48h natively. */
const NEWS_WINDOW_HOURS = 48
/** Items per category in Latest Signals. */
const NEWS_PER_CATEGORY = 5
/** Today's Critical Actions carousel — derived from the same news + LLM pass. */
const CRITICAL_ACTIONS_COUNT = 5

type NormalizedArticle = {
  title: string
  source: string
  provider: string
  publishedAt?: string
  url?: string
}

const ArticleSchema = z.object({
  headline: z.string().min(1),
  source: z.string().min(1),
  date: z.string().min(1),
  /** Prefer https URLs from providers; LLM may omit or occasionally return bad strings. */
  url: z.string().optional(),
})

const NewsCategorySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  news: z.array(ArticleSchema).min(1).max(10),
})

const CriticalActionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(220),
  description: z.string().min(1).max(600),
  priority: z.enum(['high', 'medium', 'low']),
  /** Relative recency, e.g. "30m ago", "3h ago" — align with signal timing when possible. */
  timestamp: z.string().min(1),
})

const fallbackNewsCategories = [
  {
    id: 'geopolitics',
    title: 'Geopolitics',
    news: [
      { headline: 'US-China trade tensions ease slightly; tariff negotiations begin', source: 'Reuters', date: '2h ago' },
      { headline: 'India becomes key manufacturing hub; supply chain rebalancing', source: 'Bloomberg', date: '4h ago' },
      { headline: 'EU supply chain resilience directive enters enforcement phase', source: 'Financial Times', date: '6h ago' },
    ],
  },
  {
    id: 'weather',
    title: 'Weather & Climate',
    news: [
      { headline: 'Southeast Asian flooding affects rubber and palm oil production', source: 'Reuters', date: '1h ago' },
      { headline: 'Arctic shipping routes open earlier than historical average', source: 'Maritime News', date: '3h ago' },
      { headline: 'California drought impacts agricultural export capacity', source: 'AP', date: '5h ago' },
    ],
  },
  {
    id: 'deals',
    title: 'Deals & Partnerships',
    news: [
      { headline: 'Major retailer invests $2B in automated warehouse network', source: 'TechCrunch', date: '2h ago' },
      { headline: 'Logistics firm announces strategic merger to expand regional reach', source: 'Bloomberg', date: '4h ago' },
      { headline: 'Pharma companies form alliance for resilient supply chains', source: 'PharmaTech', date: '7h ago' },
    ],
  },
  {
    id: 'announcements',
    title: 'Company Announcements',
    news: [
      { headline: 'FedEx reports Q2 earnings; operational efficiency improves 8%', source: 'Yahoo Finance', date: '30m ago' },
      { headline: 'DHL launches AI-powered predictive logistics platform', source: 'Supply Chain Dive', date: '2h ago' },
      { headline: 'Maersk integrates real-time carbon tracking across operations', source: 'Container News', date: '3h ago' },
    ],
  },
  {
    id: 'industry',
    title: 'Industry Trends',
    news: [
      { headline: 'Shipping costs stabilize; fuel surcharges reduced across routes', source: 'Freightos', date: '1h ago' },
      { headline: 'Trucking industry experiences driver shortages amid wage increases', source: 'ATRI', date: '3h ago' },
      { headline: 'Manufacturing orders decline 2%; forward guidance cautious', source: 'ISM', date: '4h ago' },
    ],
  },
  {
    id: 'shipping',
    title: 'Shipping & Ports',
    news: [
      { headline: 'Port congestion eases slightly as vessel schedules stabilize', source: 'Logistics News', date: '2h ago' },
      { headline: 'Freight rates show mixed signals amid demand fluctuations', source: 'Maritime Markets', date: '3h ago' },
      { headline: 'Container turnaround times improve but remain uneven by region', source: 'Supply Chain Dive', date: '5h ago' },
    ],
  },
  {
    id: 'trade',
    title: 'Trade & Tariffs',
    news: [
      { headline: 'Tariff negotiations resume as importers plan for uncertainty', source: 'Reuters', date: '1h ago' },
      { headline: 'Trade routes adapt to policy changes affecting manufacturing inputs', source: 'Bloomberg', date: '4h ago' },
      { headline: 'Supply chain rebalancing accelerates ahead of new compliance timelines', source: 'Financial Times', date: '6h ago' },
    ],
  },
] as const

const fallbackCriticalActions: z.infer<typeof CriticalActionSchema>[] = [
  {
    id: 'action1',
    title: 'Monitor Asian Weather Patterns',
    description: 'Southeast Asian flooding could impact rubber and palm oil production',
    priority: 'high',
    timestamp: '2h ago',
  },
  {
    id: 'action2',
    title: 'US-China Trade Negotiations',
    description: 'Tariff discussions ongoing; potential impact on manufacturing costs',
    priority: 'high',
    timestamp: '4h ago',
  },
  {
    id: 'action3',
    title: 'Energy Cost Risk',
    description: 'Manufacturing energy costs remain elevated; monitor utility markets',
    priority: 'medium',
    timestamp: '6h ago',
  },
  {
    id: 'action4',
    title: 'Review Ocean & Port Exposure',
    description: 'Validate lead times and capacity on key lanes; adjust safety stock if congestion signals persist',
    priority: 'medium',
    timestamp: '8h ago',
  },
  {
    id: 'action5',
    title: 'Stress-Test Supplier Continuity',
    description: 'Confirm backup sources and contract flexibility for tier-one components amid policy shifts',
    priority: 'low',
    timestamp: '12h ago',
  },
]

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

function safeJsonParse<T>(input: string): T | null {
  const trimmed = input.trim()
  const withoutFences = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  try {
    return JSON.parse(withoutFences) as T
  } catch {
    return null
  }
}

function toStringOrEmpty(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

function normalizeArticlesFromAny(raw: unknown, provider: string): NormalizedArticle[] {
  const seen = new Set<any>()

  const pickArticlesFromArray = (arr: unknown): NormalizedArticle[] => {
    if (!Array.isArray(arr)) return []
    const out: NormalizedArticle[] = []

    for (const item of arr) {
      if (!item || typeof item !== 'object') continue
      if (seen.has(item)) continue
      seen.add(item)

      const obj = item as Record<string, any>
      const title = obj.title ?? obj.headline ?? obj.name ?? obj.subject
      const sourceName =
        obj?.source?.name ?? obj?.source ?? obj?.source_name ?? obj.publisher ?? obj.provider
      const publishedAt = obj.publishedAt ?? obj.published_at ?? obj.pubDate ?? obj.date ?? obj.time
      const url = obj.url ?? obj.link

      const normalizedTitle = toStringOrEmpty(title)
      const normalizedSource = toStringOrEmpty(sourceName) || 'News'
      const normalizedPublishedAt = toStringOrEmpty(publishedAt)
      const normalizedUrl = toStringOrEmpty(url)

      if (normalizedTitle) {
        out.push({
          title: normalizedTitle,
          source: normalizedSource,
          provider,
          publishedAt: normalizedPublishedAt || undefined,
          url: normalizedUrl || undefined,
        })
      }
    }

    return out
  }

  // Prefer common shapes first, then fall back to a shallow recursive search.
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>
    const a1 = pickArticlesFromArray(r.articles)
    if (a1.length > 0) return a1

    const a2 = pickArticlesFromArray(r.data)
    if (a2.length > 0) return a2

    const a3 = pickArticlesFromArray(r.results)
    if (a3.length > 0) return a3
  }

  const candidates: NormalizedArticle[] = []

  const walk = (value: unknown, depth: number) => {
    if (depth > 4) return
    if (!value) return

    if (Array.isArray(value)) {
      const picked = pickArticlesFromArray(value)
      if (picked.length > 0) candidates.push(...picked.slice(0, 20))
      return
    }

    if (typeof value !== 'object') return

    const obj = value as Record<string, unknown>
    for (const v of Object.values(obj)) {
      if (typeof v === 'object' || Array.isArray(v)) walk(v, depth + 1)
      if (candidates.length >= 30) return
    }
  }

  walk(raw, 0)
  return candidates.slice(0, 20)
}

async function fetchJsonWithTimeout(url: string, timeoutMs: number): Promise<unknown> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'user-agent': 'scm-intelligence/1.0' },
    })

    if (!res.ok) {
      const body = await res.text()
      const snippet = body.slice(0, 300)
      throw new Error(`News API request failed: ${res.status} ${snippet}`)
    }

    return await res.json()
  } finally {
    clearTimeout(timeout)
  }
}

/** Retries on timeout/network flake (parallel provider variants often need 2–3 attempts). */
async function fetchJsonWithTimeoutRetry(url: string, timeoutMs: number, maxAttempts = 3): Promise<unknown> {
  let lastErr: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fetchJsonWithTimeout(url, timeoutMs)
    } catch (err) {
      lastErr = err
      const msg = String(err)
      const retryable =
        msg.includes('aborted') ||
        msg.includes('ETIMEDOUT') ||
        msg.includes('fetch failed') ||
        msg.includes('ECONNRESET')
      if (!retryable || attempt >= maxAttempts) throw err
      await new Promise((r) => setTimeout(r, 350 * attempt))
    }
  }
  throw lastErr
}

function buildNewsApiUrl(opts: {
  baseUrl: string
  apiKey: string
  apiKeyParam: string
  requestParams?: Record<string, unknown>
}): string {
  const url = new URL(opts.baseUrl)
  const params: Record<string, unknown> = opts.requestParams ?? {}

  // Add custom query params (provider-specific)
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue

    if (Array.isArray(value)) {
      for (const v of value) {
        if (v === undefined || v === null) continue
        url.searchParams.append(key, String(v))
      }
    } else {
      url.searchParams.set(key, String(value))
    }
  }

  url.searchParams.set(opts.apiKeyParam, opts.apiKey)
  // Be resilient to provider param-name mismatch by sending both common key names.
  // NewsData.io expects only `apikey` (lowercase); extra apiKey/token params can confuse some APIs.
  const skipDuplicateKeyAliases = opts.baseUrl.toLowerCase().includes('newsdata.io')
  if (!skipDuplicateKeyAliases) {
    if (!url.searchParams.has('apiKey')) {
      url.searchParams.set('apiKey', opts.apiKey)
    }
    if (!url.searchParams.has('token')) {
      url.searchParams.set('token', opts.apiKey)
    }
  }
  return url.toString()
}

function getQueryParamName(params: Record<string, unknown> | undefined): string {
  if (!params) return 'q'
  if (Object.prototype.hasOwnProperty.call(params, 'q')) return 'q'
  if (Object.prototype.hasOwnProperty.call(params, 'query')) return 'query'
  if (Object.prototype.hasOwnProperty.call(params, 'keywords')) return 'keywords'
  return 'q'
}

function buildQueryVariants(): string[] {
  return [
    // Dedicated pulls so Weather / Deals get URLs from APIs, not only LLM synthesis
    'weather OR climate OR storm OR flood OR drought OR hurricane OR wildfire OR heatwave OR typhoon OR cyclone',
    'merger OR acquisition OR partnership OR takeover OR buyout OR investment OR joint venture OR acquire',
    'supply chain OR logistics OR shipping OR port congestion',
    'freight OR container OR vessel OR port delays',
    'tariffs OR trade policy OR customs OR import export',
    'weather disruption OR flooding OR drought OR climate supply chain',
    'factory output OR manufacturing slowdown OR procurement risk',
  ]
}

function buildProviderVariantUrls(opts: {
  baseUrl: string
  apiKey: string
  apiKeyParam: string
  requestParams?: Record<string, unknown>
  provider: string
}): string[] {
  const variants = buildQueryVariants()
  const queryKey = getQueryParamName(opts.requestParams)
  const urls = new Set<string>()

  for (const variant of variants) {
    const mergedParams: Record<string, unknown> = {
      ...(opts.requestParams ?? {}),
      [queryKey]: variant,
    }

    // Keep payload moderate so multiple variant calls do not exceed limits quickly.
    // NewsData.io free tier: size 1–10 per request (see https://newsdata.io/documentation).
    if (opts.provider === 'NewsData' && !Object.prototype.hasOwnProperty.call(mergedParams, 'size')) {
      mergedParams.size = 10
    }
    if (opts.provider === 'GNews' && !Object.prototype.hasOwnProperty.call(mergedParams, 'max')) {
      mergedParams.max = 10
    }
    if (opts.provider === 'NewsAPI' && !Object.prototype.hasOwnProperty.call(mergedParams, 'pageSize')) {
      mergedParams.pageSize = 20
    }

    urls.add(
      buildNewsApiUrl({
        baseUrl: opts.baseUrl,
        apiKey: opts.apiKey,
        apiKeyParam: opts.apiKeyParam,
        requestParams: mergedParams,
      }),
    )
  }

  return [...urls]
}

function dedupeArticles(articles: NormalizedArticle[]): NormalizedArticle[] {
  const seen = new Set<string>()
  const out: NormalizedArticle[] = []

  for (const article of articles) {
    const key = article.url
      ? `url:${article.url.toLowerCase()}`
      : `title:${headlineKey(article.title)}|source:${article.source.toLowerCase()}`

    if (seen.has(key)) continue
    seen.add(key)
    out.push(article)
  }

  return out
}

function headlineKey(value: string): string {
  return value.trim().toLowerCase()
}

/** Weather & Deals first so global headline dedupe reserves URLs for them before broader categories. */
const CATEGORY_TEMPLATES: Array<{ id: string; title: string }> = [
  { id: 'weather', title: 'Weather & Climate' },
  { id: 'deals', title: 'Deals & Partnerships' },
  { id: 'geopolitics', title: 'Geopolitics' },
  { id: 'announcements', title: 'Company Announcements' },
  { id: 'industry', title: 'Industry Trends' },
  { id: 'shipping', title: 'Shipping & Ports' },
  { id: 'trade', title: 'Trade & Tariffs' },
]

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Geopolitics: ['geopolitic', 'war', 'conflict', 'sanction', 'policy', 'government', 'embargo', 'border'],
  'Weather & Climate': [
    'weather',
    'storm',
    'flood',
    'drought',
    'hurricane',
    'climate',
    'rainfall',
    'heatwave',
    'temperature',
    'cyclone',
    'wildfire',
    'snow',
    'monsoon',
    'forecast',
    'meteorolog',
    'el niño',
    'el nino',
    'rain',
    'wind',
    'heat',
    'cold',
    'typhoon',
    'tsunami',
    'tornado',
    'precipitation',
    'humidity',
  ],
  // Avoid bare "deal" — it matches unrelated headlines ("big deal", defense stories).
  'Deals & Partnerships': [
    'acquire',
    'acquisition',
    'merger',
    'merge',
    'partnership',
    'alliance',
    'joint venture',
    'invest',
    'investment',
    'buyout',
    'stake',
    'takeover',
    'acquires',
    'buys',
  ],
  'Company Announcements': ['announces', 'launches', 'reports', 'earnings', 'guidance', 'unveils', 'statement'],
  'Industry Trends': ['trend', 'market', 'demand', 'supply', 'inflation', 'cost', 'outlook', 'index'],
  'Shipping & Ports': ['port', 'shipping', 'vessel', 'container', 'freight', 'harbor', 'route', 'maritime'],
  'Trade & Tariffs': ['tariff', 'trade', 'import', 'export', 'duties', 'customs', 'compliance', 'wto'],
}

/** If any match, article is excluded from this category (prevents M&A scoring on defense clickbait). */
const CATEGORY_NEGATIVE_KEYWORDS: Record<string, string[]> = {
  'Deals & Partnerships': [
    'fighter jet',
    'stealth fighter',
    'f-35',
    'f35',
    'missile',
    'airstrike',
    'military aircraft',
  ],
}

const CATEGORY_MIN_SCORE: Record<string, number> = {
  Geopolitics: 1,
  /** Was 2 — too strict vs real headline variety; pool + keywords compensate. */
  'Weather & Climate': 1,
  'Deals & Partnerships': 1,
  'Company Announcements': 1,
  'Industry Trends': 1,
  'Shipping & Ports': 1,
  'Trade & Tariffs': 1,
}

function scoreArticleForCategory(title: string, categoryTitle: string): number {
  const text = title.toLowerCase()
  const negatives = CATEGORY_NEGATIVE_KEYWORDS[categoryTitle] ?? []
  if (negatives.some((kw) => text.includes(kw))) return 0
  const keywords = CATEGORY_KEYWORDS[categoryTitle] ?? []
  return keywords.reduce((acc, kw) => (text.includes(kw) ? acc + 1 : acc), 0)
}

/** Second-chance match when strict keyword score is 0 but headline is clearly weather-adjacent (keeps URLs). */
function weakWeatherMatch(title: string): boolean {
  const t = title.toLowerCase()
  if (
    /\b(iran|gaza|missile|airstrike|pentagon|fighter f|f-35|f35)\b/.test(t) &&
    !/weather|climate|storm|flood|rain|snow|wind|heat|cold|cyclone|hurricane|drought|wildfire|forecast/.test(t)
  ) {
    return false
  }
  return /weather|climate|storm|flood|drought|hurricane|rain|snow|wind|heat|cold|cyclone|typhoon|wildfire|tsunami|monsoon|forecast|meteorolog|precipitation|humidity|el niño|el nino|tornado|hail|fog|heatwave|rainfall|celsius|fahrenheit/.test(
    t,
  )
}

/** Second-chance for M&A-style headlines that use wording outside strict keyword list. */
function weakDealsMatch(title: string): boolean {
  const t = title.toLowerCase()
  const negatives = CATEGORY_NEGATIVE_KEYWORDS['Deals & Partnerships'] ?? []
  if (negatives.some((kw) => t.includes(kw))) return false
  return /\bacquir|acquisition|merger|merging|partnership|alliance|joint venture|investment|invests|\bbuyout\b|takeover|\bstake\b|lbo|ipo|spin-?off|to acquire|to merge|agrees to buy|agrees to sell/.test(t)
}

/** Single consistent LLM source label — never produces "OpenAI (LLM) (LLM)". */
function formatLlmSourceLabel(source: string): string {
  const s = source.trim()
  if (!s) return 'OpenAI (LLM)'
  const lower = s.toLowerCase()
  if (lower.includes('(gnews)') || lower.includes('(newsdata)') || lower.includes('(newsapi)')) return s
  if (/\(llm\)/i.test(s)) return s
  return `${s} (LLM)`
}

function normalizeLlmNewsItems(
  rawItems: Array<{ headline: string; source: string; date: string; url?: string }>,
  usedHeadlines: Set<string>,
): Array<{ headline: string; source: string; date: string; url?: string }> {
  const out: Array<{ headline: string; source: string; date: string; url?: string }> = []
  for (const item of rawItems) {
    const key = headlineKey(item.headline)
    if (!key || usedHeadlines.has(key)) continue
    usedHeadlines.add(key)
    const row: { headline: string; source: string; date: string; url?: string } = {
      headline: item.headline,
      source: formatLlmSourceLabel(item.source),
      date: item.date || 'recent',
    }
    if (item.url && /^https?:\/\//i.test(item.url)) row.url = item.url
    out.push(row)
    if (out.length >= NEWS_PER_CATEGORY) break
  }
  return out
}

function articleToNewsItem(a: NormalizedArticle): { headline: string; source: string; date: string; url?: string } {
  const item: { headline: string; source: string; date: string; url?: string } = {
    headline: a.title,
    source: `${a.source || 'News'} (${a.provider})`,
    date: 'recent',
  }
  if (a.url) item.url = a.url
  return item
}

function buildFinalCategories(
  llmCategories: z.infer<typeof NewsCategorySchema>[],
  combinedArticles: NormalizedArticle[],
): z.infer<typeof NewsCategorySchema>[] {
  const used = new Set<string>()
  const llmById = new Map(llmCategories.map((c) => [c.id, c]))

  return CATEGORY_TEMPLATES.map((template) => {
    const minScore = CATEGORY_MIN_SCORE[template.title] ?? 1
    const scoredArticles = combinedArticles
      .map((a) => ({ article: a, score: scoreArticleForCategory(a.title, template.title) }))
      .filter((row) => row.score >= minScore)
      .sort((a, b) => b.score - a.score)

    const selected: Array<{ headline: string; source: string; date: string; url?: string }> = []

    for (const row of scoredArticles) {
      const key = headlineKey(row.article.title)
      if (!key || used.has(key)) continue
      used.add(key)
      selected.push(articleToNewsItem(row.article))
      if (selected.length >= NEWS_PER_CATEGORY) break
    }

    if (selected.length < NEWS_PER_CATEGORY) {
      const llmItems = llmById.get(template.id)?.news ?? []
      const llmFill = normalizeLlmNewsItems(llmItems, used)
      selected.push(...llmFill.slice(0, NEWS_PER_CATEGORY - selected.length))
    }

    // Prefer real provider URLs over synthesis: weak keyword pass for Weather / Deals
    if (selected.length < NEWS_PER_CATEGORY && template.title === 'Weather & Climate') {
      for (const a of combinedArticles) {
        const k = headlineKey(a.title)
        if (!k || used.has(k) || !weakWeatherMatch(a.title)) continue
        used.add(k)
        selected.push(articleToNewsItem(a))
        if (selected.length >= NEWS_PER_CATEGORY) break
      }
    }
    if (selected.length < NEWS_PER_CATEGORY && template.title === 'Deals & Partnerships') {
      for (const a of combinedArticles) {
        const k = headlineKey(a.title)
        if (!k || used.has(k)) continue
        if (!weakDealsMatch(a.title)) continue
        used.add(k)
        selected.push(articleToNewsItem(a))
        if (selected.length >= NEWS_PER_CATEGORY) break
      }
    }

    // LLM knowledge: up to NEWS_PER_CATEGORY synthesized lines (not just one)
    while (selected.length < NEWS_PER_CATEGORY) {
      selected.push({
        headline: `${template.title}: synthesized signal (${selected.length + 1}/${NEWS_PER_CATEGORY})`,
        source: formatLlmSourceLabel('OpenAI'),
        date: 'recent',
      })
    }

    return {
      id: template.id,
      title: template.title,
      news: selected.slice(0, NEWS_PER_CATEGORY),
    }
  })
}

function sanitizeNewsCategories(
  raw: unknown,
  categoryTemplate: Array<{ id: string; title: string }>,
): z.infer<typeof NewsCategorySchema>[] {
  const rawList =
    raw && typeof raw === 'object' && Array.isArray((raw as any).newsCategories)
      ? ((raw as any).newsCategories as any[])
      : []

  return categoryTemplate.map((template, index) => {
    const sourceCategory =
      rawList.find((c) => c && typeof c === 'object' && ((c.id && String(c.id) === template.id) || (c.title && String(c.title) === template.title))) ??
      rawList[index]

    const rawNews = sourceCategory && Array.isArray(sourceCategory.news) ? sourceCategory.news : []
    const parsedNews = rawNews
      .map((item: unknown) => {
        if (!item || typeof item !== 'object') return null
        const headline = toStringOrEmpty((item as any).headline || (item as any).title)
        const source = toStringOrEmpty((item as any).source) || 'News'
        const date = toStringOrEmpty((item as any).date || (item as any).time) || 'recent'
        const urlRaw = toStringOrEmpty((item as any).url || (item as any).link)
        if (!headline) return null
        const out: { headline: string; source: string; date: string; url?: string } = { headline, source, date }
        if (urlRaw && /^https?:\/\//i.test(urlRaw)) out.url = urlRaw
        return out
      })
      .filter(Boolean) as Array<{ headline: string; source: string; date: string; url?: string }>

    const news =
      parsedNews.length > 0
        ? parsedNews.slice(0, NEWS_PER_CATEGORY).map((n) => ({
            ...n,
            source: formatLlmSourceLabel(n.source),
          }))
        : [
            {
              headline: `${template.title}: synthesized signal based on latest global context`,
              source: formatLlmSourceLabel('OpenAI'),
              date: 'recent',
            },
          ]
    return {
      id: template.id,
      title: template.title,
      news,
    }
  })
}

function sanitizeCriticalActionsFromParsed(parsed: unknown): z.infer<typeof CriticalActionSchema>[] {
  const rawList =
    parsed && typeof parsed === 'object' && Array.isArray((parsed as any).criticalActions)
      ? ((parsed as any).criticalActions as unknown[])
      : []

  const out: z.infer<typeof CriticalActionSchema>[] = []
  const seenIds = new Set<string>()

  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i]
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const title = toStringOrEmpty(o.title).trim()
    const description = toStringOrEmpty(o.description).trim()
    if (!title || !description) continue

    let id = toStringOrEmpty(o.id).trim() || `action-${i + 1}`
    if (seenIds.has(id)) id = `${id}-${i}`
    seenIds.add(id)

    const pr = toStringOrEmpty(o.priority).toLowerCase()
    const priority: 'high' | 'medium' | 'low' =
      pr === 'high' ? 'high' : pr === 'low' ? 'low' : 'medium'

    const timestamp = toStringOrEmpty(o.timestamp).trim() || 'recent'

    out.push({ id, title, description, priority, timestamp })
    if (out.length >= CRITICAL_ACTIONS_COUNT + 2) break
  }

  return out
}

async function generateLlmInsights(args: {
  articles1: NormalizedArticle[]
  articles2: NormalizedArticle[]
}): Promise<{
  newsCategories: z.infer<typeof NewsCategorySchema>[]
  criticalActions: z.infer<typeof CriticalActionSchema>[]
}> {
  const openai = new OpenAI({ apiKey: requireEnv('OPENAI_API_KEY') })
  const model = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini'

  const categories = CATEGORY_TEMPLATES

  const merged = dedupeArticles([...args.articles1, ...args.articles2])
  const articlesPayload = {
    articles: merged.slice(0, 80).map((a) => ({
      title: a.title,
      source: a.source,
      provider: a.provider,
      publishedAt: a.publishedAt,
      url: a.url,
    })),
    articleCount: merged.length,
    now: new Date().toISOString(),
  }

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.2,
    max_tokens: 5000,
    messages: [
      {
        role: 'system',
        content:
          'You are a supply chain intelligence analyst. You transform raw news into a structured executive briefing. ' +
          'Return ONLY valid JSON — no markdown, no commentary.',
      },
      {
        role: 'user',
        content: [
          `Use the articles below to produce TWO sections in one JSON object:`,
          ``,
          `1) "newsCategories" — Latest Signals (same rules as before):`,
          `Use these fixed categories (keep id and title EXACTLY as given): ${JSON.stringify(categories)}.`,
          `Pick the most relevant ${NEWS_PER_CATEGORY} items per category from the articles. Avoid duplicates across categories when possible.`,
          `Each news item: { headline, source, date, url? }.`,
          `- headline: concise, accurate, inspired by article titles.`,
          `- source: publisher name (fallback "News").`,
          `- date: relative time like "30m ago", "2h ago", "1d ago" from publishedAt when possible.`,
          `- url: from input when available.`,
          `If a category lacks strong matches, use the closest relevant articles from the pool.`,
          ``,
          `2) "criticalActions" — exactly ${CRITICAL_ACTIONS_COUNT} items for "Today's Critical Actions" for a supply chain / operations executive.`,
          `Each must be a concrete, decision-oriented action (monitor, rebalance inventory, review lanes, hedge, escalate with suppliers, etc.) grounded in the news themes — not generic platitudes.`,
          `Tie actions to current risks or opportunities implied by the headlines (trade, weather, freight, cyber, energy, compliance, etc.).`,
          `You may supplement with widely known 2024–2026 supply chain context only where it helps interpret thin article coverage.`,
          `Shape per item: { id, title, description, priority, timestamp }.`,
          `- id: stable string ids like "ca-1" … "ca-${CRITICAL_ACTIONS_COUNT}".`,
          `- title: short imperative headline (max ~12 words).`,
          `- description: 1–2 sentences: what to do and why it matters now.`,
          `- priority: "high" | "medium" | "low" based on urgency/impact.`,
          `- timestamp: relative time aligned with the supporting signals (e.g. "1h ago") or "today" if timing unclear.`,
          `Order criticalActions with highest urgency first.`,
          ``,
          `Articles are merged from NewsData.io + NewsAPI (deduped), capped at 80 for context.`,
          `\n\nArticles JSON:\n${JSON.stringify(articlesPayload)}`,
          `\n\nReturn JSON with EXACT shape:\n{ "newsCategories": [ ... ], "criticalActions": [ /* exactly ${CRITICAL_ACTIONS_COUNT} objects */ ] }`,
        ].join('\n'),
      },
    ],
  })

  const content = completion.choices?.[0]?.message?.content ?? ''
  const parsed = safeJsonParse<unknown>(content)
  if (!parsed) {
    throw new Error('OpenAI returned non-JSON content')
  }

  const sanitized = sanitizeNewsCategories(parsed, categories)
  const validatedNews = z.array(NewsCategorySchema).safeParse(sanitized)
  const newsCategories = validatedNews.success
    ? validatedNews.data
    : (() => {
        console.error('[insights] OpenAI newsCategories validation failed:', validatedNews.error.message)
        return fallbackNewsCategories as unknown as z.infer<typeof NewsCategorySchema>[]
      })()

  const sanitizedActions = sanitizeCriticalActionsFromParsed(parsed)
  const validatedActions = z.array(CriticalActionSchema).safeParse(sanitizedActions)
  let criticalActions: z.infer<typeof CriticalActionSchema>[] = fallbackCriticalActions
  if (validatedActions.success && validatedActions.data.length >= 3) {
    criticalActions = validatedActions.data.slice(0, CRITICAL_ACTIONS_COUNT)
  } else if (!validatedActions.success) {
    console.error('[insights] criticalActions validation failed:', validatedActions.error.message)
  } else {
    console.error('[insights] criticalActions: fewer than 3 items; using fallback list')
  }

  return { newsCategories, criticalActions }
}

/** Detect primary (NEWS1) provider for URL shape, limits, and logging. */
function getNews1ProviderKind(url: string): 'newsdata' | 'gnews' | 'other' {
  const u = url.toLowerCase()
  if (u.includes('newsdata.io')) return 'newsdata'
  if (u.includes('gnews.io')) return 'gnews'
  return 'other'
}

async function buildInsightsPayload() {
  const news1Url = requireEnv('NEWS1_API_URL')
  const news2Url = requireEnv('NEWS2_API_URL')
  const news1ApiKey = requireEnv('NEWS1_API_KEY')
  const news2ApiKey = requireEnv('NEWS2_API_KEY')

  /** NewsData.io: `apikey`. GNews often uses `token`. Override per provider if needed. */
  const news1ApiKeyParam = process.env.NEWS1_API_KEY_PARAM ?? 'apikey'
  const news2ApiKeyParam = process.env.NEWS2_API_KEY_PARAM ?? 'apiKey'

  const news1RequestParamsRaw = process.env.NEWS1_REQUEST_PARAMS
  const news2RequestParamsRaw = process.env.NEWS2_REQUEST_PARAMS

  const news1RequestParams = news1RequestParamsRaw ? (JSON.parse(news1RequestParamsRaw) as Record<string, unknown>) : undefined
  const news2RequestParams = news2RequestParamsRaw ? (JSON.parse(news2RequestParamsRaw) as Record<string, unknown>) : undefined

  const now = new Date()
  const from = new Date(now.getTime() - NEWS_WINDOW_HOURS * 60 * 60 * 1000)
  const fromDateOnly = from.toISOString().slice(0, 10)
  const toDateOnly = now.toISOString().slice(0, 10)

  const news1Kind = getNews1ProviderKind(news1Url)
  const useNewsData = news1Kind === 'newsdata'

  // NewsData `latest`: past ~48h built-in — do not send legacy `from`/`to`. Other providers keep date window.
  const primaryRequestParams: Record<string, unknown> = {
    ...(news1RequestParams ?? {}),
    ...(useNewsData
      ? {}
      : {
          ...((news1RequestParams && typeof (news1RequestParams as any).from === 'string') ? {} : { from: fromDateOnly }),
          ...((news1RequestParams && typeof (news1RequestParams as any).to === 'string') ? {} : { to: toDateOnly }),
        }),
  }

  const newsApiRequestParams: Record<string, unknown> = {
    ...(news2RequestParams ?? {}),
    ...((news2RequestParams && typeof (news2RequestParams as any).from === 'string') ? {} : { from: fromDateOnly }),
    ...((news2RequestParams && typeof (news2RequestParams as any).to === 'string') ? {} : { to: toDateOnly }),
  }

  const providerTimeoutMs = Number(process.env.NEWS_PROVIDER_TIMEOUT_MS ?? '15000')

  const primaryBuildProvider = useNewsData ? 'NewsData' : news1Kind === 'gnews' ? 'GNews' : 'Generic'
  const primaryArticleLabel = useNewsData ? 'NewsData' : news1Kind === 'gnews' ? 'GNews' : 'News1'

  const primaryVariantUrls = buildProviderVariantUrls({
    baseUrl: news1Url,
    apiKey: news1ApiKey,
    apiKeyParam: news1ApiKeyParam,
    requestParams: primaryRequestParams,
    provider: primaryBuildProvider,
  })
  const newsApiVariantUrls = buildProviderVariantUrls({
    baseUrl: news2Url,
    apiKey: news2ApiKey,
    apiKeyParam: news2ApiKeyParam,
    requestParams: newsApiRequestParams,
    provider: 'NewsAPI',
  })

  const allVariantUrls = [...primaryVariantUrls, ...newsApiVariantUrls]
  const variantResults = await Promise.allSettled(
    allVariantUrls.map((url, i) =>
      i < primaryVariantUrls.length
        ? fetchJsonWithTimeoutRetry(url, providerTimeoutMs)
        : fetchJsonWithTimeout(url, providerTimeoutMs),
    ),
  )
  const primaryResults = variantResults.slice(0, primaryVariantUrls.length)
  const newsApiResults = variantResults.slice(primaryVariantUrls.length)

  const articles1 = dedupeArticles(
    primaryResults
      .filter((r): r is PromiseFulfilledResult<unknown> => r.status === 'fulfilled')
      .flatMap((r) => normalizeArticlesFromAny(r.value, primaryArticleLabel)),
  )

  const articles2 = dedupeArticles(
    newsApiResults
      .filter((r): r is PromiseFulfilledResult<unknown> => r.status === 'fulfilled')
      .flatMap((r) => normalizeArticlesFromAny(r.value, 'NewsAPI')),
  )

  const primaryFailures = primaryResults.filter((r) => r.status === 'rejected').length
  const newsApiFailures = newsApiResults.filter((r) => r.status === 'rejected').length
  if (primaryFailures > 0) {
    console.error(`[insights] ${primaryArticleLabel} variants failed: ${primaryFailures}/${primaryVariantUrls.length}`)
  }
  if (newsApiFailures > 0) {
    console.error(`[insights] NewsAPI variants failed: ${newsApiFailures}/${newsApiVariantUrls.length}`)
  }

  console.log(
    `[insights] aggregated articles => ${primaryArticleLabel}: ${articles1.length}, NewsAPI: ${articles2.length}, total: ${
      articles1.length + articles2.length
    }`,
  )

  const generated = await generateLlmInsights({ articles1, articles2 })
  const finalCategories = buildFinalCategories(generated.newsCategories, [...articles1, ...articles2])

  return {
    criticalActions: generated.criticalActions,
    newsCategories: finalCategories,
  }
}

const getCachedInsights = unstable_cache(buildInsightsPayload, ['scm-api-insights'], {
  revalidate: INSIGHTS_CACHE_REVALIDATE_SECONDS,
})

export async function GET() {
  const response = {
    criticalActions: fallbackCriticalActions,
    newsCategories: fallbackNewsCategories,
  }

  const openAiKey = process.env.OPENAI_API_KEY
  const news1Url = process.env.NEWS1_API_URL
  const news2Url = process.env.NEWS2_API_URL

  if (!openAiKey || !news1Url || !news2Url) {
    return NextResponse.json(response, { status: 200 })
  }

  try {
    const data = await getCachedInsights()
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': `private, max-age=${INSIGHTS_CACHE_REVALIDATE_SECONDS}, stale-while-revalidate=${INSIGHTS_CACHE_REVALIDATE_SECONDS * 2}`,
      },
    })
  } catch (err) {
    console.error('[insights] failed:', err)
    return NextResponse.json(response, { status: 200 })
  }
}
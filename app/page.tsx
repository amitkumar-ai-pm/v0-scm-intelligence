'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, ChevronDown, Bell, Download, LogOut } from 'lucide-react'
import { redirectToLoginIfUnauthorized } from '@/lib/auth/client'
import { ScmAssistant } from '@/components/scm-assistant'
import { SECTOR_TRENDS } from '@/lib/sector-trends'
import type { CriticalAction, InsightsResponse, NewsCategory, SectorTrendMetric } from '@/lib/scm-types'

type InsightsLoadState = 'loading' | 'success' | 'error'

/** Opens relevant context: explicit URL when set, otherwise a web search for this metric + sector + source. */
function getSectorMetricSourceUrl(trendTitle: string, metric: SectorTrendMetric): string {
  const direct = metric.sourceUrl?.trim()
  if (direct && /^https?:\/\//i.test(direct)) return direct
  const q = encodeURIComponent(`${metric.source} ${metric.label} ${trendTitle} supply chain trends`)
  return `https://duckduckgo.com/?q=${q}&ia=web`
}

const Page = () => {
  const [expandedNews, setExpandedNews] = useState<string | null>(null)
  const [activeActionIndex, setActiveActionIndex] = useState(0)
  const [data, setData] = useState<InsightsResponse | null>(null)
  /** Avoid showing 3-item static fallback while /api/insights is still loading (matches API 5 items + urls). */
  const [insightsLoadState, setInsightsLoadState] = useState<InsightsLoadState>('loading')

  useEffect(() => {
    const fetchData = async () => {
      setInsightsLoadState('loading')
      try {
        const res = await fetch('/api/insights', { cache: 'no-store' })
        if (redirectToLoginIfUnauthorized(res.status)) return
        if (!res.ok) throw new Error(`API request failed: ${res.status}`)
        const json = (await res.json()) as InsightsResponse
        setData(json)
        setInsightsLoadState('success')
      } catch (err) {
        console.error('API error:', err)
        setInsightsLoadState('error')
      }
    }

    fetchData()
  }, [])

  /** Offline / error fallback — same shape as /api/insights `criticalActions`. */
  const fallbackCriticalActions: CriticalAction[] = [
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

  const criticalActions: CriticalAction[] =
    insightsLoadState === 'success' && data?.criticalActions && data.criticalActions.length > 0
      ? data.criticalActions
      : fallbackCriticalActions

  useEffect(() => {
    setActiveActionIndex((i) => Math.min(i, Math.max(0, criticalActions.length - 1)))
  }, [criticalActions.length])

  const priorityBadgeClass = (p: CriticalAction['priority']) =>
    p === 'high'
      ? 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/25'
      : p === 'low'
        ? 'bg-muted text-muted-foreground border border-border'
        : 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/25'

  const trends = SECTOR_TRENDS

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      window.location.href = '/login'
    }
  }

  /** Shown only if /api/insights fails — 5 items & 7 categories to mirror API shape (placeholders, not live). */
  const fallbackNewsCategories: NewsCategory[] = [
    {
      id: 'geopolitics',
      title: 'Geopolitics',
      news: [
        { headline: 'US-China trade tensions ease slightly; tariff negotiations begin', source: 'Reuters', date: '2h ago' },
        { headline: 'India becomes key manufacturing hub; supply chain rebalancing', source: 'Bloomberg', date: '4h ago' },
        { headline: 'EU supply chain resilience directive enters enforcement phase', source: 'Financial Times', date: '6h ago' },
        { headline: 'Regional trade corridors adapt to shifting compliance rules', source: 'WSJ', date: '5h ago' },
        { headline: 'Export controls update affects high-tech supply routes', source: 'FT', date: '8h ago' },
      ],
    },
    {
      id: 'weather',
      title: 'Weather & Climate',
      news: [
        { headline: 'Southeast Asian flooding affects rubber and palm oil production', source: 'Reuters', date: '1h ago' },
        { headline: 'Arctic shipping routes open earlier than historical average', source: 'Maritime News', date: '3h ago' },
        { headline: 'California drought impacts agricultural export capacity', source: 'AP', date: '5h ago' },
        { headline: 'Storm systems tracked along major freight corridors', source: 'NOAA', date: '6h ago' },
        { headline: 'Climate volatility cited in crop yield forecasts', source: 'Bloomberg', date: '7h ago' },
      ],
    },
    {
      id: 'deals',
      title: 'Deals & Partnerships',
      news: [
        { headline: 'Major retailer invests $2B in automated warehouse network', source: 'TechCrunch', date: '2h ago' },
        { headline: 'Logistics firm announces strategic merger to expand regional reach', source: 'Bloomberg', date: '4h ago' },
        { headline: 'Pharma companies form alliance for resilient supply chains', source: 'PharmaTech', date: '7h ago' },
        { headline: '3PL acquisition expands cold-chain footprint in EU', source: 'Supply Chain Dive', date: '5h ago' },
        { headline: 'Private equity backs port automation startup', source: 'Reuters', date: '8h ago' },
      ],
    },
    {
      id: 'announcements',
      title: 'Company Announcements',
      news: [
        { headline: 'FedEx reports Q2 earnings; operational efficiency improves 8%', source: 'Yahoo Finance', date: '30m ago' },
        { headline: 'DHL launches AI-powered predictive logistics platform', source: 'Supply Chain Dive', date: '2h ago' },
        { headline: 'Maersk integrates real-time carbon tracking across operations', source: 'Container News', date: '3h ago' },
        { headline: 'Carrier issues service update on Asia–Europe lanes', source: 'Lloyd\'s List', date: '4h ago' },
        { headline: 'Warehouse operator opens automated fulfillment site', source: 'DC Velocity', date: '6h ago' },
      ],
    },
    {
      id: 'industry',
      title: 'Industry Trends',
      news: [
        { headline: 'Shipping costs stabilize; fuel surcharges reduced across routes', source: 'Freightos', date: '1h ago' },
        { headline: 'Trucking industry experiences driver shortages amid wage increases', source: 'ATRI', date: '3h ago' },
        { headline: 'Manufacturing orders decline 2%; forward guidance cautious', source: 'ISM', date: '4h ago' },
        { headline: 'Inventory-to-sales ratios normalize in retail sector', source: 'NRF', date: '5h ago' },
        { headline: 'Procurement teams prioritize dual sourcing', source: 'Gartner', date: '7h ago' },
      ],
    },
    {
      id: 'shipping',
      title: 'Shipping & Ports',
      news: [
        { headline: 'Port throughput recovers after holiday backlog', source: 'Journal of Commerce', date: '2h ago' },
        { headline: 'Blank sailings reduced on transpacific strings', source: 'Lloyd\'s List', date: '4h ago' },
        { headline: 'Intermodal volumes tick up week over week', source: 'ATA', date: '5h ago' },
        { headline: 'Container availability improves at major hubs', source: 'Xeneta', date: '6h ago' },
        { headline: 'Barge operators report steady grain movements', source: 'Reuters', date: '8h ago' },
      ],
    },
    {
      id: 'trade',
      title: 'Trade & Tariffs',
      news: [
        { headline: 'Customs delays ease after new clearance pilot', source: 'TradeWinds', date: '1h ago' },
        { headline: 'Importer groups petition for tariff reconsideration', source: 'Politico', date: '3h ago' },
        { headline: 'Rules of origin guidance updated for key FTA', source: 'WTO', date: '5h ago' },
        { headline: 'Cross-border e-commerce shipments face new documentation', source: 'Bloomberg', date: '6h ago' },
        { headline: 'Steel tariff debate resumes in trade committee', source: 'FT', date: '7h ago' },
      ],
    },
  ]

  const newsCategories =
    insightsLoadState === 'success'
      ? data?.newsCategories ?? []
      : insightsLoadState === 'error'
        ? fallbackNewsCategories
        : []

  const toggleNews = (categoryId: string) => {
    setExpandedNews(expandedNews === categoryId ? null : categoryId)
  }

  const nextAction = () => {
    setActiveActionIndex((prev) => (prev + 1) % criticalActions.length)
  }

  const prevAction = () => {
    setActiveActionIndex((prev) => (prev - 1 + criticalActions.length) % criticalActions.length)
  }

  const downloadPDF = async () => {
    const element = document.getElementById('dashboard-content')
    if (!element) return

    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
    script.onload = () => {
      const opt = {
        margin: 10,
        filename: 'Supply_Chain_Intelligence_Dashboard.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
      }
      // @ts-expect-error html2pdf is injected by html2pdf.js CDN bundle at runtime
      html2pdf().set(opt).from(element).save()
    }
    document.head.appendChild(script)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 text-foreground">
      {/* Premium Header */}
      <header className="relative overflow-hidden border-b border-border/30 bg-gradient-to-r from-background via-primary/5 to-background">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -right-48 -top-32 h-96 w-96 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 blur-3xl"></div>
        </div>
        <div className="relative mx-auto max-w-full px-6 py-12">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Supply Chain Intelligence</h1>
            <div className="flex items-center gap-3">
              <button onClick={downloadPDF} className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground" title="Download as PDF">
                <Download className="h-5 w-5" />
              </button>
              <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground" title="Notifications">
                <Bell className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
          <p className="text-base text-muted-foreground">
            Real-time trends, signals, and insights for executive decision-making
          </p>
        </div>
      </header>

      {/* Extra bottom padding so Sector Trends / last cards stay above the fixed Assistant FAB */}
      <main className="px-6 py-8 pb-32 max-[480px]:pb-36">
        {/* Main Content - Left Side */}
        <div id="dashboard-content" className="flex-1 space-y-8">
          {/* Critical Actions - Scrollable Carousel */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-foreground">Today&apos;s Critical Actions</h2>
            {insightsLoadState === 'loading' && (
              <p className="text-xs text-muted-foreground mb-2">Personalizing actions from latest news signals…</p>
            )}
            <div className="relative">
              <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/15 via-accent/10 to-primary/15 p-6 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-primary mt-1" />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded ${priorityBadgeClass(
                          criticalActions[activeActionIndex].priority,
                        )}`}
                      >
                        {criticalActions[activeActionIndex].priority}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground text-base">{criticalActions[activeActionIndex].title}</h3>
                    <p className="mt-1 text-sm text-foreground/80">{criticalActions[activeActionIndex].description}</p>
                    <p className="mt-3 text-xs text-muted-foreground">{criticalActions[activeActionIndex].timestamp}</p>
                  </div>
                </div>
              </div>
              
              {/* Navigation */}
              {criticalActions.length > 1 && (
                <div className="mt-3 flex items-center justify-between">
                  <button
                    onClick={prevAction}
                    className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <ChevronDown className="h-4 w-4 rotate-90" />
                  </button>
                  <div className="flex gap-2">
                    {criticalActions.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveActionIndex(idx)}
                        className={`h-2 w-2 rounded-full transition-colors ${
                          idx === activeActionIndex ? 'bg-primary' : 'bg-border'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={nextAction}
                    className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <ChevronDown className="h-4 w-4 -rotate-90" />
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Latest Signals Section */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-foreground">Latest Signals</h2>
            {insightsLoadState === 'loading' && (
              <p className="text-sm text-muted-foreground mb-3">Loading signals from /api/insights…</p>
            )}
            {insightsLoadState === 'error' && (
              <p className="text-sm text-amber-600/90 mb-3">Could not load live insights. Showing offline placeholders.</p>
            )}
            <div className="space-y-3">
              {newsCategories.map((category) => (
                <div key={category.id} className="rounded-xl border border-border/30 overflow-hidden backdrop-blur-sm bg-card/50 hover:bg-card/70 transition-colors">
                  <button
                    onClick={() => toggleNews(category.id)}
                    className="flex w-full items-center justify-between px-5 py-3 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <h3 className="font-semibold text-base text-foreground">{category.title}</h3>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${
                        expandedNews === category.id ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {expandedNews === category.id && (
                    <div className="border-t border-border/20 bg-gradient-to-b from-foreground/2 to-transparent p-5">
                      <ul className="space-y-3">
                        {category.news.map((item, idx) => {
                          const href =
                            item.url && /^https?:\/\//i.test(item.url) ? item.url : undefined
                          return (
                            <li key={idx} className="space-y-1 pb-3 border-b border-border/10 last:border-0 last:pb-0">
                              <p className="font-semibold text-foreground text-sm">
                                {href ? (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-foreground underline underline-offset-2 decoration-muted-foreground/60 hover:decoration-primary hover:text-primary cursor-pointer"
                                  >
                                    {item.headline}
                                  </a>
                                ) : (
                                  item.headline
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground flex flex-wrap gap-2 items-center">
                                {href ? (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-primary underline underline-offset-2 decoration-primary/60 hover:decoration-primary cursor-pointer"
                                  >
                                    {item.source}
                                  </a>
                                ) : (
                                  <span className="font-medium text-primary">{item.source}</span>
                                )}
                                <span>•</span>
                                <span>{item.date}</span>
                              </p>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Sector Trends - Quantified Cards */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-foreground">Sector Trends</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {trends.map((trend) => (
                <div
                  key={trend.id}
                  className="rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm overflow-hidden shadow-md transition-all hover:shadow-lg"
                >
                  {/* Colored Header */}
                  <div className={`bg-gradient-to-r ${trend.color} p-4 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{trend.icon}</span>
                      <h3 className="font-bold text-white text-base">{trend.title}</h3>
                    </div>
                  </div>
                  
                  {/* Metrics in a horizontal row — three columns */}
                  <div className="p-3 sm:p-4 grid grid-cols-3 gap-2 sm:gap-3 min-h-[7rem]">
                    {trend.metrics.map((metric, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col gap-1 text-center min-w-0 ${
                          idx > 0 ? 'border-l border-border/40 pl-2 sm:pl-3' : ''
                        }`}
                      >
                        <p className="text-muted-foreground text-[10px] sm:text-xs font-medium leading-tight line-clamp-2">
                          {metric.label}
                        </p>
                        <p className="text-foreground text-sm sm:text-base font-bold tabular-nums">{metric.value}</p>
                        <p className="text-muted-foreground text-[10px] sm:text-xs leading-tight">{metric.subtext}</p>
                        <a
                          href={getSectorMetricSourceUrl(trend.title, metric)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-xs font-medium mt-auto pt-1 line-clamp-1 hover:underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 rounded-sm inline-block max-w-full"
                          aria-label={`Open ${metric.source} — ${metric.label} in ${trend.title}`}
                        >
                          {metric.source}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>

      <ScmAssistant criticalActions={criticalActions} newsCategories={newsCategories} trends={trends} />
    </div>
  )
}

export default Page
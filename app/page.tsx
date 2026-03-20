'use client'

import { useState } from 'react'
import { ChevronDown, Send, TrendingUp, AlertCircle, Activity, Zap, Globe } from 'lucide-react'

const Page = () => {
  const [expandedNews, setExpandedNews] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState('')

  const kpiMetrics = [
    { label: 'Supply Chain Health', value: '78%', trend: '+5%', color: 'bg-gradient-to-br from-emerald-500 to-teal-600', icon: Activity },
    { label: 'Cost Optimization', value: '12.3%', trend: '-2.1%', color: 'bg-gradient-to-br from-blue-500 to-cyan-600', icon: Zap },
    { label: 'Global Coverage', value: '45', trend: '+3', color: 'bg-gradient-to-br from-orange-500 to-rose-600', icon: Globe },
    { label: 'Risk Events', value: '8', trend: '-4', color: 'bg-gradient-to-br from-purple-500 to-pink-600', icon: AlertCircle },
  ]

  const trends = [
    {
      id: 'manufacturing',
      title: 'Manufacturing',
      color: 'from-blue-600 to-blue-700',
      icon: '🏭',
      items: [
        'Nearshoring momentum accelerates in North America',
        'Factory automation investments up 23% YoY',
        'Supply constraints ease for semiconductor components',
        'Energy costs drive facility relocation decisions',
      ],
    },
    {
      id: 'logistics',
      title: 'Logistics',
      color: 'from-teal-600 to-cyan-700',
      icon: '🚚',
      items: [
        'Port congestion decreases; vessel delays down 15%',
        'Last-mile delivery costs stabilize after 2 years',
        'Regional warehouse capacity at 78% utilization',
        'Autonomous trucking pilot expansions announced',
      ],
    },
    {
      id: 'retail',
      title: 'Retail',
      color: 'from-orange-600 to-orange-700',
      icon: '🛍️',
      items: [
        'Inventory levels normalized; stockouts decline',
        'Consumer demand shifts toward sustainable products',
        'Omnichannel fulfillment becomes standard',
        'Retail margins compressed amid price competition',
      ],
    },
    {
      id: 'technology',
      title: 'Technology',
      color: 'from-purple-600 to-purple-700',
      icon: '⚙️',
      items: [
        'AI-driven demand forecasting adoption increases',
        'Blockchain supply chain tracking gains traction',
        'Cloud-based inventory systems see 40% growth',
        'Cybersecurity investments prioritized for supply networks',
      ],
    },
    {
      id: 'fmcg',
      title: 'FMCG',
      color: 'from-rose-600 to-pink-700',
      icon: '📦',
      items: [
        'Cold chain disruptions impact perishable goods',
        'Sustainability packaging mandates reshape logistics',
        'Direct-to-consumer models reshape distribution',
        'Raw material volatility creates pricing pressure',
      ],
    },
  ]

  const newsCategories = [
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
  ]

  const toggleNews = (categoryId: string) => {
    setExpandedNews(expandedNews === categoryId ? null : categoryId)
  }

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Chat functionality would be implemented here
    setChatInput('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 text-foreground">
      {/* Premium Header */}
      <header className="relative overflow-hidden border-b border-border/30 bg-gradient-to-r from-background via-primary/5 to-background">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -right-48 -top-32 h-96 w-96 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 blur-3xl"></div>
        </div>
        <div className="relative mx-auto max-w-7xl px-6 py-16">
          <div className="flex items-baseline justify-between">
            <div>
              <h1 className="text-5xl font-bold tracking-tight text-foreground">Supply Chain Intelligence</h1>
              <p className="mt-3 text-lg text-muted-foreground">
                Real-time trends, signals, and insights for executive decision-making
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* KPI Metrics Section */}
        <section className="mb-16">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {kpiMetrics.map((metric) => {
              const Icon = metric.icon
              return (
                <div
                  key={metric.label}
                  className={`${metric.color} rounded-xl p-8 text-white shadow-lg transition-all hover:shadow-xl hover:scale-105`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="h-6 w-6 opacity-80" />
                    <span className={`text-sm font-semibold ${metric.trend.startsWith('+') ? 'text-emerald-200' : 'text-green-200'}`}>
                      {metric.trend}
                    </span>
                  </div>
                  <p className="text-sm font-medium opacity-90">{metric.label}</p>
                  <p className="mt-2 text-4xl font-bold">{metric.value}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Key Insights Alert Box */}
        <section className="mb-16">
          <div className="rounded-xl border border-orange-200/50 bg-gradient-to-br from-orange-50/50 to-rose-50/50 p-8 backdrop-blur-sm">
            <div className="flex gap-4">
              <AlertCircle className="h-6 w-6 flex-shrink-0 text-orange-600 mt-1" />
              <div>
                <h3 className="mb-2 text-lg font-bold text-foreground">Today's Critical Actions</h3>
                <p className="leading-relaxed text-foreground/85">
                  Global supply chains show signs of stabilization with port congestion easing and nearshoring momentum accelerating. However, geopolitical tensions and weather disruptions remain significant risks. Manufacturing costs continue to face upward pressure from energy prices, while technology adoption for AI-driven forecasting and blockchain tracking is becoming industry standard. <strong>Action required:</strong> Monitor Asian weather patterns and US-China trade negotiations closely.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Key Trends Section */}
        <section className="mb-16">
          <h2 className="mb-8 text-3xl font-bold tracking-tight text-foreground">Sector Trends</h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            {trends.map((trend) => (
              <div
                key={trend.id}
                className={`group rounded-xl bg-gradient-to-br ${trend.color} p-0 shadow-lg transition-all hover:shadow-2xl hover:-translate-y-1`}
              >
                <div className="rounded-xl bg-white/10 backdrop-blur-sm p-6 h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{trend.icon}</span>
                    <h3 className="font-bold text-white text-lg">{trend.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {trend.items.map((item, idx) => (
                      <li key={idx} className="text-sm leading-snug text-white/90 flex gap-2">
                        <span className="flex-shrink-0 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Latest Signals Section */}
        <section className="mb-16">
          <h2 className="mb-8 text-3xl font-bold tracking-tight text-foreground">Latest Signals</h2>
          <div className="space-y-3">
            {newsCategories.map((category) => (
              <div key={category.id} className="rounded-xl border border-border/30 overflow-hidden backdrop-blur-sm bg-card/50 hover:bg-card/70 transition-colors">
                <button
                  onClick={() => toggleNews(category.id)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <h3 className="font-bold text-lg text-foreground">{category.title}</h3>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
                      expandedNews === category.id ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedNews === category.id && (
                  <div className="border-t border-border/20 bg-gradient-to-b from-foreground/2 to-transparent p-6">
                    <ul className="space-y-4">
                      {category.news.map((item, idx) => (
                        <li key={idx} className="space-y-1.5 pb-4 border-b border-border/10 last:border-0 last:pb-0">
                          <p className="font-semibold text-foreground text-sm leading-snug">{item.headline}</p>
                          <p className="text-xs text-muted-foreground flex gap-2">
                            <span className="font-medium text-primary">{item.source}</span>
                            <span>•</span>
                            <span>{item.date}</span>
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Chat Section */}
        <section>
          <h2 className="mb-8 text-3xl font-bold tracking-tight text-foreground">Ask Supply Chain AI</h2>
          <div className="rounded-xl border border-border/30 bg-gradient-to-br from-card to-card/50 p-8 backdrop-blur-sm shadow-lg">
            <form onSubmit={handleChatSubmit} className="flex gap-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask anything about supply chain trends, risks, or opportunities..."
                className="flex-1 rounded-lg border border-border/50 bg-background/50 px-5 py-4 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all backdrop-blur-sm"
              />
              <button
                type="submit"
                className="rounded-lg bg-gradient-to-r from-primary to-accent px-6 py-4 text-white hover:shadow-lg transition-all flex items-center gap-2 text-sm font-semibold hover:scale-105"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Ask</span>
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Page

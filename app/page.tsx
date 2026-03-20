'use client'

import { useState } from 'react'
import { ChevronDown, Send, TrendingUp } from 'lucide-react'

const Page = () => {
  const [expandedNews, setExpandedNews] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState('')

  const trends = [
    {
      id: 'manufacturing',
      title: 'Manufacturing',
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header Section */}
      <header className="border-b border-border/50 bg-background">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <h1 className="text-4xl font-semibold tracking-tight">Supply Chain Intelligence</h1>
          <p className="mt-2 text-base text-muted-foreground">
            Real-time trends, signals, and insights across global supply chains
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* Key Trends Section */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold">Key Trends</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {trends.map((trend) => (
              <div key={trend.id} className="rounded-lg border border-border/50 bg-card p-6 transition-shadow hover:shadow-md">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {trend.title}
                </h3>
                <ul className="space-y-3">
                  {trend.items.map((item, idx) => (
                    <li key={idx} className="text-sm leading-snug text-foreground/80">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Insight Summary Section */}
        <section className="mb-16">
          <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-8">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">Today's Key Insights</h3>
            <p className="leading-relaxed text-foreground">
              Global supply chains show signs of stabilization with port congestion easing and nearshoring momentum accelerating. However, geopolitical tensions and weather disruptions remain significant risks. Manufacturing costs continue to face upward pressure from energy prices, while technology adoption for AI-driven forecasting and blockchain tracking is becoming industry standard. Most critical: monitor Asian weather patterns and US-China trade negotiations closely.
            </p>
          </div>
        </section>

        {/* Latest Signals Section */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold">Latest Signals</h2>
          <div className="space-y-3">
            {newsCategories.map((category) => (
              <div key={category.id} className="rounded-lg border border-border/50">
                <button
                  onClick={() => toggleNews(category.id)}
                  className="flex w-full items-center justify-between bg-card px-6 py-4 text-left hover:bg-card/80 transition-colors"
                >
                  <h3 className="font-semibold text-foreground">{category.title}</h3>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform ${
                      expandedNews === category.id ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedNews === category.id && (
                  <div className="border-t border-border/50 bg-background/50 p-6">
                    <ul className="space-y-4">
                      {category.news.map((item, idx) => (
                        <li key={idx} className="space-y-1">
                          <p className="font-medium text-foreground text-sm leading-snug">{item.headline}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.source} • {item.date}
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
          <h2 className="mb-6 text-2xl font-semibold">Ask About Supply Chain Trends</h2>
          <div className="rounded-lg border border-border/50 bg-card p-6">
            <form onSubmit={handleChatSubmit} className="flex gap-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask anything about supply chain trends or news..."
                className="flex-1 rounded-lg border border-border/50 bg-background px-4 py-3 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-3 text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Page

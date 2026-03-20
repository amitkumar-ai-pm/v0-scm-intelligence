'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Send, AlertCircle, Activity, Zap, Globe, MessageSquare, Archive, User, Bell, Download } from 'lucide-react'

const Page = () => {
  const [expandedNews, setExpandedNews] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [activeActionIndex, setActiveActionIndex] = useState(0)
  const [isChatOpen, setIsChatOpen] = useState(false)

  const criticalActions = [
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
  ]

  const trends = [
    {
      id: 'manufacturing',
      title: 'Manufacturing',
      color: 'from-blue-600 to-blue-700',
      icon: '🏭',
      metrics: [
        { label: 'Nearshoring', value: '+23%', subtext: 'YoY', source: 'Reuters' },
        { label: 'Automation', value: '+18%', subtext: 'Investment', source: 'McKinsey' },
        { label: 'Constraints', value: '-15%', subtext: 'Easing', source: 'Bloomberg' },
      ],
    },
    {
      id: 'logistics',
      title: 'Logistics',
      color: 'from-teal-600 to-cyan-700',
      icon: '🚚',
      metrics: [
        { label: 'Port Delays', value: '-15%', subtext: 'Improving', source: 'Freightos' },
        { label: 'Warehouse Util.', value: '78%', subtext: 'Capacity', source: 'CSCMP' },
        { label: 'Trucking', value: '+12%', subtext: 'Autonomous', source: 'ATA' },
      ],
    },
    {
      id: 'retail',
      title: 'Retail',
      color: 'from-orange-600 to-orange-700',
      icon: '🛍️',
      metrics: [
        { label: 'Inventory', value: 'Normal', subtext: 'Levels', source: 'NRF' },
        { label: 'Stockouts', value: '-8%', subtext: 'Declining', source: 'Numerator' },
        { label: 'Omnichannel', value: '95%', subtext: 'Adoption', source: 'BCG' },
      ],
    },
    {
      id: 'technology',
      title: 'Technology',
      color: 'from-purple-600 to-purple-700',
      icon: '⚙️',
      metrics: [
        { label: 'AI Adoption', value: '+34%', subtext: 'Forecasting', source: 'Gartner' },
        { label: 'Blockchain', value: '+28%', subtext: 'Tracking', source: 'Accenture' },
        { label: 'Cloud Systems', value: '+40%', subtext: 'Growth', source: 'IDC' },
      ],
    },
    {
      id: 'fmcg',
      title: 'FMCG',
      color: 'from-rose-600 to-pink-700',
      icon: '📦',
      metrics: [
        { label: 'Cold Chain Risk', value: 'High', subtext: 'Alert', source: 'WFP' },
        { label: 'Sustainability', value: '+22%', subtext: 'Packaging', source: 'Ellen MacArthur' },
        { label: 'Raw Materials', value: '+8%', subtext: 'Volatility', source: 'IMF' },
      ],
    },
    {
      id: 'warehousing',
      title: 'Warehousing',
      color: 'from-amber-600 to-yellow-700',
      icon: '🏢',
      metrics: [
        { label: 'Capacity Util.', value: '82%', subtext: 'Usage', source: 'CBRE' },
        { label: 'Automation', value: '+25%', subtext: 'Growth', source: 'MHI' },
        { label: 'Costs', value: '+5%', subtext: 'YoY', source: 'JLL' },
      ],
    },
  ]

  const chatSuggestions = [
    { icon: AlertCircle, text: 'What are today\'s top risks?' },
    { icon: Zap, text: 'How to reduce costs?' },
    { icon: Activity, text: 'Supply chain status?' },
    { icon: Globe, text: 'Geopolitical impact?' },
  ]

  const chatHistory = [
    { title: 'Manufacturing nearshoring', time: '2d ago' },
    { title: 'Port congestion analysis', time: '5d ago' },
    { title: 'Cost optimization trends', time: '1w ago' },
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
    setChatInput('')
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
      // @ts-ignore
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
              <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground" title="User Profile">
                <User className="h-5 w-5" />
              </button>
            </div>
          </div>
          <p className="text-base text-muted-foreground">
            Real-time trends, signals, and insights for executive decision-making
          </p>
        </div>
      </header>

      <main className="flex gap-6 px-6 py-8">
        {/* Main Content - Left Side */}
        <div id="dashboard-content" className="flex-1 space-y-8">
          {/* Critical Actions - Scrollable Carousel */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-foreground">Today's Critical Actions</h2>
            <div className="relative">
              <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/15 via-accent/10 to-primary/15 p-6 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-primary mt-1" />
                  <div className="flex-1">
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
                        {category.news.map((item, idx) => (
                          <li key={idx} className="space-y-1 pb-3 border-b border-border/10 last:border-0 last:pb-0">
                            <p className="font-semibold text-foreground text-sm">{item.headline}</p>
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
                  
                  {/* Text-only Body */}
                  <div className="p-4 space-y-3">
                    {trend.metrics.map((metric, idx) => (
                      <div key={idx} className="space-y-1">
                        <p className="text-muted-foreground text-xs font-medium">{metric.label}</p>
                        <p className="text-foreground text-base font-bold">{metric.value}</p>
                        <p className="text-muted-foreground text-xs">{metric.subtext}</p>
                        <p className="text-primary text-xs font-medium pt-1">{metric.source}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Chat Sidebar - Right Side */}
        <aside className="w-80 hidden lg:flex flex-col gap-4">
          {/* Chat Button - More Visible */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="flex items-center gap-3 w-full rounded-xl border-0 bg-gradient-to-r from-primary to-accent px-5 py-4 text-left hover:shadow-lg transition-all text-white"
          >
            <MessageSquare className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">SCM Assistant</p>
            </div>
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Chat Input - Top */}
          <div className="rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm p-4">
            <form onSubmit={handleChatSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask anything..."
                className="flex-1 rounded-lg border border-border/50 bg-background/50 px-4 py-3 text-xs placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <button
                type="submit"
                className="rounded-lg bg-gradient-to-r from-primary to-accent p-2 text-white hover:shadow-lg transition-all flex items-center justify-center text-xs font-semibold flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Chat Suggestions */}
          <div className="rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase">Suggested Today</p>
            <div className="space-y-2">
              {chatSuggestions.map((suggestion, idx) => {
                const Icon = suggestion.icon
                return (
                  <button
                    key={idx}
                    className="w-full text-left text-xs p-3 rounded-lg bg-background hover:bg-primary/10 transition-colors flex items-center gap-2 text-foreground hover:text-primary"
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="line-clamp-2">{suggestion.text}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Chat History */}
          <div className="rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Recent
            </p>
            <div className="space-y-2">
              {chatHistory.map((chat, idx) => (
                <button
                  key={idx}
                  className="w-full text-left text-xs p-3 rounded-lg bg-background hover:bg-muted transition-colors text-foreground"
                >
                  <p className="line-clamp-1 font-medium">{chat.title}</p>
                  <p className="text-muted-foreground text-xs mt-1">{chat.time}</p>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}

export default Page

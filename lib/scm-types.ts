export type NewsItem = {
  headline: string
  source: string
  date: string
  url?: string
}

export type NewsCategory = {
  id: string
  title: string
  news: NewsItem[]
}

export type CriticalAction = {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  timestamp: string
}

export type InsightsResponse = {
  criticalActions?: CriticalAction[]
  newsCategories: NewsCategory[]
}

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type ChatSession = {
  id: string
  title: string
  updatedAt: number
  messages: ChatMessage[]
}

export type SectorTrendMetric = {
  label: string
  value: string
  subtext: string
  source: string
  sourceUrl?: string
}

export type SectorTrendCard = {
  id: string
  title: string
  color: string
  icon: string
  metrics: SectorTrendMetric[]
}

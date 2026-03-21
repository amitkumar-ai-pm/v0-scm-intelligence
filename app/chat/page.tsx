'use client'

import { useEffect, useState } from 'react'
import { redirectToLoginIfUnauthorized } from '@/lib/auth/client'
import { ScmAssistant } from '@/components/scm-assistant'
import { SECTOR_TRENDS } from '@/lib/sector-trends'
import type { CriticalAction, InsightsResponse, NewsCategory } from '@/lib/scm-types'

export default function ChatPage() {
  const [criticalActions, setCriticalActions] = useState<CriticalAction[]>([])
  const [newsCategories, setNewsCategories] = useState<NewsCategory[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/insights', { cache: 'no-store' })
        if (redirectToLoginIfUnauthorized(res.status)) return
        const json = (await res.json()) as InsightsResponse
        if (!cancelled) {
          setCriticalActions(json.criticalActions ?? [])
          setNewsCategories(json.newsCategories ?? [])
        }
      } catch {
        /* use empty context */
      } finally {
        if (!cancelled) setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background text-muted-foreground text-sm">
        Loading SCM Assistant…
      </div>
    )
  }

  return (
    <ScmAssistant
      standalone
      criticalActions={criticalActions}
      newsCategories={newsCategories}
      trends={SECTOR_TRENDS}
    />
  )
}

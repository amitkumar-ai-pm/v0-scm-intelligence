'use client'

import { redirectToLoginIfUnauthorized } from '@/lib/auth/client'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  AlertCircle,
  Activity,
  Archive,
  ExternalLink,
  Globe,
  Loader2,
  MessageSquare,
  PanelLeftClose,
  Plus,
  Send,
  X,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatMessage, ChatSession, CriticalAction, NewsCategory, SectorTrendCard } from '@/lib/scm-types'

const CHAT_SESSIONS_KEY = 'scm-assistant-sessions-v1'
const MAX_STORED_SESSIONS = 5

const chatSuggestions = [
  { icon: AlertCircle, text: "Summarize today's critical actions and how they connect." },
  { icon: Activity, text: 'What are the top risks in Latest Signals right now?' },
  { icon: Globe, text: 'How do sector trends compare across manufacturing vs logistics?' },
  { icon: Zap, text: 'What should we prioritize this week based on the dashboard?' },
  { icon: MessageSquare, text: 'Explain weather-related signals and possible exposure.' },
  { icon: Archive, text: 'Which trade or tariff items need executive attention?' },
]

type ScmAssistantProps = {
  criticalActions: CriticalAction[]
  newsCategories: NewsCategory[]
  trends: SectorTrendCard[]
  standalone?: boolean
}

export function ScmAssistant({ criticalActions, newsCategories, trends, standalone = false }: ScmAssistantProps) {
  const [open, setOpen] = useState(standalone)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState(() =>
    typeof crypto !== 'undefined' ? crypto.randomUUID() : `sess-${Date.now()}`,
  )
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadSessionsFromStorage = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(CHAT_SESSIONS_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as unknown
      if (!Array.isArray(parsed)) return
      const cleaned = parsed
        .filter(
          (s): s is ChatSession =>
            s &&
            typeof s === 'object' &&
            typeof (s as ChatSession).id === 'string' &&
            Array.isArray((s as ChatSession).messages),
        )
        .slice(0, MAX_STORED_SESSIONS)
      setChatSessions(cleaned)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    loadSessionsFromStorage()
  }, [loadSessionsFromStorage])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: chatMessages.length > 0 ? 'smooth' : 'auto' })
  }, [chatMessages, chatLoading, chatError])

  useEffect(() => {
    if (standalone) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [standalone])

  useEffect(() => {
    if (standalone || !open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, standalone])

  const syncSessionToStorage = (messages: ChatMessage[], sid: string) => {
    if (messages.length === 0) return
    const firstUser = messages.find((m) => m.role === 'user')
    const title = (firstUser?.content ?? 'Chat').slice(0, 72)
    const session: ChatSession = { id: sid, title, updatedAt: Date.now(), messages }
    setChatSessions((prev) => {
      const merged = [session, ...prev.filter((s) => s.id !== sid)]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, MAX_STORED_SESSIONS)
      if (typeof window !== 'undefined') {
        localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(merged))
      }
      return merged
    })
  }

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || chatLoading) return
    setChatError(null)
    const nextMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: trimmed }]
    setChatMessages(nextMessages)
    setChatLoading(true)
    try {
      const context = {
        criticalActions: criticalActions.map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          priority: a.priority,
          timestamp: a.timestamp,
        })),
        newsCategories: newsCategories.map((c) => ({
          id: c.id,
          title: c.title,
          news: c.news.map((n) => ({
            headline: n.headline,
            source: n.source,
            date: n.date,
          })),
        })),
        sectorTrends: trends.map((t) => ({
          sector: t.title,
          metrics: t.metrics.map((m) => ({
            label: m.label,
            value: m.value,
            subtext: m.subtext,
            source: m.source,
          })),
        })),
      }
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, context }),
      })
      if (redirectToLoginIfUnauthorized(res.status)) return
      const json = (await res.json()) as { reply?: string; error?: string }
      if (!res.ok) {
        throw new Error(json.error || `Request failed (${res.status})`)
      }
      if (!json.reply) throw new Error('No reply from assistant')
      const withAssistant: ChatMessage[] = [...nextMessages, { role: 'assistant', content: json.reply }]
      setChatMessages(withAssistant)
      syncSessionToStorage(withAssistant, sessionId)
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Something went wrong')
      setChatMessages(nextMessages)
    } finally {
      setChatLoading(false)
    }
  }

  const startNewChat = () => {
    if (chatMessages.length > 0) syncSessionToStorage(chatMessages, sessionId)
    setChatMessages([])
    setChatError(null)
    setSessionId(typeof crypto !== 'undefined' ? crypto.randomUUID() : `sess-${Date.now()}`)
  }

  const openSession = (s: ChatSession) => {
    if (chatMessages.length > 0 && s.id !== sessionId) syncSessionToStorage(chatMessages, sessionId)
    setSessionId(s.id)
    setChatMessages(s.messages)
    setChatError(null)
  }

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const t = chatInput.trim()
    setChatInput('')
    if (t) void sendMessage(t)
  }

  const popOut = () => {
    window.open('/chat', 'scm-assistant', 'noopener,noreferrer,width=1100,height=860,menubar=no,toolbar=no')
  }

  /** Left rail: new chat + history (ChatGPT-style) */
  const sidebar = (
    <aside
      className={cn(
        'flex flex-col shrink-0 border-border/50 bg-muted/25 transition-[width,opacity] duration-200 ease-out overflow-hidden',
        sidebarOpen ? 'w-[min(260px,82vw)] border-r opacity-100' : 'w-0 opacity-0 border-0',
      )}
      aria-hidden={!sidebarOpen}
    >
      <div className="p-2.5 border-b border-border/40">
        <button
          type="button"
          onClick={startNewChat}
          className="flex w-full items-center gap-2 rounded-lg border border-border/60 bg-background/80 px-3 py-2.5 text-left text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
        >
          <Plus className="h-4 w-4 shrink-0" />
          New chat
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-2 [scrollbar-width:thin]">
        <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recent</p>
        {chatSessions.length === 0 ? (
          <p className="px-2 py-2 text-xs text-muted-foreground">No history yet.</p>
        ) : (
          <ul className="space-y-0.5">
            {chatSessions.map((session) => (
              <li key={session.id}>
                <button
                  type="button"
                  onClick={() => openSession(session)}
                  className={cn(
                    'w-full rounded-lg px-2.5 py-2 text-left text-xs transition-colors',
                    session.id === sessionId
                      ? 'bg-primary/15 text-foreground border border-primary/25'
                      : 'text-foreground/90 hover:bg-muted/70 border border-transparent',
                  )}
                >
                  <span className="line-clamp-2 font-medium">{session.title}</span>
                  <span className="mt-0.5 block text-[10px] text-muted-foreground">
                    {formatDistanceToNow(session.updatedAt, { addSuffix: true })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {standalone && (
        <div className="p-2 border-t border-border/40">
          <Link
            href="/"
            className="flex items-center justify-center rounded-lg py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            ← Back to dashboard
          </Link>
        </div>
      )}
    </aside>
  )

  /** Main conversation column — wide, centered text like ChatGPT */
  const mainColumn = (
    <div className="flex min-w-0 flex-1 flex-col min-h-0 bg-background/40">
      <div
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border"
      >
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
          {chatMessages.length === 0 && !chatLoading && (
            <div className="mb-8 text-center">
              <h3 className="text-lg font-semibold text-foreground sm:text-xl">How can I help?</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                Ask about <span className="text-foreground/90">Latest Signals</span>,{' '}
                <span className="text-foreground/90">Critical Actions</span>, or{' '}
                <span className="text-foreground/90">Sector Trends</span>. History is saved for this device only.
              </p>
              <div className="mt-8 grid gap-2 sm:grid-cols-2 text-left">
                {chatSuggestions.map((suggestion, idx) => {
                  const Icon = suggestion.icon
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={chatLoading}
                      onClick={() => void sendMessage(suggestion.text)}
                      className="flex gap-3 rounded-xl border border-border/50 bg-card/50 px-3 py-3 text-left text-sm text-foreground transition-colors hover:bg-muted/60 hover:border-border disabled:opacity-50"
                    >
                      <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                      <span className="leading-snug">{suggestion.text}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {chatMessages.map((m, idx) => (
              <div
                key={`${idx}-${m.role}-${m.content.slice(0, 20)}`}
                className={cn('flex w-full', m.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {m.role === 'user' ? (
                  <div className="max-w-[min(85%,28rem)] rounded-2xl bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground shadow-sm">
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  </div>
                ) : (
                  <div className="w-full max-w-none rounded-2xl border border-border/40 bg-muted/25 px-4 py-3 text-sm leading-relaxed text-foreground">
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  </div>
                )}
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-border/40 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  Thinking…
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {chatError && (
            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {chatError}
            </div>
          )}
        </div>
      </div>

      {/* Composer — full-width bar, centered field */}
      <div className="shrink-0 border-t border-border/40 bg-background/95 backdrop-blur-md px-4 pb-4 pt-3 sm:px-6">
        <form onSubmit={handleChatSubmit} className="mx-auto flex max-w-3xl items-end gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              aria-label="Message SCM Assistant"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask anything…"
              disabled={chatLoading}
              className="w-full rounded-2xl border border-border/70 bg-muted/30 py-3 pl-4 pr-4 text-sm text-foreground placeholder:text-muted-foreground shadow-inner focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled={chatLoading || !chatInput.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white shadow-md transition-opacity hover:opacity-95 disabled:opacity-40"
            aria-label="Send"
          >
            {chatLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </form>
        <p className="mx-auto mt-2 max-w-3xl text-center text-[10px] text-muted-foreground">
          SCM Assistant uses your dashboard context and may make mistakes. Verify important decisions.
        </p>
      </div>
    </div>
  )

  /** Top toolbar */
  const topBar = (opts: { showPopOut?: boolean; showClose?: boolean }) => (
    <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border/50 bg-card/80 px-3 py-2.5 backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setSidebarOpen((v) => !v)}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          title="Toggle sidebar"
        >
          {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
        </button>
        <div className="min-w-0 pl-1">
          <p className="truncate text-sm font-semibold text-foreground">SCM Assistant</p>
          <p className="truncate text-[10px] text-muted-foreground">Signals · Actions · Trends</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {opts.showPopOut && (
          <button
            type="button"
            onClick={popOut}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Open in new window"
            aria-label="Open in new window"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={startNewChat}
          className="hidden items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-flex"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </button>
        {standalone && (
          <button
            type="button"
            onClick={() => window.close()}
            className="rounded-lg px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Close
          </button>
        )}
        {opts.showClose && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close assistant"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </header>
  )

  /** Shared shell: sidebar + main */
  const chatShell = (header: ReactNode) => (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background text-foreground">
      {header}
      <div className="flex min-h-0 flex-1">
        {sidebar}
        {mainColumn}
      </div>
    </div>
  )

  if (standalone) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-background">
        <div className="flex min-h-0 flex-1 flex-col">
          {chatShell(topBar({ showPopOut: false, showClose: false }))}
        </div>
      </div>
    )
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex max-[480px]:bottom-5 max-[480px]:right-4 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent pl-4 pr-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:brightness-105 transition-all"
          aria-label="Open SCM Assistant"
        >
          <MessageSquare className="h-5 w-5" />
          <span>Assistant</span>
        </button>
      )}

      {open && (
        <>
          <button
            type="button"
            aria-label="Close assistant"
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="scm-assistant-title"
            onClick={(e) => e.stopPropagation()}
            className="fixed z-50 flex h-[calc(100dvh-1rem)] max-h-[min(92dvh,920px)] flex-col overflow-hidden rounded-2xl border border-border/60 bg-background shadow-2xl
              inset-2
              sm:inset-auto sm:right-4 sm:bottom-4 sm:left-auto sm:top-[4vh]
              sm:h-[min(88dvh,860px)] sm:w-[min(960px,calc(100vw-2rem))]"
          >
            <h2 id="scm-assistant-title" className="sr-only">
              SCM Assistant
            </h2>
            {chatShell(topBar({ showPopOut: true, showClose: true }))}
          </div>
        </>
      )}
    </>
  )
}

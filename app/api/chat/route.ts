import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(16000),
})

const BodySchema = z.object({
  messages: z.array(MessageSchema).min(1).max(40),
  context: z
    .object({
      criticalActions: z.array(z.unknown()).optional(),
      newsCategories: z.array(z.unknown()).optional(),
      sectorTrends: z.array(z.unknown()).optional(),
    })
    .optional(),
})

function buildSystemPrompt(contextJson: string | null): string {
  const base =
    'You are **SCM Assistant**, the in-app advisor for the Supply Chain Intelligence dashboard. ' +
    'You help executives interpret **Latest Signals** (news by category), **Today\'s Critical Actions**, and **Sector Trends** (quantified metrics). ' +
    'Be concise, actionable, and professional. Use bullet points when comparing multiple items. ' +
    'If the user asks about something not covered in the dashboard context, say so briefly and answer from general supply-chain knowledge, ' +
    'clearly labeling general knowledge as such. ' +
    'Do not invent specific headlines, numbers, or sources that are not in the context or widely known facts. ' +
    'When citing the dashboard, refer to sections by name (e.g. "Latest Signals → Weather & Climate").'

  if (!contextJson || contextJson.length < 10) {
    return base + '\n\nNo live dashboard context was provided for this request.'
  }

  return (
    base +
    '\n\n--- Current dashboard context (JSON; prioritize this for questions about "today", "latest", "shown", or "my" data) ---\n' +
    contextJson
  )
}

export async function POST(req: Request) {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key is not configured' }, { status: 503 })
  }

  const { messages, context } = parsed.data
  let contextStr: string | null = null
  if (context && (context.criticalActions?.length || context.newsCategories?.length || context.sectorTrends?.length)) {
    try {
      contextStr = JSON.stringify(context, null, 2)
      if (contextStr.length > 14000) {
        contextStr = contextStr.slice(0, 14000) + '\n…[context truncated for length]'
      }
    } catch {
      contextStr = null
    }
  }

  const openai = new OpenAI({ apiKey })
  const model = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini'

  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.35,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: buildSystemPrompt(contextStr) },
        ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ],
    })

    const reply = completion.choices?.[0]?.message?.content?.trim() ?? ''
    if (!reply) {
      return NextResponse.json({ error: 'Empty model response' }, { status: 502 })
    }

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('[chat]', err)
    const msg = err instanceof Error ? err.message : 'Chat failed'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}

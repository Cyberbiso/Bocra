import { NextRequest } from 'next/server'
import { SYSTEM_PROMPT } from '@/lib/agent/system-prompt'

export const runtime = 'nodejs'

interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string
}

interface SseEvent {
  type: string
  delta?: { type: string; text: string }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  let messages: AnthropicMessage[]
  let threadId: string | undefined
  try {
    const body = (await req.json()) as { messages?: AnthropicMessage[]; threadId?: string }
    messages = Array.isArray(body.messages) ? body.messages : []
    threadId = body.threadId
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  void threadId // used by client for routing, not needed server-side

  if (messages.length === 0) {
    return new Response(
      JSON.stringify({ error: 'messages is required and must be non-empty.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      stream: true,
      system: SYSTEM_PROMPT,
      messages,
    }),
  })

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => '')
    return new Response(
      JSON.stringify({ error: `Anthropic API error (${upstream.status})`, detail }),
      { status: upstream.status, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (!data || data === '[DONE]') continue
            try {
              const event = JSON.parse(data) as SseEvent
              if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
                controller.enqueue(encoder.encode(event.delta.text))
              }
            } catch {
              // skip malformed SSE lines
            }
          }
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}

import { NextRequest } from 'next/server'
import { SYSTEM_PROMPT } from '@/lib/agent/system-prompt'

export const runtime = 'nodejs'

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY

interface AgentMessage {
  role: 'user' | 'assistant'
  content: string
}

type GeminiPayload = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
  }>
  error?: {
    message?: string
  }
}

function extractText(payload: GeminiPayload) {
  const parts = payload.candidates?.[0]?.content?.parts
  if (!Array.isArray(parts)) return ''

  return parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('\n')
    .trim()
}

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Gemini is not configured. Set GEMINI_API_KEY on the frontend deployment.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  let messages: AgentMessage[]
  let threadId: string | undefined

  try {
    const body = (await req.json()) as { messages?: AgentMessage[]; threadId?: string }
    messages = Array.isArray(body.messages) ? body.messages : []
    threadId = body.threadId
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  void threadId

  if (messages.length === 0) {
    return new Response(
      JSON.stringify({ error: 'messages is required and must be non-empty.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const upstream = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: messages.map((message) => ({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.content }],
        })),
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024,
        },
      }),
      cache: 'no-store',
    },
  )

  const payload = (await upstream.json().catch(() => ({}))) as GeminiPayload

  if (!upstream.ok) {
    const detail =
      typeof payload?.error?.message === 'string'
        ? payload.error.message
        : 'Gemini request failed.'

    return new Response(
      JSON.stringify({ error: `Gemini API error (${upstream.status})`, detail }),
      { status: upstream.status, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const text = extractText(payload)

  if (!text) {
    return new Response(
      JSON.stringify({ error: 'Gemini did not return a text response.' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    )
  }

  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}

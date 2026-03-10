import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 120

const HIGGSFIELD_BASE = 'https://platform.higgsfield.ai'
const MODEL = 'bytedance/seedream/v4/text-to-image'

function buildAuthHeader(): string | null {
  const key = process.env.HIGGSFIELD_API_KEY
  const secret = process.env.HIGGSFIELD_API_SECRET
  if (!key || !secret) return null
  return `Key ${key}:${secret}`
}

async function submitJob(prompt: string, authHeader: string): Promise<string | null> {
  const url = `${HIGGSFIELD_BASE}/${MODEL}`
  console.log(`[content-image] Submitting: ${prompt.slice(0, 80)}...`)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, aspect_ratio: '4:5', resolution: '2K' }),
    })

    const text = await res.text()
    console.log(`[content-image] Submit (${res.status}): ${text.slice(0, 300)}`)
    if (!res.ok) return null

    const data = JSON.parse(text)
    return data.request_id || data.id || null
  } catch (err) {
    console.error('[content-image] Submit error:', err)
    return null
  }
}

async function pollJob(requestId: string, authHeader: string): Promise<string | null> {
  const maxTime = 90_000
  const interval = 3_000
  const start = Date.now()

  while (Date.now() - start < maxTime) {
    try {
      const res = await fetch(`${HIGGSFIELD_BASE}/requests/${requestId}/status`, {
        headers: { Authorization: authHeader },
      })

      const text = await res.text()
      console.log(`[content-image] Poll ${requestId} (${res.status}): ${text.slice(0, 200)}`)
      if (!res.ok) return null

      const data = JSON.parse(text)

      if (data.status === 'completed') {
        const url =
          data.images?.[0]?.url ||
          data.output?.images?.[0]?.url ||
          data.output?.url ||
          data.result?.url ||
          (typeof data.output === 'string' ? data.output : null)
        console.log(`[content-image] Completed: ${url}`)
        return url
      }

      if (data.status === 'failed' || data.status === 'nsfw') {
        console.error(`[content-image] Terminal: ${data.status}`)
        return null
      }

      await new Promise((r) => setTimeout(r, interval))
    } catch (err) {
      console.error(`[content-image] Poll error:`, err)
      return null
    }
  }

  console.error(`[content-image] Timeout for ${requestId}`)
  return null
}

export async function POST(req: NextRequest) {
  const authHeader = buildAuthHeader()
  if (!authHeader) {
    return NextResponse.json({ error: 'Higgsfield credentials not configured' }, { status: 500 })
  }

  try {
    const { prompt } = await req.json()
    if (!prompt) {
      return NextResponse.json({ error: 'No prompt provided' }, { status: 400 })
    }

    console.log(`[content-image] Starting generation: ${prompt.slice(0, 100)}...`)

    const requestId = await submitJob(prompt, authHeader)
    if (!requestId) {
      return NextResponse.json({ error: 'Failed to submit job' }, { status: 500 })
    }

    const imageUrl = await pollJob(requestId, authHeader)
    return NextResponse.json({ imageUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[content-image] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

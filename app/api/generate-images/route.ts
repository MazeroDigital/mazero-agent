import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 120

const HIGGSFIELD_BASE = 'https://platform.higgsfield.ai'
const MODEL = 'bytedance/seedream/v4/text-to-image'

type ImageRole = 'cover' | 'strategy' | 'results'

type ImageRequest = {
  role: ImageRole
  prompt: string
}

function buildAuthHeader(): string | null {
  const key = process.env.HIGGSFIELD_API_KEY
  const secret = process.env.HIGGSFIELD_API_SECRET
  if (!key || !secret) return null
  return `Key ${key}:${secret}`
}

function generatePrompts(companyName: string, industry: string): ImageRequest[] {
  const base = 'ultra-realistic, cinematic lighting, 4K quality, professional photography'

  const industryVisuals: Record<string, string> = {
    'E-commerce / Retail': 'modern retail storefront with elegant product displays, warm ambient lighting',
    'SaaS / Technology': 'sleek tech workspace with holographic data visualizations, blue ambient glow',
    'Healthcare / Wellness': 'modern medical clinic interior, clean white aesthetic, natural light',
    'Real Estate': 'stunning luxury property exterior at golden hour, architectural photography',
    'Food & Beverage': 'beautifully plated gourmet dish, warm restaurant ambiance, food photography',
    'Finance / Fintech': 'modern financial district skyline at dusk, glass towers reflecting golden light',
    'Education': 'bright modern learning space with collaborative technology, warm natural light',
    'Fashion & Beauty': 'high-end fashion editorial setup, studio lighting, premium textures',
    'Travel & Hospitality': 'luxury resort infinity pool overlooking ocean at sunset, paradise atmosphere',
    'Professional Services': 'sophisticated modern office with city panorama, executive environment',
    'Fitness & Sports': 'state-of-the-art gym with dynamic lighting, energy and movement',
    'Automotive': 'premium vehicle in dramatic studio lighting, reflective surfaces, automotive photography',
    'Entertainment & Media': 'cinematic production set with dramatic stage lighting, creative atmosphere',
    'Non-Profit': 'diverse community gathering in warm sunlit space, genuine human connection',
  }

  const visual = industryVisuals[industry] || `professional ${industry.toLowerCase()} environment, modern and premium`

  return [
    {
      role: 'cover',
      prompt: `Cinematic hero shot: ${visual}. Brand essence of ${companyName}. Wide angle, dramatic depth of field, ${base}`,
    },
    {
      role: 'strategy',
      prompt: `Strategic marketing visualization: modern workspace flat lay with marketing materials, digital screens showing analytics dashboards, ${industry.toLowerCase()} branding elements, bird's eye view, ${base}`,
    },
    {
      role: 'results',
      prompt: `Success and achievement visualization: upward trending abstract light trails and golden sparks over a ${industry.toLowerCase()} backdrop, triumphant atmosphere, dynamic composition, ${base}`,
    },
  ]
}

async function submitJob(prompt: string, authHeader: string): Promise<string | null> {
  const url = `${HIGGSFIELD_BASE}/${MODEL}`
  const body = { prompt, aspect_ratio: '16:9', resolution: '2K' }

  console.log(`[generate-images] Submitting job to ${url}`)
  console.log(`[generate-images] Prompt: ${prompt.slice(0, 80)}...`)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const text = await res.text()
    console.log(`[generate-images] Submit response (${res.status}): ${text.slice(0, 500)}`)

    if (!res.ok) return null

    const data = JSON.parse(text)
    const id = data.request_id || data.id || null
    console.log(`[generate-images] Job ID: ${id}`)
    return id
  } catch (err) {
    console.error('[generate-images] Submit error:', err)
    return null
  }
}

async function pollJob(requestId: string, authHeader: string): Promise<string | null> {
  const maxTime = 60_000
  const interval = 3_000
  const start = Date.now()

  console.log(`[generate-images] Polling job ${requestId}...`)

  while (Date.now() - start < maxTime) {
    try {
      const url = `${HIGGSFIELD_BASE}/requests/${requestId}/status`
      const res = await fetch(url, {
        headers: { Authorization: authHeader },
      })

      const text = await res.text()
      console.log(`[generate-images] Poll ${requestId} (${res.status}): ${text.slice(0, 300)}`)

      if (!res.ok) return null

      const data = JSON.parse(text)

      if (data.status === 'completed') {
        const imageUrl =
          data.images?.[0]?.url ||
          data.output?.images?.[0]?.url ||
          data.output?.url ||
          data.result?.url ||
          data.result?.images?.[0]?.url ||
          (typeof data.output === 'string' ? data.output : null)

        console.log(`[generate-images] Job ${requestId} completed. Image URL: ${imageUrl}`)
        return imageUrl
      }

      if (data.status === 'failed' || data.status === 'nsfw') {
        console.error(`[generate-images] Job ${requestId} terminal status: ${data.status}`)
        return null
      }

      await new Promise((r) => setTimeout(r, interval))
    } catch (err) {
      console.error(`[generate-images] Poll error for ${requestId}:`, err)
      return null
    }
  }

  console.error(`[generate-images] Job ${requestId} timed out after ${maxTime}ms`)
  return null
}

export async function POST(req: NextRequest) {
  const authHeader = buildAuthHeader()
  if (!authHeader) {
    console.error('[generate-images] Missing HIGGSFIELD_API_KEY or HIGGSFIELD_API_SECRET')
    return NextResponse.json(
      { error: 'HIGGSFIELD_API_KEY or HIGGSFIELD_API_SECRET not configured' },
      { status: 500 }
    )
  }

  try {
    const { companyName, industry } = await req.json()
    console.log(`[generate-images] Starting image generation for ${companyName} (${industry})`)

    const imageRequests = generatePrompts(companyName, industry)

    // Submit all 3 jobs in parallel
    const submissions = await Promise.all(
      imageRequests.map((ir) => submitJob(ir.prompt, authHeader))
    )

    console.log(`[generate-images] Submitted jobs:`, submissions)

    // Poll all jobs in parallel
    const results = await Promise.all(
      submissions.map((requestId) => {
        if (!requestId) return Promise.resolve(null)
        return pollJob(requestId, authHeader)
      })
    )

    const images: Record<string, string | null> = {}
    imageRequests.forEach((ir, i) => {
      images[ir.role] = results[i]
    })

    console.log(`[generate-images] Final results:`, images)
    return NextResponse.json({ images })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[generate-images] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

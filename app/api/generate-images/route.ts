import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 120

const HIGGSFIELD_BASE = 'https://cloud.higgsfield.ai'
const MODEL = 'bytedance/seedream/v4/text-to-image'

type ImageRole = 'cover' | 'opportunity' | 'strategy' | 'results'

type ImageRequest = {
  role: ImageRole
  prompt: string
}

function buildAuthHeader(): string | null {
  const key = process.env.HIGGSFIELD_API_KEY
  const secret = process.env.HIGGSFIELD_API_SECRET
  if (!key) return null
  // SDK uses "Key KEY_ID:KEY_SECRET" format
  if (secret) return `Key ${key}:${secret}`
  return `Bearer ${key}`
}

function generatePrompts(companyName: string, industry: string, services: string): ImageRequest[] {
  const base = `ultra-realistic, cinematic lighting, 4K quality, professional photography`

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
      role: 'opportunity',
      prompt: `Visual metaphor for growth and untapped potential: upward trending abstract light trails over a ${industry.toLowerCase()} backdrop, golden hour atmosphere, dynamic composition, ${base}`,
    },
    {
      role: 'strategy',
      prompt: `Strategic planning visualization: modern workspace flat lay with marketing materials, digital screens showing analytics dashboards, ${industry.toLowerCase()} branding elements, bird's eye view, ${base}`,
    },
    {
      role: 'results',
      prompt: `Success and ROI visualization: celebratory business moment, team achievement in premium ${industry.toLowerCase()} setting, warm golden lighting, triumphant atmosphere, ${base}`,
    },
  ]
}

async function submitJob(prompt: string, authHeader: string): Promise<string | null> {
  try {
    const res = await fetch(`${HIGGSFIELD_BASE}/${MODEL}`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        aspect_ratio: '16:9',
        resolution: '2k',
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error(`[generate-images] Submit failed (${res.status}):`, text)
      return null
    }

    const data = await res.json()
    return data.request_id || data.id || null
  } catch (err) {
    console.error('[generate-images] Submit error:', err)
    return null
  }
}

async function pollJob(requestId: string, authHeader: string): Promise<string | null> {
  const maxTime = 60_000
  const interval = 3_000
  const start = Date.now()

  while (Date.now() - start < maxTime) {
    try {
      const res = await fetch(`${HIGGSFIELD_BASE}/requests/${requestId}/status`, {
        headers: { Authorization: authHeader },
      })

      if (!res.ok) {
        console.error(`[generate-images] Poll failed (${res.status})`)
        return null
      }

      const data = await res.json()

      if (data.status === 'completed') {
        // Try multiple response shapes
        if (data.images?.[0]?.url) return data.images[0].url
        if (data.output?.url) return data.output.url
        if (data.result?.url) return data.result.url
        if (typeof data.output === 'string') return data.output
        console.error('[generate-images] Completed but no image URL found:', JSON.stringify(data))
        return null
      }

      if (data.status === 'failed' || data.status === 'nsfw') {
        console.error(`[generate-images] Job ${requestId} status: ${data.status}`)
        return null
      }

      // Still queued or in_progress — wait and retry
      await new Promise((r) => setTimeout(r, interval))
    } catch (err) {
      console.error('[generate-images] Poll error:', err)
      return null
    }
  }

  console.error(`[generate-images] Job ${requestId} timed out after ${maxTime}ms`)
  return null
}

export async function POST(req: NextRequest) {
  const authHeader = buildAuthHeader()
  if (!authHeader) {
    return NextResponse.json(
      { error: 'HIGGSFIELD_API_KEY is not configured' },
      { status: 500 }
    )
  }

  try {
    const { companyName, industry, services } = await req.json()
    const imageRequests = generatePrompts(companyName, industry, services || '')

    // Submit all 4 jobs in parallel
    const submissions = await Promise.all(
      imageRequests.map((ir) => submitJob(ir.prompt, authHeader))
    )

    // Poll all jobs in parallel
    const results = await Promise.all(
      submissions.map((requestId, i) => {
        if (!requestId) return Promise.resolve(null)
        return pollJob(requestId, authHeader)
      })
    )

    // Build response mapping role -> url
    const images: Record<string, string | null> = {}
    imageRequests.forEach((ir, i) => {
      images[ir.role] = results[i]
    })

    return NextResponse.json({ images })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[generate-images] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

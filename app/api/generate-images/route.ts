import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 120

const HIGGSFIELD_BASE = 'https://platform.higgsfield.ai'
const MODEL = 'bytedance/seedream/v4/text-to-image'

type ImageRole = 'cover' | 'situation' | 'solution' | 'investment'

function buildAuthHeader(): string | null {
  const key = process.env.HIGGSFIELD_API_KEY
  const secret = process.env.HIGGSFIELD_API_SECRET
  if (!key || !secret) return null
  return `Key ${key}:${secret}`
}

function generatePrompts(
  companyName: string,
  industry: string,
  visualDirection: string
): { role: ImageRole; prompt: string }[] {
  const base = 'ultra-realistic, cinematic lighting, 4K quality, professional photography'
  const style = visualDirection || 'premium, modern, cinematic'

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

  const visual = industryVisuals[industry] || `professional ${industry.toLowerCase()} environment`

  return [
    {
      role: 'cover',
      prompt: `Cinematic hero shot: ${visual}. Brand essence of ${companyName}. Wide angle, dramatic depth of field. Style: ${style}. ${base}`,
    },
    {
      role: 'situation',
      prompt: `Current state visualization for ${industry.toLowerCase()}: cluttered workspace, outdated marketing materials, missed opportunities, moody atmospheric lighting showing the gap. Style: ${style}. ${base}`,
    },
    {
      role: 'solution',
      prompt: `Strategic marketing transformation: modern creative workspace with multiple screens showing social media analytics, content calendars, and campaign dashboards for ${industry.toLowerCase()}. Organized, dynamic, forward-looking. Style: ${style}. ${base}`,
    },
    {
      role: 'investment',
      prompt: `Success and ROI visualization: upward trending data visualizations with golden light, celebratory business achievement in premium ${industry.toLowerCase()} setting. Growth, momentum, results. Style: ${style}. ${base}`,
    },
  ]
}

async function submitJob(prompt: string, authHeader: string): Promise<string | null> {
  const url = `${HIGGSFIELD_BASE}/${MODEL}`
  console.log(`[generate-images] Submitting: ${prompt.slice(0, 80)}...`)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, aspect_ratio: '16:9', resolution: '2K' }),
    })

    const text = await res.text()
    console.log(`[generate-images] Submit (${res.status}): ${text.slice(0, 300)}`)
    if (!res.ok) return null

    const data = JSON.parse(text)
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

      const text = await res.text()
      console.log(`[generate-images] Poll ${requestId} (${res.status}): ${text.slice(0, 200)}`)
      if (!res.ok) return null

      const data = JSON.parse(text)

      if (data.status === 'completed') {
        const url =
          data.images?.[0]?.url ||
          data.output?.images?.[0]?.url ||
          data.output?.url ||
          data.result?.url ||
          (typeof data.output === 'string' ? data.output : null)
        console.log(`[generate-images] Completed: ${url}`)
        return url
      }

      if (data.status === 'failed' || data.status === 'nsfw') {
        console.error(`[generate-images] Terminal: ${data.status}`)
        return null
      }

      await new Promise((r) => setTimeout(r, interval))
    } catch (err) {
      console.error(`[generate-images] Poll error:`, err)
      return null
    }
  }

  console.error(`[generate-images] Timeout for ${requestId}`)
  return null
}

export async function POST(req: NextRequest) {
  const authHeader = buildAuthHeader()
  if (!authHeader) {
    return NextResponse.json({ error: 'Higgsfield credentials not configured' }, { status: 500 })
  }

  try {
    const { companyName, industry, visualDirection } = await req.json()
    console.log(`[generate-images] Starting for ${companyName} (${industry}), direction: ${visualDirection}`)

    const imageRequests = generatePrompts(companyName, industry, visualDirection || '')

    const submissions = await Promise.all(
      imageRequests.map((ir) => submitJob(ir.prompt, authHeader))
    )
    console.log(`[generate-images] Jobs:`, submissions)

    const results = await Promise.all(
      submissions.map((id) => (id ? pollJob(id, authHeader) : Promise.resolve(null)))
    )

    const images: Record<string, string | null> = {}
    imageRequests.forEach((ir, i) => {
      images[ir.role] = results[i]
    })

    console.log(`[generate-images] Results:`, images)
    return NextResponse.json({ images })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[generate-images] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

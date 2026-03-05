import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  console.log('[analyze-client] Request received')

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('[analyze-client] ANTHROPIC_API_KEY is missing')
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }
  console.log('[analyze-client] API key present, length:', apiKey.length)

  let name = '', description = '', website_url = ''
  try {
    const body = await req.json()
    name = body.name ?? ''
    description = body.description ?? ''
    website_url = body.website_url ?? ''
  } catch (e) {
    console.error('[analyze-client] Failed to parse request body:', e)
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  console.log('[analyze-client] Client name:', name)

  try {
    const anthropic = new Anthropic({ apiKey })
    console.log('[analyze-client] Calling claude-sonnet-4-6...')

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `You are analyzing a business. Client: ${name}. Description: ${description || 'Not provided'}. Website: ${website_url || 'Not provided'}. Return a JSON object with these exact keys: summary, industry, target_audience, key_services, brand_tone. Return only the JSON object, no other text.`,
        },
      ],
    })

    console.log('[analyze-client] Claude responded, stop_reason:', response.stop_reason)

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    console.log('[analyze-client] Raw text (first 300 chars):', text.slice(0, 300))

    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()

    let brain
    try {
      brain = JSON.parse(cleaned)
      console.log('[analyze-client] JSON parsed OK, keys:', Object.keys(brain).join(', '))
    } catch (parseErr) {
      console.warn('[analyze-client] JSON parse failed:', parseErr, '— using raw text as summary')
      brain = { summary: text, industry: '', target_audience: '', key_services: '', brand_tone: '' }
    }

    console.log('[analyze-client] Returning success')
    return NextResponse.json({ brain })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[analyze-client] Anthropic API error:', message)
    // Return the exact error so the browser can log it
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

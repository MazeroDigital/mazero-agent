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
  console.log('[analyze-client] API key found')

  const { name, description, website_url } = await req.json()
  console.log('[analyze-client] Client:', name)

  const anthropic = new Anthropic({ apiKey })

  console.log('[analyze-client] Calling Claude Haiku...')
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `You are analyzing a business. Client: ${name}. Description: ${description || 'Not provided'}. Website: ${website_url || 'Not provided'}. Return a JSON object with: summary, industry, target_audience, key_services, brand_tone`,
      },
    ],
  })
  console.log('[analyze-client] Claude responded')

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  console.log('[analyze-client] Raw response:', text.slice(0, 200))

  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()

  let brain
  try {
    brain = JSON.parse(cleaned)
    console.log('[analyze-client] JSON parsed successfully')
  } catch {
    console.log('[analyze-client] JSON parse failed, using raw text as summary')
    brain = { summary: text, industry: '', target_audience: '', key_services: '', brand_tone: '' }
  }

  console.log('[analyze-client] Returning brain to client')
  return NextResponse.json({ brain })
}

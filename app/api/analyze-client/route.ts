import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

// This route ONLY generates the brain via Claude and returns it.
// The browser client saves it to Supabase directly — avoids any
// server-side cookie/RLS auth issues with the Supabase server client.
export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  try {
    const { name, description, website_url } = await req.json()

    const anthropic = new Anthropic({ apiKey })

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Create a marketing intelligence profile for this client. Return ONLY valid JSON, nothing else.

Client name: ${name}
Description: ${description || 'Not provided'}
Website: ${website_url || 'Not provided'}

JSON format:
{
  "summary": "2-3 sentence overview of who they are and their market position",
  "positioning": "Their unique value proposition in 1-2 sentences",
  "tone_of_voice": "Brand voice description — adjectives and style",
  "target_audience": "Who their customers are — demographics and psychographics",
  "content_pillars": ["pillar 1", "pillar 2", "pillar 3", "pillar 4"],
  "key_messages": ["message 1", "message 2", "message 3"],
  "social_media_strategy": "Platform recommendations and content approach",
  "hashtag_clusters": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "content_ideas": ["idea 1", "idea 2", "idea 3", "idea 4", "idea 5"]
}`,
        },
      ],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()

    let brain
    try {
      brain = JSON.parse(cleaned)
    } catch {
      brain = { summary: cleaned }
    }

    return NextResponse.json({ brain })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('analyze-client error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

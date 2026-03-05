import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  // Parse clientId outside the main try so the catch block can mark it as errored
  let clientId: string | undefined

  try {
    const body = await req.json()
    clientId = body.clientId

    const { name, industry, description, website_url, instagram_handle, target_audience, brand_colors } = body

    const anthropic = new Anthropic({ apiKey })

    // Use Haiku for brain building — 3-5x faster than Sonnet, well within Vercel's
    // 10s Hobby limit. Quality is more than sufficient for structured JSON output.
    const prompt = `You are building a "Client Brain" — a strategic intelligence profile for Mazero Digital Marketing Agency.

Analyze the following client and produce a comprehensive, specific, actionable JSON profile. Use your knowledge of the industry to make this genuinely useful for a social media marketing team.

CLIENT DATA:
- Name: ${name}
- Industry: ${industry || 'Not specified'}
- Description: ${description || 'Not provided'}
- Website: ${website_url || 'Not provided'}
- Instagram Handle: ${instagram_handle || 'Not provided'}
- Target Audience: ${target_audience || 'Not specified'}
- Brand Colors: ${brand_colors || 'Not specified'}

Return ONLY a valid JSON object. No markdown, no code fences, no explanation — just the JSON:

{
  "summary": "2-3 sentence executive summary: who they are, market position, what makes them unique",
  "positioning": "Their unique value proposition and market angle in 1-2 sentences",
  "tone_of_voice": "Specific brand voice — adjectives, energy level, language style, what to avoid",
  "target_audience": "Detailed profile: demographics, psychographics, aspirations, pain points",
  "content_pillars": ["pillar 1", "pillar 2", "pillar 3", "pillar 4"],
  "competitor_insights": "Key competitors and exactly how this client differentiates from them",
  "brand_personality": "5 personality traits that define this brand",
  "key_messages": ["core message 1", "core message 2", "core message 3"],
  "social_media_strategy": "Which platforms, posting cadence, content mix, and platform-specific approach",
  "hashtag_clusters": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6", "#tag7", "#tag8"],
  "do": ["specific thing to always do in content", "specific thing", "specific thing"],
  "dont": ["specific thing to never do", "specific thing", "specific thing"],
  "content_ideas": ["highly specific content idea 1", "specific content idea 2", "specific content idea 3", "specific content idea 4", "specific content idea 5"]
}`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'

    let brain: Record<string, unknown>
    try {
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
      brain = JSON.parse(cleaned)
    } catch {
      // If JSON parse fails, store raw text as summary so there's something useful
      brain = { summary: raw, parse_error: true }
    }

    const supabase = await createClient()
    const { error: updateError } = await supabase
      .from('clients')
      .update({ brain: JSON.stringify(brain), brain_status: 'complete' })
      .eq('id', clientId)

    if (updateError) {
      console.error('Supabase update error:', updateError)
      return NextResponse.json({ error: `DB update failed: ${updateError.message}` }, { status: 500 })
    }

    return NextResponse.json({ brain })
  } catch (error) {
    console.error('analyze-client error:', error)

    // Always mark the client as errored so the UI shows a retry option
    if (clientId) {
      try {
        const supabase = await createClient()
        await supabase
          .from('clients')
          .update({ brain_status: 'error' })
          .eq('id', clientId)
      } catch (dbErr) {
        console.error('Failed to set error status:', dbErr)
      }
    }

    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Analysis failed: ${message}` }, { status: 500 })
  }
}

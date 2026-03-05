import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  try {
    const {
      clientId,
      name,
      industry,
      description,
      website_url,
      instagram_handle,
      target_audience,
      brand_colors,
    } = await req.json()

    // Try to fetch website content — silently ignore if unreachable
    let websiteContent = ''
    if (website_url) {
      try {
        const res = await fetch(website_url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MazeroBot/1.0)' },
          signal: AbortSignal.timeout(8000),
        })
        const html = await res.text()
        websiteContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 4000)
      } catch {
        // Website blocked bots or timed out — continue without it
      }
    }

    const anthropic = new Anthropic({ apiKey })

    const prompt = `You are building a "Client Brain" — a strategic intelligence profile for Mazero Digital Marketing Agency.

Analyze the following client data and produce a comprehensive, specific, actionable profile. Draw on real knowledge of the industry to make this genuinely useful for a marketing team.

CLIENT DATA:
- Name: ${name}
- Industry: ${industry || 'Not specified'}
- Description: ${description || 'Not provided'}
- Website: ${website_url || 'Not provided'}
- Instagram Handle: ${instagram_handle || 'Not provided'}
- Target Audience: ${target_audience || 'Not specified'}
- Brand Colors: ${brand_colors || 'Not specified'}${websiteContent ? `\n\nWEBSITE CONTENT (extracted):\n${websiteContent}` : ''}

Return ONLY a valid JSON object — no markdown, no code blocks, no extra text:

{
  "summary": "2-3 sentence executive summary: who they are, market position, what makes them unique",
  "positioning": "Their unique value proposition and market angle in 1-2 sentences",
  "tone_of_voice": "Specific brand voice — adjectives, energy level, language style, what to avoid",
  "target_audience": "Detailed profile: demographics, psychographics, aspirations, pain points",
  "content_pillars": ["pillar 1", "pillar 2", "pillar 3", "pillar 4"],
  "competitor_insights": "Key competitors and exactly how this client differentiates from them",
  "brand_personality": "5 personality traits (e.g. 'sophisticated, warm, authoritative, aspirational, modern')",
  "key_messages": ["core message 1", "core message 2", "core message 3"],
  "social_media_strategy": "Which platforms, posting cadence, content mix, and platform-specific approach",
  "hashtag_clusters": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6", "#tag7", "#tag8"],
  "do": ["specific thing to always do in content", "specific thing", "specific thing"],
  "dont": ["specific thing to never do", "specific thing", "specific thing"],
  "content_ideas": ["highly specific content idea 1", "specific content idea 2", "specific content idea 3", "specific content idea 4", "specific content idea 5"]
}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'

    let brain: Record<string, unknown>
    try {
      // Strip any accidental code fences
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
      brain = JSON.parse(cleaned)
    } catch {
      brain = { summary: raw, parse_error: true }
    }

    const supabase = await createClient()
    await supabase
      .from('clients')
      .update({ brain: JSON.stringify(brain), brain_status: 'complete' })
      .eq('id', clientId)

    return NextResponse.json({ brain })
  } catch (error) {
    console.error('analyze-client error:', error)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}

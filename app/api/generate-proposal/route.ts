import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 120

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  try {
    const brief = await req.json()

    const prompt = `You are a senior marketing strategist at Mazero Digital Marketing Agency. Generate a comprehensive, persuasive marketing proposal based on this client brief:

PROSPECT: ${brief.companyName}
WEBSITE: ${brief.websiteUrl || 'Not provided'}
INDUSTRY: ${brief.industry}
CURRENT MARKETING: ${brief.currentMarketing || 'Not provided'}
PROBLEMS/GAPS IDENTIFIED: ${brief.problems || 'Not provided'}
SERVICES TO PITCH: ${brief.services}
ADDITIONAL NOTES: ${brief.notes || 'None'}
BUDGET RANGE: ${brief.budget || 'Not specified'}

Generate a full proposal with these sections. Use markdown formatting:

# Proposal for [Company Name]

## Executive Summary
A compelling 2-3 paragraph overview of why they need this and what you'll deliver.

## The Challenge
Detail their current situation, pain points, and what they're missing out on. Be specific to their industry.

## Our Solution
Lay out the strategic approach. Explain the methodology and why it works.

## Scope of Work & Deliverables
Bullet-pointed list of exactly what they get. Be specific and tangible.

## Timeline
A phased rollout plan (Phase 1, 2, 3) with realistic timeframes.

## Investment
Pricing breakdown based on the budget range if provided, or suggest a range based on the scope. Include what's included at each tier if applicable.

## Why Mazero
3-4 compelling reasons to choose Mazero. Focus on results, expertise, and partnership approach.

## Next Steps
Clear call to action for moving forward.

Make the tone confident, professional, and results-focused. Use data points and specific metrics where relevant. The proposal should feel like it was written by someone who deeply understands their industry.`

    const client = new Anthropic({ apiKey })

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    return NextResponse.json({ proposal: text })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[generate-proposal] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

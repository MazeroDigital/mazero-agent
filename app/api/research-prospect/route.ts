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
    const client = new Anthropic({ apiKey })

    const socialContext = brief.socialHandles
      ? `\n4. Look up their social media presence: ${brief.socialHandles}`
      : ''

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
      messages: [
        {
          role: 'user',
          content: `Research this prospect for a marketing proposal. Be concise — bullet points preferred.

COMPANY: ${brief.companyName}
WEBSITE: ${brief.websiteUrl || 'N/A'}
INDUSTRY: ${brief.industry}

Research tasks:
1. Search "${brief.companyName}" — positioning, recent news, key info
2. Find top 3 competitors in ${brief.industry} — their marketing strengths
3. Find 3 real industry statistics (market size, growth, trends)${socialContext}

Format with these headers:
## Company Overview
Brief summary of the company.

## Competitor Analysis
### [Name] — strategy, social presence, key strength (repeat x3)

## Industry Statistics
- **[Stat]:** value — *Source: [source]*  (x3-5)

## Digital Presence Assessment
Brief assessment of their online presence and gaps.

## Key Opportunities
1-4 bullet points based on gaps and trends.

Use real data only. Be specific but concise.`,
        },
      ],
    })

    // Extract text content from response (filter out tool use/result blocks)
    const textContent = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((b) => b.text)
      .join('\n')

    // Truncate research to avoid bloating downstream calls
    const trimmed = textContent.length > 3000 ? textContent.slice(0, 3000) + '\n\n[Research truncated]' : textContent

    return NextResponse.json({ research: trimmed })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[research-prospect] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

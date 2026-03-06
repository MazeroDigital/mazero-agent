import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 120

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  try {
    const { brief, research } = await req.json()
    const client = new Anthropic({ apiKey })

    const today = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

    // --- Call 1: Research outline + structure ---
    const outlineResponse = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are a senior marketing strategist at Mazero Digital Marketing. Using the research below, create a detailed OUTLINE for a marketing proposal.

CLIENT: ${brief.companyName} | ${brief.industry}
SERVICES: ${brief.services}
BUDGET: ${brief.budget || 'Not specified'}
DATE: ${today}

RESEARCH:
${research}

Create a structured outline with key points for each section:
1. Executive Summary — 3 key themes
2. The Opportunity — gaps and urgency points with stats
3. Competitor Analysis — top 3 competitors, strengths and takeaways
4. Industry Insights — 3-5 stats with relevance
5. Our Solution — approach for each service
6. Content Strategy Preview — 3-5 sample post ideas
7. Deliverables — specific items with quantities
8. 90-Day Roadmap — Month 1/2/3 actions
9. Investment — 3 tiers (Starter/Growth/Premium) with prices
10. Why Mazero — 4 reasons
11. Next Steps — 3 actions

Output the outline as bullet points under each numbered section. Be specific — use real competitor names and stats from the research.`,
        },
      ],
    })

    const outline =
      outlineResponse.content[0].type === 'text' ? outlineResponse.content[0].text : ''

    // 1-second delay between calls
    await sleep(1000)

    // --- Call 2: Full proposal from outline ---
    const proposalResponse = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Write a complete marketing proposal in markdown using this outline. Make it persuasive, specific, and professional — like a $10,000 custom proposal.

CLIENT: ${brief.companyName} | ${brief.industry}
SERVICES: ${brief.services}
BUDGET: ${brief.budget || 'Not specified'}
DATE: ${today}

OUTLINE:
${outline}

Start with:
# Marketing Proposal for ${brief.companyName}
*${brief.industry} | Prepared by Mazero Digital Marketing | ${today}*

> [Write a powerful 1-line tagline]

Then write all 11 sections (Executive Summary through Next Steps) in full prose with markdown formatting. Use headers (##), bullet points, bold text, and blockquotes. Reference specific data from the outline. End with a confident closing statement.`,
        },
      ],
    })

    const text =
      proposalResponse.content[0].type === 'text' ? proposalResponse.content[0].text : ''

    return NextResponse.json({ proposal: text })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[generate-proposal] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

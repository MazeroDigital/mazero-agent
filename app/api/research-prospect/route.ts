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
      ? `\n5. Look up their social media presence: ${brief.socialHandles}`
      : ''

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 10 }],
      messages: [
        {
          role: 'user',
          content: `You are a senior marketing researcher at Mazero Digital Marketing Agency. Conduct deep research on this prospect for a marketing proposal.

COMPANY: ${brief.companyName}
WEBSITE: ${brief.websiteUrl || 'Not provided'}
INDUSTRY: ${brief.industry}
CURRENT MARKETING: ${brief.currentMarketing || 'Unknown'}
PROBLEMS NOTED: ${brief.problems || 'None specified'}

Perform the following research:

1. Search for "${brief.companyName}" — find what they do, their positioning, recent news, and any notable achievements or challenges
2. Find their top 3 competitors in the ${brief.industry} space. For each competitor, analyze their marketing strategy, social media presence, and what they do well
3. Find 3-5 real, verifiable statistics about the ${brief.industry} industry — market size, growth rate, digital adoption rates, consumer behavior trends
4. Assess their current digital/online presence based on what you can find${socialContext}

Format your response EXACTLY as follows (use these exact headers):

## Company Overview
What you found about the company — positioning, size, recent news, notable achievements.

## Competitor Analysis

### [Competitor 1 Name]
- **Marketing Strategy:** What they're doing
- **Social Presence:** Follower counts, engagement, platforms
- **Key Strength:** What makes their marketing effective

### [Competitor 2 Name]
- **Marketing Strategy:** What they're doing
- **Social Presence:** Follower counts, engagement, platforms
- **Key Strength:** What makes their marketing effective

### [Competitor 3 Name]
- **Marketing Strategy:** What they're doing
- **Social Presence:** Follower counts, engagement, platforms
- **Key Strength:** What makes their marketing effective

## Industry Statistics
- **[Stat 1]:** [Value + context] — *Source: [source name]*
- **[Stat 2]:** [Value + context] — *Source: [source name]*
- **[Stat 3]:** [Value + context] — *Source: [source name]*
- **[Stat 4]:** [Value + context] — *Source: [source name]*
- **[Stat 5]:** [Value + context] — *Source: [source name]*

## Digital Presence Assessment
Analysis of their website, SEO indicators, social media activity, content quality, and gaps.

## Key Opportunities
1. [Opportunity based on competitor gaps]
2. [Opportunity based on industry trends]
3. [Opportunity based on their current weaknesses]
4. [Opportunity based on untapped channels/strategies]

Be specific, use real company names and real data. Do NOT fabricate statistics — only include stats you found through search. If you can't find exact numbers, note the approximation.`,
        },
      ],
    })

    // Extract text content from response (filter out tool use/result blocks)
    const textContent = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((b) => b.text)
      .join('\n')

    return NextResponse.json({ research: textContent })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[research-prospect] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

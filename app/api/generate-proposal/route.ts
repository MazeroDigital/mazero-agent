import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 120

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

    const prompt = `You are a senior marketing strategist at Mazero Digital Marketing Agency. You have just completed deep research on a prospect. Now generate a premium, comprehensive marketing proposal.

CLIENT BRIEF:
- Company: ${brief.companyName}
- Website: ${brief.websiteUrl || 'Not provided'}
- Industry: ${brief.industry}
- Current Marketing: ${brief.currentMarketing || 'Not provided'}
- Problems/Gaps Identified: ${brief.problems || 'Not provided'}
- Services to Pitch: ${brief.services}
- Budget Range: ${brief.budget || 'Not specified'}
- Additional Notes: ${brief.notes || 'None'}
- Date: ${today}

RESEARCH FINDINGS:
${research}

---

Generate a COMPLETE proposal with ALL of the following sections. Use markdown formatting. This must feel like a $10,000 custom proposal — specific, data-backed, and compelling.

# Marketing Proposal for ${brief.companyName}
*${brief.industry} | Prepared by Mazero Digital Marketing | ${today}*

> [Write a powerful 1-line tagline specific to their business and goals]

---

## 1. Executive Summary
A compelling 3-paragraph overview. Reference specific findings from the research. Make it clear you deeply understand their business. End with a bold statement about what you'll achieve together.

## 2. The Opportunity
Detail the gap between where they are and where they could be. Use the research data — reference their competitors' success, industry growth statistics, and specific weaknesses you found. Make it feel urgent. Include at least 2 statistics from the research.

## 3. Competitor Analysis
For each of the top 3 competitors found in research:
- What they're doing well in marketing
- Their estimated reach/following
- The key takeaway for ${brief.companyName}

End with: "Here's how we'll help you not just catch up — but lead."

## 4. Industry Insights
Present 3-5 statistics from the research as compelling insights. Format each as:
> **[Stat]** — [Why this matters for ${brief.companyName}]

## 5. Our Solution
Detail the strategic approach for each service being pitched (${brief.services}). For each service:
- What you'll do
- Why it works for their specific situation
- Expected impact

## 6. Content Strategy Preview
Create 3-5 ACTUAL sample content ideas specifically for ${brief.companyName}. For each:
- **Post Concept:** [specific idea]
- **Platform:** [where it goes]
- **Why It Works:** [1 sentence]

Make these creative, specific to their brand, and immediately impressive.

## 7. Deliverables
A detailed, itemized list with specific quantities. Format as a table-like structure:
- [Deliverable] — [Quantity/Frequency] — [Description]

Be specific (not "social media posts" but "12 Instagram carousel posts/month").

## 8. 90-Day Roadmap

### Month 1: Foundation
- [3-4 specific actions with details]

### Month 2: Growth
- [3-4 specific actions with details]

### Month 3: Scale
- [3-4 specific actions with details]

## 9. Investment
Present 3 tiers:

### Starter
- Price: [based on budget range or reasonable for scope]
- What's included: [bullet list]
- Best for: [who this suits]

### Growth (Recommended)
- Price: [mid-range]
- What's included: [bullet list]
- Best for: [who this suits]

### Premium
- Price: [high-end]
- What's included: [bullet list]
- Best for: [who this suits]

If a budget range was provided (${brief.budget || 'none'}), align the recommended tier with that range.

## 10. Why Mazero
4 compelling reasons to choose Mazero. Focus on:
- Results-driven approach with data
- Industry expertise in ${brief.industry}
- Full-service creative + strategy team
- Partnership mindset (not just another vendor)

## 11. Next Steps
A clear, actionable 3-step process to get started:
1. [Action 1]
2. [Action 2]
3. [Action 3]

End with a confident closing statement.

---

IMPORTANT GUIDELINES:
- Every section must reference specific data from the research — no generic filler
- Use real competitor names and real statistics found in the research
- Write with confidence and authority
- The tone should be professional but personable — like a trusted advisor, not a salesperson
- Include specific numbers wherever possible
- Make ${brief.companyName} feel like this proposal was built exclusively for them`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
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

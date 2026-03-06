import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { messages, currentProposal, research } = await req.json()

    const systemPrompt = `You are a senior marketing strategist at Mazero Digital Marketing Agency helping refine a proposal. Here is the current proposal:

---
${currentProposal}
---

${research ? `Here is the research that was used to create this proposal:\n---\n${research}\n---\n` : ''}

The user will ask you to modify specific sections, adjust tone, change pricing, add details, etc. When you make changes:

1. Return the FULL updated proposal with the changes applied (in markdown format), wrapped in [PROPOSAL_START] and [PROPOSAL_END] tags.
2. Before the proposal, briefly explain what you changed in 1-2 sentences.

If the user is just asking a question (not requesting changes), respond conversationally without the proposal tags.

The proposal has these sections: Executive Summary, The Opportunity, Competitor Analysis, Industry Insights, Our Solution, Content Strategy Preview, Deliverables, 90-Day Roadmap, Investment (3 tiers), Why Mazero, Next Steps.

Always maintain the professional, data-backed, persuasive tone. Reference the research data when adding new content. Keep all section numbers and structure intact unless asked to change them.`

    const client = new Anthropic({ apiKey })

    const stream = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: systemPrompt,
      messages,
      stream: true,
    })

    const encoder = new TextEncoder()

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    console.error('[refine-proposal] Error:', error)
    return new Response(JSON.stringify({ error: 'Failed to process request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

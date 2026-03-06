import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

export const maxDuration = 120

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

    const systemPrompt = `You are a senior proposal editor at Mazero Digital Marketing. You refine marketing proposals based on user requests.

CURRENT PROPOSAL:
---
${currentProposal}
---
${research ? `\nRESEARCH:\n---\n${research}\n---\n` : ''}
CRITICAL OUTPUT FORMAT:
When the user requests ANY change (pricing, tone, sections, content, wording, style, additions, removals, etc.), you MUST:
1. Write a brief explanation of what you changed (1-2 sentences max).
2. Then output the COMPLETE updated proposal between [PROPOSAL_START] and [PROPOSAL_END] tags.

Example format:
I've updated the pricing section to reflect the new budget.

[PROPOSAL_START]
# Proposal Title
## Section 1
...full content...
## Section 2
...full content...
[PROPOSAL_END]

MANDATORY RULES:
- You MUST include [PROPOSAL_START] and [PROPOSAL_END] tags whenever any change is requested. This is non-negotiable.
- Return the ENTIRE proposal with ALL sections, not just the changed parts.
- Keep all existing sections intact unless the user explicitly asks to remove them.
- If user says "add a slide/section", add a new ## section at the right place.
- If user says "remove", delete that section but keep everything else.
- ONLY skip the tags if the user asks a pure question with zero change requests.
- Maintain Mazero's professional, data-backed, persuasive tone.
- Use markdown formatting: # for title, ## for sections, ### for subsections, > for quotes, - for bullets.
- Do NOT truncate or summarize sections. Output the full proposal every time.`

    const client = new Anthropic({ apiKey })

    const stream = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
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

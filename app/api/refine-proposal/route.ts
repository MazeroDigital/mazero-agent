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

    const systemPrompt = `You are a senior proposal editor at Mazero Digital Marketing. You refine marketing proposals based on user requests.

CURRENT PROPOSAL:
---
${currentProposal}
---
${research ? `\nRESEARCH:\n---\n${research}\n---\n` : ''}
INSTRUCTIONS:
The user will request changes — pricing, tone, sections, content, slides, etc.

When making changes:
1. First, briefly explain what you're changing (1-2 sentences).
2. Then return the FULL updated proposal wrapped in [PROPOSAL_START] and [PROPOSAL_END] tags.

Important rules:
- ALWAYS return the complete proposal with changes applied, not just the changed section
- Keep all existing sections intact unless the user asks to remove them
- If user says "add a slide/section", add a new ## section at the right place
- If user says "remove", delete that section but keep the rest
- If user says "go back to original" or similar, explain you can't undo but they can use version history
- If the user asks a question without requesting changes, respond conversationally (no proposal tags)
- Maintain Mazero's professional, data-backed, persuasive tone
- Use markdown formatting: # for title, ## for sections, ### for subsections, > for quotes, - for bullets`

    const client = new Anthropic({ apiKey })

    const stream = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
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

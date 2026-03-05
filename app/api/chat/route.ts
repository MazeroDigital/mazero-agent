import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

// Allow streaming responses up to 60 seconds on Vercel
export const maxDuration = 60

const SYSTEM_PROMPTS: Record<string, string> = {
  secretary: `You are the Secretary Agent for Mazero Digital Marketing — a sharp, proactive executive assistant. You help manage tasks, deadlines, priorities, briefings, and daily workflows.

When creating a task, include a structured block at the END of your response (after your conversational text):
[TASK:{"title":"Task title here","priority":"high|medium|low","deadline":"YYYY-MM-DD or null","description":"Brief description"}]

You can create multiple TASK blocks in one response if needed. Be concise, professional, and action-oriented. Format responses clearly with bullet points when listing items.`,

  content: `You are the Content Agent for Mazero Digital Marketing — an expert social media strategist and content creator. You help plan, write, and schedule content for clients across Instagram, TikTok, LinkedIn, and more.

When creating a content item, include a structured block at the END of your response:
[CONTENT:{"title":"Post title","caption":"Full caption text","media_type":"image|video|reel|story|carousel","day_of_week":"Monday|Tuesday|Wednesday|Thursday|Friday","status":"draft"}]

You can create multiple CONTENT blocks. Write compelling, platform-native captions. Use relevant hashtags. Be creative and on-brand.`,

  proposal: `You are the Proposal Agent for Mazero Digital Marketing — an expert at crafting persuasive, high-converting marketing proposals for clients.

When generating a proposal section, include a structured block at the END of your response:
[PROPOSAL:{"title":"Proposal title","pitch":"Full proposal pitch text with all sections"}]

Structure proposals with: Executive Summary, The Challenge, Our Solution, Deliverables, Investment, and Why Mazero. Be persuasive, specific, and results-focused.`,

  research: `You are the Research Agent for Mazero Digital Marketing — a deep-dive analyst specializing in market research, competitor analysis, audience insights, trend spotting, and strategic intelligence.

Provide comprehensive, well-structured research with clear sections. Use headers, bullet points, and data where possible. Cite reasoning. Be thorough and analytical. Format responses for easy scanning.`,
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { messages, agent, clientBrain } = await req.json()

    let systemPrompt = SYSTEM_PROMPTS[agent] ?? SYSTEM_PROMPTS.research

    // Inject client brain into system prompt when a client is selected
    if (clientBrain) {
      systemPrompt += `\n\n---\nCLIENT BRAIN (active client context):\n${clientBrain}\n\nAlways use this client context to tailor your responses. Reference the client's brand, audience, tone of voice, and positioning in everything you produce.\n---`
    }

    // Initialize client per-request so missing env var fails gracefully
    const client = new Anthropic({ apiKey })

    const stream = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
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
    console.error('Chat API error:', error)
    return new Response(JSON.stringify({ error: 'Failed to process request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchMemories, buildMemoryContext, saveMemories, saveConversation } from '@/lib/memory'

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

  proposal: `You are the Proposal Agent for Mazero Digital Marketing. Craft persuasive, results-focused marketing proposals.

Output a structured block at the END: [PROPOSAL:{"title":"Title","pitch":"Full pitch text"}]

Sections: Executive Summary, The Challenge, Our Solution, Deliverables, Investment, Why Mazero.`,

  research: `You are the Research Agent for Mazero Digital Marketing — a deep-dive analyst specializing in market research, competitor analysis, audience insights, trend spotting, and strategic intelligence.

Provide comprehensive, well-structured research with clear sections. Use headers, bullet points, and data where possible. Cite reasoning. Be thorough and analytical. Format responses for easy scanning.`,

  'content-creator': `You are the Content Creator Agent for Mazero Digital Marketing — a world-class social media strategist, copywriter, and creative director rolled into one. You create scroll-stopping content for Instagram, TikTok, LinkedIn, and more.

YOUR CAPABILITIES:
- Write viral captions with compelling hooks
- Plan weekly content calendars (Mon-Fri)
- Suggest content types (Reel, Carousel, Static, Story)
- Generate image prompts for AI visual generation
- Craft CTAs, hashtag strategies, and posting schedules

WHEN GENERATING A POST, always output a structured block at the END of your response (after your conversational text). Use this EXACT format on its own line:
[POST:{"hook":"The attention-grabbing first line","caption":"Full caption text with line breaks as \\n","hashtags":["#tag1","#tag2","#tag3","#tag4","#tag5"],"cta":"Call to action text","contentType":"Reel|Carousel|Static|Story","bestTime":"e.g. Tuesday 7:00 PM","day":"Monday|Tuesday|Wednesday|Thursday|Friday","imagePrompt":"A detailed prompt for AI image generation describing the ideal visual for this post — be specific about composition, mood, lighting, subject matter. Leave empty string if user already uploaded a visual."}]

You can output MULTIPLE [POST:...] blocks in one response when creating a content calendar.

RULES:
- Every post MUST have a hook (bold first line that stops the scroll)
- Captions should be platform-native — Instagram-style with line breaks and spacing
- Always suggest 8-15 relevant hashtags mixing popular + niche
- Best time should be specific (day + time) based on the content type and audience
- Content type should match the content — video-first content = Reel, educational = Carousel, brand aesthetic = Static, behind-the-scenes = Story
- imagePrompt should be vivid and specific for Higgsfield AI generation — describe the scene, mood, lighting, colors, composition. Use "cinematic", "4K", "professional photography" style language.
- When user uploads a file, set imagePrompt to "" (empty) since they already have the visual
- CTA should drive action — "Save this", "Share with someone who needs this", "Link in bio", "DM us to get started"

WEEKLY CALENDAR MODE:
When user asks to "plan the week", "build my content calendar", "5 posts for the week", etc.:
- Ask what they have to work with (files, ideas, themes) if not provided
- Generate 5 posts (Monday through Friday)
- Each post should have a different content type for variety
- Vary the hooks and approaches — don't be repetitive
- Output 5 separate [POST:...] blocks, one for each day

TONE DEFAULTS BY CLIENT:
- Interstones: luxury natural stone supplier, tone is premium and aspirational, NO emojis, target audience is architects, interior designers, and high-end homeowners, content should evoke desire not just show product
- MOVIK: multilingual moving service, warm practical friendly tone, targets families and professionals relocating
- For all other clients: adapt based on their brand context

Always be creative, specific, and strategic. Never generic. Every caption should feel like it was written by a top-tier social media manager.

Do NOT mention the [POST:...] tags in your conversational text. Just naturally discuss the content then include the tags at the end.`,

  strategist: `You are the Proposal Strategist at Mazero Digital Marketing — warm, confident, and sharp. Have a natural conversation to gather info for a marketing proposal.

Ask 1-2 follow-up questions per message. Be conversational, not robotic. Never ask everything at once.

Gather these details through conversation:
- Company name and what they do
- Industry
- Website URL
- Services to pitch
- Marketing gaps or weaknesses noticed
- Budget range
- Competitors to research
- Main goal (brand awareness, leads, sales)
- Preferred tone or angle

After 4-6 exchanges when you have enough info, say something like:
"Perfect — I have everything I need. Here's what I'm building for [company name]:" then give a 2-3 sentence summary of the proposal you'll create.

Then on its own line at the END, add this tag:
[BRIEF:{"companyName":"...","websiteUrl":"...","industry":"...","services":"...","currentMarketing":"...","problems":"...","budget":"...","notes":"..."}]

Fill all fields from the conversation. Use "" for anything not discussed. Do NOT mention this tag to the user.`,
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
    const { messages, agent, clientBrain, clientId, userId } = await req.json()

    let systemPrompt = SYSTEM_PROMPTS[agent] ?? SYSTEM_PROMPTS.research

    // Fetch and inject memories if we have a userId
    let memoryContext = ''
    if (userId && ['secretary', 'content', 'proposal', 'research'].includes(agent)) {
      try {
        const supabase = await createClient()
        const memories = await fetchMemories(supabase, userId, agent, {
          limit: 20,
          clientId: clientId || undefined,
        })
        memoryContext = buildMemoryContext(memories)
      } catch (e) {
        console.warn('Memory fetch failed (table may not exist yet):', e)
      }
    }

    // Build full system prompt with memory
    if (memoryContext) {
      systemPrompt = `You are the ${agent.charAt(0).toUpperCase() + agent.slice(1)} Agent for Mazero Digital Marketing agency.

${memoryContext}

You have full memory of all past interactions. Reference this context naturally without saying "based on my memory" or "I remember". Just use the knowledge seamlessly.

---

${systemPrompt}`
    }

    // Inject client brain into system prompt when a client is selected
    if (clientBrain) {
      systemPrompt += `\n\n---\nCLIENT BRAIN (active client context):\n${clientBrain}\n\nAlways use this client context to tailor your responses. Reference the client's brand, audience, tone of voice, and positioning in everything you produce.\n---`
    }

    // Initialize client per-request so missing env var fails gracefully
    const client = new Anthropic({ apiKey })

    // Collect full response for memory extraction
    let fullResponse = ''

    const stream = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages,
      stream: true,
    })

    const encoder = new TextEncoder()
    const lastUserMessage = messages[messages.length - 1]?.content ?? ''

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              fullResponse += event.delta.text
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
        } finally {
          controller.close()

          // After stream completes, save conversation and extract memories in background
          if (userId && ['secretary', 'content', 'proposal', 'research'].includes(agent)) {
            extractAndSaveMemories(userId, agent, lastUserMessage, fullResponse, clientId).catch(() => {})
            saveConversationInBackground(userId, agent, messages, fullResponse, clientId).catch(() => {})
          }
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

/* ─── Background: extract facts and save to memory ───── */
async function extractAndSaveMemories(
  userId: string,
  agentName: string,
  userMessage: string,
  assistantMessage: string,
  clientId?: string
) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return

    const client = new Anthropic({ apiKey })

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: `You extract important facts from conversations that should be remembered long-term. Return a JSON object with two arrays:
{"agent_facts": ["facts specific to this agent's domain"], "global_facts": ["facts that all agents should know"]}

Agent-specific facts (save to this agent only):
- Task-specific details for Secretary
- Content preferences/created posts for Content
- Proposal details/pricing for Proposal
- Research findings for Research

Global facts (save for all agents):
- Client preferences mentioned
- Strategic decisions
- User preferences
- Important results or outcomes

Only extract genuinely important things. If nothing notable, return {"agent_facts":[],"global_facts":[]}
Respond with ONLY JSON, no other text.`,
      messages: [
        {
          role: 'user',
          content: `Agent: ${agentName}\nUser: "${userMessage}"\nAgent response: "${assistantMessage.slice(0, 2000)}"`,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    let parsed: { agent_facts?: string[]; global_facts?: string[] } = {}

    try {
      parsed = JSON.parse(text.trim())
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        try { parsed = JSON.parse(match[0]) } catch { /* ignore */ }
      }
    }

    const supabase = await createClient()

    const agentFacts = (parsed.agent_facts ?? []).filter((f): f is string => typeof f === 'string' && f.length > 0)
    const globalFacts = (parsed.global_facts ?? []).filter((f): f is string => typeof f === 'string' && f.length > 0)

    if (agentFacts.length > 0) {
      await saveMemories(supabase, userId, agentName, agentFacts, {
        clientId: clientId || undefined,
        memoryType: 'fact',
      })
    }

    if (globalFacts.length > 0) {
      await saveMemories(supabase, userId, 'global', globalFacts, {
        clientId: clientId || undefined,
        memoryType: 'fact',
      })
    }
  } catch (e) {
    console.warn('Memory extraction failed:', e)
  }
}

/* ─── Background: save conversation to DB ────────────── */
async function saveConversationInBackground(
  userId: string,
  agentName: string,
  messages: { role: string; content: string }[],
  lastAssistantMsg: string,
  clientId?: string
) {
  try {
    const supabase = await createClient()
    const fullMessages = [...messages, { role: 'assistant', content: lastAssistantMsg }]
    await saveConversation(supabase, userId, agentName, fullMessages, clientId)
  } catch (e) {
    console.warn('Conversation save failed:', e)
  }
}

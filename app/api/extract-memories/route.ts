import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return Response.json({ facts: [] })
  }

  try {
    const { userMessage, assistantMessage, agentName } = await req.json()

    const client = new Anthropic({ apiKey })

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: `You extract important facts from conversations that should be remembered long-term. Return a JSON array of short, specific fact strings. Only extract genuinely important things worth remembering:
- Client preferences or decisions ("Client prefers short captions for Instagram")
- Key outcomes or results ("The stone texture post campaign got 33k views")
- User preferences ("User likes bullet-point format responses")
- Strategic decisions ("Decided to focus Instagram strategy for Interstones on luxury lifestyle content")
- Important dates or deadlines mentioned
- Pricing decisions or budget info

Do NOT extract:
- Generic greetings or small talk
- Questions without answers
- Temporary or one-time information
- Things that are obvious from context

If nothing important was said, return an empty array: []
Always respond with ONLY a JSON array, no other text.`,
      messages: [
        {
          role: 'user',
          content: `Agent: ${agentName}\n\nUser said: "${userMessage}"\n\nAgent responded: "${assistantMessage.slice(0, 1500)}"`,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '[]'

    // Parse the JSON array from the response
    let facts: string[] = []
    try {
      const parsed = JSON.parse(text.trim())
      if (Array.isArray(parsed)) {
        facts = parsed.filter((f: unknown) => typeof f === 'string' && f.length > 0)
      }
    } catch {
      // Try to extract JSON array from response if it has extra text
      const match = text.match(/\[[\s\S]*\]/)
      if (match) {
        try {
          const parsed = JSON.parse(match[0])
          if (Array.isArray(parsed)) {
            facts = parsed.filter((f: unknown) => typeof f === 'string' && f.length > 0)
          }
        } catch { /* ignore */ }
      }
    }

    return Response.json({ facts })
  } catch (error) {
    console.error('Memory extraction error:', error)
    return Response.json({ facts: [] })
  }
}

import { SupabaseClient } from '@supabase/supabase-js'

export type MemoryType = 'conversation' | 'fact' | 'preference' | 'client_context'
export type AgentName = 'secretary' | 'content' | 'proposal' | 'research' | 'global'

export interface Memory {
  id: string
  user_id: string
  agent_name: AgentName
  memory_type: MemoryType
  content: string
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface ConversationRecord {
  id: string
  user_id: string
  agent_name: string
  messages: { role: string; content: string }[]
  client_id: string | null
  created_at: string
  updated_at: string
}

/* ─── Fetch memories for an agent ─────────────────────── */
export async function fetchMemories(
  supabase: SupabaseClient,
  userId: string,
  agentName: string,
  opts?: { limit?: number; clientId?: string }
) {
  const limit = opts?.limit ?? 20

  // Agent-specific memories
  const { data: agentMemories } = await supabase
    .from('agent_memory')
    .select('*')
    .eq('user_id', userId)
    .eq('agent_name', agentName)
    .order('updated_at', { ascending: false })
    .limit(limit)

  // Global memories (shared across all agents)
  const { data: globalMemories } = await supabase
    .from('agent_memory')
    .select('*')
    .eq('user_id', userId)
    .eq('agent_name', 'global')
    .order('updated_at', { ascending: false })
    .limit(10)

  // Client-specific memories (from any agent, tagged with this client)
  let clientMemories: Memory[] = []
  if (opts?.clientId) {
    const { data } = await supabase
      .from('agent_memory')
      .select('*')
      .eq('user_id', userId)
      .eq('memory_type', 'client_context')
      .contains('metadata', { client_id: opts.clientId })
      .order('updated_at', { ascending: false })
      .limit(10)
    clientMemories = data ?? []
  }

  return {
    agentMemories: (agentMemories ?? []) as Memory[],
    globalMemories: (globalMemories ?? []) as Memory[],
    clientMemories: clientMemories as Memory[],
  }
}

/* ─── Build memory context string for injection ──────── */
export function buildMemoryContext(memories: {
  agentMemories: Memory[]
  globalMemories: Memory[]
  clientMemories: Memory[]
}): string {
  const parts: string[] = []

  if (memories.globalMemories.length > 0) {
    parts.push('WHAT YOU REMEMBER (shared knowledge):')
    memories.globalMemories.forEach((m) => {
      parts.push(`- ${m.content}`)
    })
  }

  if (memories.agentMemories.length > 0) {
    parts.push('\nYOUR PREVIOUS CONTEXT (from past conversations):')
    memories.agentMemories.forEach((m) => {
      parts.push(`- ${m.content}`)
    })
  }

  if (memories.clientMemories.length > 0) {
    parts.push('\nCLIENT-SPECIFIC CONTEXT (from all agents):')
    memories.clientMemories.forEach((m) => {
      const agent = m.agent_name !== 'global' ? ` [from ${m.agent_name}]` : ''
      parts.push(`- ${m.content}${agent}`)
    })
  }

  return parts.join('\n')
}

/* ─── Save memories from extracted facts ─────────────── */
export async function saveMemories(
  supabase: SupabaseClient,
  userId: string,
  agentName: string,
  facts: string[],
  opts?: { clientId?: string; memoryType?: MemoryType }
) {
  if (facts.length === 0) return

  const records = facts.map((fact) => ({
    user_id: userId,
    agent_name: agentName,
    memory_type: opts?.memoryType ?? 'fact',
    content: fact,
    metadata: opts?.clientId ? { client_id: opts.clientId } : null,
  }))

  await supabase.from('agent_memory').insert(records)
}

/* ─── Save/load conversation history ─────────────────── */
export async function saveConversation(
  supabase: SupabaseClient,
  userId: string,
  agentName: string,
  messages: { role: string; content: string }[],
  clientId?: string
) {
  // Upsert — one active conversation per agent per user
  const { data: existing } = await supabase
    .from('agent_conversations')
    .select('id')
    .eq('user_id', userId)
    .eq('agent_name', agentName)
    .limit(1)
    .single()

  if (existing) {
    await supabase
      .from('agent_conversations')
      .update({
        messages: JSON.stringify(messages),
        client_id: clientId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('agent_conversations')
      .insert({
        user_id: userId,
        agent_name: agentName,
        messages: JSON.stringify(messages),
        client_id: clientId || null,
      })
  }
}

export async function loadConversation(
  supabase: SupabaseClient,
  userId: string,
  agentName: string
): Promise<{ messages: { role: string; content: string }[]; clientId: string | null } | null> {
  const { data } = await supabase
    .from('agent_conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('agent_name', agentName)
    .limit(1)
    .single()

  if (!data) return null

  let messages: { role: string; content: string }[]
  try {
    messages = typeof data.messages === 'string' ? JSON.parse(data.messages) : data.messages
  } catch {
    return null
  }

  return { messages, clientId: data.client_id }
}

export async function deleteConversation(
  supabase: SupabaseClient,
  userId: string,
  agentName: string
) {
  await supabase
    .from('agent_conversations')
    .delete()
    .eq('user_id', userId)
    .eq('agent_name', agentName)
}

/* ─── Delete a single memory ─────────────────────────── */
export async function deleteMemory(supabase: SupabaseClient, memoryId: string) {
  await supabase.from('agent_memory').delete().eq('id', memoryId)
}

/* ─── Fetch all memories for the panel UI ────────────── */
export async function fetchAllMemoriesForAgent(
  supabase: SupabaseClient,
  userId: string,
  agentName: string
): Promise<{ agent: Memory[]; global: Memory[] }> {
  const [{ data: agent }, { data: global }] = await Promise.all([
    supabase
      .from('agent_memory')
      .select('*')
      .eq('user_id', userId)
      .eq('agent_name', agentName)
      .order('updated_at', { ascending: false })
      .limit(50),
    supabase
      .from('agent_memory')
      .select('*')
      .eq('user_id', userId)
      .eq('agent_name', 'global')
      .order('updated_at', { ascending: false })
      .limit(30),
  ])

  return {
    agent: (agent ?? []) as Memory[],
    global: (global ?? []) as Memory[],
  }
}

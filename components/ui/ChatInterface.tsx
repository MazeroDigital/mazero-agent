'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

/* ─── Types ──────────────────────────────────────────── */
interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ClientOption {
  id: string
  name: string
  brain: string | null
}

interface AgentConfig {
  id: string
  label: string
  color: string
  bgColor: string
  initial: string
  title: string
  subtitle: string
  placeholder: string
  suggestions: string[]
}

interface MemoryItem {
  id: string
  agent_name: string
  memory_type: string
  content: string
  created_at: string
}

/* ─── Agent configs ───────────────────────────────────── */
const AGENT_CONFIGS: Record<string, AgentConfig> = {
  secretary: {
    id: 'secretary',
    label: 'Secretary',
    color: '#ff6b4a',
    bgColor: 'rgba(255,107,74,0.1)',
    initial: 'S',
    title: 'Secretary Agent',
    subtitle: 'Your executive assistant for tasks, priorities, scheduling, and daily operations.',
    placeholder: 'Ask me to create tasks, plan your week, draft briefings…',
    suggestions: [
      'What should I focus on today?',
      'Create a task for the client proposal due Friday',
      'Help me prioritize my current workload',
      'Draft a team standup briefing for this week',
    ],
  },
  content: {
    id: 'content',
    label: 'Content',
    color: '#3b82f6',
    bgColor: 'rgba(59,130,246,0.1)',
    initial: 'C',
    title: 'Content Agent',
    subtitle: 'Expert social media strategist. Plan, write, and schedule content for your clients.',
    placeholder: 'Ask me to write captions, plan a content calendar, or brainstorm ideas…',
    suggestions: [
      'Write 5 Instagram captions for a coffee shop',
      'Plan a week of content for a fitness brand',
      'Create a TikTok strategy for a skincare client',
      'Write a LinkedIn post about digital marketing trends',
    ],
  },
  proposal: {
    id: 'proposal',
    label: 'Proposal',
    color: '#a855f7',
    bgColor: 'rgba(168,85,247,0.1)',
    initial: 'P',
    title: 'Proposal Agent',
    subtitle: 'Craft persuasive, high-converting marketing proposals for your clients.',
    placeholder: "Describe your client and I'll build a full proposal…",
    suggestions: [
      'Write a social media proposal for a restaurant',
      'Create a full digital marketing proposal for an e-commerce brand',
      'Draft a content strategy proposal for a startup',
      'Build a paid ads proposal for a local services business',
    ],
  },
  research: {
    id: 'research',
    label: 'Research',
    color: '#10b981',
    bgColor: 'rgba(16,185,129,0.1)',
    initial: 'R',
    title: 'Research Agent',
    subtitle: 'Deep-dive analysis, competitor intelligence, audience insights, and trend spotting.',
    placeholder: 'Ask me to research a market, analyse competitors, or spot trends…',
    suggestions: [
      'Analyse the social media landscape for a fitness brand',
      'Who are the top competitors in digital marketing in South Africa?',
      'What content trends are dominating Instagram right now?',
      'Research the target audience for a luxury fashion brand',
    ],
  },
}

/* ─── Simple Markdown Renderer ───────────────────────── */
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim().startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      nodes.push(<pre key={`pre-${i}`}><code>{codeLines.join('\n')}</code></pre>)
      i++
      continue
    }

    if (line.startsWith('## ')) { nodes.push(<h2 key={`h2-${i}`}>{inlineMarkdown(line.slice(3))}</h2>); i++; continue }
    if (line.startsWith('### ')) { nodes.push(<h3 key={`h3-${i}`}>{inlineMarkdown(line.slice(4))}</h3>); i++; continue }
    if (line.startsWith('# ')) { nodes.push(<h2 key={`h1-${i}`}>{inlineMarkdown(line.slice(2))}</h2>); i++; continue }

    if (line.match(/^[-*+]\s/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^[-*+]\s/)) { items.push(lines[i].replace(/^[-*+]\s/, '')); i++ }
      nodes.push(<ul key={`ul-${i}`}>{items.map((item, idx) => <li key={idx}>{inlineMarkdown(item)}</li>)}</ul>)
      continue
    }

    if (line.match(/^\d+\.\s/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) { items.push(lines[i].replace(/^\d+\.\s/, '')); i++ }
      nodes.push(<ol key={`ol-${i}`}>{items.map((item, idx) => <li key={idx}>{inlineMarkdown(item)}</li>)}</ol>)
      continue
    }

    if (line.startsWith('> ')) { nodes.push(<blockquote key={`bq-${i}`}>{inlineMarkdown(line.slice(2))}</blockquote>); i++; continue }
    if (line.match(/^[-*_]{3,}$/)) { nodes.push(<hr key={`hr-${i}`} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '12px 0' }} />); i++; continue }
    if (line.trim() === '') { i++; continue }

    nodes.push(<p key={`p-${i}`}>{inlineMarkdown(line)}</p>)
    i++
  }

  return nodes
}

function inlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={idx}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={idx}>{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={idx}>{part.slice(1, -1)}</code>
    return part
  })
}

/* ─── Icons ──────────────────────────────────────────── */
function AgentDot({ config }: { config: AgentConfig }) {
  return (
    <div
      style={{
        width: '8px', height: '8px', borderRadius: '50%',
        background: config.color, boxShadow: `0 0 8px ${config.color}60`,
        flexShrink: 0, marginTop: '8px',
      }}
    />
  )
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function MemoryIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
      <line x1="10" y1="22" x2="14" y2="22" />
    </svg>
  )
}

function TrashSmallIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

/* ─── Memory Panel ───────────────────────────────────── */
function MemoryPanel({
  agent,
  onClose,
}: {
  agent: string
  onClose: () => void
}) {
  const [agentMems, setAgentMems] = useState<MemoryItem[]>([])
  const [globalMems, setGlobalMems] = useState<MemoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/memories?agent=${agent}`)
      .then((r) => r.json())
      .then((data) => {
        setAgentMems(data.agent ?? [])
        setGlobalMems(data.global ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [agent])

  async function handleDelete(id: string) {
    await fetch('/api/memories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setAgentMems((prev) => prev.filter((m) => m.id !== id))
    setGlobalMems((prev) => prev.filter((m) => m.id !== id))
  }

  const renderMem = (mem: MemoryItem) => (
    <div
      key={mem.id}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '8px',
        padding: '8px 10px', borderRadius: '6px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.04)',
        fontSize: '12px', color: '#888', lineHeight: '1.5',
      }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>{mem.content}</span>
      <button
        onClick={() => handleDelete(mem.id)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#333', padding: '2px', flexShrink: 0,
          transition: 'color 0.15s', borderRadius: '4px',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#ff6b4a' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#333' }}
        title="Delete memory"
      >
        <TrashSmallIcon />
      </button>
    </div>
  )

  return (
    <div
      style={{
        position: 'absolute', top: '48px', right: '16px', width: '340px',
        maxHeight: '70vh', overflowY: 'auto',
        background: 'rgba(20,20,20,0.95)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
        padding: '16px', zIndex: 40,
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: '500', color: '#e8e8e8', letterSpacing: '0.04em' }}>
          Agent Memory
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', color: '#555', cursor: 'pointer',
            fontSize: '16px', padding: '0 4px', lineHeight: 1,
          }}
        >
          &times;
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#555', fontSize: '12px', padding: '20px 0', textAlign: 'center' }}>Loading…</div>
      ) : (
        <>
          {agentMems.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '10px', fontWeight: '500', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                {agent} memories ({agentMems.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {agentMems.map(renderMem)}
              </div>
            </div>
          )}

          {globalMems.length > 0 && (
            <div>
              <div style={{ fontSize: '10px', fontWeight: '500', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                Shared memories ({globalMems.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {globalMems.map(renderMem)}
              </div>
            </div>
          )}

          {agentMems.length === 0 && globalMems.length === 0 && (
            <div style={{ color: '#555', fontSize: '12px', padding: '20px 0', textAlign: 'center' }}>
              No memories yet. Start chatting and important facts will be saved automatically.
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ─── Main Component ──────────────────────────────────── */
export default function ChatInterface({ agent }: { agent: string }) {
  const config = AGENT_CONFIGS[agent] ?? AGENT_CONFIGS.secretary
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<ClientOption[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [showMemory, setShowMemory] = useState(false)
  const [conversationLoaded, setConversationLoaded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load user, clients, and restore conversation
  useEffect(() => {
    const supabase = createClient()

    // Get user ID
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })

    // Load clients
    supabase
      .from('clients')
      .select('id, name, brain')
      .order('name')
      .then(({ data }) => setClients(data ?? []))

    // Restore previous conversation
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setConversationLoaded(true); return }

      supabase
        .from('agent_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('agent_name', agent)
        .limit(1)
        .single()
        .then(({ data, error }) => {
          if (data && !error) {
            try {
              const msgs = typeof data.messages === 'string' ? JSON.parse(data.messages) : data.messages
              if (Array.isArray(msgs) && msgs.length > 0) {
                setMessages(msgs)
                if (data.client_id) setSelectedClientId(data.client_id)
              }
            } catch { /* ignore */ }
          }
          setConversationLoaded(true)
        })
    })
  }, [agent])

  const sendMessage = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim()
      if (!content || loading) return

      const userMsg: Message = { role: 'user', content }
      const history = [...messages, userMsg]
      setMessages(history)
      setInput('')
      setLoading(true)

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }

      abortRef.current = new AbortController()

      try {
        const selectedClient = clients.find((c) => c.id === selectedClientId)
        const clientBrain = selectedClient?.brain ?? undefined

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.content })),
            agent,
            clientBrain,
            clientId: selectedClientId || undefined,
            userId: userId || undefined,
          }),
          signal: abortRef.current.signal,
        })

        if (!res.ok || !res.body) throw new Error('Request failed')

        setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

        const reader = res.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: updated[updated.length - 1].content + chunk,
            }
            return updated
          })
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Something went wrong connecting to the AI. Please check your API key and try again.',
          },
        ])
      } finally {
        setLoading(false)
        abortRef.current = null
      }
    },
    [input, loading, messages, agent, selectedClientId, clients, userId]
  )

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  async function clearChat() {
    if (loading && abortRef.current) abortRef.current.abort()
    setMessages([])
    setInput('')
    setLoading(false)

    // Delete saved conversation
    if (userId) {
      const supabase = createClient()
      supabase
        .from('agent_conversations')
        .delete()
        .eq('user_id', userId)
        .eq('agent_name', agent)
        .then(() => {})
    }
  }

  const canSend = input.trim().length > 0 && !loading
  const isEmpty = messages.length === 0

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#0a0a0a',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          padding: '12px 32px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(20,20,20,0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: config.color, boxShadow: `0 0 8px ${config.color}60`,
            }}
          />
          <div>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#e8e8e8', lineHeight: 1.2 }}>
              {config.title}
            </div>
            <div style={{ fontSize: '11px', color: '#555', marginTop: '1px' }}>
              claude-sonnet-4-6 · memory enabled
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Client context selector */}
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            style={{
              background: selectedClientId ? 'rgba(255,107,74,0.06)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${selectedClientId ? 'rgba(255,107,74,0.15)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '8px',
              color: selectedClientId ? '#ff9a6c' : '#555',
              fontSize: '12px', fontWeight: '400', padding: '5px 10px',
              cursor: 'pointer', fontFamily: 'inherit', outline: 'none', maxWidth: '160px',
            }}
          >
            <option value="">No client context</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id} disabled={!c.brain}>
                {c.name}{!c.brain ? ' (no brain)' : ''}
              </option>
            ))}
          </select>

          {/* Memory button */}
          <button
            onClick={() => setShowMemory(!showMemory)}
            title="View agent memory"
            style={{
              background: showMemory ? 'rgba(255,107,74,0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${showMemory ? 'rgba(255,107,74,0.2)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '8px',
              color: showMemory ? '#ff6b4a' : '#555',
              padding: '5px 8px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '11px', fontWeight: '400', fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!showMemory) {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                e.currentTarget.style.color = '#888'
              }
            }}
            onMouseLeave={(e) => {
              if (!showMemory) {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.color = '#555'
              }
            }}
          >
            <MemoryIcon />
            Memory
          </button>

          {messages.length > 0 && (
            <button
              onClick={clearChat}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#555', fontSize: '12px', fontWeight: '400',
                padding: '5px 14px', cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.borderColor = 'rgba(255,255,255,0.15)'
                el.style.color = '#888'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.borderColor = 'rgba(255,255,255,0.08)'
                el.style.color = '#555'
              }}
            >
              New chat
            </button>
          )}
        </div>

        {/* Memory panel */}
        {showMemory && <MemoryPanel agent={agent} onClose={() => setShowMemory(false)} />}
      </div>

      {/* Message area */}
      <div
        style={{
          flex: 1, overflowY: 'auto',
          padding: isEmpty ? '0' : '28px 32px',
          display: 'flex', flexDirection: 'column', minHeight: 0,
        }}
      >
        {/* Empty state */}
        {isEmpty && conversationLoaded && (
          <div
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '40px 32px', minHeight: 0,
            }}
            className="animate-fadeIn"
          >
            <div
              style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: config.color, boxShadow: `0 0 20px ${config.color}60`,
                marginBottom: '24px',
              }}
            />
            <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#e8e8e8', marginBottom: '8px', textAlign: 'center' }}>
              {config.title}
            </h1>
            <p style={{ fontSize: '14px', color: '#555', textAlign: 'center', marginBottom: '40px', maxWidth: '420px', lineHeight: 1.6 }}>
              {config.subtitle}
            </p>

            <div
              style={{
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px', width: '100%', maxWidth: '560px',
              }}
            >
              {config.suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px', padding: '14px 16px',
                    fontSize: '13px', color: '#888', cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.2s ease',
                    textAlign: 'left', lineHeight: '1.45',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.borderColor = 'rgba(255,255,255,0.12)'
                    el.style.color = '#e8e8e8'
                    el.style.background = 'rgba(255,255,255,0.05)'
                    el.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.borderColor = 'rgba(255,255,255,0.06)'
                    el.style.color = '#888'
                    el.style.background = 'rgba(255,255,255,0.03)'
                    el.style.transform = 'translateY(0)'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {!isEmpty && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '760px', margin: '0 auto', width: '100%' }}>
            {messages.map((msg, i) => {
              const isLast = i === messages.length - 1
              const isTyping = isLast && loading && msg.role === 'assistant' && msg.content === ''

              if (msg.role === 'user') {
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'flex-end' }} className="animate-fadeIn">
                    <div className="msg-user">{msg.content}</div>
                  </div>
                )
              }

              return (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }} className="animate-fadeIn">
                  <AgentDot config={config} />
                  <div className="msg-assistant">
                    {isTyping ? (
                      <div style={{ display: 'flex', gap: '5px', padding: '4px 0', alignItems: 'center' }}>
                        <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                      </div>
                    ) : (
                      renderMarkdown(msg.content)
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div style={{ padding: '16px 32px 20px', flexShrink: 0 }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', position: 'relative' }}>
          <div
            style={{
              position: 'relative',
              background: 'rgba(20,20,20,0.8)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={config.placeholder}
              rows={1}
              className="chat-input"
              style={{ display: 'block', background: 'transparent', border: 'none' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!canSend}
              style={{
                position: 'absolute', right: '8px', bottom: '8px',
                width: '36px', height: '36px', borderRadius: '50%',
                background: canSend ? 'linear-gradient(135deg, #ff6b4a, #ff9a6c)' : 'rgba(255,255,255,0.04)',
                border: 'none',
                cursor: canSend ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease', flexShrink: 0,
                color: canSend ? '#fff' : '#333',
                boxShadow: canSend ? '0 0 16px rgba(255,107,74,0.3)' : 'none',
              }}
            >
              <SendIcon />
            </button>
          </div>
        </div>
        <p style={{ fontSize: '11px', color: '#333', textAlign: 'center', maxWidth: '760px', margin: '10px auto 0' }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}

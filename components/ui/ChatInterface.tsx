'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

/* ─── Types ──────────────────────────────────────────── */
interface Message {
  role: 'user' | 'assistant'
  content: string
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

/* ─── Agent configs ───────────────────────────────────── */
const AGENT_CONFIGS: Record<string, AgentConfig> = {
  secretary: {
    id: 'secretary',
    label: 'Secretary',
    color: '#f5a623',
    bgColor: 'rgba(245,166,35,0.12)',
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
    bgColor: 'rgba(59,130,246,0.12)',
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
    bgColor: 'rgba(168,85,247,0.12)',
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
    bgColor: 'rgba(16,185,129,0.12)',
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

/* ─── Simple Markdown Renderer ─────────────────────────
   Converts common markdown to JSX without an external lib */
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Code block
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3)
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      nodes.push(
        <pre key={`pre-${i}`}>
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
      i++
      continue
    }

    // H2
    if (line.startsWith('## ')) {
      nodes.push(<h2 key={`h2-${i}`}>{inlineMarkdown(line.slice(3))}</h2>)
      i++
      continue
    }

    // H3
    if (line.startsWith('### ')) {
      nodes.push(<h3 key={`h3-${i}`}>{inlineMarkdown(line.slice(4))}</h3>)
      i++
      continue
    }

    // H1 → render as h2
    if (line.startsWith('# ')) {
      nodes.push(<h2 key={`h1-${i}`}>{inlineMarkdown(line.slice(2))}</h2>)
      i++
      continue
    }

    // Unordered list
    if (line.match(/^[-*+]\s/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^[-*+]\s/)) {
        items.push(lines[i].replace(/^[-*+]\s/, ''))
        i++
      }
      nodes.push(
        <ul key={`ul-${i}`}>
          {items.map((item, idx) => (
            <li key={idx}>{inlineMarkdown(item)}</li>
          ))}
        </ul>
      )
      continue
    }

    // Ordered list
    if (line.match(/^\d+\.\s/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push(lines[i].replace(/^\d+\.\s/, ''))
        i++
      }
      nodes.push(
        <ol key={`ol-${i}`}>
          {items.map((item, idx) => (
            <li key={idx}>{inlineMarkdown(item)}</li>
          ))}
        </ol>
      )
      continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      nodes.push(<blockquote key={`bq-${i}`}>{inlineMarkdown(line.slice(2))}</blockquote>)
      i++
      continue
    }

    // Horizontal rule
    if (line.match(/^[-*_]{3,}$/)) {
      nodes.push(<hr key={`hr-${i}`} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />)
      i++
      continue
    }

    // Empty line → paragraph break (skip consecutive empties)
    if (line.trim() === '') {
      i++
      continue
    }

    // Regular paragraph
    nodes.push(<p key={`p-${i}`}>{inlineMarkdown(line)}</p>)
    i++
  }

  return nodes
}

function inlineMarkdown(text: string): React.ReactNode {
  // Split on **bold**, *italic*, `code`, handling mixed patterns
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={idx}>{part.slice(1, -1)}</em>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={idx}>{part.slice(1, -1)}</code>
    }
    return part
  })
}

/* ─── Agent Avatar ────────────────────────────────────── */
function AgentAvatar({ config }: { config: AgentConfig }) {
  return (
    <div
      style={{
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        background: config.bgColor,
        border: `1.5px solid ${config.color}44`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '11px',
        fontWeight: '800',
        color: config.color,
        flexShrink: 0,
        marginTop: '2px',
        fontFamily: 'var(--font-syne), sans-serif',
      }}
    >
      {config.initial}
    </div>
  )
}

/* ─── Send Icon ───────────────────────────────────────── */
function SendIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? '#fff' : 'var(--text-muted)'}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

/* ─── Main Component ──────────────────────────────────── */
export default function ChatInterface({ agent }: { agent: string }) {
  const config = AGENT_CONFIGS[agent] ?? AGENT_CONFIGS.secretary
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.content })),
            agent,
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
    [input, loading, messages, agent]
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

  function clearChat() {
    if (loading && abortRef.current) abortRef.current.abort()
    setMessages([])
    setInput('')
    setLoading(false)
  }

  const canSend = input.trim().length > 0 && !loading
  const isEmpty = messages.length === 0

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#f7f8fc',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          padding: '14px 32px',
          borderBottom: '1px solid var(--border)',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: config.bgColor,
              border: `1.5px solid ${config.color}44`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: '800',
              color: config.color,
              fontFamily: 'var(--font-syne), sans-serif',
            }}
          >
            {config.initial}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {config.title}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
              Powered by Claude · claude-sonnet-4-6
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-strong)',
              borderRadius: '7px',
              color: 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: '600',
              padding: '5px 14px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-secondary)'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'
            }}
          >
            New chat
          </button>
        )}
      </div>

      {/* Message area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: isEmpty ? '0' : '28px 32px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        {/* Empty state */}
        {isEmpty && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 32px',
              minHeight: 0,
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: config.bgColor,
                border: `1.5px solid ${config.color}44`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: '800',
                color: config.color,
                marginBottom: '20px',
                fontFamily: 'var(--font-syne), sans-serif',
              }}
            >
              {config.initial}
            </div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: '800',
                color: 'var(--text-primary)',
                marginBottom: '10px',
                textAlign: 'center',
                fontFamily: 'var(--font-syne), sans-serif',
              }}
            >
              {config.title}
            </h1>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                marginBottom: '40px',
                maxWidth: '420px',
                lineHeight: 1.6,
              }}
            >
              {config.subtitle}
            </p>

            {/* Suggestion chips */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px',
                width: '100%',
                maxWidth: '580px',
              }}
            >
              {config.suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  style={{
                    background: '#fff',
                    border: '1.5px solid var(--border)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                    lineHeight: '1.45',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.borderColor = config.color + '66'
                    el.style.color = 'var(--text-primary)'
                    el.style.boxShadow = `0 2px 8px rgba(0,0,0,0.08), 0 0 0 3px ${config.color}12`
                    el.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.borderColor = 'var(--border)'
                    el.style.color = 'var(--text-secondary)'
                    el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {messages.map((msg, i) => {
              const isLast = i === messages.length - 1
              const isTyping = isLast && loading && msg.role === 'assistant' && msg.content === ''

              if (msg.role === 'user') {
                return (
                  <div
                    key={i}
                    style={{ display: 'flex', justifyContent: 'flex-end' }}
                    className="animate-fadeIn"
                  >
                    <div className="msg-user">{msg.content}</div>
                  </div>
                )
              }

              return (
                <div
                  key={i}
                  style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}
                  className="animate-fadeIn"
                >
                  <AgentAvatar config={config} />
                  <div className="msg-assistant">
                    {isTyping ? (
                      <div style={{ display: 'flex', gap: '5px', padding: '4px 0', alignItems: 'center' }}>
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-dot" />
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
      <div
        style={{
          padding: '16px 32px 20px',
          background: '#fff',
          borderTop: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <div style={{ maxWidth: '760px', margin: '0 auto', position: 'relative' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={config.placeholder}
            rows={1}
            className="chat-input"
            style={{ display: 'block' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!canSend}
            style={{
              position: 'absolute',
              right: '10px',
              bottom: '10px',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: canSend ? config.color : 'var(--bg-secondary)',
              border: 'none',
              cursor: canSend ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              flexShrink: 0,
              boxShadow: canSend ? `0 2px 8px ${config.color}44` : 'none',
            }}
          >
            <SendIcon active={canSend} />
          </button>
        </div>
        <p
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: '10px',
            maxWidth: '760px',
            margin: '10px auto 0',
          }}
        >
          Enter ↵ to send · Shift+Enter for new line · Powered by Claude claude-sonnet-4-6
        </p>
      </div>
    </div>
  )
}

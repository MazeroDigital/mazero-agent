'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

type Step = 'chat' | 'processing' | 'output'

type Brief = {
  companyName: string
  websiteUrl: string
  industry: string
  services: string
  currentMarketing: string
  problems: string
  budget: string
  notes: string
}

type ProposalImages = {
  cover: string | null
  situation: string | null
  solution: string | null
  investment: string | null
}

type ChatMessage = { role: 'user' | 'assistant'; content: string }

const OPENING_MESSAGE =
  "Hey! I'm your proposal strategist. Tell me about the prospect you're pitching — who are they, what do they do, and what opportunity do you see for them?"

// --- Icons ---
function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}
function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}
function CanvaIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 12h8" /><path d="M12 8v8" />
    </svg>
  )
}
function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  )
}
function BoltIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

// --- Markdown Renderer ---
function renderMarkdown(md: string) {
  const lines = md.split('\n')
  const elements: React.ReactElement[] = []
  let listItems: string[] = []
  let listType: 'ul' | 'ol' | null = null

  function flushList() {
    if (listItems.length > 0 && listType) {
      const Tag = listType
      elements.push(
        <Tag key={`list-${elements.length}`} style={{ paddingLeft: '22px', margin: '8px 0' }}>
          {listItems.map((item, i) => (
            <li key={i} style={{ marginBottom: '4px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7' }}
              dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
          ))}
        </Tag>
      )
      listItems = []
      listType = null
    }
  }

  function inlineFormat(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text-primary);font-weight:700">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:4px;padding:1px 5px;font-size:12px">$1</code>')
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('# ')) {
      flushList()
      elements.push(
        <h1 key={i} style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', margin: '28px 0 12px', borderBottom: '2px solid var(--gold)', paddingBottom: '8px' }}
          dangerouslySetInnerHTML={{ __html: inlineFormat(line.slice(2)) }} />
      )
    } else if (line.startsWith('### ')) {
      flushList()
      elements.push(
        <h3 key={i} style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-secondary)', margin: '16px 0 6px' }}
          dangerouslySetInnerHTML={{ __html: inlineFormat(line.slice(4)) }} />
      )
    } else if (line.startsWith('## ')) {
      flushList()
      elements.push(
        <h2 key={i} style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', margin: '24px 0 8px' }}
          dangerouslySetInnerHTML={{ __html: inlineFormat(line.slice(3)) }} />
      )
    } else if (/^[-*]\s/.test(line)) {
      if (listType !== 'ul') { flushList(); listType = 'ul' }
      listItems.push(line.replace(/^[-*]\s/, ''))
    } else if (/^\d+\.\s/.test(line)) {
      if (listType !== 'ol') { flushList(); listType = 'ol' }
      listItems.push(line.replace(/^\d+\.\s/, ''))
    } else if (line.startsWith('> ')) {
      flushList()
      elements.push(
        <blockquote key={i} style={{
          borderLeft: '3px solid var(--gold)', paddingLeft: '16px', margin: '12px 0',
          color: 'var(--text-secondary)', fontStyle: 'italic', background: 'var(--gold-light)',
          padding: '12px 16px 12px 20px', borderRadius: '0 8px 8px 0',
        }}
          dangerouslySetInnerHTML={{ __html: inlineFormat(line.slice(2)) }} />
      )
    } else if (line.startsWith('---')) {
      flushList()
      elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0' }} />)
    } else if (line.trim() === '') {
      flushList()
    } else {
      flushList()
      elements.push(
        <p key={i} style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7', margin: '6px 0' }}
          dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />
      )
    }
  }
  flushList()
  return elements
}

// --- Proposal Image ---
function ProposalImage({ src, alt }: { src: string | null; alt: string }) {
  if (!src) return null
  return (
    <div style={{ margin: '20px 0', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <img src={src} alt={alt} style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
    </div>
  )
}

// --- Render Markdown with Section Images ---
function renderMarkdownWithImages(md: string, images: ProposalImages) {
  const sectionImages: { pattern: RegExp; role: keyof ProposalImages }[] = [
    { pattern: /^## .*(?:current situation|opportunity|challenge)/i, role: 'situation' },
    { pattern: /^## .*(?:our solution|solution|strategy|approach)/i, role: 'solution' },
    { pattern: /^## .*(?:investment|pricing|packages)/i, role: 'investment' },
  ]

  const lines = md.split('\n')
  const baseElements = renderMarkdown(md)
  const result: React.ReactElement[] = []

  // Map line indices to image insertions
  const imageInsertions = new Map<number, React.ReactElement>()
  const used = new Set<string>()
  for (let i = 0; i < lines.length; i++) {
    for (const mapping of sectionImages) {
      if (!used.has(mapping.role) && mapping.pattern.test(lines[i]) && images[mapping.role]) {
        used.add(mapping.role)
        imageInsertions.set(i, <ProposalImage key={`img-${mapping.role}`} src={images[mapping.role]} alt={mapping.role} />)
        break
      }
    }
  }

  for (const el of baseElements) {
    const elKey = Number(el.key)
    const img = imageInsertions.get(elKey)
    if (img) result.push(img)
    result.push(el)
  }

  return result
}

// --- Spinner ---
function Spinner({ size = 16 }: { size?: number }) {
  return (
    <>
      <div style={{ width: size, height: size, border: '2px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}

// --- Processing Steps ---
const PROCESSING_STEPS = [
  'Researching',
  'Analyzing competitors',
  'Writing proposal',
  'Generating visuals with Higgsfield',
]

// ═══════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════
export default function ProposalsPage() {
  const [step, setStep] = useState<Step>('chat')

  // Chat intake state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: OPENING_MESSAGE },
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [brief, setBrief] = useState<Brief | null>(null)
  const [briefReady, setBriefReady] = useState(false)
  const [waitingForVisuals, setWaitingForVisuals] = useState(false)
  const [visualDirection, setVisualDirection] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Processing state
  const [processingStep, setProcessingStep] = useState(0)
  const [prospectName, setProspectName] = useState('')

  // Output state
  const [proposal, setProposal] = useState('')
  const [research, setResearch] = useState('')
  const [proposalImages, setProposalImages] = useState<ProposalImages>({
    cover: null, situation: null, solution: null, investment: null,
  })
  const [imagesLoading, setImagesLoading] = useState(false)
  const [canvaUrl, setCanvaUrl] = useState<string | null>(null)
  const [showResearch, setShowResearch] = useState(false)
  const [copied, setCopied] = useState(false)

  // Refinement chat state
  const [refineMessages, setRefineMessages] = useState<ChatMessage[]>([])
  const [refineInput, setRefineInput] = useState('')
  const [refineLoading, setRefineLoading] = useState(false)
  const refineEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => {
    refineEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [refineMessages])

  // --- Parse [BRIEF:{...}] from assistant message ---
  function extractBrief(text: string): Brief | null {
    const match = text.match(/\[BRIEF:([\s\S]*?)\]/)
    if (!match) return null
    try {
      return JSON.parse(match[1])
    } catch {
      return null
    }
  }

  // --- Strip [BRIEF:...] tag from display text ---
  function cleanMessage(text: string): string {
    return text.replace(/\[BRIEF:[\s\S]*?\]/g, '').trim()
  }

  // --- Send chat message (intake conversation) ---
  async function sendChatMessage(e: React.FormEvent) {
    e.preventDefault()
    const text = chatInput.trim()
    if (!text || chatLoading) return
    setChatInput('')

    // If waiting for visual direction, capture it and start generation
    if (waitingForVisuals) {
      setVisualDirection(text)
      setChatMessages((prev) => [
        ...prev,
        { role: 'user', content: text },
        { role: 'assistant', content: `Love it — "${text}". Starting generation now...` },
      ])
      setWaitingForVisuals(false)
      // Start generation after a brief pause for the message to render
      setTimeout(() => startGeneration(brief!, text), 300)
      return
    }

    const newMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: text }]
    setChatMessages(newMessages)
    setChatLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: 'strategist',
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      if (!res.ok) throw new Error('Failed')

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No reader')

      let fullResponse = ''
      const decoder = new TextDecoder()
      setChatMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullResponse += decoder.decode(value, { stream: true })
        const displayText = cleanMessage(fullResponse)
        setChatMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: displayText }
          return updated
        })
      }

      // Check if brief was extracted
      const parsed = extractBrief(fullResponse)
      if (parsed) {
        setBrief(parsed)
        setBriefReady(true)
        setProspectName(parsed.companyName)
      }
    } catch {
      setChatMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  // --- Handle "Generate Proposal" button ---
  function handleGenerateClick() {
    setChatMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content:
          "Last thing — for the visuals, I'll generate AI images for your proposal. Any specific direction? For example: \"make them look premium and dark\", \"use outdoor lifestyle shots\", \"focus on the product\", or just say \"surprise me\" and I'll decide based on the industry.",
      },
    ])
    setWaitingForVisuals(true)
  }

  // --- Generation pipeline ---
  const startGeneration = useCallback(async (briefData: Brief, visDir: string) => {
    setStep('processing')
    setProcessingStep(0)

    // Step 1: Research
    let researchText = ''
    try {
      const res = await fetch('/api/research-prospect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(briefData),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Research failed')
      const data = await res.json()
      researchText = data.research
      setResearch(researchText)
    } catch (err) {
      setStep('chat')
      return
    }

    // Step 2: Analyzing (visual transition)
    setProcessingStep(1)
    await new Promise((r) => setTimeout(r, 800))

    // Step 3: Generate proposal
    setProcessingStep(2)
    let proposalText = ''
    try {
      const res = await fetch('/api/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: briefData, research: researchText }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Generation failed')
      const data = await res.json()
      proposalText = data.proposal
      setProposal(proposalText)
    } catch (err) {
      setStep('chat')
      return
    }

    // Step 4: Generate images (non-blocking)
    setProcessingStep(3)
    setImagesLoading(true)

    const imagePromise = fetch('/api/generate-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: briefData.companyName,
        industry: briefData.industry,
        visualDirection: visDir,
      }),
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json()
          if (data.images) setProposalImages(data.images)
        }
      })
      .catch(() => {})
      .finally(() => setImagesLoading(false))

    // Canva (optional, parallel)
    const canvaPromise = fetch('/api/create-canva-design', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: briefData.companyName,
        industry: briefData.industry,
        proposalSections: proposalText.slice(0, 500),
      }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (data.designUrl) setCanvaUrl(data.designUrl)
      })
      .catch(() => {})

    await Promise.all([imagePromise, canvaPromise])
    setStep('output')
  }, [])

  // --- Send refinement message ---
  async function sendRefineMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!refineInput.trim() || refineLoading) return

    const text = refineInput.trim()
    setRefineInput('')
    const newMessages: ChatMessage[] = [...refineMessages, { role: 'user', content: text }]
    setRefineMessages(newMessages)
    setRefineLoading(true)

    try {
      const res = await fetch('/api/refine-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          currentProposal: proposal,
          research,
        }),
      })
      if (!res.ok) throw new Error('Failed')

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No reader')

      let fullResponse = ''
      const decoder = new TextDecoder()
      setRefineMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullResponse += decoder.decode(value, { stream: true })
        setRefineMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: fullResponse }
          return updated
        })
      }

      // Extract updated proposal
      const si = fullResponse.indexOf('[PROPOSAL_START]')
      const ei = fullResponse.indexOf('[PROPOSAL_END]')
      if (si !== -1 && ei !== -1) {
        setProposal(fullResponse.slice(si + '[PROPOSAL_START]'.length, ei).trim())
        const explanation = fullResponse.slice(0, si).trim()
        setRefineMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: explanation || 'Proposal updated.' }
          return updated
        })
      }
    } catch {
      setRefineMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ])
    } finally {
      setRefineLoading(false)
    }
  }

  // --- Utilities ---
  function copyToClipboard() {
    navigator.clipboard.writeText(proposal)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadPDF() {
    const w = window.open('', '_blank')
    if (!w) return
    const htmlBody = proposal
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^---$/gm, '<hr>')
      .replace(/\n/g, '<br>')
    w.document.write(`<!DOCTYPE html><html><head>
      <title>Proposal — ${prospectName} | Mazero Digital</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 40px; color: #1a1a2e; line-height: 1.7; font-size: 14px; }
        h1 { font-size: 28px; font-weight: 800; border-bottom: 3px solid #f5a623; padding-bottom: 10px; margin-top: 32px; }
        h2 { font-size: 20px; font-weight: 700; margin-top: 28px; color: #2d2d44; }
        h3 { font-size: 16px; font-weight: 700; margin-top: 20px; color: #4a4a6a; }
        blockquote { border-left: 3px solid #f5a623; background: #fff8eb; padding: 12px 16px; margin: 12px 0; border-radius: 0 8px 8px 0; }
        hr { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
        @media print { body { margin: 20px; } }
      </style>
    </head><body>${htmlBody}</body></html>`)
    w.document.close()
    w.print()
  }

  function startOver() {
    setChatMessages([{ role: 'assistant', content: OPENING_MESSAGE }])
    setChatInput('')
    setBrief(null)
    setBriefReady(false)
    setWaitingForVisuals(false)
    setVisualDirection('')
    setProposal('')
    setResearch('')
    setProposalImages({ cover: null, situation: null, solution: null, investment: null })
    setImagesLoading(false)
    setCanvaUrl(null)
    setRefineMessages([])
    setRefineInput('')
    setShowResearch(false)
    setStep('chat')
  }

  // --- Chat bubble ---
  function ChatBubble({ msg }: { msg: ChatMessage }) {
    const isUser = msg.role === 'user'
    return (
      <div style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '85%', padding: '12px 16px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser ? 'var(--gold)' : 'var(--bg-secondary)',
        color: isUser ? '#0a0a0f' : 'var(--text-primary)',
        fontSize: '14px', lineHeight: '1.6',
        border: isUser ? 'none' : '1px solid var(--border)',
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        {msg.content || (
          <div style={{ display: 'flex', gap: '4px', padding: '4px 0' }}>
            <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
          </div>
        )}
      </div>
    )
  }

  // ═══════════════════════════════════
  // RENDER
  // ═══════════════════════════════════
  return (
    <div className="animate-fadeIn" style={{
      height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      padding: step === 'output' ? '16px 20px' : '24px 28px',
    }}>

      {/* ═══════ STEP 1: CONVERSATIONAL CHAT ═══════ */}
      {step === 'chat' && (
        <div style={{ maxWidth: '700px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {/* Header */}
          <div style={{ marginBottom: '20px', flexShrink: 0 }}>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)' }}>Proposal Builder</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
              Have a conversation, get a research-backed proposal with AI visuals.
            </p>
          </div>

          {/* Chat messages */}
          <div style={{
            flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '12px',
            padding: '20px 0', minHeight: 0,
          }}>
            {chatMessages.map((msg, i) => (
              <ChatBubble key={i} msg={msg} />
            ))}

            {/* Generate button appears after brief is ready */}
            {briefReady && !waitingForVisuals && (
              <div style={{ alignSelf: 'center', marginTop: '8px' }}>
                <button onClick={handleGenerateClick} className="btn-gold" style={{
                  padding: '14px 32px', fontSize: '15px', fontWeight: '700',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  borderRadius: '14px', animation: 'fadeIn 0.4s ease',
                }}>
                  <BoltIcon /> Generate Proposal
                </button>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendChatMessage} style={{
            display: 'flex', gap: '10px', padding: '16px 0', borderTop: '1px solid var(--border)', flexShrink: 0,
          }}>
            <input
              className="input-field"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={waitingForVisuals ? 'Describe your visual direction...' : 'Type your response...'}
              disabled={chatLoading}
              style={{ flex: 1, fontSize: '14px', padding: '14px 18px', borderRadius: '14px' }}
            />
            <button type="submit" disabled={chatLoading || !chatInput.trim()} className="btn-gold"
              style={{ padding: '14px 18px', borderRadius: '14px', flexShrink: 0 }}>
              <SendIcon />
            </button>
          </form>
        </div>
      )}

      {/* ═══════ STEP 2: PROCESSING ═══════ */}
      {step === 'processing' && (
        <div style={{ maxWidth: '520px', margin: 'auto', textAlign: 'center' }}>
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>
              Building Your Proposal
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              for <span style={{ color: 'var(--gold)', fontWeight: '700' }}>{prospectName}</span>
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            {PROCESSING_STEPS.map((label, i) => {
              const isDone = i < processingStep
              const isCurrent = i === processingStep
              const displayLabel = i === 0 ? `${label} ${prospectName}...` : `${label}...`

              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px',
                  borderRadius: '12px',
                  background: isDone ? 'rgba(76,175,125,0.06)' : isCurrent ? 'var(--bg-secondary)' : 'transparent',
                  border: `1px solid ${isDone ? 'rgba(76,175,125,0.2)' : isCurrent ? 'var(--gold-border)' : 'var(--border)'}`,
                  transition: 'all 0.3s ease',
                }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    background: isDone ? '#4caf7d' : isCurrent ? 'var(--gold)' : 'var(--bg-secondary)',
                    color: isDone || isCurrent ? '#fff' : 'var(--text-muted)',
                  }}>
                    {isDone ? <CheckIcon /> : isCurrent ? <Spinner size={14} /> : (
                      <span style={{ fontSize: '12px', fontWeight: '700' }}>{i + 1}</span>
                    )}
                  </div>
                  <span style={{
                    fontSize: '14px', fontWeight: isCurrent ? '700' : '500',
                    color: isDone ? '#4caf7d' : isCurrent ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}>
                    {displayLabel}
                    {isDone && <span style={{ fontWeight: '500', marginLeft: '6px', opacity: 0.7 }}>Done</span>}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══════ STEP 3: PROPOSAL OUTPUT ═══════ */}
      {step === 'output' && (
        <>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexShrink: 0 }}>
            <button onClick={startOver} className="btn-ghost" style={{ fontSize: '12px' }}>
              <ArrowLeftIcon /> New Proposal
            </button>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button onClick={() => setShowResearch(!showResearch)} className="btn-ghost"
                style={{ padding: '6px 12px', fontSize: '11px', background: showResearch ? 'var(--gold-light)' : undefined, color: showResearch ? 'var(--gold)' : undefined }}>
                <SearchIcon /> Research
              </button>
              <button onClick={copyToClipboard} className="btn-ghost" style={{ padding: '6px 12px', fontSize: '11px' }}>
                {copied ? <><CheckIcon /> Copied</> : <><CopyIcon /> Copy</>}
              </button>
              <button onClick={downloadPDF} className="btn-ghost" style={{ padding: '6px 12px', fontSize: '11px' }}>
                <DownloadIcon /> PDF
              </button>
              {canvaUrl && (
                <a href={canvaUrl} target="_blank" rel="noopener noreferrer" className="btn-gold" style={{ padding: '6px 12px', fontSize: '11px', textDecoration: 'none' }}>
                  <CanvaIcon /> Canva
                </a>
              )}
            </div>
          </div>

          {/* Split layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '12px', flex: 1, minHeight: 0 }}>
            {/* Left: Proposal */}
            <div className="card" style={{ borderRadius: '14px', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

              {/* Research panel */}
              {showResearch && research && (
                <div style={{ borderBottom: '1px solid var(--border)', padding: '16px 24px', background: 'var(--bg-secondary)', maxHeight: '35vh', overflow: 'auto', flexShrink: 0 }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px' }}>Research Brief</h3>
                  <div style={{ fontSize: '13px' }}>{renderMarkdown(research)}</div>
                </div>
              )}

              {/* Proposal with images */}
              <div style={{ flex: 1, overflow: 'auto', padding: '28px 32px', minHeight: 0 }}>
                {/* Hero cover image */}
                {proposalImages.cover ? (
                  <div style={{ margin: '0 -32px 24px', position: 'relative' }}>
                    <img src={proposalImages.cover} alt="Proposal cover"
                      style={{ width: '100%', height: '260px', objectFit: 'cover', display: 'block' }}
                      onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 40%, rgba(10,10,15,0.85))' }} />
                  </div>
                ) : imagesLoading ? (
                  <div style={{ margin: '0 -32px 24px', height: '260px', background: 'linear-gradient(135deg, var(--bg-secondary), rgba(245,166,35,0.06))', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <Spinner /> <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Generating visuals...</span>
                  </div>
                ) : null}

                {renderMarkdownWithImages(proposal, proposalImages)}
              </div>
            </div>

            {/* Right: Refinement chat */}
            <div className="card" style={{ borderRadius: '14px', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0 }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Refine Proposal</span>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Edit any section with AI</p>
              </div>

              <div style={{ flex: 1, overflow: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: 0 }}>
                {refineMessages.length === 0 && (
                  <div style={{ padding: '32px 12px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.8', marginBottom: '16px' }}>
                      Ask to edit any section:
                    </p>
                    {[
                      'Make the pricing more aggressive',
                      'Add a case study reference',
                      'Rewrite the executive summary',
                      'Change the 90-day roadmap to 60 days',
                    ].map((hint) => (
                      <button key={hint} onClick={() => setRefineInput(hint)}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', marginBottom: '6px',
                          background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px',
                          color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--gold-border)' }}
                        onMouseLeave={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--border)' }}>
                        &quot;{hint}&quot;
                      </button>
                    ))}
                  </div>
                )}
                {refineMessages.map((msg, i) => (
                  <div key={i} style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '90%', padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: msg.role === 'user' ? 'var(--gold)' : 'var(--bg-secondary)',
                    color: msg.role === 'user' ? '#0a0a0f' : 'var(--text-primary)',
                    fontSize: '13px', lineHeight: '1.6',
                    border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {msg.content || (
                      <div style={{ display: 'flex', gap: '4px', padding: '4px 0' }}>
                        <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={refineEndRef} />
              </div>

              <form onSubmit={sendRefineMessage} style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', flexShrink: 0 }}>
                <input className="input-field" value={refineInput} onChange={(e) => setRefineInput(e.target.value)}
                  placeholder="Refine the proposal..." disabled={refineLoading}
                  style={{ flex: 1, fontSize: '13px', padding: '10px 14px' }} />
                <button type="submit" disabled={refineLoading || !refineInput.trim()} className="btn-gold" style={{ padding: '10px 14px', flexShrink: 0 }}>
                  <SendIcon />
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

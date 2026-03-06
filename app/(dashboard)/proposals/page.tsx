'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

type Step = 'intake' | 'review' | 'processing' | 'output'
type ProcessingPhase = 'research' | 'generate' | 'visuals' | 'design'

type Brief = {
  companyName: string
  websiteUrl: string
  industry: string
  socialHandles: string
  currentMarketing: string
  problems: string
  services: string
  notes: string
  budget: string
}

type ProposalImages = {
  cover: string | null
  opportunity: string | null
  strategy: string | null
  results: string | null
}

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

const EMPTY_BRIEF: Brief = {
  companyName: '',
  websiteUrl: '',
  industry: '',
  socialHandles: '',
  currentMarketing: '',
  problems: '',
  services: '',
  notes: '',
  budget: '',
}

const INDUSTRY_OPTIONS = [
  'E-commerce / Retail',
  'SaaS / Technology',
  'Healthcare / Wellness',
  'Real Estate',
  'Food & Beverage',
  'Finance / Fintech',
  'Education',
  'Fashion & Beauty',
  'Travel & Hospitality',
  'Professional Services',
  'Fitness & Sports',
  'Automotive',
  'Entertainment & Media',
  'Non-Profit',
  'Other',
]

const BUDGET_OPTIONS = [
  'Under $1,000/mo',
  '$1,000 – $3,000/mo',
  '$3,000 – $5,000/mo',
  '$5,000 – $10,000/mo',
  '$10,000+/mo',
  'Project-based (one-time)',
  'To be discussed',
]

// --- Icons ---
function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  )
}
function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  )
}
function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
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
function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
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
function CanvaIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 12h8" /><path d="M12 8v8" />
    </svg>
  )
}
function ImageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
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
function BoltIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
              dangerouslySetInnerHTML={{ __html: inlineFormat(item) }}
            />
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
          dangerouslySetInnerHTML={{ __html: inlineFormat(line.slice(2)) }}
        />
      )
    } else if (line.startsWith('### ')) {
      flushList()
      elements.push(
        <h3 key={i} style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-secondary)', margin: '16px 0 6px' }}
          dangerouslySetInnerHTML={{ __html: inlineFormat(line.slice(4)) }}
        />
      )
    } else if (line.startsWith('## ')) {
      flushList()
      elements.push(
        <h2 key={i} style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', margin: '24px 0 8px' }}
          dangerouslySetInnerHTML={{ __html: inlineFormat(line.slice(3)) }}
        />
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
          borderLeft: '3px solid var(--gold)',
          paddingLeft: '16px',
          margin: '12px 0',
          color: 'var(--text-secondary)',
          fontStyle: 'italic',
          background: 'var(--gold-light)',
          padding: '12px 16px 12px 20px',
          borderRadius: '0 8px 8px 0',
        }}
          dangerouslySetInnerHTML={{ __html: inlineFormat(line.slice(2)) }}
        />
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
          dangerouslySetInnerHTML={{ __html: inlineFormat(line) }}
        />
      )
    }
  }
  flushList()
  return elements
}

// --- Proposal Image Component ---
function ProposalImage({ src, alt }: { src: string | null; alt: string }) {
  if (!src) return null
  return (
    <div style={{ margin: '20px 0', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <img src={src} alt={alt}
        style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    </div>
  )
}

// --- Markdown Renderer with Images ---
function renderMarkdownWithImages(md: string, images: ProposalImages) {
  // Inject image markers into the markdown before rendering
  const sectionImages: { pattern: RegExp; role: keyof ProposalImages }[] = [
    { pattern: /^## .*(?:opportunity)/i, role: 'opportunity' },
    { pattern: /^## .*(?:solution|strategy)/i, role: 'strategy' },
    { pattern: /^## .*(?:investment|why mazero|results)/i, role: 'results' },
  ]

  const lines = md.split('\n')
  const outputLines: string[] = []
  const injected = new Set<string>()

  for (const line of lines) {
    // Before adding this line, check if it's a section heading that gets an image
    for (const mapping of sectionImages) {
      if (!injected.has(mapping.role) && mapping.pattern.test(line) && images[mapping.role]) {
        injected.add(mapping.role)
        outputLines.push(`[PROPOSAL_IMAGE:${mapping.role}:${images[mapping.role]}]`)
        break
      }
    }
    outputLines.push(line)
  }

  // Now render, handling image placeholders
  const elements: React.ReactElement[] = []
  for (let i = 0; i < outputLines.length; i++) {
    const line = outputLines[i]
    const imgMatch = line.match(/^\[PROPOSAL_IMAGE:(\w+):(.*)\]$/)
    if (imgMatch) {
      elements.push(
        <ProposalImage key={`img-${imgMatch[1]}`} src={imgMatch[2]} alt={imgMatch[1]} />
      )
    }
  }

  // Re-render the original markdown and interleave images at the right positions
  const baseElements = renderMarkdown(md)
  const result: React.ReactElement[] = []
  const imageInsertions = new Map<number, React.ReactElement>()

  // Find which line indices get images
  let lineIndex = 0
  const injected2 = new Set<string>()
  for (const line of md.split('\n')) {
    for (const mapping of sectionImages) {
      if (!injected2.has(mapping.role) && mapping.pattern.test(line) && images[mapping.role]) {
        injected2.add(mapping.role)
        imageInsertions.set(lineIndex, (
          <ProposalImage key={`img-${mapping.role}`} src={images[mapping.role]} alt={mapping.role} />
        ))
        break
      }
    }
    lineIndex++
  }

  // Map base elements back — each element was created with key={i} where i is the line index
  for (const el of baseElements) {
    const elKey = Number(el.key)
    const img = imageInsertions.get(elKey)
    if (img) result.push(img)
    result.push(el)
  }

  return result
}

// --- Styles ---
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)',
  marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em',
}
const hintStyle: React.CSSProperties = { fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }

const stepDotStyle = (active: boolean, done: boolean): React.CSSProperties => ({
  width: '32px', height: '32px', borderRadius: '50%', display: 'flex',
  alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700',
  background: done ? 'var(--gold)' : active ? 'rgba(245,166,35,0.15)' : 'var(--bg-secondary)',
  color: done ? '#0a0a0f' : active ? 'var(--gold)' : 'var(--text-muted)',
  border: active ? '2px solid var(--gold)' : '2px solid transparent',
  transition: 'all 0.3s ease', flexShrink: 0,
})

const stepTextStyle = (active: boolean): React.CSSProperties => ({
  fontSize: '12px', fontWeight: active ? '700' : '500',
  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
  transition: 'color 0.2s ease',
})

// --- Processing Phase Config ---
const PHASE_CONFIG: Record<ProcessingPhase, { label: string; tasks: string[] }> = {
  research: {
    label: 'Deep Research',
    tasks: [
      'Searching for company information & news',
      'Identifying top competitors',
      'Analyzing competitor marketing strategies',
      'Finding industry statistics & trends',
      'Assessing digital presence',
      'Compiling research brief',
    ],
  },
  generate: {
    label: 'Crafting Proposal',
    tasks: [
      'Writing executive summary',
      'Building opportunity analysis with research data',
      'Formatting competitor breakdown',
      'Creating content strategy ideas',
      'Structuring deliverables & roadmap',
      'Calculating investment tiers',
    ],
  },
  visuals: {
    label: 'Generating Visuals',
    tasks: [
      'Creating cinematic cover image',
      'Generating opportunity visual',
      'Designing strategy illustration',
      'Producing results imagery',
    ],
  },
  design: {
    label: 'Creating Canva Design',
    tasks: [
      'Selecting industry color scheme',
      'Generating presentation slides',
      'Applying Mazero branding',
    ],
  },
}

// --- Main Component ---
export default function ProposalsPage() {
  const [step, setStep] = useState<Step>('intake')
  const [phase, setPhase] = useState<ProcessingPhase>('research')
  const [phaseTaskIndex, setPhaseTaskIndex] = useState(0)
  const [completedPhases, setCompletedPhases] = useState<ProcessingPhase[]>([])
  const [brief, setBrief] = useState<Brief>(EMPTY_BRIEF)
  const [research, setResearch] = useState('')
  const [proposal, setProposal] = useState('')
  const [canvaUrl, setCanvaUrl] = useState<string | null>(null)
  const [proposalImages, setProposalImages] = useState<ProposalImages>({ cover: null, opportunity: null, strategy: null, results: null })
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [showResearch, setShowResearch] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const taskTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Animate task progress during processing
  useEffect(() => {
    if (step !== 'processing') {
      if (taskTimerRef.current) clearInterval(taskTimerRef.current)
      return
    }
    const tasks = PHASE_CONFIG[phase].tasks
    setPhaseTaskIndex(0)
    taskTimerRef.current = setInterval(() => {
      setPhaseTaskIndex((prev) => {
        if (prev < tasks.length - 1) return prev + 1
        return prev
      })
    }, 3500)
    return () => {
      if (taskTimerRef.current) clearInterval(taskTimerRef.current)
    }
  }, [step, phase])

  function updateBrief(field: keyof Brief, value: string) {
    setBrief((b) => ({ ...b, [field]: value }))
  }

  function handleIntakeSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStep('review')
  }

  const startBuild = useCallback(async () => {
    setStep('processing')
    setError('')
    setCompletedPhases([])

    // Phase 1: Research
    setPhase('research')
    let researchText = ''
    try {
      const res = await fetch('/api/research-prospect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brief),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Research failed')
      const data = await res.json()
      researchText = data.research
      setResearch(researchText)
      setCompletedPhases(['research'])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Research failed')
      setStep('review')
      return
    }

    // Phase 2: Generate Proposal
    setPhase('generate')
    let proposalText = ''
    try {
      const res = await fetch('/api/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, research: researchText }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Generation failed')
      const data = await res.json()
      proposalText = data.proposal
      setProposal(proposalText)
      setCompletedPhases(['research', 'generate'])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
      setStep('review')
      return
    }

    // Phase 3: Generate Visuals (optional, non-blocking)
    setPhase('visuals')
    try {
      const res = await fetch('/api/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: brief.companyName,
          industry: brief.industry,
          services: brief.services,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.images) setProposalImages(data.images)
      }
    } catch {
      // Image generation is optional
    }
    setCompletedPhases(['research', 'generate', 'visuals'])

    // Phase 4: Canva Design (optional, non-blocking)
    setPhase('design')
    try {
      const res = await fetch('/api/create-canva-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: brief.companyName,
          industry: brief.industry,
          proposalSections: proposalText.slice(0, 500),
        }),
      })
      const data = await res.json()
      if (data.designUrl) setCanvaUrl(data.designUrl)
    } catch {
      // Canva is optional
    }
    setCompletedPhases(['research', 'generate', 'visuals', 'design'])
    setStep('output')
  }, [brief])

  async function sendChatMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!chatInput.trim() || chatLoading) return

    const userMessage = chatInput.trim()
    setChatInput('')
    const newMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: userMessage }]
    setChatMessages(newMessages)
    setChatLoading(true)

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
      if (!res.ok) throw new Error('Failed to get response')

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No reader')

      let fullResponse = ''
      const decoder = new TextDecoder()
      setChatMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullResponse += decoder.decode(value, { stream: true })
        setChatMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: fullResponse }
          return updated
        })
      }

      // Extract updated proposal if present
      const startTag = '[PROPOSAL_START]'
      const endTag = '[PROPOSAL_END]'
      const si = fullResponse.indexOf(startTag)
      const ei = fullResponse.indexOf(endTag)
      if (si !== -1 && ei !== -1) {
        setProposal(fullResponse.slice(si + startTag.length, ei).trim())
        const explanation = fullResponse.slice(0, si).trim()
        setChatMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: explanation || 'Proposal updated.' }
          return updated
        })
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

  function copyToClipboard() {
    navigator.clipboard.writeText(proposal)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadPDF() {
    const w = window.open('', '_blank')
    if (!w) return
    // Convert markdown to basic HTML for print
    const htmlBody = proposal
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^\> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^\- (.+)$/gm, '<li>$1</li>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^---$/gm, '<hr>')
      .replace(/\n/g, '<br>')
    w.document.write(`<!DOCTYPE html><html><head>
      <title>Proposal — ${brief.companyName} | Mazero Digital</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 40px; color: #1a1a2e; line-height: 1.7; font-size: 14px; }
        h1 { font-size: 28px; font-weight: 800; border-bottom: 3px solid #f5a623; padding-bottom: 10px; margin-top: 32px; }
        h2 { font-size: 20px; font-weight: 700; margin-top: 28px; color: #2d2d44; }
        h3 { font-size: 16px; font-weight: 700; margin-top: 20px; color: #4a4a6a; }
        p, li { margin: 8px 0; }
        ul, ol { padding-left: 24px; }
        blockquote { border-left: 3px solid #f5a623; background: #fff8eb; padding: 12px 16px; margin: 12px 0; border-radius: 0 8px 8px 0; }
        hr { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
        strong { font-weight: 700; }
        @media print { body { margin: 20px; } }
      </style>
    </head><body>${htmlBody}</body></html>`)
    w.document.close()
    w.print()
  }

  function startOver() {
    setBrief(EMPTY_BRIEF)
    setResearch('')
    setProposal('')
    setCanvaUrl(null)
    setProposalImages({ cover: null, opportunity: null, strategy: null, results: null })
    setChatMessages([])
    setChatInput('')
    setError('')
    setShowResearch(false)
    setStep('intake')
  }

  const STEPS = [
    { key: 'intake', label: 'Brief' },
    { key: 'review', label: 'Review' },
    { key: 'processing', label: 'Build' },
    { key: 'output', label: 'Proposal' },
  ]
  const stepIndex = STEPS.findIndex((s) => s.key === step)

  return (
    <div className="animate-fadeIn" style={{
      maxWidth: step === 'output' ? '100%' : '760px',
      margin: '0 auto',
      transition: 'max-width 0.3s ease',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: step === 'output' ? 'hidden' : 'auto',
      padding: '24px 28px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)' }}>Proposal Builder</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Research-backed, AI-powered proposals with Canva design.
          </p>
        </div>
        {step !== 'intake' && step !== 'processing' && (
          <button onClick={startOver} className="btn-ghost" style={{ fontSize: '12px' }}>
            <ArrowLeftIcon /> Start Over
          </button>
        )}
      </div>

      {/* Step Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
        {STEPS.map((s, i) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={stepDotStyle(i === stepIndex, i < stepIndex)}>
                {i < stepIndex ? <CheckIcon /> : i + 1}
              </div>
              <span style={stepTextStyle(i === stepIndex)}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: '2px', margin: '0 12px', marginBottom: '24px', borderRadius: '1px',
                background: i < stepIndex ? 'var(--gold)' : 'var(--border)',
                transition: 'background 0.4s ease',
              }} />
            )}
          </div>
        ))}
      </div>

      {/* ═══════ STEP 1: INTAKE FORM ═══════ */}
      {step === 'intake' && (
        <form onSubmit={handleIntakeSubmit}>
          <div className="card" style={{ padding: '32px', borderRadius: '16px' }}>
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Client Brief
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                The more detail you provide, the more tailored the proposal. Our AI will research the prospect before generating.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Company Name */}
              <div>
                <label style={labelStyle}>Prospect Company Name *</label>
                <input className="input-field" value={brief.companyName} onChange={(e) => updateBrief('companyName', e.target.value)}
                  placeholder="e.g. Bloom Skincare Co." required />
              </div>

              {/* Website + Industry */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Website URL</label>
                  <input className="input-field" value={brief.websiteUrl} onChange={(e) => updateBrief('websiteUrl', e.target.value)}
                    placeholder="https://..." type="url" />
                  <p style={hintStyle}>Helps our AI research their brand</p>
                </div>
                <div>
                  <label style={labelStyle}>Industry *</label>
                  <select className="input-field" value={brief.industry} onChange={(e) => updateBrief('industry', e.target.value)}
                    required style={{ appearance: 'none', cursor: 'pointer' }}>
                    <option value="">Select industry...</option>
                    {INDUSTRY_OPTIONS.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                </div>
              </div>

              {/* Social Handles */}
              <div>
                <label style={labelStyle}>Social Media Handles</label>
                <input className="input-field" value={brief.socialHandles} onChange={(e) => updateBrief('socialHandles', e.target.value)}
                  placeholder="e.g. @bloomskincare on Instagram, @bloom_skin on TikTok" />
                <p style={hintStyle}>Our AI will analyze their social presence during research</p>
              </div>

              {/* Current Marketing */}
              <div>
                <label style={labelStyle}>Current Marketing Efforts</label>
                <textarea className="input-field" value={brief.currentMarketing} onChange={(e) => updateBrief('currentMarketing', e.target.value)}
                  placeholder="What are they doing now? e.g. 'Posting on Instagram 2x/week, running basic Google Ads, no email marketing...'"
                  rows={3} style={{ resize: 'vertical' }} />
                <p style={hintStyle}>What do they currently do for marketing, if known?</p>
              </div>

              {/* Problems / Gaps */}
              <div>
                <label style={labelStyle}>Problems & Gaps You Noticed</label>
                <textarea className="input-field" value={brief.problems} onChange={(e) => updateBrief('problems', e.target.value)}
                  placeholder="e.g. 'No consistent brand voice, low engagement rates, website isn't converting, no video content...'"
                  rows={3} style={{ resize: 'vertical' }} />
              </div>

              {/* Services to Pitch */}
              <div>
                <label style={labelStyle}>Services You Want to Pitch *</label>
                <textarea className="input-field" value={brief.services} onChange={(e) => updateBrief('services', e.target.value)}
                  placeholder="e.g. 'Social media management (IG + TikTok), content creation (4 reels/month + 12 static), brand strategy refresh...'"
                  rows={3} style={{ resize: 'vertical' }} required />
              </div>

              {/* Budget + Notes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Budget Range</label>
                  <select className="input-field" value={brief.budget} onChange={(e) => updateBrief('budget', e.target.value)}
                    style={{ appearance: 'none', cursor: 'pointer' }}>
                    <option value="">Select range...</option>
                    {BUDGET_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <p style={hintStyle}>If known or discussed</p>
                </div>
                <div>
                  <label style={labelStyle}>Additional Notes</label>
                  <textarea className="input-field" value={brief.notes} onChange={(e) => updateBrief('notes', e.target.value)}
                    placeholder="Decision maker name, timeline, special requirements..."
                    rows={3} style={{ resize: 'vertical' }} />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-gold" style={{ padding: '12px 28px', fontSize: '14px' }}>
                Review Brief <ArrowRightIcon />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ═══════ STEP 2: REVIEW ═══════ */}
      {step === 'review' && (
        <div className="card" style={{ padding: '32px', borderRadius: '16px' }}>
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
              Review Your Brief
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Confirm the details. Our AI will research the prospect, generate an 11-section proposal, and create a Canva design.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Prospect', value: brief.companyName },
              { label: 'Website', value: brief.websiteUrl || '—' },
              { label: 'Industry', value: brief.industry },
              { label: 'Social Handles', value: brief.socialHandles || '—' },
              { label: 'Current Marketing', value: brief.currentMarketing || '—' },
              { label: 'Problems & Gaps', value: brief.problems || '—' },
              { label: 'Services to Pitch', value: brief.services },
              { label: 'Budget Range', value: brief.budget || 'Not specified' },
              { label: 'Notes', value: brief.notes || '—' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', gap: '16px', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: '130px', flexShrink: 0, paddingTop: '2px' }}>
                  {item.label}
                </span>
                <span style={{ fontSize: '14px', color: item.value === '—' ? 'var(--text-muted)' : 'var(--text-primary)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {/* What will happen */}
          <div style={{ marginTop: '24px', padding: '16px', background: 'var(--gold-light)', border: '1px solid var(--gold-border)', borderRadius: '12px' }}>
            <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
              What happens next:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { icon: <SearchIcon />, text: 'Deep research — company, competitors, industry stats' },
                { icon: <BoltIcon />, text: '11-section proposal with real data and 3 pricing tiers' },
                { icon: <ImageIcon />, text: '4 AI-generated cinematic visuals tailored to the proposal' },
                { icon: <CanvaIcon />, text: 'Canva presentation design (if credentials configured)' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--gold)', flexShrink: 0 }}>{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(224,82,82,0.08)', border: '1px solid rgba(224,82,82,0.2)', borderRadius: '10px', color: '#e05252', fontSize: '13px' }}>
              {error}
            </div>
          )}

          <div style={{ marginTop: '28px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button onClick={() => setStep('intake')} className="btn-ghost">
              <ArrowLeftIcon /> Edit Brief
            </button>
            <button onClick={startBuild} className="btn-gold" style={{ padding: '12px 28px', fontSize: '14px' }}>
              Research & Generate <BoltIcon />
            </button>
          </div>
        </div>
      )}

      {/* ═══════ STEP 3: PROCESSING ═══════ */}
      {step === 'processing' && (
        <div className="card" style={{ padding: '48px 32px', borderRadius: '16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>
              Building Your Proposal
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              for <span style={{ color: 'var(--gold)', fontWeight: '700' }}>{brief.companyName}</span>
            </p>
          </div>

          <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {(['research', 'generate', 'visuals', 'design'] as ProcessingPhase[]).map((p) => {
              const isDone = completedPhases.includes(p)
              const isCurrent = phase === p && !isDone
              const config = PHASE_CONFIG[p]

              return (
                <div key={p} style={{
                  padding: '20px',
                  borderRadius: '14px',
                  background: isDone ? 'rgba(76,175,125,0.06)' : isCurrent ? 'var(--bg-secondary)' : 'transparent',
                  border: `1px solid ${isDone ? 'rgba(76,175,125,0.2)' : isCurrent ? 'var(--gold-border)' : 'var(--border)'}`,
                  transition: 'all 0.3s ease',
                }}>
                  {/* Phase Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: isCurrent ? '14px' : '0' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isDone ? '#4caf7d' : isCurrent ? 'var(--gold)' : 'var(--bg-secondary)',
                      color: isDone || isCurrent ? '#fff' : 'var(--text-muted)',
                      flexShrink: 0,
                    }}>
                      {isDone ? <CheckIcon /> : isCurrent ? (
                        <div style={{ width: '14px', height: '14px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      ) : (
                        <span style={{ fontSize: '12px', fontWeight: '700' }}>{p === 'research' ? '1' : p === 'generate' ? '2' : p === 'visuals' ? '3' : '4'}</span>
                      )}
                    </div>
                    <span style={{
                      fontSize: '14px', fontWeight: '700',
                      color: isDone ? '#4caf7d' : isCurrent ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}>
                      {config.label}
                      {isDone && <span style={{ fontWeight: '500', marginLeft: '8px' }}>Complete</span>}
                    </span>
                  </div>

                  {/* Animated Tasks (only for current phase) */}
                  {isCurrent && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '40px' }}>
                      {config.tasks.map((task, ti) => (
                        <div key={ti} style={{
                          display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px',
                          color: ti < phaseTaskIndex ? '#4caf7d' : ti === phaseTaskIndex ? 'var(--text-primary)' : 'var(--text-muted)',
                          opacity: ti <= phaseTaskIndex ? 1 : 0.4,
                          transition: 'all 0.3s ease',
                        }}>
                          {ti < phaseTaskIndex ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4caf7d" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                          ) : ti === phaseTaskIndex ? (
                            <div className="typing-dot" style={{ width: '5px', height: '5px' }} />
                          ) : (
                            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--text-muted)', opacity: 0.3 }} />
                          )}
                          {task}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ═══════ STEP 4: OUTPUT ═══════ */}
      {step === 'output' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '16px', flex: 1, minHeight: 0 }}>
          {/* Left: Proposal */}
          <div className="card" style={{ borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            {/* Toolbar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0,
            }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {brief.companyName}
              </span>
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
                    <CanvaIcon /> Open in Canva
                  </a>
                )}
              </div>
            </div>

            {/* Research Panel (collapsible) */}
            {showResearch && research && (
              <div style={{
                borderBottom: '1px solid var(--border)', padding: '20px 24px',
                background: 'var(--bg-secondary)', maxHeight: '40vh', overflow: 'auto',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Research Brief
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--surface)', padding: '3px 10px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                    Live data from web research
                  </span>
                </div>
                <div style={{ fontSize: '13px' }}>{renderMarkdown(research)}</div>
              </div>
            )}

            {/* Proposal Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '28px 32px', minHeight: 0 }}>
              {/* Cover Image */}
              {proposalImages.cover ? (
                <div style={{ margin: '0 -32px 24px', position: 'relative' }}>
                  <img src={proposalImages.cover} alt="Proposal cover"
                    style={{ width: '100%', height: '240px', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 40%, rgba(10,10,15,0.85))' }} />
                </div>
              ) : proposalImages.cover === null && proposal && (
                <div style={{ margin: '0 -32px 24px', height: '240px', background: 'linear-gradient(135deg, var(--bg-secondary), rgba(245,166,35,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Cover image unavailable</span>
                </div>
              )}
              {renderMarkdownWithImages(proposal, proposalImages)}
            </div>
          </div>

          {/* Right: Chat */}
          <div className="card" style={{ borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0 }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Refine Proposal</span>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Edit any section with AI</p>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: 0 }}>
              {chatMessages.length === 0 && (
                <div style={{ padding: '32px 12px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.8', marginBottom: '16px' }}>
                    Ask to edit any section:
                  </p>
                  {[
                    '"Make the pricing more aggressive"',
                    '"Add a case study reference"',
                    '"Rewrite the executive summary"',
                    '"Add more about video content"',
                    '"Change the 90-day roadmap to 60 days"',
                  ].map((hint) => (
                    <button key={hint} onClick={() => { setChatInput(hint.replace(/"/g, '')); }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', marginBottom: '6px',
                        background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px',
                        color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--gold-border)' }}
                      onMouseLeave={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--border)' }}
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '90%', padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: msg.role === 'user' ? 'var(--user-bubble)' : 'var(--bg-secondary)',
                  color: msg.role === 'user' ? '#f1f5f9' : 'var(--text-primary)',
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
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={sendChatMessage} style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', flexShrink: 0 }}>
              <input className="input-field" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                placeholder="Refine the proposal..." disabled={chatLoading}
                style={{ flex: 1, fontSize: '13px', padding: '10px 14px' }} />
              <button type="submit" disabled={chatLoading || !chatInput.trim()} className="btn-gold" style={{ padding: '10px 14px', flexShrink: 0 }}>
                <SendIcon />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

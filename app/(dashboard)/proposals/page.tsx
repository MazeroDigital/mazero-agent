'use client'

import { useState, useRef, useEffect } from 'react'

type Step = 'intake' | 'review' | 'generating' | 'output'

type Brief = {
  companyName: string
  websiteUrl: string
  industry: string
  currentMarketing: string
  problems: string
  services: string
  notes: string
  budget: string
}

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

const EMPTY_BRIEF: Brief = {
  companyName: '',
  websiteUrl: '',
  industry: '',
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

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
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

// Simple markdown renderer
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
        <h1 key={i} style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', margin: '24px 0 12px', borderBottom: '2px solid var(--gold)', paddingBottom: '8px' }}
          dangerouslySetInnerHTML={{ __html: inlineFormat(line.slice(2)) }}
        />
      )
    } else if (line.startsWith('## ')) {
      flushList()
      elements.push(
        <h2 key={i} style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', margin: '20px 0 8px' }}
          dangerouslySetInnerHTML={{ __html: inlineFormat(line.slice(3)) }}
        />
      )
    } else if (line.startsWith('### ')) {
      flushList()
      elements.push(
        <h3 key={i} style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-secondary)', margin: '16px 0 6px' }}
          dangerouslySetInnerHTML={{ __html: inlineFormat(line.slice(4)) }}
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
        <blockquote key={i} style={{ borderLeft: '3px solid var(--gold)', paddingLeft: '14px', margin: '8px 0', color: 'var(--text-secondary)', fontStyle: 'italic' }}
          dangerouslySetInnerHTML={{ __html: inlineFormat(line.slice(2)) }}
        />
      )
    } else if (line.startsWith('---')) {
      flushList()
      elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />)
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

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: '700',
  color: 'var(--text-secondary)',
  marginBottom: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

const hintStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-muted)',
  marginTop: '4px',
}

const stepIndicatorStyle = (active: boolean, done: boolean): React.CSSProperties => ({
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '13px',
  fontWeight: '700',
  background: done ? 'var(--gold)' : active ? 'rgba(245,166,35,0.15)' : 'var(--bg-secondary)',
  color: done ? '#0a0a0f' : active ? 'var(--gold)' : 'var(--text-muted)',
  border: active ? '2px solid var(--gold)' : '2px solid transparent',
  transition: 'all 0.2s ease',
  flexShrink: 0,
})

const stepLabelStyle = (active: boolean): React.CSSProperties => ({
  fontSize: '12px',
  fontWeight: active ? '700' : '500',
  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
  transition: 'color 0.2s ease',
})

export default function ProposalsPage() {
  const [step, setStep] = useState<Step>('intake')
  const [brief, setBrief] = useState<Brief>(EMPTY_BRIEF)
  const [proposal, setProposal] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const proposalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  function updateBrief(field: keyof Brief, value: string) {
    setBrief((b) => ({ ...b, [field]: value }))
  }

  function handleIntakeSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStep('review')
  }

  async function generateProposal() {
    setStep('generating')
    setError('')
    try {
      const res = await fetch('/api/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brief),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Generation failed')
      }
      const data = await res.json()
      setProposal(data.proposal)
      setStep('output')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStep('review')
    }
  }

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
        const chunk = decoder.decode(value, { stream: true })
        fullResponse += chunk
        setChatMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: fullResponse }
          return updated
        })
      }

      // Check if the response contains an updated proposal
      const startTag = '[PROPOSAL_START]'
      const endTag = '[PROPOSAL_END]'
      const startIdx = fullResponse.indexOf(startTag)
      const endIdx = fullResponse.indexOf(endTag)
      if (startIdx !== -1 && endIdx !== -1) {
        const updatedProposal = fullResponse.slice(startIdx + startTag.length, endIdx).trim()
        setProposal(updatedProposal)
        // Clean the chat message to just show the explanation
        const explanation = fullResponse.slice(0, startIdx).trim()
        setChatMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: explanation || 'Proposal updated.',
          }
          return updated
        })
      }
    } catch {
      setChatMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
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
    // Create a printable HTML document and trigger print-to-PDF
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Proposal - ${brief.companyName}</title>
        <style>
          body { font-family: 'Segoe UI', -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 40px; color: #1a1a2e; line-height: 1.7; }
          h1 { font-size: 26px; border-bottom: 3px solid #f5a623; padding-bottom: 10px; margin-top: 30px; }
          h2 { font-size: 20px; margin-top: 28px; color: #2d2d44; }
          h3 { font-size: 16px; margin-top: 20px; color: #4a4a6a; }
          p { margin: 8px 0; }
          ul, ol { padding-left: 24px; }
          li { margin-bottom: 6px; }
          blockquote { border-left: 3px solid #f5a623; padding-left: 16px; margin: 12px 0; color: #555; }
          hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>${proposal.replace(/\n/g, '<br>')}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  function startOver() {
    setBrief(EMPTY_BRIEF)
    setProposal('')
    setChatMessages([])
    setChatInput('')
    setError('')
    setStep('intake')
  }

  const steps = [
    { key: 'intake', label: 'Brief' },
    { key: 'review', label: 'Review' },
    { key: 'generating', label: 'Generate' },
    { key: 'output', label: 'Proposal' },
  ]
  const stepIndex = steps.findIndex((s) => s.key === step)

  return (
    <div className="animate-fadeIn" style={{ maxWidth: step === 'output' ? '100%' : '720px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)' }}>Proposal Builder</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Craft AI-powered proposals tailored to your prospects.
          </p>
        </div>
        {step !== 'intake' && (
          <button onClick={startOver} className="btn-ghost" style={{ fontSize: '12px' }}>
            <ArrowLeftIcon /> Start Over
          </button>
        )}
      </div>

      {/* Step Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '32px' }}>
        {steps.map((s, i) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={stepIndicatorStyle(i === stepIndex, i < stepIndex)}>
                {i < stepIndex ? <CheckIcon /> : i + 1}
              </div>
              <span style={stepLabelStyle(i === stepIndex)}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1,
                height: '2px',
                background: i < stepIndex ? 'var(--gold)' : 'var(--border)',
                margin: '0 12px',
                marginBottom: '24px',
                borderRadius: '1px',
                transition: 'background 0.3s ease',
              }} />
            )}
          </div>
        ))}
      </div>

      {/* STEP 1: INTAKE FORM */}
      {step === 'intake' && (
        <form onSubmit={handleIntakeSubmit}>
          <div className="card" style={{ padding: '32px', borderRadius: '16px' }}>
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Client Brief
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Fill in the details below. The more context you provide, the better the proposal.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Company Name */}
              <div>
                <label style={labelStyle}>Prospect Company Name *</label>
                <input
                  className="input-field"
                  value={brief.companyName}
                  onChange={(e) => updateBrief('companyName', e.target.value)}
                  placeholder="e.g. Bloom Skincare Co."
                  required
                />
              </div>

              {/* Two columns: Website + Industry */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Website URL</label>
                  <input
                    className="input-field"
                    value={brief.websiteUrl}
                    onChange={(e) => updateBrief('websiteUrl', e.target.value)}
                    placeholder="https://..."
                    type="url"
                  />
                  <p style={hintStyle}>Optional but helps with context</p>
                </div>
                <div>
                  <label style={labelStyle}>Industry *</label>
                  <select
                    className="input-field"
                    value={brief.industry}
                    onChange={(e) => updateBrief('industry', e.target.value)}
                    required
                    style={{ appearance: 'none', cursor: 'pointer' }}
                  >
                    <option value="">Select industry...</option>
                    {INDUSTRY_OPTIONS.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Current Marketing */}
              <div>
                <label style={labelStyle}>Current Marketing Efforts</label>
                <textarea
                  className="input-field"
                  value={brief.currentMarketing}
                  onChange={(e) => updateBrief('currentMarketing', e.target.value)}
                  placeholder="What are they doing now? e.g. 'Posting on Instagram 2x/week, running basic Google Ads, no email marketing...'"
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
                <p style={hintStyle}>What do they currently do for marketing, if known?</p>
              </div>

              {/* Problems / Gaps */}
              <div>
                <label style={labelStyle}>Problems & Gaps You Noticed</label>
                <textarea
                  className="input-field"
                  value={brief.problems}
                  onChange={(e) => updateBrief('problems', e.target.value)}
                  placeholder="e.g. 'No consistent brand voice, low engagement rates, website isn't converting, no video content...'"
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
                <p style={hintStyle}>What gaps or opportunities did you identify?</p>
              </div>

              {/* Services to Pitch */}
              <div>
                <label style={labelStyle}>Services You Want to Pitch *</label>
                <textarea
                  className="input-field"
                  value={brief.services}
                  onChange={(e) => updateBrief('services', e.target.value)}
                  placeholder="e.g. 'Social media management (Instagram + TikTok), content creation (4 reels/month + 12 static posts), brand strategy refresh...'"
                  rows={3}
                  style={{ resize: 'vertical' }}
                  required
                />
              </div>

              {/* Two columns: Budget + Notes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Budget Range</label>
                  <select
                    className="input-field"
                    value={brief.budget}
                    onChange={(e) => updateBrief('budget', e.target.value)}
                    style={{ appearance: 'none', cursor: 'pointer' }}
                  >
                    <option value="">Select range...</option>
                    {BUDGET_OPTIONS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <p style={hintStyle}>If known or discussed</p>
                </div>
                <div>
                  <label style={labelStyle}>Additional Notes</label>
                  <textarea
                    className="input-field"
                    value={brief.notes}
                    onChange={(e) => updateBrief('notes', e.target.value)}
                    placeholder="Anything else relevant..."
                    rows={3}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-gold" style={{ padding: '12px 28px', fontSize: '14px' }}>
                Review Brief
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* STEP 2: REVIEW */}
      {step === 'review' && (
        <div className="card" style={{ padding: '32px', borderRadius: '16px' }}>
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
              Review Your Brief
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Make sure everything looks right before generating the proposal.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {[
              { label: 'Prospect', value: brief.companyName },
              { label: 'Website', value: brief.websiteUrl || 'Not provided' },
              { label: 'Industry', value: brief.industry },
              { label: 'Current Marketing', value: brief.currentMarketing || 'Not provided' },
              { label: 'Problems & Gaps', value: brief.problems || 'Not provided' },
              { label: 'Services to Pitch', value: brief.services },
              { label: 'Budget Range', value: brief.budget || 'Not specified' },
              { label: 'Additional Notes', value: brief.notes || 'None' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', gap: '16px', padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: '140px', flexShrink: 0, paddingTop: '2px' }}>
                  {item.label}
                </span>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                  {item.value}
                </span>
              </div>
            ))}
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
            <button onClick={generateProposal} className="btn-gold" style={{ padding: '12px 28px', fontSize: '14px' }}>
              Generate Proposal
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: GENERATING */}
      {step === 'generating' && (
        <div className="card" style={{ padding: '60px 32px', borderRadius: '16px', textAlign: 'center' }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(245,166,35,0.1)',
              border: '3px solid var(--gold)',
              borderTopColor: 'transparent',
              margin: '0 auto 20px',
              animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Crafting your proposal...
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
              Our AI is building a tailored proposal for {brief.companyName}. This usually takes 15-30 seconds.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '300px', margin: '0 auto' }}>
            {['Analyzing industry context', 'Structuring deliverables', 'Writing proposal sections', 'Finalizing investment details'].map((task, i) => (
              <div key={task} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                fontSize: '13px',
                color: 'var(--text-muted)',
                animation: `fadeIn 0.3s ease ${i * 0.3}s both`,
              }}>
                <div className="typing-dot" style={{ animationDelay: `${i * 0.15}s` }} />
                {task}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 4: OUTPUT (Split Screen) */}
      {step === 'output' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '20px', height: 'calc(100vh - 220px)', minHeight: '500px' }}>
          {/* Left: Proposal */}
          <div className="card" style={{ borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Toolbar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                Proposal for {brief.companyName}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={copyToClipboard} className="btn-ghost" style={{ padding: '7px 14px', fontSize: '12px' }}>
                  {copied ? <><CheckIcon /> Copied</> : <><CopyIcon /> Copy</>}
                </button>
                <button onClick={downloadPDF} className="btn-gold" style={{ padding: '7px 14px', fontSize: '12px' }}>
                  <DownloadIcon /> PDF
                </button>
              </div>
            </div>

            {/* Proposal Content */}
            <div ref={proposalRef} style={{ flex: 1, overflow: 'auto', padding: '28px 32px' }}>
              {renderMarkdown(proposal)}
            </div>
          </div>

          {/* Right: Chat */}
          <div className="card" style={{ borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Chat Header */}
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                Refine Proposal
              </span>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Ask to edit any section
              </p>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {chatMessages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 16px' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.6' }}>
                    Try things like:<br />
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>"Make the pricing more aggressive"</span><br />
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>"Add more about video content"</span><br />
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>"Rewrite the executive summary"</span>
                  </p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '90%',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: msg.role === 'user' ? 'var(--user-bubble)' : 'var(--bg-secondary)',
                    color: msg.role === 'user' ? '#f1f5f9' : 'var(--text-primary)',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                  }}
                >
                  {msg.content || (
                    <div style={{ display: 'flex', gap: '4px', padding: '4px 0' }}>
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendChatMessage} style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', flexShrink: 0 }}>
              <input
                className="input-field"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Refine the proposal..."
                disabled={chatLoading}
                style={{ flex: 1, fontSize: '13px', padding: '10px 14px' }}
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="btn-gold"
                style={{ padding: '10px 14px', flexShrink: 0 }}
              >
                <SendIcon />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

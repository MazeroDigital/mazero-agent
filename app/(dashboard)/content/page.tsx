'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

/* ─── Types ───────────────────────────────────────────── */
interface Message {
  role: 'user' | 'assistant'
  content: string
  filePreview?: string // data URL for uploaded image/video
  fileName?: string
}

interface PostCard {
  id: string
  hook: string
  caption: string
  hashtags: string[]
  cta: string
  contentType: 'Reel' | 'Carousel' | 'Static' | 'Story'
  bestTime: string
  day: string
  imagePrompt: string
  imageUrl: string | null
  imageLoading: boolean
  clientName: string
  uploadedFile?: string // data URL from user upload
}

interface ClientOption {
  id: string
  name: string
  brain: string | null
}

/* ─── Hardcoded client brains ────────────────────────── */
const HARDCODED_BRAINS: Record<string, string> = {
  interstones: `Brand: Interstones — luxury natural stone supplier.
Tone: Premium, aspirational, sophisticated. NO emojis ever.
Target Audience: Architects, interior designers, high-end homeowners.
Content Style: Evoke desire and exclusivity. Show the artistry of natural stone. Think editorial, not catalogue. Every image should feel like it belongs in Architectural Digest. Use words like "timeless", "crafted", "curated", "bespoke". Content should make the viewer aspire to this lifestyle.`,
  movik: `Brand: MOVIK — multilingual moving and relocation service.
Tone: Warm, practical, friendly, reassuring.
Target Audience: Families and professionals relocating locally or internationally.
Content Style: Show the human side of moving — the excitement, the fresh start. Be helpful with tips and guides. Use inclusive, welcoming language. Emphasize trust, reliability, and ease.`,
}

function getClientBrain(client: ClientOption): string {
  const hardcoded = HARDCODED_BRAINS[client.name.toLowerCase()]
  if (hardcoded) return hardcoded
  return client.brain || ''
}

/* ─── Icons ───────────────────────────────────────────── */
function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}
function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}
function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
function SaveIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}
function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}
function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

/* ─── Spinner ──────────────────────────────────────────── */
function Spinner({ size = 16 }: { size?: number }) {
  return (
    <>
      <div style={{ width: size, height: size, border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}

/* ─── Content Type Badge Colors ───────────────────────── */
const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  Reel: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444' },
  Carousel: { bg: 'rgba(168,85,247,0.12)', text: '#a855f7' },
  Static: { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6' },
  Story: { bg: 'rgba(255,107,74,0.1)', text: '#ff6b4a' },
}

/* ─── Parse [POST:{...}] tags from agent response ────── */
function extractPosts(text: string): { cleaned: string; posts: Omit<PostCard, 'id' | 'imageUrl' | 'imageLoading' | 'clientName' | 'uploadedFile'>[] } {
  const posts: Omit<PostCard, 'id' | 'imageUrl' | 'imageLoading' | 'clientName' | 'uploadedFile'>[] = []
  const cleaned = text.replace(/\[POST:([\s\S]*?)\]/g, (_, json) => {
    try {
      const parsed = JSON.parse(json)
      posts.push({
        hook: parsed.hook || '',
        caption: parsed.caption || '',
        hashtags: parsed.hashtags || [],
        cta: parsed.cta || '',
        contentType: parsed.contentType || 'Static',
        bestTime: parsed.bestTime || '',
        day: parsed.day || '',
        imagePrompt: parsed.imagePrompt || '',
      })
    } catch {
      // ignore parse errors
    }
    return ''
  }).trim()
  return { cleaned, posts }
}

/* ─── Simple Markdown Renderer ───────────────────────── */
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('## ')) {
      nodes.push(<h3 key={`h-${i}`} style={{ fontSize: '14px', fontWeight: 700, margin: '10px 0 4px', color: 'var(--text-primary)' }}>{line.slice(3)}</h3>)
      i++; continue
    }
    if (line.startsWith('### ') || line.startsWith('# ')) {
      const sliceAt = line.startsWith('### ') ? 4 : 2
      nodes.push(<h3 key={`h-${i}`} style={{ fontSize: '13px', fontWeight: 700, margin: '8px 0 4px', color: 'var(--text-secondary)' }}>{line.slice(sliceAt)}</h3>)
      i++; continue
    }
    if (line.match(/^[-*]\s/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^[-*]\s/)) {
        items.push(lines[i].replace(/^[-*]\s/, ''))
        i++
      }
      nodes.push(
        <ul key={`ul-${i}`} style={{ paddingLeft: '18px', margin: '4px 0' }}>
          {items.map((item, idx) => <li key={idx} style={{ fontSize: '13px', marginBottom: '2px' }}>{inlineMd(item)}</li>)}
        </ul>
      )
      continue
    }
    if (line.trim() === '') { i++; continue }
    nodes.push(<p key={`p-${i}`} style={{ fontSize: '13px', marginBottom: '6px', lineHeight: 1.6 }}>{inlineMd(line)}</p>)
    i++
  }
  return nodes
}

function inlineMd(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={idx}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={idx}>{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={idx} style={{ background: 'var(--bg-secondary)', padding: '1px 4px', borderRadius: '3px', fontSize: '12px' }}>{part.slice(1, -1)}</code>
    return part
  })
}

/* ─── Post Card Component ────────────────────────────── */
function PostCardComponent({
  post,
  onCopy,
  onSave,
}: {
  post: PostCard
  onCopy: () => void
  onSave: () => void
}) {
  const [copied, setCopied] = useState(false)
  const badge = BADGE_COLORS[post.contentType] || BADGE_COLORS.Static
  const isGenerating = post.imageLoading
  const glowColor = isGenerating ? 'rgba(245,166,35,0.4)' : 'rgba(76,175,125,0.3)'

  function handleCopy() {
    const fullText = `${post.hook}\n\n${post.caption}\n\n${post.hashtags.join(' ')}\n\n${post.cta}`
    navigator.clipboard.writeText(fullText)
    setCopied(true)
    onCopy()
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="animate-fadeIn"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        overflow: 'hidden',
        boxShadow: `0 0 20px ${glowColor}, var(--shadow-sm)`,
        transition: 'box-shadow 0.4s ease',
      }}
    >
      {/* Image area */}
      <div style={{
        height: '180px',
        background: '#0f1117',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {post.uploadedFile ? (
          post.uploadedFile.startsWith('data:video') ? (
            <video src={post.uploadedFile} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
          ) : (
            <img src={post.uploadedFile} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )
        ) : post.imageUrl ? (
          <img src={post.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : isGenerating ? (
          <div style={{ textAlign: 'center' }}>
            <Spinner size={24} />
            <p style={{ color: '#9ca3af', fontSize: '11px', marginTop: '10px' }}>Higgsfield is rendering...</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#4b5563' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
            </svg>
            <p style={{ fontSize: '11px', marginTop: '6px' }}>No visual</p>
          </div>
        )}
        {/* Content type badge */}
        <div style={{
          position: 'absolute', top: '10px', right: '10px',
          background: badge.bg, color: badge.text,
          padding: '3px 10px', borderRadius: '20px',
          fontSize: '11px', fontWeight: 700,
          backdropFilter: 'blur(8px)',
          border: `1px solid ${badge.text}33`,
        }}>
          {post.contentType}
        </div>
        {/* Day badge */}
        {post.day && (
          <div style={{
            position: 'absolute', top: '10px', left: '10px',
            background: 'rgba(0,0,0,0.6)', color: '#fff',
            padding: '3px 10px', borderRadius: '20px',
            fontSize: '10px', fontWeight: 600,
            backdropFilter: 'blur(8px)',
          }}>
            {post.day}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px' }}>
        {/* Hook */}
        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.4 }}>
          {post.hook}
        </p>

        {/* Caption */}
        <p style={{
          fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6,
          marginBottom: '10px', whiteSpace: 'pre-wrap',
          maxHeight: '80px', overflow: 'hidden',
          WebkitMaskImage: 'linear-gradient(180deg, #000 60%, transparent)',
          maskImage: 'linear-gradient(180deg, #000 60%, transparent)',
        }}>
          {post.caption.replace(/\\n/g, '\n')}
        </p>

        {/* Hashtags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
          {post.hashtags.slice(0, 6).map((tag, i) => (
            <span key={i} style={{
              background: 'var(--bg-secondary)', color: '#3b82f6',
              padding: '2px 8px', borderRadius: '12px',
              fontSize: '10.5px', fontWeight: 600,
              border: '1px solid rgba(59,130,246,0.15)',
            }}>
              {tag}
            </span>
          ))}
          {post.hashtags.length > 6 && (
            <span style={{ color: 'var(--text-muted)', fontSize: '10.5px', padding: '2px 4px' }}>
              +{post.hashtags.length - 6}
            </span>
          )}
        </div>

        {/* CTA */}
        <p style={{ fontSize: '11.5px', color: 'var(--accent)', fontWeight: 600, marginBottom: '8px' }}>
          {post.cta}
        </p>

        {/* Best time + client */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
            Best: {post.bestTime}
          </span>
          <span style={{
            fontSize: '10px', color: 'var(--accent)', fontWeight: 600,
            background: 'var(--accent-light)', padding: '2px 8px', borderRadius: '10px',
          }}>
            {post.clientName}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={handleCopy} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            padding: '7px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            color: copied ? '#4caf7d' : 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}>
            {copied ? <><CheckIcon /> Copied</> : <><CopyIcon /> Copy Caption</>}
          </button>
          <button onClick={onSave} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            padding: '7px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}>
            <SaveIcon /> Save to Folder
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Component ──────────────────────────────────── */
export default function ContentAgentPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<ClientOption[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [posts, setPosts] = useState<PostCard[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid')
  const [uploadFile, setUploadFile] = useState<{ dataUrl: string; name: string; type: string } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const selectedClient = clients.find((c) => c.id === selectedClientId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load clients
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('clients')
      .select('id, name, brain')
      .order('name')
      .then(({ data }) => {
        if (data) setClients(data)
      })
  }, [])

  // Send greeting when client is selected
  useEffect(() => {
    if (selectedClient) {
      const greeting: Message = {
        role: 'assistant',
        content: `Ready for **${selectedClient.name}**. Upload footage and tell me what to make, or just describe the post you want.`,
      }
      setMessages([greeting])
      setPosts([])
    }
  }, [selectedClientId])

  // Generate Higgsfield image for a post
  const generateImage = useCallback(async (postId: string, imagePrompt: string) => {
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, imageLoading: true } : p))

    try {
      const res = await fetch('/api/generate-content-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt }),
      })

      if (res.ok) {
        const data = await res.json()
        setPosts((prev) => prev.map((p) =>
          p.id === postId ? { ...p, imageUrl: data.imageUrl || null, imageLoading: false } : p
        ))
      } else {
        setPosts((prev) => prev.map((p) =>
          p.id === postId ? { ...p, imageLoading: false } : p
        ))
      }
    } catch {
      setPosts((prev) => prev.map((p) =>
        p.id === postId ? { ...p, imageLoading: false } : p
      ))
    }
  }, [])

  // Handle file selection
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setUploadFile({
        dataUrl: reader.result as string,
        name: file.name,
        type: file.type,
      })
    }
    reader.readAsDataURL(file)
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Remove uploaded file
  function clearUpload() {
    setUploadFile(null)
  }

  // Send message
  const sendMessage = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim()
      if (!content || loading) return

      const userMsg: Message = {
        role: 'user',
        content: uploadFile ? `[Uploaded: ${uploadFile.name}]\n${content}` : content,
        filePreview: uploadFile?.dataUrl,
        fileName: uploadFile?.name,
      }

      const currentUpload = uploadFile
      setUploadFile(null)

      const history = [...messages, userMsg]
      setMessages(history)
      setInput('')
      setLoading(true)

      if (textareaRef.current) textareaRef.current.style.height = 'auto'

      abortRef.current = new AbortController()

      try {
        const clientBrain = selectedClient ? getClientBrain(selectedClient) : undefined

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.content })),
            agent: 'content-creator',
            clientBrain,
          }),
          signal: abortRef.current.signal,
        })

        if (!res.ok || !res.body) throw new Error('Request failed')

        setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let fullResponse = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          fullResponse += chunk

          // Show cleaned text during streaming
          const { cleaned } = extractPosts(fullResponse)
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: cleaned }
            return updated
          })
        }

        // Extract posts from final response
        const { cleaned, posts: newPosts } = extractPosts(fullResponse)
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: cleaned }
          return updated
        })

        // Create post cards
        if (newPosts.length > 0) {
          const clientName = selectedClient?.name || 'General'
          const postCards: PostCard[] = newPosts.map((p) => ({
            ...p,
            id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            imageUrl: null,
            imageLoading: false,
            clientName,
            uploadedFile: currentUpload?.dataUrl,
          }))

          setPosts((prev) => [...prev, ...postCards])

          // If calendar mode (5+ posts), switch to calendar view
          if (newPosts.length >= 5) setViewMode('calendar')

          // Generate images for posts that have imagePrompts
          for (const card of postCards) {
            if (card.imagePrompt && !card.uploadedFile) {
              generateImage(card.id, card.imagePrompt)
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Something went wrong. Please check your API key and try again.' },
        ])
      } finally {
        setLoading(false)
        abortRef.current = null
      }
    },
    [input, loading, messages, selectedClient, uploadFile, generateImage]
  )

  // Save post to folder (browser download)
  function savePost(post: PostCard) {
    const dateStr = new Date().toISOString().split('T')[0]
    const captionText = `${post.hook}\n\n${post.caption.replace(/\\n/g, '\n')}\n\n${post.hashtags.join(' ')}\n\n${post.cta}\n\nBest time to post: ${post.bestTime}\nContent type: ${post.contentType}`
    const blob = new Blob([captionText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${post.clientName}_${dateStr}_${post.day || 'post'}.txt`
    a.click()
    URL.revokeObjectURL(url)

    // Download image if available
    if (post.imageUrl || post.uploadedFile) {
      const imgUrl = post.imageUrl || post.uploadedFile!
      const imgLink = document.createElement('a')
      imgLink.href = imgUrl
      imgLink.download = `${post.clientName}_${dateStr}_${post.day || 'post'}.jpg`
      imgLink.target = '_blank'
      imgLink.click()
    }
  }

  // Save all posts (batch)
  function saveAllPosts() {
    posts.forEach((post) => savePost(post))
  }

  // Clear chat
  function clearChat() {
    if (loading && abortRef.current) abortRef.current.abort()
    setMessages(selectedClient ? [{
      role: 'assistant',
      content: `Ready for **${selectedClient.name}**. Upload footage and tell me what to make, or just describe the post you want.`,
    }] : [])
    setInput('')
    setLoading(false)
    setPosts([])
    setUploadFile(null)
  }

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
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }

  const canSend = (input.trim().length > 0 || uploadFile) && !loading
  const isEmpty = messages.length === 0
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

  /* ─── RENDER ─────────────────────────────────────────── */
  return (
    <div className="animate-fadeIn" style={{
      height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        padding: '12px 24px',
        borderBottom: '1px solid var(--border)',
        background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%',
            background: 'rgba(59,130,246,0.12)', border: '1.5px solid rgba(59,130,246,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 800, color: '#3b82f6',
            fontFamily: 'var(--font-syne), sans-serif',
          }}>
            C
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              Content Agent
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
              Powered by Claude + Higgsfield AI
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Client selector */}
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            style={{
              background: selectedClientId ? 'rgba(59,130,246,0.08)' : 'var(--bg-secondary)',
              border: `1px solid ${selectedClientId ? 'rgba(59,130,246,0.3)' : 'var(--border)'}`,
              borderRadius: '7px',
              color: selectedClientId ? '#3b82f6' : 'var(--text-muted)',
              fontSize: '12px', fontWeight: 600, padding: '5px 10px',
              cursor: 'pointer', fontFamily: 'inherit', outline: 'none', maxWidth: '180px',
            }}
          >
            <option value="">Select client...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* View mode toggle */}
          {posts.length > 0 && (
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '7px', overflow: 'hidden' }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '5px 10px', border: 'none', cursor: 'pointer',
                  background: viewMode === 'grid' ? 'var(--bg-secondary)' : 'transparent',
                  color: viewMode === 'grid' ? 'var(--text-primary)' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, fontFamily: 'inherit',
                }}
              >
                <GridIcon /> Grid
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                style={{
                  padding: '5px 10px', border: 'none', borderLeft: '1px solid var(--border)', cursor: 'pointer',
                  background: viewMode === 'calendar' ? 'var(--bg-secondary)' : 'transparent',
                  color: viewMode === 'calendar' ? 'var(--text-primary)' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, fontFamily: 'inherit',
                }}
              >
                <CalendarIcon /> Calendar
              </button>
            </div>
          )}

          {/* Save all */}
          {posts.length > 1 && (
            <button onClick={saveAllPosts} style={{
              padding: '5px 12px', borderRadius: '7px', fontSize: '11px', fontWeight: 600,
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <SaveIcon /> Save All
            </button>
          )}

          {messages.length > 0 && (
            <button onClick={clearChat} style={{
              background: 'transparent', border: '1px solid var(--border-strong)',
              borderRadius: '7px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600,
              padding: '5px 14px', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              New chat
            </button>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
        {/* ═══ LEFT: Chat Panel ═══ */}
        <div style={{
          width: posts.length > 0 ? '45%' : '100%',
          display: 'flex', flexDirection: 'column',
          borderRight: posts.length > 0 ? '1px solid var(--border)' : 'none',
          transition: 'width 0.3s ease',
          minHeight: 0,
        }}>
          {/* Messages area */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '20px 24px',
            display: 'flex', flexDirection: 'column',
            minHeight: 0,
          }}>
            {/* Empty state */}
            {isEmpty && (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', padding: '40px 20px',
              }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '16px',
                  background: 'rgba(59,130,246,0.12)', border: '1.5px solid rgba(59,130,246,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', fontWeight: 800, color: '#3b82f6',
                  marginBottom: '20px', fontFamily: 'var(--font-syne), sans-serif',
                }}>
                  C
                </div>
                <h1 style={{
                  fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)',
                  marginBottom: '10px', textAlign: 'center', fontFamily: 'var(--font-syne), sans-serif',
                }}>
                  Content Agent
                </h1>
                <p style={{
                  fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center',
                  marginBottom: '32px', maxWidth: '400px', lineHeight: 1.6,
                }}>
                  {selectedClient
                    ? `Select a client above to start creating content for ${selectedClient.name}.`
                    : 'Select a client above to start creating scroll-stopping content with AI.'}
                </p>

                {/* Suggestion chips */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', width: '100%', maxWidth: '500px' }}>
                  {[
                    'Make a post about our latest product launch',
                    'Plan the week — 5 posts, Monday to Friday',
                    'Write a carousel post about interior design tips',
                    'Create a Reel concept for behind-the-scenes content',
                  ].map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { if (selectedClient) sendMessage(s) }}
                      disabled={!selectedClient}
                      style={{
                        background: '#fff', border: '1.5px solid var(--border)',
                        borderRadius: '12px', padding: '14px 16px', fontSize: '13px',
                        color: selectedClient ? 'var(--text-secondary)' : 'var(--text-muted)',
                        cursor: selectedClient ? 'pointer' : 'not-allowed',
                        fontFamily: 'inherit', textAlign: 'left', lineHeight: 1.45,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        transition: 'all 0.15s ease',
                        opacity: selectedClient ? 1 : 0.5,
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {messages.map((msg, i) => {
                  const isUser = msg.role === 'user'
                  const isLast = i === messages.length - 1
                  const isTyping = isLast && loading && msg.role === 'assistant' && msg.content === ''

                  if (isUser) {
                    return (
                      <div key={i} className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                        {msg.filePreview && (
                          <div style={{
                            maxWidth: '200px', borderRadius: '12px', overflow: 'hidden',
                            border: '1px solid var(--border)',
                          }}>
                            {msg.filePreview.startsWith('data:video') ? (
                              <video src={msg.filePreview} style={{ width: '100%', display: 'block' }} muted controls />
                            ) : (
                              <img src={msg.filePreview} alt="" style={{ width: '100%', display: 'block' }} />
                            )}
                          </div>
                        )}
                        <div className="msg-user">{msg.content}</div>
                      </div>
                    )
                  }

                  return (
                    <div key={i} className="animate-fadeIn" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: 'rgba(59,130,246,0.12)', border: '1.5px solid rgba(59,130,246,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '10px', fontWeight: 800, color: '#3b82f6', flexShrink: 0,
                        marginTop: '2px', fontFamily: 'var(--font-syne), sans-serif',
                      }}>
                        C
                      </div>
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
          <div style={{
            padding: '12px 24px 16px', background: '#fff',
            borderTop: '1px solid var(--border)', flexShrink: 0,
          }}>
            {/* Upload preview */}
            {uploadFile && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 12px', marginBottom: '10px',
                background: 'var(--bg-secondary)', borderRadius: '10px',
                border: '1px solid var(--border)',
              }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                  {uploadFile.type.startsWith('video') ? (
                    <video src={uploadFile.dataUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                  ) : (
                    <img src={uploadFile.dataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {uploadFile.name}
                </span>
                <button onClick={clearUpload} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: '2px', display: 'flex',
                }}>
                  <XIcon />
                </button>
              </div>
            )}

            <div style={{ position: 'relative', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              {/* Upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!selectedClient}
                style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  cursor: selectedClient ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-muted)', flexShrink: 0,
                  transition: 'all 0.15s',
                  opacity: selectedClient ? 1 : 0.5,
                }}
              >
                <UploadIcon />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              {/* Text input */}
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    !selectedClient
                      ? 'Select a client to start...'
                      : uploadFile
                        ? 'Describe what you want to do with this file...'
                        : 'Describe the post you want, or say "plan the week"...'
                  }
                  disabled={!selectedClient}
                  rows={1}
                  className="chat-input"
                  style={{ display: 'block' }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!canSend}
                  style={{
                    position: 'absolute', right: '8px', bottom: '8px',
                    width: '34px', height: '34px', borderRadius: '10px',
                    background: canSend ? '#3b82f6' : 'var(--bg-secondary)',
                    border: 'none', cursor: canSend ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s ease', flexShrink: 0,
                    boxShadow: canSend ? '0 2px 8px rgba(59,130,246,0.4)' : 'none',
                    color: canSend ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  <SendIcon />
                </button>
              </div>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
              Enter to send · Shift+Enter for new line · Upload photos/videos to transform them
            </p>
          </div>
        </div>

        {/* ═══ RIGHT: Post Cards Panel ═══ */}
        {posts.length > 0 && (
          <div style={{
            flex: 1, overflowY: 'auto', padding: '20px',
            background: 'var(--bg)',
            minHeight: 0,
          }}>
            {viewMode === 'grid' ? (
              /* Grid View */
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px',
              }}>
                {posts.map((post) => (
                  <PostCardComponent
                    key={post.id}
                    post={post}
                    onCopy={() => {}}
                    onSave={() => savePost(post)}
                  />
                ))}
              </div>
            ) : (
              /* Calendar View */
              <div>
                <h3 style={{
                  fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)',
                  marginBottom: '16px', fontFamily: 'var(--font-syne), sans-serif',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <CalendarIcon /> Content Calendar
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>
                    Week of {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '12px',
                }}>
                  {DAYS.map((day) => {
                    const dayPost = posts.find((p) => p.day === day)
                    return (
                      <div key={day} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{
                          fontSize: '12px', fontWeight: 700, color: dayPost ? '#3b82f6' : 'var(--text-muted)',
                          textAlign: 'center', padding: '6px',
                          background: dayPost ? 'rgba(59,130,246,0.08)' : 'var(--bg-secondary)',
                          borderRadius: '8px',
                        }}>
                          {day}
                        </div>
                        {dayPost ? (
                          <PostCardComponent
                            post={dayPost}
                            onCopy={() => {}}
                            onSave={() => savePost(dayPost)}
                          />
                        ) : (
                          <div style={{
                            height: '200px', borderRadius: '14px',
                            border: '2px dashed var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-muted)', fontSize: '12px',
                          }}>
                            No post
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                {/* Posts without day assignment */}
                {posts.filter((p) => !DAYS.includes(p.day)).length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px' }}>
                      Unscheduled
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                      {posts.filter((p) => !DAYS.includes(p.day)).map((post) => (
                        <PostCardComponent
                          key={post.id}
                          post={post}
                          onCopy={() => {}}
                          onSave={() => savePost(post)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

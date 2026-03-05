'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type ClientBrain = {
  summary?: string
  positioning?: string
  tone_of_voice?: string
  target_audience?: string
  content_pillars?: string[]
  competitor_insights?: string
  brand_personality?: string
  key_messages?: string[]
  social_media_strategy?: string
  hashtag_clusters?: string[]
  do?: string[]
  dont?: string[]
  content_ideas?: string[]
}

type Client = {
  id: string
  name: string
  industry: string | null
  description: string | null
  website_url: string | null
  instagram_handle: string | null
  target_audience: string | null
  brand_colors: string | null
  brain: string | null
  brain_status: string | null
  created_at: string
}

const BLANK_FORM = {
  name: '',
  industry: '',
  description: '',
  website_url: '',
  instagram_handle: '',
  target_audience: '',
  brand_colors: '',
}

const INTERSTONES_SAMPLE = {
  name: 'Interstones Group',
  industry: 'Luxury Natural Stone Supply',
  description:
    'Luxury natural stone supplier based in North Miami. Specializes in premium marble, travertine, limestone, and exotic stone slabs for high-end residential and commercial projects.',
  website_url: 'https://interstonesgroup.com',
  instagram_handle: '@interstonesgroup',
  target_audience:
    'High-end homeowners, interior designers, architects, luxury home builders, and real estate developers in South Florida and nationally',
  brand_colors: 'Warm whites, creams, stone greys, gold accents',
}

const AVATAR_COLORS = [
  { bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.25)', text: '#d97706' },
  { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)', text: '#2563eb' },
  { bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.25)', text: '#9333ea' },
  { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', text: '#059669' },
  { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', text: '#dc2626' },
]

function getAvatarColor(name: string) {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}
function ExternalIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}
function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
function BrainIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2a2.5 2.5 0 0 1 5 0v.5A2.5 2.5 0 0 1 12 5a2.5 2.5 0 0 1-2.5-2.5V2z" />
      <path d="M9.5 2C7 2 5 4 5 6.5c0 1.5.7 2.8 1.8 3.6C5.7 11 5 12.4 5 14c0 2.2 1.8 4 4 4h6c2.2 0 4-1.8 4-4 0-1.6-.7-3-1.8-3.9C18.3 9.3 19 8 19 6.5 19 4 17 2 14.5 2" />
    </svg>
  )
}

const LABEL = {
  display: 'block' as const,
  fontSize: '11px',
  fontWeight: '700' as const,
  color: 'var(--text-secondary)',
  marginBottom: '7px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.07em',
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(BLANK_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewingBrain, setViewingBrain] = useState<Client | null>(null)
  const [brainCache, setBrainCache] = useState<Record<string, ClientBrain>>({})
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const supabase = createClient()

  useEffect(() => { fetchClients() }, [])

  // Stable polling — only create one interval, don't recreate on every clients change
  useEffect(() => {
    const hasAnalyzing = clients.some((c) => c.brain_status === 'analyzing')
    if (hasAnalyzing && !pollRef.current) {
      pollRef.current = setInterval(fetchClients, 3000)
    } else if (!hasAnalyzing && pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    // Cleanup on unmount
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }
  }, [clients.some((c) => c.brain_status === 'analyzing')])

  async function fetchClients() {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    setClients(data ?? [])
    setLoading(false)
  }

  async function addClient(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    const { data: newClient, error: insertError } = await supabase
      .from('clients')
      .insert({
        name: form.name,
        industry: form.industry || null,
        description: form.description || null,
        website_url: form.website_url || null,
        instagram_handle: form.instagram_handle || null,
        target_audience: form.target_audience || null,
        brand_colors: form.brand_colors || null,
        brain_status: 'analyzing',
        user_id: user?.id,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    setShowModal(false)
    setForm(BLANK_FORM)
    setSaving(false)
    await fetchClients()

    // Trigger AI analysis in background — card already shows "Analyzing…"
    if (newClient) {
      triggerAnalysis(newClient.id, form)
    }
  }

  async function triggerAnalysis(clientId: string, fields: typeof BLANK_FORM) {
    console.log('[brain] Starting analysis for client:', clientId)

    let brain: ClientBrain | null = null
    try {
      const res = await fetch('/api/analyze-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fields.name,
          description: fields.description,
          website_url: fields.website_url,
        }),
      })

      console.log('[brain] API response status:', res.status)

      if (!res.ok) {
        const text = await res.text()
        console.error('[brain] API error response:', text)
      } else {
        const data = await res.json()
        console.log('[brain] API returned data:', JSON.stringify(data).slice(0, 300))
        brain = data.brain ?? null
      }
    } catch (err) {
      console.error('[brain] fetch threw exception:', err)
    }

    if (brain) {
      // Store in memory immediately — card updates even if DB write fails
      setBrainCache((prev) => ({ ...prev, [clientId]: brain! }))

      // Separate updates: status first (always works), then brain column (may fail if column missing)
      await supabase.from('clients').update({ brain_status: 'complete' }).eq('id', clientId)
      const { error: brainErr } = await supabase
        .from('clients')
        .update({ brain: JSON.stringify(brain) })
        .eq('id', clientId)
      if (brainErr) {
        console.warn('[brain] Could not persist brain column (may not exist yet):', brainErr.message)
        console.log('[brain] Brain is cached in memory — card will still display correctly')
      } else {
        console.log('[brain] Brain persisted to Supabase successfully')
      }
    } else {
      console.log('[brain] No brain returned — setting status to error')
      await supabase.from('clients').update({ brain_status: 'error' }).eq('id', clientId)
    }

    fetchClients()
  }

  async function reanalyze(client: Client) {
    // Clear cached brain so card shows "Building..." state
    setBrainCache((prev) => { const next = { ...prev }; delete next[client.id]; return next })
    await supabase.from('clients').update({ brain_status: 'analyzing' }).eq('id', client.id)
    fetchClients()
    triggerAnalysis(client.id, {
      name: client.name,
      industry: client.industry ?? '',
      description: client.description ?? '',
      website_url: client.website_url ?? '',
      instagram_handle: client.instagram_handle ?? '',
      target_audience: client.target_audience ?? '',
      brand_colors: client.brand_colors ?? '',
    })
  }

  async function deleteClient(id: string) {
    if (!confirm('Delete this client and their Brain? This cannot be undone.')) return
    await supabase.from('clients').delete().eq('id', id)
    fetchClients()
  }

  function parseBrain(client: Client): ClientBrain | null {
    // Check in-memory cache first (populated immediately after API success)
    if (brainCache[client.id]) return brainCache[client.id]
    if (!client.brain) return null
    try {
      // Handle both string (text column) and object (jsonb column)
      return typeof client.brain === 'object' ? client.brain as ClientBrain : JSON.parse(client.brain)
    } catch { return null }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '36px 44px', background: '#f7f8fc' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'var(--font-syne), sans-serif' }}>
            Clients
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            {loading ? '…' : `${clients.length} client${clients.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-gold">
          <PlusIcon /> Add Client
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ borderRadius: '14px', height: '200px' }} />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '64px 40px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '22px' }}>
            👥
          </div>
          <p style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '6px' }}>No clients yet</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '22px' }}>
            Add your first client and the AI will build their Brain automatically.
          </p>
          <button onClick={() => { setForm(INTERSTONES_SAMPLE); setShowModal(true) }} className="btn-ghost" style={{ margin: '0 auto 10px', display: 'flex' }}>
            Load Interstones Sample
          </button>
          <button onClick={() => setShowModal(true)} className="btn-gold" style={{ margin: '0 auto' }}>
            <PlusIcon /> Add Client
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {clients.map((client) => {
            const av = getAvatarColor(client.name)
            const brain = parseBrain(client)
            const isAnalyzing = client.brain_status === 'analyzing'
            return (
              <div
                key={client.id}
                style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', boxShadow: 'var(--shadow-sm)', transition: 'box-shadow 0.15s, transform 0.15s', display: 'flex', flexDirection: 'column', gap: '14px' }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = 'var(--shadow-md)'; el.style.transform = 'translateY(-1px)' }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = 'var(--shadow-sm)'; el.style.transform = 'translateY(0)' }}
              >
                {/* Top row: avatar + name + delete */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: av.bg, border: `1px solid ${av.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', color: av.text, flexShrink: 0, fontFamily: 'var(--font-syne), sans-serif' }}>
                      {client.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.2 }}>{client.name}</div>
                      {client.industry && (
                        <div style={{ fontSize: '11px', color: av.text, marginTop: '3px', background: av.bg, border: `1px solid ${av.border}`, borderRadius: '5px', padding: '1px 7px', display: 'inline-block', fontWeight: '600' }}>
                          {client.industry}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteClient(client.id)}
                    title="Delete client"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '5px', borderRadius: '6px', transition: 'all 0.15s', lineHeight: 0 }}
                    onMouseEnter={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.color = '#dc2626'; el.style.background = 'rgba(220,38,38,0.08)' }}
                    onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.color = 'var(--text-muted)'; el.style.background = 'none' }}
                  >
                    <TrashIcon />
                  </button>
                </div>

                {/* Brain section */}
                <div style={{ background: isAnalyzing ? 'rgba(245,166,35,0.04)' : client.brain_status === 'error' ? 'rgba(220,38,38,0.04)' : brain ? 'rgba(245,166,35,0.05)' : 'var(--bg-secondary)', border: `1px solid ${isAnalyzing ? 'rgba(245,166,35,0.2)' : client.brain_status === 'error' ? 'rgba(220,38,38,0.2)' : brain ? 'rgba(245,166,35,0.18)' : 'var(--border)'}`, borderRadius: '9px', padding: '12px' }}>
                  {isAnalyzing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f5a623', animation: 'pulse 1.5s infinite' }} />
                      <span style={{ fontSize: '12px', color: '#d97706', fontWeight: '600' }}>Building Client Brain…</span>
                    </div>
                  ) : client.brain_status === 'error' ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600' }}>⚠ Analysis failed</span>
                      <button
                        onClick={() => reanalyze(client)}
                        style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '6px', fontSize: '11px', fontWeight: '600', color: '#dc2626', padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        Retry
                      </button>
                    </div>
                  ) : brain ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                        <span style={{ color: '#d97706' }}><BrainIcon /></span>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Client Brain</span>
                      </div>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.55', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {brain.summary}
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No Brain yet</span>
                      <button
                        onClick={() => reanalyze(client)}
                        style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        Analyze
                      </button>
                    </div>
                  )}
                </div>

                {/* Bottom row: links + View Brain */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {client.website_url && (
                    <a href={client.website_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#2563eb', textDecoration: 'none', padding: '3px 9px', borderRadius: '5px', background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)' }}>
                      <ExternalIcon />
                      {client.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0]}
                    </a>
                  )}
                  {client.instagram_handle && (
                    <span style={{ fontSize: '11px', color: '#7c3aed', padding: '3px 9px', borderRadius: '5px', background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.15)' }}>
                      {client.instagram_handle.startsWith('@') ? client.instagram_handle : `@${client.instagram_handle}`}
                    </span>
                  )}
                  {brain && (
                    <button
                      onClick={() => setViewingBrain(client)}
                      style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '700', color: '#d97706', background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.22)', borderRadius: '7px', padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(245,166,35,0.15)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(245,166,35,0.08)' }}
                    >
                      <BrainIcon /> View Brain
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Client Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>Add Client</h2>
              <button
                onClick={() => setForm(INTERSTONES_SAMPLE)}
                style={{ fontSize: '11px', fontWeight: '700', color: '#d97706', background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.22)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Load Sample ✦
              </button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
              The AI will automatically build a Client Brain after you save.
            </p>
            <form onSubmit={addClient} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={LABEL}>Client Name *</label>
                  <input className="input-field" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Acme Corporation" required />
                </div>
                <div>
                  <label style={LABEL}>Industry</label>
                  <input className="input-field" value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} placeholder="Luxury Fashion" />
                </div>
              </div>
              <div>
                <label style={LABEL}>Description</label>
                <textarea className="input-field" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Brief description of the client and their business…" rows={2} style={{ resize: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={LABEL}>Website URL</label>
                  <input className="input-field" value={form.website_url} onChange={(e) => setForm((f) => ({ ...f, website_url: e.target.value }))} placeholder="https://example.com" />
                </div>
                <div>
                  <label style={LABEL}>Instagram Handle</label>
                  <input className="input-field" value={form.instagram_handle} onChange={(e) => setForm((f) => ({ ...f, instagram_handle: e.target.value }))} placeholder="@clienthandle" />
                </div>
              </div>
              <div>
                <label style={LABEL}>Target Audience</label>
                <input className="input-field" value={form.target_audience} onChange={(e) => setForm((f) => ({ ...f, target_audience: e.target.value }))} placeholder="High-end homeowners, interior designers aged 30–55…" />
              </div>
              <div>
                <label style={LABEL}>Brand Colors</label>
                <input className="input-field" value={form.brand_colors} onChange={(e) => setForm((f) => ({ ...f, brand_colors: e.target.value }))} placeholder="Navy blue #1e3a5f, gold #c9a84c, white" />
              </div>
              {error && (
                <div style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#dc2626' }}>
                  {error}
                </div>
              )}
              <div style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.18)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#92590a' }}>
                ✦ After saving, Claude will analyze this client and build their Brain automatically (takes ~15 seconds).
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => { setShowModal(false); setForm(BLANK_FORM) }} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={saving} className="btn-gold" style={{ flex: 1, justifyContent: 'center' }}>
                  {saving ? 'Saving…' : 'Add & Analyze'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Brain Modal */}
      {viewingBrain && (() => {
        // Use the latest client data if available, fallback to snapshot
        const liveClient = clients.find((c) => c.id === viewingBrain.id) ?? viewingBrain
        const brain = parseBrain(liveClient)
        if (!brain) return null
        const av = getAvatarColor(viewingBrain.name)

        const sections: { label: string; content: React.ReactNode }[] = [
          { label: 'Summary', content: brain.summary },
          { label: 'Positioning', content: brain.positioning },
          { label: 'Tone of Voice', content: brain.tone_of_voice },
          { label: 'Target Audience', content: brain.target_audience },
          { label: 'Brand Personality', content: brain.brand_personality },
          { label: 'Competitor Insights', content: brain.competitor_insights },
          { label: 'Social Media Strategy', content: brain.social_media_strategy },
        ].filter((s) => s.content)

        const listSections: { label: string; items: string[] }[] = [
          { label: 'Content Pillars', items: brain.content_pillars ?? [] },
          { label: 'Key Messages', items: brain.key_messages ?? [] },
          { label: 'Content Ideas', items: brain.content_ideas ?? [] },
          { label: 'Always Do', items: brain.do ?? [] },
          { label: 'Never Do', items: brain.dont ?? [] },
          { label: 'Hashtag Strategy', items: brain.hashtag_clusters ?? [] },
        ].filter((s) => s.items.length > 0)

        return (
          <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setViewingBrain(null)}>
            <div className="modal" style={{ maxWidth: '640px', maxHeight: '88vh', overflowY: 'auto' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: av.bg, border: `1px solid ${av.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', color: av.text, fontFamily: 'var(--font-syne), sans-serif' }}>
                    {viewingBrain.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>{viewingBrain.name}</div>
                    <div style={{ fontSize: '11px', color: '#d97706', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <BrainIcon /> Client Brain
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => reanalyze(viewingBrain)} style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '7px', padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Re-analyze
                  </button>
                  <button onClick={() => setViewingBrain(null)} style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '7px', padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Close
                  </button>
                </div>
              </div>

              {/* Text sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {sections.map(({ label, content }) => (
                  <div key={label} style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '14px 16px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{label}</div>
                    <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: '1.6', margin: 0 }}>{content as string}</p>
                  </div>
                ))}

                {/* List sections */}
                {listSections.map(({ label, items }) => (
                  <div key={label} style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '14px 16px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{label}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {items.map((item, i) => (
                        <span key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', background: '#fff', border: '1px solid var(--border)', borderRadius: '6px', padding: '3px 10px', lineHeight: '1.5' }}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

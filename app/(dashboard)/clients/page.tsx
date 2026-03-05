'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Client = {
  id: string
  name: string
  description: string | null
  website_url: string | null
  created_at: string
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

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', website_url: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => { fetchClients() }, [])

  async function fetchClients() {
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    setClients(data ?? [])
    setLoading(false)
  }

  async function addClient(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('clients').insert({
      name: form.name,
      description: form.description || null,
      website_url: form.website_url || null,
      user_id: user?.id,
    })
    if (error) { setError(error.message); setSaving(false); return }
    setShowModal(false)
    setForm({ name: '', description: '', website_url: '' })
    setSaving(false)
    fetchClients()
  }

  async function deleteClient(id: string) {
    if (!confirm('Delete this client? This cannot be undone.')) return
    await supabase.from('clients').delete().eq('id', id)
    fetchClients()
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ borderRadius: '14px', height: '148px' }} />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '64px 40px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '22px',
            }}
          >
            👥
          </div>
          <p style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '6px' }}>
            No clients yet
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '22px' }}>
            Add your first client to get started.
          </p>
          <button onClick={() => setShowModal(true)} className="btn-gold" style={{ margin: '0 auto' }}>
            <PlusIcon /> Add Client
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {clients.map((client) => {
            const av = getAvatarColor(client.name)
            return (
              <div
                key={client.id}
                style={{
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '20px',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'box-shadow 0.15s, transform 0.15s',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.boxShadow = 'var(--shadow-md)'
                  el.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.boxShadow = 'var(--shadow-sm)'
                  el.style.transform = 'translateY(0)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '11px',
                        background: av.bg,
                        border: `1px solid ${av.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '800',
                        color: av.text,
                        flexShrink: 0,
                        fontFamily: 'var(--font-syne), sans-serif',
                      }}
                    >
                      {client.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {client.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Added {new Date(client.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteClient(client.id)}
                    title="Delete client"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      padding: '5px',
                      borderRadius: '6px',
                      transition: 'all 0.15s',
                      lineHeight: 0,
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.color = '#dc2626'
                      el.style.background = 'rgba(220,38,38,0.08)'
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.color = 'var(--text-muted)'
                      el.style.background = 'none'
                    }}
                  >
                    <TrashIcon />
                  </button>
                </div>

                {client.description && (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.55', marginBottom: '14px' }}>
                    {client.description}
                  </p>
                )}

                {client.website_url && (
                  <a
                    href={client.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '12px',
                      color: '#2563eb',
                      textDecoration: 'none',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'rgba(59,130,246,0.07)',
                      border: '1px solid rgba(59,130,246,0.15)',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(59,130,246,0.12)'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(59,130,246,0.07)'
                    }}
                  >
                    <ExternalIcon />
                    {client.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="modal">
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
              Add Client
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
              Fill in the details for your new client.
            </p>
            <form onSubmit={addClient} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Client Name *
                </label>
                <input
                  className="input-field"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Acme Corporation"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Description
                </label>
                <textarea
                  className="input-field"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of the client and their business…"
                  rows={3}
                  style={{ resize: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Website URL
                </label>
                <input
                  className="input-field"
                  type="url"
                  value={form.website_url}
                  onChange={(e) => setForm((f) => ({ ...f, website_url: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>
              {error && (
                <div style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#dc2626' }}>
                  {error}
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-gold" style={{ flex: 1, justifyContent: 'center' }}>
                  {saving ? 'Adding…' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

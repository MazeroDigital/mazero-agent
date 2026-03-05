'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Proposal = {
  id: string
  title: string
  pitch: string | null
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  client_id: string | null
  created_at: string
  clients?: { name: string } | null
}

type Client = { id: string; name: string }

const STATUS_OPTIONS = ['draft', 'sent', 'accepted', 'rejected'] as const

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  draft: { bg: 'rgba(107,107,138,0.15)', color: '#8888a4' },
  sent: { bg: 'rgba(91,140,245,0.15)', color: '#5b8cf5' },
  accepted: { bg: 'rgba(76,175,125,0.15)', color: '#4caf7d' },
  rejected: { bg: 'rgba(224,82,82,0.15)', color: '#e05252' },
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', pitch: '', client_id: '', status: 'draft' })
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [{ data: pData }, { data: cData }] = await Promise.all([
      supabase.from('proposals').select('*, clients(name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name'),
    ])
    setProposals(pData ?? [])
    setClients(cData ?? [])
    setLoading(false)
  }

  async function addProposal(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    await supabase.from('proposals').insert({
      title: form.title,
      pitch: form.pitch || null,
      client_id: form.client_id || null,
      status: form.status,
      user_id: user?.id,
    })
    setShowModal(false)
    setForm({ title: '', pitch: '', client_id: '', status: 'draft' })
    setSaving(false)
    fetchData()
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('proposals').update({ status }).eq('id', id)
    fetchData()
  }

  async function deleteProposal(id: string) {
    if (!confirm('Delete this proposal?')) return
    await supabase.from('proposals').delete().eq('id', id)
    fetchData()
  }

  const counts = STATUS_OPTIONS.reduce(
    (acc, s) => ({ ...acc, [s]: proposals.filter((p) => p.status === s).length }),
    {} as Record<string, number>
  )

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#e8e8f0' }}>Proposals</h1>
          <p style={{ color: '#6b6b8a', fontSize: '13px', marginTop: '4px' }}>
            Create and track proposals for your clients.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-gold">
          <PlusIcon />
          New Proposal
        </button>
      </div>

      {/* Status summary */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {STATUS_OPTIONS.map((s) => (
          <div
            key={s}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              background: STATUS_STYLE[s].bg,
              border: `1px solid ${STATUS_STYLE[s].color}30`,
            }}
          >
            <span style={{ fontSize: '18px', fontWeight: '800', color: STATUS_STYLE[s].color, marginRight: '7px' }}>
              {counts[s] ?? 0}
            </span>
            <span style={{ fontSize: '12px', color: '#8888a4', fontWeight: '600', textTransform: 'capitalize' }}>{s}</span>
          </div>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ color: '#6b6b8a', fontSize: '14px' }}>Loading...</div>
      ) : proposals.length === 0 ? (
        <div className="glass" style={{ borderRadius: '14px', padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '42px', marginBottom: '14px', opacity: 0.35 }}>📄</div>
          <p style={{ color: '#e8e8f0', fontWeight: '700', fontSize: '15px', marginBottom: '6px' }}>No proposals yet</p>
          <p style={{ color: '#6b6b8a', fontSize: '13px', marginBottom: '20px' }}>Draft your first client proposal.</p>
          <button onClick={() => setShowModal(true)} className="btn-gold" style={{ margin: '0 auto' }}>
            <PlusIcon />
            New Proposal
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {proposals.map((proposal) => (
            <div key={proposal.id} className="glass" style={{ borderRadius: '13px', padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '7px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#e8e8f0' }}>{proposal.title}</h3>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '3px 11px',
                        borderRadius: '20px',
                        fontSize: '10px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        ...STATUS_STYLE[proposal.status],
                      }}
                    >
                      {proposal.status}
                    </span>
                  </div>

                  {proposal.clients?.name && (
                    <p style={{ fontSize: '12px', color: '#f5a623', marginBottom: '8px', fontWeight: '600' }}>
                      Client: {proposal.clients.name}
                    </p>
                  )}

                  {proposal.pitch && (
                    <p style={{ fontSize: '13px', color: '#8888a4', lineHeight: '1.55', marginBottom: '10px' }}>
                      {proposal.pitch}
                    </p>
                  )}

                  <p style={{ fontSize: '11px', color: '#3a3a52' }}>
                    {new Date(proposal.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', flexShrink: 0 }}>
                  <select
                    value={proposal.status}
                    onChange={(e) => updateStatus(proposal.id, e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '7px',
                      color: '#e8e8f0',
                      fontSize: '12px',
                      padding: '6px 10px',
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      outline: 'none',
                      minWidth: '110px',
                    }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => deleteProposal(proposal.id)}
                    style={{
                      background: 'rgba(224,82,82,0.08)',
                      border: '1px solid rgba(224,82,82,0.15)',
                      borderRadius: '7px',
                      color: '#e05252',
                      fontSize: '12px',
                      fontWeight: '600',
                      padding: '6px 10px',
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#e8e8f0', marginBottom: '4px' }}>New Proposal</h2>
            <p style={{ color: '#6b6b8a', fontSize: '13px', marginBottom: '22px' }}>Create a proposal for a client.</p>
            <form onSubmit={addProposal} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#8888a4', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Title *
                </label>
                <input
                  className="input-dark"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Q1 Social Media Strategy"
                  required
                />
              </div>
              {clients.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#8888a4', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Client
                  </label>
                  <select
                    className="input-dark"
                    value={form.client_id}
                    onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))}
                    style={{ appearance: 'none' }}
                  >
                    <option value="">No client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#8888a4', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Pitch
                </label>
                <textarea
                  className="input-dark"
                  value={form.pitch}
                  onChange={(e) => setForm((f) => ({ ...f, pitch: e.target.value }))}
                  placeholder="Describe your proposal in detail..."
                  rows={4}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-gold" style={{ flex: 1, justifyContent: 'center' }}>
                  {saving ? 'Creating...' : 'Create Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

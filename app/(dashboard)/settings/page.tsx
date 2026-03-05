'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

type ApiKey = { id: string; key_name: string; key_value: string; created_at: string }
type Tab = 'account' | 'api' | 'database'

const SQL_SCHEMA = `-- Run this SQL in your Supabase SQL editor

create table if not exists clients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  industry text,
  description text,
  website_url text,
  instagram_handle text,
  target_audience text,
  brand_colors text,
  brain text,
  brain_status text default 'none',
  created_at timestamptz default now()
);

-- If your clients table already exists, run these to add new columns:
-- alter table clients add column if not exists industry text;
-- alter table clients add column if not exists instagram_handle text;
-- alter table clients add column if not exists target_audience text;
-- alter table clients add column if not exists brand_colors text;
-- alter table clients add column if not exists brain text;
-- alter table clients add column if not exists brain_status text default 'none';

create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  client_id uuid references clients(id) on delete set null,
  title text not null,
  description text,
  deadline date,
  priority text default 'medium',
  completed boolean default false,
  created_at timestamptz default now()
);

create table if not exists proposals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  client_id uuid references clients(id) on delete set null,
  title text not null,
  pitch text,
  status text default 'draft',
  created_at timestamptz default now()
);

create table if not exists content_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  client_id uuid references clients(id) on delete set null,
  title text,
  caption text,
  media_type text default 'image',
  scheduled_date date,
  day_of_week text,
  status text default 'draft',
  created_at timestamptz default now()
);

create table if not exists api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  key_name text not null,
  key_value text not null,
  created_at timestamptz default now()
);

-- Row Level Security
alter table clients enable row level security;
alter table tasks enable row level security;
alter table proposals enable row level security;
alter table content_items enable row level security;
alter table api_keys enable row level security;

create policy "users_clients" on clients
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users_tasks" on tasks
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users_proposals" on proposals
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users_content" on content_items
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users_api_keys" on api_keys
  using (auth.uid() = user_id) with check (auth.uid() = user_id);`

const LABEL_STYLE = {
  display: 'block' as const,
  fontSize: '11px',
  fontWeight: '700' as const,
  color: 'var(--text-secondary)',
  marginBottom: '7px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.07em',
}
const VALUE_STYLE = {
  fontSize: '14px',
  color: 'var(--text-primary)',
  padding: '10px 14px',
  background: 'var(--bg-secondary)',
  borderRadius: '8px',
  border: '1px solid var(--border)',
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [showAddKey, setShowAddKey] = useState(false)
  const [keyForm, setKeyForm] = useState({ key_name: '', key_value: '' })
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('account')
  const [revealed, setRevealed] = useState<Set<string>>(new Set())

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    fetchApiKeys()
  }, [])

  async function fetchApiKeys() {
    const { data } = await supabase.from('api_keys').select('*').order('created_at', { ascending: false })
    setApiKeys(data ?? [])
  }

  async function addApiKey(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('api_keys').insert({ key_name: keyForm.key_name, key_value: keyForm.key_value, user_id: user?.id })
    setShowAddKey(false)
    setKeyForm({ key_name: '', key_value: '' })
    setSaving(false)
    fetchApiKeys()
  }

  async function deleteApiKey(id: string) {
    if (!confirm('Delete this API key?')) return
    await supabase.from('api_keys').delete().eq('id', id)
    fetchApiKeys()
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  function toggleReveal(id: string) {
    setRevealed((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'account', label: 'Account' },
    { id: 'api', label: 'API Keys' },
    { id: 'database', label: 'Database Setup' },
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '36px 44px', background: '#f7f8fc' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'var(--font-syne), sans-serif' }}>
          Settings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
          Manage your account and workspace configuration.
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '2px',
          marginBottom: '28px',
          background: '#fff',
          borderRadius: '10px',
          padding: '4px',
          border: '1px solid var(--border)',
          width: 'fit-content',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '7px 20px',
              borderRadius: '7px',
              fontSize: '13px',
              fontWeight: '600',
              fontFamily: 'inherit',
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.15s ease',
              background: activeTab === tab.id ? 'var(--gold)' : 'transparent',
              color: activeTab === tab.id ? '#0a0a0f' : 'var(--text-muted)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '28px',
            maxWidth: '560px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '24px' }}>
            Account Details
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {[
              { label: 'Email', value: user?.email ?? '—', mono: false },
              { label: 'User ID', value: user?.id ?? '—', mono: true },
              {
                label: 'Member Since',
                value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—',
                mono: false,
              },
            ].map(({ label, value, mono }) => (
              <div key={label}>
                <label style={LABEL_STYLE}>{label}</label>
                <div style={{ ...VALUE_STYLE, fontSize: mono ? '12px' : '14px', fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === 'api' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Securely store API keys for external services.</p>
            <button onClick={() => setShowAddKey(true)} className="btn-gold" style={{ fontSize: '13px' }}>
              + Add Key
            </button>
          </div>

          {apiKeys.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '14px', padding: '48px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No API keys stored yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  style={{
                    background: '#fff',
                    border: '1px solid var(--border)',
                    borderRadius: '11px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>{key.key_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {revealed.has(key.id) ? key.key_value : '•'.repeat(Math.min(key.key_value.length, 32))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    {['Show/Hide', 'Copy', 'Delete'].map((action) => {
                      const isHide = action === 'Show/Hide'
                      const isCopy = action === 'Copy'
                      const isDelete = action === 'Delete'
                      const label = isHide ? (revealed.has(key.id) ? 'Hide' : 'Show') : isCopy ? (copied === key.id ? '✓ Copied' : 'Copy') : 'Delete'
                      return (
                        <button
                          key={action}
                          onClick={() => {
                            if (isHide) toggleReveal(key.id)
                            else if (isCopy) copy(key.key_value, key.id)
                            else deleteApiKey(key.id)
                          }}
                          style={{
                            background: isDelete ? 'rgba(220,38,38,0.07)' : isCopy && copied === key.id ? 'rgba(16,185,129,0.08)' : 'var(--bg-secondary)',
                            border: `1px solid ${isDelete ? 'rgba(220,38,38,0.18)' : isCopy && copied === key.id ? 'rgba(16,185,129,0.25)' : 'var(--border)'}`,
                            borderRadius: '7px',
                            color: isDelete ? '#dc2626' : isCopy && copied === key.id ? '#059669' : 'var(--text-secondary)',
                            fontSize: '12px',
                            fontWeight: '600',
                            padding: '5px 11px',
                            fontFamily: 'inherit',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {showAddKey && (
            <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowAddKey(false)}>
              <div className="modal">
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Add API Key</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>Store a key for an external service.</p>
                <form onSubmit={addApiKey} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={LABEL_STYLE}>Key Name *</label>
                    <input className="input-field" value={keyForm.key_name} onChange={(e) => setKeyForm((f) => ({ ...f, key_name: e.target.value }))} placeholder="e.g. Anthropic API Key" required />
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>Key Value *</label>
                    <input className="input-field" type="password" value={keyForm.key_value} onChange={(e) => setKeyForm((f) => ({ ...f, key_value: e.target.value }))} placeholder="sk-ant-…" required />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                    <button type="button" onClick={() => setShowAddKey(false)} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
                    <button type="submit" disabled={saving} className="btn-gold" style={{ flex: 1, justifyContent: 'center' }}>{saving ? 'Saving…' : 'Save Key'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Database Tab */}
      {activeTab === 'database' && (
        <div>
          <div
            style={{
              background: 'rgba(245,166,35,0.07)',
              border: '1px solid rgba(245,166,35,0.22)',
              borderRadius: '10px',
              padding: '14px 18px',
              marginBottom: '18px',
              fontSize: '13px',
              color: '#92590a',
              fontWeight: '600',
            }}
          >
            Run this SQL in your Supabase SQL Editor to create all required tables and RLS policies.
          </div>
          <div style={{ position: 'relative' }}>
            <pre
              style={{
                background: '#0f1117',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '13px',
                padding: '22px',
                fontSize: '12px',
                color: '#94a3b8',
                overflowX: 'auto',
                lineHeight: '1.7',
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                whiteSpace: 'pre',
              }}
            >
              {SQL_SCHEMA}
            </pre>
            <button
              onClick={() => copy(SQL_SCHEMA, 'schema')}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                background: copied === 'schema' ? 'rgba(16,185,129,0.15)' : 'rgba(245,166,35,0.12)',
                border: `1px solid ${copied === 'schema' ? 'rgba(16,185,129,0.35)' : 'rgba(245,166,35,0.3)'}`,
                borderRadius: '7px',
                color: copied === 'schema' ? '#059669' : '#f5a623',
                fontSize: '12px',
                fontWeight: '700',
                padding: '7px 14px',
                fontFamily: 'inherit',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {copied === 'schema' ? '✓ Copied!' : 'Copy SQL'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

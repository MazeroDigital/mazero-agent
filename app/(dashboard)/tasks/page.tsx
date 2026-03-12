'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Task = {
  id: string
  title: string
  description: string | null
  deadline: string | null
  priority: 'high' | 'medium' | 'low'
  completed: boolean
  created_at: string
}

type Client = { id: string; name: string }

type Filter = 'open' | 'all' | 'completed'

const PRIORITY_COLOR: Record<string, string> = { high: '#ff6b4a', medium: '#ff9a6c', low: '#10b981' }

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState<Filter>('open')
  const [form, setForm] = useState({ title: '', description: '', deadline: '', priority: 'medium', client_id: '' })
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [{ data: tasksData }, { data: clientsData }] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name'),
    ])
    setTasks(tasksData ?? [])
    setClients(clientsData ?? [])
    setLoading(false)
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    await supabase.from('tasks').insert({
      title: form.title,
      description: form.description || null,
      deadline: form.deadline || null,
      priority: form.priority,
      client_id: form.client_id || null,
      user_id: user?.id,
      completed: false,
    })
    setShowModal(false)
    setForm({ title: '', description: '', deadline: '', priority: 'medium', client_id: '' })
    setSaving(false)
    fetchData()
  }

  async function toggleTask(id: string, completed: boolean) {
    await supabase.from('tasks').update({ completed: !completed }).eq('id', id)
    fetchData()
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    fetchData()
  }

  const filtered = tasks.filter((t) => {
    if (filter === 'open') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const openCount = tasks.filter((t) => !t.completed).length
  const doneCount = tasks.filter((t) => t.completed).length

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '36px 44px', background: '#0a0a0a' }} className="animate-fadeIn">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#e8e8e8' }}>Tasks</h1>
          <p style={{ color: '#555', fontSize: '13px', marginTop: '4px' }}>
            Track and manage your team&apos;s work.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-gold">
          <PlusIcon />
          New Task
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <div style={{ padding: '10px 16px', borderRadius: '8px', background: 'rgba(255,107,74,0.06)', border: '1px solid rgba(255,107,74,0.12)' }}>
          <span style={{ fontSize: '18px', fontWeight: '600', color: '#ff6b4a', marginRight: '8px' }}>{openCount}</span>
          <span style={{ fontSize: '12px', color: '#555', fontWeight: '400' }}>Open</span>
        </div>
        <div style={{ padding: '10px 16px', borderRadius: '8px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}>
          <span style={{ fontSize: '18px', fontWeight: '600', color: '#10b981', marginRight: '8px' }}>{doneCount}</span>
          <span style={{ fontSize: '12px', color: '#555', fontWeight: '400' }}>Done</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '3px', border: '1px solid rgba(255,255,255,0.06)', width: 'fit-content' }}>
        {(['open', 'all', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '5px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '400',
              fontFamily: 'inherit',
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.2s',
              background: filter === f ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: filter === f ? '#e8e8e8' : '#555',
              textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Tasks list */}
      {loading ? (
        <div style={{ color: '#555', fontSize: '14px' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="glass" style={{ borderRadius: '14px', padding: '52px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.35 }}>✅</div>
          <p style={{ color: '#e8e8e8', fontWeight: '600', fontSize: '15px', marginBottom: '6px' }}>
            {filter === 'open' ? 'All caught up!' : 'No tasks here'}
          </p>
          <p style={{ color: '#555', fontSize: '13px' }}>
            {filter === 'open' ? 'No open tasks right now.' : 'No tasks match this filter.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map((task) => (
            <div
              key={task.id}
              className="glass"
              style={{
                borderRadius: '11px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '13px',
                opacity: task.completed ? 0.5 : 1,
                transition: 'opacity 0.2s ease',
              }}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleTask(task.id, task.completed)}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: `2px solid ${task.completed ? '#4caf7d' : 'rgba(255,255,255,0.18)'}`,
                  background: task.completed ? '#4caf7d' : 'transparent',
                  cursor: 'pointer',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  padding: 0,
                }}
              >
                {task.completed && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#e8e8e8', textDecoration: task.completed ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {task.title}
                </div>
                {task.description && (
                  <div style={{ fontSize: '12px', color: '#555', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.description}
                  </div>
                )}
              </div>

              {/* Deadline */}
              {task.deadline && (
                <div style={{ fontSize: '12px', color: '#555', flexShrink: 0, background: 'rgba(255,255,255,0.04)', padding: '4px 9px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              )}

              {/* Priority dot */}
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: PRIORITY_COLOR[task.priority] ?? '#f5a623',
                  flexShrink: 0,
                  boxShadow: `0 0 6px ${PRIORITY_COLOR[task.priority] ?? '#f5a623'}80`,
                }}
                title={`Priority: ${task.priority}`}
              />

              {/* Delete */}
              <button
                onClick={() => deleteTask(task.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#333',
                  padding: '4px',
                  borderRadius: '5px',
                  flexShrink: 0,
                  transition: 'color 0.15s, background 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#e05252'
                  e.currentTarget.style.background = 'rgba(224,82,82,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#333'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#e8e8e8', marginBottom: '4px' }}>New Task</h2>
            <p style={{ color: '#555', fontSize: '13px', marginBottom: '22px' }}>Create a new task to track your work.</p>
            <form onSubmit={addTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#555', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Title *
                </label>
                <input
                  className="input-dark"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="What needs to be done?"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#555', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Description
                </label>
                <textarea
                  className="input-dark"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional details..."
                  rows={2}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#555', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Deadline
                  </label>
                  <input
                    className="input-dark"
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#555', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Priority
                  </label>
                  <select
                    className="input-dark"
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                    style={{ appearance: 'none' }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              {clients.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#555', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Client (optional)
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
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-gold" style={{ flex: 1, justifyContent: 'center' }}>
                  {saving ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

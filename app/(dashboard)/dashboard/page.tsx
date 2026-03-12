import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ count: clientCount }, { count: taskCount }, { count: proposalCount }, { count: contentCount }] =
    await Promise.all([
      supabase.from('clients').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('completed', false),
      supabase.from('proposals').select('*', { count: 'exact', head: true }),
      supabase.from('content_items').select('*', { count: 'exact', head: true }),
    ])

  const { data: recentClients } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(4)

  const { data: upcomingTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('completed', false)
    .order('deadline', { ascending: true })
    .limit(5)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const name = user?.email?.split('@')[0] ?? 'team'
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const stats = [
    { label: 'Active Clients', value: clientCount ?? 0, color: '#3b82f6' },
    { label: 'Open Tasks', value: taskCount ?? 0, color: '#ff6b4a' },
    { label: 'Proposals', value: proposalCount ?? 0, color: '#10b981' },
    { label: 'Content Items', value: contentCount ?? 0, color: '#a855f7' },
  ]

  const priorityColor: Record<string, string> = { high: '#ff6b4a', medium: '#ff9a6c', low: '#10b981' }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '36px 44px', background: '#0a0a0a' }} className="animate-fadeIn">
      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <p style={{ color: '#555', fontSize: '12px', marginBottom: '6px', letterSpacing: '0.04em' }}>{today}</p>
        <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#e8e8e8', lineHeight: 1.2 }}>
          {greeting},{' '}
          <span style={{ color: '#ff6b4a' }}>{name}</span>.
        </h1>
        <p style={{ color: '#555', marginTop: '7px', fontSize: '14px' }}>
          Here&apos;s what&apos;s happening at Mazero today.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }} className="animate-stagger">
        {stats.map(({ label, value, color }) => (
          <div key={label} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px', transition: 'border-color 0.2s, transform 0.2s' }}
            onMouseEnter={(e) => { const el = e.currentTarget; el.style.borderColor = 'rgba(255,255,255,0.12)'; el.style.transform = 'translateY(-2px)' }}
            onMouseLeave={(e) => { const el = e.currentTarget; el.style.borderColor = 'rgba(255,255,255,0.06)'; el.style.transform = 'translateY(0)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: '#555', fontWeight: '400' }}>{label}</div>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}60` }} />
            </div>
            <div style={{ fontSize: '32px', fontWeight: '600', color: '#e8e8e8', lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        {/* Recent Clients */}
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: '500', color: '#888' }}>Recent Clients</h2>
            <a href="/clients" style={{ fontSize: '12px', color: '#ff6b4a', textDecoration: 'none', opacity: 0.8 }}>View all &rarr;</a>
          </div>
          {!recentClients?.length ? (
            <p style={{ color: '#555', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No clients yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {recentClients.map((client: { id: string; name: string; website_url?: string }) => (
                <div key={client.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', transition: 'border-color 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)' }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,107,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '500', color: '#ff6b4a', flexShrink: 0 }}>
                    {client.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#e8e8e8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</div>
                    {client.website_url && (
                      <div style={{ fontSize: '11px', color: '#555' }}>{client.website_url.replace(/^https?:\/\//, '')}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Tasks */}
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: '500', color: '#888' }}>Upcoming Tasks</h2>
            <a href="/tasks" style={{ fontSize: '12px', color: '#ff6b4a', textDecoration: 'none', opacity: 0.8 }}>View all &rarr;</a>
          </div>
          {!upcomingTasks?.length ? (
            <p style={{ color: '#555', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No open tasks right now</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {upcomingTasks.map((task: { id: string; title: string; deadline?: string; priority?: string }) => (
                <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', transition: 'border-color 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)' }}
                >
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: priorityColor[task.priority ?? 'medium'] ?? '#ff6b4a', flexShrink: 0, boxShadow: `0 0 6px ${priorityColor[task.priority ?? 'medium'] ?? '#ff6b4a'}50` }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#e8e8e8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                    {task.deadline && (
                      <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
                        Due {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px 20px' }}>
        <h2 style={{ fontSize: '11px', fontWeight: '500', color: '#555', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { href: '/clients', label: '+ New Client' },
            { href: '/tasks', label: '+ New Task' },
            { href: '/proposals', label: '+ New Proposal' },
            { href: '/content', label: '+ Schedule Content' },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,107,74,0.15)', color: '#ff6b4a', fontSize: '13px', fontWeight: '400', textDecoration: 'none', background: 'rgba(255,107,74,0.04)', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { const el = e.currentTarget; el.style.background = 'rgba(255,107,74,0.08)'; el.style.borderColor = 'rgba(255,107,74,0.25)' }}
              onMouseLeave={(e) => { const el = e.currentTarget; el.style.background = 'rgba(255,107,74,0.04)'; el.style.borderColor = 'rgba(255,107,74,0.15)' }}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

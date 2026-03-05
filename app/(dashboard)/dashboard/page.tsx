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
    { label: 'Active Clients', value: clientCount ?? 0, color: '#5b8cf5', bg: 'rgba(91,140,245,0.1)', border: 'rgba(91,140,245,0.18)', icon: 'C' },
    { label: 'Open Tasks', value: taskCount ?? 0, color: '#f5a623', bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.18)', icon: 'T' },
    { label: 'Proposals', value: proposalCount ?? 0, color: '#4caf7d', bg: 'rgba(76,175,125,0.1)', border: 'rgba(76,175,125,0.18)', icon: 'P' },
    { label: 'Content Items', value: contentCount ?? 0, color: '#e05252', bg: 'rgba(224,82,82,0.1)', border: 'rgba(224,82,82,0.18)', icon: 'I' },
  ]

  const priorityColor: Record<string, string> = { high: '#e05252', medium: '#f5a623', low: '#4caf7d' }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '36px 44px', background: '#f7f8fc' }} className="animate-fadeIn">
      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <p style={{ color: '#6b6b8a', fontSize: '12px', marginBottom: '6px', letterSpacing: '0.04em' }}>{today}</p>
        <h1 style={{ fontSize: '30px', fontWeight: '800', color: '#e8e8f0', lineHeight: 1.2 }}>
          {greeting},{' '}
          <span className="gold-text">{name}</span>.
        </h1>
        <p style={{ color: '#6b6b8a', marginTop: '7px', fontSize: '14px' }}>
          Here&apos;s what&apos;s happening at Mazero today.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {stats.map(({ label, value, color, bg, border, icon }) => (
          <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: '14px', padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', color }}>
                {icon}
              </div>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: color }} />
            </div>
            <div style={{ fontSize: '36px', fontWeight: '800', color: '#e8e8f0', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '12px', color: '#8888a4', marginTop: '5px', fontWeight: '600' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Recent Clients */}
        <div className="glass" style={{ borderRadius: '14px', padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#e8e8f0' }}>Recent Clients</h2>
            <a href="/clients" style={{ fontSize: '12px', color: '#f5a623', textDecoration: 'none', opacity: 0.8 }}>View all &rarr;</a>
          </div>
          {!recentClients?.length ? (
            <p style={{ color: '#6b6b8a', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No clients yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentClients.map((client: { id: string; name: string; website_url?: string }) => (
                <div key={client.id} style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '10px 12px', borderRadius: '9px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', color: '#f5a623', flexShrink: 0 }}>
                    {client.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#e8e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</div>
                    {client.website_url && (
                      <div style={{ fontSize: '11px', color: '#6b6b8a' }}>{client.website_url.replace(/^https?:\/\//, '')}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Tasks */}
        <div className="glass" style={{ borderRadius: '14px', padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#e8e8f0' }}>Upcoming Tasks</h2>
            <a href="/tasks" style={{ fontSize: '12px', color: '#f5a623', textDecoration: 'none', opacity: 0.8 }}>View all &rarr;</a>
          </div>
          {!upcomingTasks?.length ? (
            <p style={{ color: '#6b6b8a', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No open tasks right now</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {upcomingTasks.map((task: { id: string; title: string; deadline?: string; priority?: string }) => (
                <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '10px 12px', borderRadius: '9px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: priorityColor[task.priority ?? 'medium'] ?? '#f5a623', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#e8e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                    {task.deadline && (
                      <div style={{ fontSize: '11px', color: '#6b6b8a', marginTop: '2px' }}>
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
      <div className="glass" style={{ borderRadius: '14px', padding: '20px 22px' }}>
        <h2 style={{ fontSize: '12px', fontWeight: '700', color: '#8888a4', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { href: '/clients', label: '+ New Client' },
            { href: '/tasks', label: '+ New Task' },
            { href: '/proposals', label: '+ New Proposal' },
            { href: '/content', label: '+ Schedule Content' },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              style={{ padding: '9px 18px', borderRadius: '9px', border: '1px solid rgba(245,166,35,0.22)', color: '#f5a623', fontSize: '13px', fontWeight: '600', textDecoration: 'none', background: 'rgba(245,166,35,0.05)' }}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

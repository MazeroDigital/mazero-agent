'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

function IconSecretary() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
function IconContent() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" /><path d="M9 21V9" />
    </svg>
  )
}
function IconProposal() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}
function IconResearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
function IconClients() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
function IconLogout() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

const NAV_ITEMS = [
  { href: '/secretary', label: 'Secretary', Icon: IconSecretary, tag: 'AI' },
  { href: '/content', label: 'Content', Icon: IconContent, tag: 'AI' },
  { href: '/proposal', label: 'Proposal', Icon: IconProposal, tag: 'AI' },
  { href: '/research', label: 'Research', Icon: IconResearch, tag: 'AI' },
  { href: '/clients', label: 'Clients', Icon: IconClients, tag: null },
  { href: '/settings', label: 'Settings', Icon: IconSettings, tag: null },
]

export default function Sidebar({ user }: { user: User }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = (user.email ?? 'MZ').slice(0, 2).toUpperCase()
  const displayName = user.email?.split('@')[0] ?? 'User'

  return (
    <aside
      style={{
        width: '240px',
        minWidth: '240px',
        background: '#0f1117',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        flexShrink: 0,
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: '20px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '11px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #f5a623 0%, #c98a0e 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '800',
            fontSize: '15px',
            color: '#0a0a0f',
            flexShrink: 0,
            boxShadow: '0 4px 14px rgba(245,166,35,0.28)',
          }}
        >
          M
        </div>
        <div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: '800',
              color: '#f0f0f8',
              letterSpacing: '0.1em',
              fontFamily: 'var(--font-syne), sans-serif',
            }}
          >
            MAZERO
          </div>
          <div
            style={{
              fontSize: '10px',
              color: 'rgba(255,255,255,0.28)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginTop: '1px',
            }}
          >
            AI Platform
          </div>
        </div>
      </div>

      {/* Section label */}
      <div style={{ padding: '20px 18px 8px' }}>
        <span
          style={{
            fontSize: '10px',
            fontWeight: '600',
            color: 'rgba(255,255,255,0.22)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Agents
        </span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0 10px', overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ href, label, Icon, tag }, i) => {
          const active = pathname === href || pathname.startsWith(href + '/')

          // Section break before Clients
          const showDivider = label === 'Clients'

          return (
            <div key={href}>
              {showDivider && (
                <div
                  style={{
                    margin: '12px 8px 10px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    paddingTop: '10px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      color: 'rgba(255,255,255,0.22)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Workspace
                  </span>
                </div>
              )}
              <Link
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 10px',
                  borderRadius: '9px',
                  fontSize: '13px',
                  fontWeight: active ? '600' : '500',
                  color: active ? '#f5a623' : 'rgba(255,255,255,0.5)',
                  background: active ? 'rgba(245,166,35,0.1)' : 'transparent',
                  border: active ? '1px solid rgba(245,166,35,0.18)' : '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  marginBottom: '2px',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.05)'
                    ;(e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.75)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    ;(e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.5)'
                  }
                }}
              >
                <span style={{ opacity: active ? 1 : 0.7, flexShrink: 0 }}>
                  <Icon />
                </span>
                <span style={{ flex: 1 }}>{label}</span>
                {tag && (
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: '700',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: active ? 'rgba(245,166,35,0.2)' : 'rgba(255,255,255,0.07)',
                      color: active ? '#f5a623' : 'rgba(255,255,255,0.3)',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {tag}
                  </span>
                )}
              </Link>
            </div>
          )
        })}
      </nav>

      {/* User footer */}
      <div
        style={{
          padding: '12px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 10px',
            borderRadius: '10px',
            marginBottom: '8px',
          }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'rgba(245,166,35,0.18)',
              border: '1px solid rgba(245,166,35,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: '800',
              color: '#f5a623',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.75)',
                fontWeight: '600',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {displayName}
            </div>
            <div
              style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.28)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.email}
            </div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.35)',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(224,82,82,0.1)'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(224,82,82,0.25)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#e05252'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.35)'
          }}
        >
          <IconLogout />
          Sign Out
        </button>
      </div>
    </aside>
  )
}

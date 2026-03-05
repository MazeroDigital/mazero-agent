'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setError(error.message)
        return
      }

      // Hard redirect so the server always sees the freshly-written session cookie.
      // router.push (soft nav) can race with cookie writes on SSR, leaving the
      // server layout seeing no session and bouncing back to /login.
      window.location.href = '/secretary'
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#0f1117',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glows */}
      <div style={{ position: 'absolute', top: '-10%', left: '30%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,166,35,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-5%', right: '20%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 60%)', pointerEvents: 'none' }} />

      {/* Left panel */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 80px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '60px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              background: 'linear-gradient(135deg, #f5a623 0%, #c98a0e 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '18px',
              color: '#0a0a0f',
              boxShadow: '0 6px 20px rgba(245,166,35,0.3)',
              fontFamily: 'var(--font-syne), sans-serif',
            }}
          >
            M
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#f0f0f8', letterSpacing: '0.12em', fontFamily: 'var(--font-syne), sans-serif' }}>MAZERO</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>AI Platform</div>
          </div>
        </div>

        <h1
          style={{
            fontSize: '40px',
            fontWeight: '800',
            color: '#f0f0f8',
            lineHeight: 1.15,
            marginBottom: '18px',
            fontFamily: 'var(--font-syne), sans-serif',
            maxWidth: '400px',
          }}
        >
          Your AI-powered marketing team
        </h1>
        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.38)', lineHeight: 1.65, maxWidth: '380px' }}>
          Secretary, Content, Proposal, and Research agents — all powered by Claude AI and built for Mazero Digital Marketing.
        </p>

        {/* Feature pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '44px' }}>
          {[
            { icon: '⚡', label: 'Real-time streaming responses' },
            { icon: '🎯', label: 'Specialist agents for every task' },
            { icon: '🔒', label: 'Private and secure workspace' },
          ].map(({ icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '16px' }}>{icon}</span>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login card */}
      <div
        style={{
          width: '440px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '36px',
            backdropFilter: 'blur(20px)',
            animation: 'fadeIn 0.4s ease forwards',
          }}
        >
          <h2
            style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#f0f0f8',
              marginBottom: '4px',
              fontFamily: 'var(--font-syne), sans-serif',
            }}
          >
            Welcome back
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '28px' }}>
            Sign in to your workspace
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: 'rgba(255,255,255,0.4)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-dark"
                placeholder="you@mazerodigital.com"
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: 'rgba(255,255,255,0.4)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-dark"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div
                style={{
                  background: 'rgba(220,38,38,0.1)',
                  border: '1px solid rgba(220,38,38,0.25)',
                  borderRadius: '8px',
                  padding: '11px 14px',
                  fontSize: '13px',
                  color: '#f87171',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '10px',
                background: loading ? 'rgba(245,166,35,0.7)' : '#f5a623',
                border: 'none',
                color: '#0a0a0f',
                fontSize: '14px',
                fontWeight: '700',
                fontFamily: 'inherit',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                marginTop: '6px',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(245,166,35,0.3)',
              }}
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <p
            style={{
              textAlign: 'center',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.18)',
              marginTop: '24px',
            }}
          >
            Mazero Digital Marketing — Internal Platform
          </p>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ═══════════════════════════════════
// TYPES
// ═══════════════════════════════════

type ProposalImages = {
  cover: string | null
  situation: string | null
  solution: string | null
  investment: string | null
}

type SlideSection = {
  title: string
  content: string[]
  subsections: { title: string; items: string[] }[]
}

type Props = {
  proposal: string
  prospectName: string
  industry: string
  images: ProposalImages
  onClose: () => void
}

// ═══════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════

const C = {
  cream: '#f0e4d4',
  creamDark: '#e8d8c4',
  dark: '#0e0c0a',
  brown: '#1c1410',
  navy: '#0a0a14',
  terra: '#2c1a10',
  gold: '#c4a265',
  goldBright: '#d4b87a',
  rust: '#b85a3a',
  textDark: '#1a1410',
  textLight: '#f0e8dc',
  textMutedDark: '#6b5d4f',
  textMutedLight: '#9a8a78',
  cardDark: 'rgba(255,255,255,0.06)',
  cardLight: 'rgba(0,0,0,0.04)',
  borderDark: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(0,0,0,0.08)',
}

// Noise grain SVG as data URI
const GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`

// ═══════════════════════════════════
// PROPOSAL PARSER
// ═══════════════════════════════════

function parseSections(proposal: string): SlideSection[] {
  const sections: SlideSection[] = []
  const parts = proposal.split(/^## /m)

  for (const part of parts) {
    if (!part.trim()) continue
    const lines = part.split('\n')
    const title = lines[0].replace(/^\d+\.\s*/, '').trim()
    const content: string[] = []
    const subsections: { title: string; items: string[] }[] = []
    let currentSub: { title: string; items: string[] } | null = null

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (line.startsWith('### ')) {
        if (currentSub) subsections.push(currentSub)
        currentSub = { title: line.slice(4).trim(), items: [] }
      } else if (/^[-*]\s/.test(line)) {
        const item = line.replace(/^[-*]\s/, '').replace(/\*\*/g, '').trim()
        if (currentSub) currentSub.items.push(item)
        else content.push(item)
      } else if (line.startsWith('> ')) {
        content.push(line.slice(2).replace(/\*\*/g, '').trim())
      } else if (line.trim() && !line.startsWith('---') && !line.startsWith('#')) {
        content.push(line.replace(/\*\*/g, '').trim())
      }
    }
    if (currentSub) subsections.push(currentSub)
    sections.push({ title, content, subsections })
  }
  return sections
}

function findSection(sections: SlideSection[], ...patterns: RegExp[]): SlideSection | null {
  for (const p of patterns) {
    const s = sections.find((s) => p.test(s.title))
    if (s) return s
  }
  return null
}

function extractTagline(proposal: string): string {
  const m = proposal.match(/^> (.+)$/m)
  return m ? m[1].replace(/[*[\]]/g, '').trim() : ''
}

// ═══════════════════════════════════
// GRAIN OVERLAY (reusable)
// ═══════════════════════════════════

function Grain() {
  return <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, backgroundRepeat: 'repeat', backgroundSize: '512px 512px', pointerEvents: 'none', zIndex: 1 }} />
}

function Watermark({ light }: { light?: boolean }) {
  return (
    <div style={{ position: 'absolute', top: '28px', right: '36px', zIndex: 2, fontSize: '11px', letterSpacing: '3px', fontFamily: "'Bebas Neue', sans-serif", color: light ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)', textTransform: 'uppercase' }}>
      MAZERO
    </div>
  )
}

// ═══════════════════════════════════
// SLIDE 1: HERO COVER
// ═══════════════════════════════════

function SlideCover({ name, tagline, image }: { name: string; tagline: string; image: string | null }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: C.dark, overflow: 'hidden' }}>
      {image && <img src={image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} />}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(14,12,10,0.6) 0%, rgba(14,12,10,0.3) 40%, rgba(14,12,10,0.8) 100%)' }} />
      <Grain />
      <Watermark light />

      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', letterSpacing: '6px', color: C.gold, fontFamily: "'Inter', sans-serif", fontWeight: 500, marginBottom: '32px', textTransform: 'uppercase' }}>
          Marketing Proposal
        </div>
        <h1 style={{ fontSize: 'clamp(48px, 7vw, 96px)', fontFamily: "'Bebas Neue', sans-serif", fontWeight: 400, color: C.textLight, lineHeight: 0.95, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '20px' }}>
          MAZERO X {name.toUpperCase()}
        </h1>
        {tagline && (
          <p style={{ fontSize: 'clamp(14px, 1.8vw, 20px)', fontFamily: "'Inter', sans-serif", color: C.textMutedLight, maxWidth: '650px', lineHeight: 1.6, fontWeight: 300 }}>
            {tagline}
          </p>
        )}
        <div style={{ position: 'absolute', bottom: '40px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '1px', background: C.gold }} />
          <span style={{ fontSize: '10px', letterSpacing: '4px', color: C.textMutedLight, fontFamily: "'Inter', sans-serif", textTransform: 'uppercase' }}>
            mazerodigitalmarketing.com
          </span>
          <div style={{ width: '50px', height: '1px', background: C.gold }} />
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════
// SLIDE 2: CURRENT REALITY (two column)
// ═══════════════════════════════════

function SlideCurrentReality({ section, image }: { section: SlideSection | null; image: string | null }) {
  const items = section?.content.slice(0, 6) || ['No clear brand voice online', 'Inconsistent posting schedule', 'Low engagement and reach', 'No content strategy in place']
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: C.cream, overflow: 'hidden' }}>
      <Grain />
      <Watermark />

      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', padding: '56px 64px' }}>
        <div style={{ fontSize: '11px', letterSpacing: '5px', color: C.rust, fontFamily: "'Inter', sans-serif", fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase' }}>
          Where Things Stand
        </div>
        <h2 style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontFamily: "'Bebas Neue', sans-serif", color: C.textDark, lineHeight: 0.95, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '40px' }}>
          CURRENT REALITY
        </h2>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {items.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: `2px solid ${C.rust}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <span style={{ fontSize: '12px', fontFamily: "'Bebas Neue', sans-serif", color: C.rust }}>{i + 1}</span>
                </div>
                <p style={{ fontSize: '15px', fontFamily: "'Inter', sans-serif", color: C.textMutedDark, lineHeight: 1.7, fontWeight: 400 }}>
                  {item}
                </p>
              </div>
            ))}
          </div>

          <div style={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${C.borderLight}`, boxShadow: '0 20px 60px rgba(0,0,0,0.08)', height: '100%', maxHeight: '360px' }}>
            {image ? (
              <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #e8d8c4, #d4c4b0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '48px', opacity: 0.2 }}>?</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════
// SLIDE 3: CASE STUDY / STATS
// ═══════════════════════════════════

function SlideCaseStudy() {
  const stats = [
    { number: '33K+', label: 'Video Views', sub: 'in first 30 days' },
    { number: '200+', label: 'New Followers', sub: 'organic growth' },
    { number: '12X', label: 'Engagement Rate', sub: 'vs industry average' },
    { number: '45+', label: 'Content Pieces', sub: 'created monthly' },
  ]
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: C.navy, overflow: 'hidden' }}>
      <Grain />
      <Watermark light />

      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', padding: '56px 64px' }}>
        <div style={{ fontSize: '11px', letterSpacing: '5px', color: C.gold, fontFamily: "'Inter', sans-serif", fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase' }}>
          Proven Results
        </div>
        <h2 style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontFamily: "'Bebas Neue', sans-serif", color: C.textLight, lineHeight: 0.95, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>
          OUR WORK SPEAKS
        </h2>
        <p style={{ fontSize: '14px', fontFamily: "'Inter', sans-serif", color: C.textMutedLight, marginBottom: '44px', maxWidth: '500px' }}>
          Results from our Interstones campaign — a luxury stone company we transformed with strategic content marketing.
        </p>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', alignItems: 'center' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: C.cardDark, border: `1px solid ${C.borderDark}`, borderRadius: '16px', padding: '32px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(40px, 5vw, 64px)', fontFamily: "'Bebas Neue', sans-serif", color: C.gold, lineHeight: 1, marginBottom: '8px', letterSpacing: '2px' }}>
                {s.number}
              </div>
              <div style={{ fontSize: '14px', fontFamily: "'Inter', sans-serif", fontWeight: 600, color: C.textLight, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {s.label}
              </div>
              <div style={{ fontSize: '12px', fontFamily: "'Inter', sans-serif", color: C.textMutedLight }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════
// SLIDE 4: THREE PILLARS
// ═══════════════════════════════════

function SlidePillars({ section }: { section: SlideSection | null }) {
  const pillars = section?.subsections.slice(0, 3).map((s) => ({
    title: s.title,
    items: s.items.slice(0, 3),
  })) || section?.content.slice(0, 3).map((c, i) => ({
    title: ['Strategy', 'Content', 'Growth'][i] || `Pillar ${i + 1}`,
    items: [c],
  })) || []

  const icons = ['M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', 'M12 20V10M18 20V4M6 20v-4', 'M22 12h-4l-3 9L9 3l-3 9H2']

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: C.brown, overflow: 'hidden' }}>
      <Grain />
      <Watermark light />

      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', padding: '56px 64px' }}>
        <div style={{ fontSize: '11px', letterSpacing: '5px', color: C.gold, fontFamily: "'Inter', sans-serif", fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase' }}>
          Our Approach
        </div>
        <h2 style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontFamily: "'Bebas Neue', sans-serif", color: C.textLight, lineHeight: 0.95, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '48px' }}>
          WHAT WE BUILD FOR YOU
        </h2>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${Math.min(pillars.length || 3, 3)}, 1fr)`, gap: '24px', alignItems: 'start' }}>
          {(pillars.length > 0 ? pillars : [{ title: 'Strategy', items: ['Custom marketing plan'] }, { title: 'Content', items: ['Professional content creation'] }, { title: 'Growth', items: ['Audience growth & engagement'] }]).map((p, i) => (
            <div key={i} style={{ background: C.cardDark, border: `1px solid ${C.borderDark}`, borderRadius: '20px', padding: '36px 28px', height: '100%' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(196,162,101,0.12)', border: `1px solid rgba(196,162,101,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={icons[i] || icons[0]} />
                </svg>
              </div>
              <h3 style={{ fontSize: '22px', fontFamily: "'Bebas Neue', sans-serif", color: C.textLight, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px' }}>
                {p.title.replace(/\*\*/g, '')}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {p.items.map((item, j) => (
                  <p key={j} style={{ fontSize: '13px', fontFamily: "'Inter', sans-serif", color: C.textMutedLight, lineHeight: 1.6 }}>
                    {item}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════
// SLIDE 5: WHAT WE DO (image bg)
// ═══════════════════════════════════

function SlideWhatWeDo({ section, image }: { section: SlideSection | null; image: string | null }) {
  const items = section?.content.slice(0, 6) || section?.subsections.flatMap((s) => s.items).slice(0, 6) || [
    'Daily content creation and scheduling',
    'Community management and engagement',
    'Performance tracking and optimization',
    'Trend research and strategy updates',
  ]
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: C.dark, overflow: 'hidden' }}>
      {image && <img src={image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.2 }} />}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(14,12,10,0.92), rgba(28,20,16,0.88))' }} />
      <Grain />
      <Watermark light />

      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 72px' }}>
        <div style={{ fontSize: '11px', letterSpacing: '5px', color: C.rust, fontFamily: "'Inter', sans-serif", fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase' }}>
          Behind The Scenes
        </div>
        <h2 style={{ fontSize: 'clamp(40px, 5.5vw, 72px)', fontFamily: "'Bebas Neue', sans-serif", color: C.textLight, lineHeight: 0.95, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '48px' }}>
          OUR DAILY<br />PROCESS
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 40px', maxWidth: '800px' }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
              <p style={{ fontSize: '15px', fontFamily: "'Inter', sans-serif", color: C.textMutedLight, lineHeight: 1.5 }}>
                {item}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════
// SLIDE 6: BEFORE / AFTER
// ═══════════════════════════════════

function SlideBeforeAfter({ section }: { section: SlideSection | null }) {
  const befores = section?.content.filter((_, i) => i < 4).slice(0, 4) || [
    'Inconsistent posting, no strategy',
    'Low brand awareness online',
    'No content calendar or planning',
    'Minimal engagement with audience',
  ]
  const afters = section?.content.filter((_, i) => i >= 4).slice(0, 4) || [
    'Strategic daily content across platforms',
    'Growing brand authority and recognition',
    'Data-driven content calendar',
    'Active community and engagement',
  ]

  const Card = ({ title, items, accent }: { title: string; items: string[]; accent: string }) => (
    <div style={{ background: C.cardDark, border: `1px solid ${C.borderDark}`, borderRadius: '20px', padding: '36px 32px', flex: 1 }}>
      <div style={{ fontSize: '12px', letterSpacing: '4px', color: accent, fontFamily: "'Bebas Neue', sans-serif", marginBottom: '24px', textTransform: 'uppercase' }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: accent, marginTop: '8px', flexShrink: 0 }} />
            <p style={{ fontSize: '14px', fontFamily: "'Inter', sans-serif", color: C.textMutedLight, lineHeight: 1.6 }}>{item}</p>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: C.navy, overflow: 'hidden' }}>
      <Grain />
      <Watermark light />

      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', padding: '56px 64px' }}>
        <div style={{ fontSize: '11px', letterSpacing: '5px', color: C.gold, fontFamily: "'Inter', sans-serif", fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase' }}>
          The Transformation
        </div>
        <h2 style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontFamily: "'Bebas Neue', sans-serif", color: C.textLight, lineHeight: 0.95, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '40px' }}>
          BEFORE &amp; AFTER
        </h2>

        <div style={{ flex: 1, display: 'flex', gap: '24px', alignItems: 'stretch' }}>
          <Card title="Before Mazero" items={befores} accent="#e05252" />
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </div>
          <Card title="After Mazero" items={afters} accent="#4caf7d" />
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════
// SLIDE 7: ROADMAP
// ═══════════════════════════════════

function SlideRoadmap({ section }: { section: SlideSection | null }) {
  const months = section?.subsections.slice(0, 3) || []

  const defaults = [
    { title: 'Month 1: Foundation', items: ['Brand audit & strategy', 'Content calendar setup', 'Platform optimization', 'First content batch'] },
    { title: 'Month 2: Growth', items: ['Scale content output', 'Engagement campaigns', 'Performance analysis', 'Strategy refinement'] },
    { title: 'Month 3: Scale', items: ['Advanced campaigns', 'Community building', 'Revenue-driving content', 'Full reporting'] },
  ]

  const data = months.length >= 3 ? months : defaults

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: C.cream, overflow: 'hidden' }}>
      <Grain />
      <Watermark />

      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', padding: '56px 64px' }}>
        <div style={{ fontSize: '11px', letterSpacing: '5px', color: C.rust, fontFamily: "'Inter', sans-serif", fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase' }}>
          The Plan
        </div>
        <h2 style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontFamily: "'Bebas Neue', sans-serif", color: C.textDark, lineHeight: 0.95, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '44px' }}>
          90-DAY ROADMAP
        </h2>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {data.map((month, i) => (
            <div key={i} style={{ background: C.dark, borderRadius: '20px', padding: '32px 28px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(196,162,101,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '20px', fontFamily: "'Bebas Neue', sans-serif", color: C.gold }}>{i + 1}</span>
                </div>
                <h3 style={{ fontSize: '16px', fontFamily: "'Bebas Neue', sans-serif", color: C.textLight, letterSpacing: '1px', textTransform: 'uppercase' }}>
                  {month.title.replace(/\*\*/g, '')}
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {month.items.slice(0, 5).map((item, j) => (
                  <div key={j} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2" strokeLinecap="round" style={{ marginTop: '2px', flexShrink: 0 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <p style={{ fontSize: '13px', fontFamily: "'Inter', sans-serif", color: C.textMutedLight, lineHeight: 1.5 }}>
                      {item.replace(/\*\*/g, '')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════
// SLIDE 8: INVESTMENT / PRICING
// ═══════════════════════════════════

function SlideInvestment({ section }: { section: SlideSection | null }) {
  const tiers = section?.subsections.slice(0, 3) || []

  const defaults = [
    { title: 'Starter', items: ['Best for: Getting started', 'Price: $1,500/mo', '8 posts per month', 'Basic analytics', '1 platform'] },
    { title: 'Growth', items: ['Best for: Scaling up', 'Price: $3,000/mo', '16 posts per month', 'Advanced analytics', '2 platforms', 'Monthly strategy calls'] },
    { title: 'Premium', items: ['Best for: Full-service', 'Price: $5,000/mo', '24+ posts per month', 'Full reporting suite', 'All platforms', 'Weekly strategy calls', 'Video production'] },
  ]

  const data = tiers.length >= 2 ? tiers : defaults

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: C.dark, overflow: 'hidden' }}>
      <Grain />
      <Watermark light />

      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', padding: '48px 64px' }}>
        <h2 style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontFamily: "'Bebas Neue', sans-serif", color: C.textLight, lineHeight: 0.95, letterSpacing: '2px', textTransform: 'uppercase', textAlign: 'center', marginBottom: '40px' }}>
          INVESTMENT
        </h2>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${Math.min(data.length, 3)}, 1fr)`, gap: '20px', alignItems: 'center' }}>
          {data.map((tier, i) => {
            const isRec = tier.title.toLowerCase().includes('growth') || tier.title.toLowerCase().includes('recommended') || (data.length === 3 && i === 1)
            const priceItem = tier.items.find((it) => /price/i.test(it))
            const price = priceItem?.replace(/.*?:\s*/, '') || ''
            const otherItems = tier.items.filter((it) => !/price/i.test(it))

            return (
              <div key={i} style={{
                background: isRec ? 'rgba(196,162,101,0.08)' : C.cardDark,
                border: `${isRec ? '2px' : '1px'} solid ${isRec ? C.gold : C.borderDark}`,
                borderRadius: '20px', padding: '36px 28px', position: 'relative',
                transform: isRec ? 'scale(1.05)' : 'none', zIndex: isRec ? 1 : 0,
              }}>
                {isRec && (
                  <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', background: C.gold, color: C.dark, fontSize: '10px', fontWeight: 700, padding: '5px 18px', borderRadius: '20px', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '2px', textTransform: 'uppercase' }}>
                    Recommended
                  </div>
                )}
                <h3 style={{ fontSize: '26px', fontFamily: "'Bebas Neue', sans-serif", color: C.textLight, textAlign: 'center', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
                  {tier.title.replace(/\(.*?\)/, '').replace(/\*\*/g, '').trim()}
                </h3>
                {price && (
                  <p style={{ fontSize: '32px', fontFamily: "'Bebas Neue', sans-serif", color: C.gold, textAlign: 'center', marginBottom: '24px', letterSpacing: '1px' }}>{price}</p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {otherItems.filter((it) => !/best for/i.test(it)).slice(0, 6).map((item, j) => (
                    <div key={j} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isRec ? C.gold : C.textMutedLight} strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                      <p style={{ fontSize: '13px', fontFamily: "'Inter', sans-serif", color: C.textMutedLight, lineHeight: 1.4 }}>
                        {item.replace(/\*\*/g, '')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════
// SLIDE 9: WHY MAZERO
// ═══════════════════════════════════

function SlideWhyMazero({ section }: { section: SlideSection | null }) {
  const items = section?.content.slice(0, 4) || [
    'Data-driven strategies that deliver measurable ROI',
    'Full-service creative team with industry expertise',
    'Dedicated account management and weekly reporting',
    'Partnership mindset — we grow when you grow',
  ]
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: C.terra, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #2c1a10, #1a1008)' }} />
      <Grain />
      <Watermark light />

      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 72px' }}>
        <div style={{ fontSize: '11px', letterSpacing: '5px', color: C.goldBright, fontFamily: "'Inter', sans-serif", fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase' }}>
          The Mazero Difference
        </div>
        <h2 style={{ fontSize: 'clamp(40px, 5.5vw, 72px)', fontFamily: "'Bebas Neue', sans-serif", color: C.textLight, lineHeight: 0.95, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '48px' }}>
          WHY MAZERO
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '700px' }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(196,162,101,0.1)', border: `1px solid rgba(196,162,101,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '22px', fontFamily: "'Bebas Neue', sans-serif", color: C.gold }}>{String(i + 1).padStart(2, '0')}</span>
              </div>
              <p style={{ fontSize: '17px', fontFamily: "'Inter', sans-serif", color: C.textMutedLight, lineHeight: 1.7, paddingTop: '12px' }}>
                {item}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════
// SLIDE 10: CONTACT
// ═══════════════════════════════════

function SlideContact({ name }: { name: string }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: C.navy, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(196,162,101,0.06) 0%, transparent 60%)' }} />
      <Grain />
      <Watermark light />

      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px', textAlign: 'center' }}>
        <div style={{ fontSize: '11px', letterSpacing: '5px', color: C.gold, fontFamily: "'Inter', sans-serif", fontWeight: 600, marginBottom: '24px', textTransform: 'uppercase' }}>
          Let&apos;s Start
        </div>
        <h2 style={{ fontSize: 'clamp(36px, 6vw, 80px)', fontFamily: "'Bebas Neue', sans-serif", color: C.textLight, lineHeight: 0.95, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '16px' }}>
          READY TO GROW
        </h2>
        <h2 style={{ fontSize: 'clamp(36px, 6vw, 80px)', fontFamily: "'Bebas Neue', sans-serif", color: C.gold, lineHeight: 0.95, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '48px' }}>
          {name.toUpperCase()}?
        </h2>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '56px' }}>
          <div style={{ background: C.cardDark, border: `1px solid ${C.borderDark}`, borderRadius: '60px', padding: '16px 36px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
            </svg>
            <span style={{ fontSize: '14px', fontFamily: "'Inter', sans-serif", color: C.textLight, fontWeight: 500 }}>
              mazerodigitalmarketing@gmail.com
            </span>
          </div>
          <div style={{ background: C.cardDark, border: `1px solid ${C.borderDark}`, borderRadius: '60px', padding: '16px 36px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span style={{ fontSize: '14px', fontFamily: "'Inter', sans-serif", color: C.textLight, fontWeight: 500 }}>
              mazerodigitalmarketing.com
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '50px', height: '1px', background: C.borderDark }} />
          <span style={{ fontSize: '24px', fontFamily: "'Bebas Neue', sans-serif", color: 'rgba(255,255,255,0.15)', letterSpacing: '6px' }}>MAZERO</span>
          <div style={{ width: '50px', height: '1px', background: C.borderDark }} />
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════

export default function ProposalPresentation({ proposal, prospectName, industry, images, onClose }: Props) {
  const [current, setCurrent] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const sections = parseSections(proposal)
  const tagline = extractTagline(proposal)

  const opportunity = findSection(sections, /opportunity/i, /challenge/i, /executive/i)
  const solution = findSection(sections, /solution/i, /approach/i)
  const contentStrategy = findSection(sections, /content strategy/i, /content/i)
  const deliverables = findSection(sections, /deliverable/i)
  const roadmap = findSection(sections, /roadmap/i, /timeline/i)
  const investment = findSection(sections, /investment/i, /pricing/i)
  const whyMazero = findSection(sections, /why mazero/i, /why us/i)

  // Merge solution + content + deliverables for the pillars slide
  const pillarsSection = solution || contentStrategy
  // Merge opportunity content for before/after
  const beforeAfterSection = opportunity

  type Slide = { render: () => React.ReactElement }
  const slides: Slide[] = [
    { render: () => <SlideCover name={prospectName} tagline={tagline} image={images.cover} /> },
    { render: () => <SlideCurrentReality section={opportunity} image={images.situation} /> },
    { render: () => <SlideCaseStudy /> },
    { render: () => <SlidePillars section={pillarsSection} /> },
    { render: () => <SlideWhatWeDo section={deliverables || contentStrategy} image={images.solution} /> },
    { render: () => <SlideBeforeAfter section={beforeAfterSection} /> },
    { render: () => <SlideRoadmap section={roadmap} /> },
    { render: () => <SlideInvestment section={investment} /> },
    { render: () => <SlideWhyMazero section={whyMazero} /> },
    { render: () => <SlideContact name={prospectName} /> },
  ]

  const total = slides.length
  const goNext = useCallback(() => setCurrent((c) => Math.min(c + 1, total - 1)), [total])
  const goPrev = useCallback(() => setCurrent((c) => Math.max(c - 1, 0)), [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev() }
      if (e.key === 'Escape') { isFullscreen ? document.exitFullscreen?.() : onClose() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev, isFullscreen, onClose])

  function toggleFullscreen() {
    if (isFullscreen) document.exitFullscreen?.()
    else containerRef.current?.requestFullscreen?.()
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  function downloadPDF() {
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head>
      <title>Proposal — ${prospectName} | Mazero Digital</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #000; }
        .slide { width: 100vw; height: 100vh; position: relative; overflow: hidden; page-break-after: always; }
        @media print {
          .slide { width: 100%; height: 100vh; }
          body { background: #fff; }
        }
      </style>
    </head><body>
      <p style="color:#fff;padding:40px;font-family:Inter,sans-serif;">Use your browser's Print function (Ctrl+P) to save as PDF. Set orientation to Landscape and margins to None for best results.</p>
    </body></html>`)
    w.document.close()
    w.print()
  }

  return (
    <div ref={containerRef} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', flexDirection: 'column' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&display=swap');`}</style>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: 'rgba(14,12,10,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#9a8a78', cursor: 'pointer', fontSize: '13px', fontFamily: "'Inter', sans-serif" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          Exit
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} style={{
              width: i === current ? '20px' : '8px', height: '4px', borderRadius: '2px',
              background: i === current ? C.gold : 'rgba(255,255,255,0.15)',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
            }} />
          ))}
          <span style={{ fontSize: '12px', color: '#9a8a78', fontFamily: "'Inter', sans-serif", marginLeft: '12px', fontWeight: 500 }}>
            {current + 1}/{total}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={downloadPDF} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#9a8a78', cursor: 'pointer', fontSize: '12px', fontFamily: "'Inter', sans-serif" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            PDF
          </button>
          <button onClick={toggleFullscreen} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: 'rgba(196,162,101,0.1)', border: '1px solid rgba(196,162,101,0.3)', color: C.gold, cursor: 'pointer', fontSize: '12px', fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {isFullscreen ? (
                <><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" /></>
              ) : (
                <><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></>
              )}
            </svg>
            {isFullscreen ? 'Exit' : 'Present'}
          </button>
        </div>
      </div>

      {/* Slide viewport */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808' }}>
        {/* 16:9 container */}
        <div style={{ width: '100%', height: '100%', maxWidth: isFullscreen ? '100%' : 'calc(100vh * 16 / 9)', aspectRatio: '16/9', position: 'relative', overflow: 'hidden', boxShadow: isFullscreen ? 'none' : '0 0 80px rgba(0,0,0,0.5)' }}>
          {slides[current]?.render()}
        </div>

        {/* Nav arrows */}
        {current > 0 && (
          <button onClick={goPrev} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9a8a78" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
        )}
        {current < total - 1 && (
          <button onClick={goNext} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9a8a78" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        )}
      </div>
    </div>
  )
}

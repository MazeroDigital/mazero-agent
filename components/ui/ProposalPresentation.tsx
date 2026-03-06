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

type Theme = {
  bg: string
  bgCard: string
  accent: string
  accentGlow: string
  text: string
  textMuted: string
  heading: string
  displayFont: string
  bodyFont: string
  cardBorder: string
  gradientOverlay: string
}

type SlideData = {
  title: string
  content: string[]
  subsections: { title: string; items: string[] }[]
  raw: string
}

type Props = {
  proposal: string
  prospectName: string
  industry: string
  images: ProposalImages
  onClose: () => void
}

// ═══════════════════════════════════
// THEMES
// ═══════════════════════════════════

const THEMES: Record<string, Theme> = {
  luxury: {
    bg: '#0a0a0a', bgCard: 'rgba(255,255,255,0.03)', accent: '#c9a84c', accentGlow: 'rgba(201,168,76,0.15)',
    text: '#f5f0e8', textMuted: '#8a8275', heading: '#fff',
    displayFont: "'Playfair Display', Georgia, serif", bodyFont: "'Inter', system-ui, sans-serif",
    cardBorder: 'rgba(201,168,76,0.2)', gradientOverlay: 'linear-gradient(135deg, #0a0a0a 0%, #1a1510 100%)',
  },
  healthcare: {
    bg: '#f8fafb', bgCard: '#ffffff', accent: '#1a4b7a', accentGlow: 'rgba(26,75,122,0.08)',
    text: '#1e293b', textMuted: '#64748b', heading: '#0f2942',
    displayFont: "'Montserrat', system-ui, sans-serif", bodyFont: "'Inter', system-ui, sans-serif",
    cardBorder: 'rgba(26,75,122,0.12)', gradientOverlay: 'linear-gradient(135deg, #f8fafb 0%, #e8f0f8 100%)',
  },
  food: {
    bg: '#faf6f1', bgCard: '#ffffff', accent: '#b85c38', accentGlow: 'rgba(184,92,56,0.1)',
    text: '#3d2c1e', textMuted: '#8b7355', heading: '#2a1810',
    displayFont: "'Lora', Georgia, serif", bodyFont: "'Inter', system-ui, sans-serif",
    cardBorder: 'rgba(184,92,56,0.15)', gradientOverlay: 'linear-gradient(135deg, #faf6f1 0%, #f0e6d8 100%)',
  },
  tech: {
    bg: '#0c0c1d', bgCard: 'rgba(255,255,255,0.04)', accent: '#6c5ce7', accentGlow: 'rgba(108,92,231,0.15)',
    text: '#e2e8f0', textMuted: '#7c8db5', heading: '#fff',
    displayFont: "'Space Grotesk', system-ui, sans-serif", bodyFont: "'Inter', system-ui, sans-serif",
    cardBorder: 'rgba(108,92,231,0.2)', gradientOverlay: 'linear-gradient(135deg, #0c0c1d 0%, #1a1040 100%)',
  },
  fitness: {
    bg: '#0d0d0d', bgCard: 'rgba(255,255,255,0.04)', accent: '#00d26a', accentGlow: 'rgba(0,210,106,0.12)',
    text: '#e8e8e8', textMuted: '#7a7a7a', heading: '#fff',
    displayFont: "'Oswald', system-ui, sans-serif", bodyFont: "'Inter', system-ui, sans-serif",
    cardBorder: 'rgba(0,210,106,0.2)', gradientOverlay: 'linear-gradient(135deg, #0d0d0d 0%, #0d1a10 100%)',
  },
  default: {
    bg: '#0a0a14', bgCard: 'rgba(255,255,255,0.03)', accent: '#f5a623', accentGlow: 'rgba(245,166,35,0.12)',
    text: '#e2e8f0', textMuted: '#7a8ba8', heading: '#fff',
    displayFont: "'Syne', system-ui, sans-serif", bodyFont: "'Inter', system-ui, sans-serif",
    cardBorder: 'rgba(245,166,35,0.2)', gradientOverlay: 'linear-gradient(135deg, #0a0a14 0%, #141428 100%)',
  },
}

function getTheme(industry: string): Theme {
  const i = industry.toLowerCase()
  if (i.includes('real estate') || i.includes('fashion') || i.includes('automotive')) return THEMES.luxury
  if (i.includes('health') || i.includes('medical') || i.includes('wellness')) return THEMES.healthcare
  if (i.includes('food') || i.includes('beverage') || i.includes('restaurant')) return THEMES.food
  if (i.includes('tech') || i.includes('saas') || i.includes('fintech')) return THEMES.tech
  if (i.includes('fitness') || i.includes('sport')) return THEMES.fitness
  return THEMES.default
}

// ═══════════════════════════════════
// PROPOSAL PARSER
// ═══════════════════════════════════

function parseProposal(proposal: string): SlideData[] {
  const sections: SlideData[] = []
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
        const item = line.replace(/^[-*]\s/, '').trim()
        if (currentSub) currentSub.items.push(item)
        else content.push(item)
      } else if (line.startsWith('> ')) {
        content.push(line.slice(2).trim())
      } else if (line.trim() && !line.startsWith('---') && !line.startsWith('#')) {
        content.push(line.trim())
      }
    }
    if (currentSub) subsections.push(currentSub)

    sections.push({ title, content, subsections, raw: part })
  }

  return sections
}

function extractTagline(proposal: string): string {
  const match = proposal.match(/^> (.+)$/m)
  return match ? match[1].replace(/\*+/g, '').trim() : ''
}

function stripBold(text: string): { text: string; isBold: boolean } {
  const match = text.match(/^\*\*(.+?)\*\*(.*)$/)
  if (match) return { text: match[1] + match[2], isBold: true }
  return { text, isBold: false }
}

// ═══════════════════════════════════
// SLIDE RENDERERS
// ═══════════════════════════════════

function CoverSlide({ name, tagline, image, theme }: { name: string; tagline: string; image: string | null; theme: Theme }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: theme.bg }}>
      {image && (
        <>
          <img src={image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${theme.bg} 10%, transparent 60%, ${theme.bg}88 100%)` }} />
        </>
      )}
      <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', fontFamily: theme.bodyFont, color: theme.accent, letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '24px', fontWeight: 600 }}>
          Marketing Proposal
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontFamily: theme.displayFont, fontWeight: 800, color: theme.heading, lineHeight: 1.1, marginBottom: '24px', maxWidth: '900px' }}>
          {name}
        </h1>
        {tagline && (
          <p style={{ fontSize: 'clamp(16px, 2vw, 22px)', fontFamily: theme.bodyFont, color: theme.textMuted, maxWidth: '600px', lineHeight: 1.5, fontStyle: 'italic' }}>
            {tagline}
          </p>
        )}
        <div style={{ marginTop: '48px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '2px', background: theme.accent }} />
          <span style={{ fontSize: '13px', fontFamily: theme.bodyFont, color: theme.textMuted, letterSpacing: '2px', textTransform: 'uppercase' }}>
            Prepared by Mazero Digital
          </span>
          <div style={{ width: '40px', height: '2px', background: theme.accent }} />
        </div>
      </div>
    </div>
  )
}

function ContentSlide({ title, items, image, theme, layout = 'default' }: {
  title: string; items: string[]; image?: string | null; theme: Theme; layout?: 'default' | 'image-left' | 'image-right' | 'stats'
}) {
  const showImage = image && (layout === 'image-left' || layout === 'image-right')

  return (
    <div style={{ width: '100%', height: '100%', background: theme.gradientOverlay, display: 'flex', flexDirection: 'column', padding: '60px 72px' }}>
      <h2 style={{ fontSize: '38px', fontFamily: theme.displayFont, fontWeight: 800, color: theme.heading, marginBottom: '40px', lineHeight: 1.2 }}>
        {title}
        <div style={{ width: '60px', height: '4px', background: theme.accent, marginTop: '16px', borderRadius: '2px' }} />
      </h2>

      <div style={{ flex: 1, display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        {showImage && layout === 'image-left' && (
          <div style={{ width: '40%', flexShrink: 0, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${theme.cardBorder}` }}>
            <img src={image!} alt="" style={{ width: '100%', height: '300px', objectFit: 'cover' }} />
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.slice(0, 8).map((item, i) => {
            const { text, isBold } = stripBold(item)
            return (
              <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.accent, marginTop: '8px', flexShrink: 0 }} />
                <p style={{
                  fontSize: '16px', fontFamily: theme.bodyFont, color: isBold ? theme.text : theme.textMuted,
                  lineHeight: 1.7, fontWeight: isBold ? 600 : 400,
                }}>
                  {text.replace(/\*\*/g, '')}
                </p>
              </div>
            )
          })}
        </div>

        {showImage && layout === 'image-right' && (
          <div style={{ width: '40%', flexShrink: 0, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${theme.cardBorder}` }}>
            <img src={image!} alt="" style={{ width: '100%', height: '300px', objectFit: 'cover' }} />
          </div>
        )}
      </div>
    </div>
  )
}

function CompetitorSlide({ section, theme }: { section: SlideData; theme: Theme }) {
  const competitors = section.subsections.slice(0, 3)

  return (
    <div style={{ width: '100%', height: '100%', background: theme.gradientOverlay, display: 'flex', flexDirection: 'column', padding: '60px 72px' }}>
      <h2 style={{ fontSize: '38px', fontFamily: theme.displayFont, fontWeight: 800, color: theme.heading, marginBottom: '40px' }}>
        {section.title}
        <div style={{ width: '60px', height: '4px', background: theme.accent, marginTop: '16px', borderRadius: '2px' }} />
      </h2>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${Math.min(competitors.length, 3)}, 1fr)`, gap: '20px', alignItems: 'start' }}>
        {competitors.map((comp, i) => (
          <div key={i} style={{
            background: theme.bgCard, border: `1px solid ${theme.cardBorder}`, borderRadius: '16px',
            padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px', background: theme.accentGlow,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', fontWeight: 800, color: theme.accent, fontFamily: theme.displayFont,
              }}>
                {i + 1}
              </div>
              <h3 style={{ fontSize: '17px', fontFamily: theme.displayFont, fontWeight: 700, color: theme.heading }}>
                {comp.title.replace(/\*\*/g, '')}
              </h3>
            </div>
            {comp.items.slice(0, 4).map((item, j) => (
              <p key={j} style={{ fontSize: '13px', fontFamily: theme.bodyFont, color: theme.textMuted, lineHeight: 1.6 }}>
                {item.replace(/\*\*/g, '').replace(/\*/g, '')}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function TimelineSlide({ section, theme }: { section: SlideData; theme: Theme }) {
  const months = section.subsections.slice(0, 3)

  return (
    <div style={{ width: '100%', height: '100%', background: theme.gradientOverlay, display: 'flex', flexDirection: 'column', padding: '60px 72px' }}>
      <h2 style={{ fontSize: '38px', fontFamily: theme.displayFont, fontWeight: 800, color: theme.heading, marginBottom: '40px' }}>
        {section.title}
        <div style={{ width: '60px', height: '4px', background: theme.accent, marginTop: '16px', borderRadius: '2px' }} />
      </h2>

      <div style={{ flex: 1, display: 'flex', gap: '24px' }}>
        {months.map((month, i) => (
          <div key={i} style={{ flex: 1, position: 'relative' }}>
            {/* Timeline connector */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%', background: theme.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', fontWeight: 800, color: theme.bg, fontFamily: theme.displayFont, flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, height: '2px', background: i < months.length - 1 ? theme.cardBorder : 'transparent' }} />
            </div>
            <h3 style={{ fontSize: '18px', fontFamily: theme.displayFont, fontWeight: 700, color: theme.heading, marginBottom: '14px' }}>
              {month.title}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {month.items.slice(0, 4).map((item, j) => (
                <div key={j} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: theme.accent, marginTop: '7px', flexShrink: 0, opacity: 0.7 }} />
                  <p style={{ fontSize: '13px', fontFamily: theme.bodyFont, color: theme.textMuted, lineHeight: 1.6 }}>
                    {item.replace(/\*\*/g, '').replace(/\*/g, '')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PricingSlide({ section, theme }: { section: SlideData; theme: Theme }) {
  const tiers = section.subsections.slice(0, 3)

  return (
    <div style={{ width: '100%', height: '100%', background: theme.gradientOverlay, display: 'flex', flexDirection: 'column', padding: '60px 72px' }}>
      <h2 style={{ fontSize: '38px', fontFamily: theme.displayFont, fontWeight: 800, color: theme.heading, marginBottom: '40px', textAlign: 'center' }}>
        {section.title}
        <div style={{ width: '60px', height: '4px', background: theme.accent, marginTop: '16px', borderRadius: '2px', margin: '16px auto 0' }} />
      </h2>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${Math.min(tiers.length, 3)}, 1fr)`, gap: '20px', alignItems: 'start' }}>
        {tiers.map((tier, i) => {
          const isRecommended = tier.title.toLowerCase().includes('growth') || tier.title.toLowerCase().includes('recommended') || i === 1
          const priceItem = tier.items.find((it) => it.toLowerCase().includes('price'))
          const price = priceItem?.replace(/\*\*/g, '').replace(/.*?:\s*/, '') || ''

          return (
            <div key={i} style={{
              background: isRecommended ? theme.accentGlow : theme.bgCard,
              border: `${isRecommended ? '2px' : '1px'} solid ${isRecommended ? theme.accent : theme.cardBorder}`,
              borderRadius: '20px', padding: '32px 28px', position: 'relative',
              transform: isRecommended ? 'scale(1.04)' : 'none',
            }}>
              {isRecommended && (
                <div style={{
                  position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                  background: theme.accent, color: theme.bg, fontSize: '11px', fontWeight: 700,
                  padding: '4px 16px', borderRadius: '20px', fontFamily: theme.bodyFont, letterSpacing: '1px', textTransform: 'uppercase',
                }}>
                  Recommended
                </div>
              )}
              <h3 style={{ fontSize: '22px', fontFamily: theme.displayFont, fontWeight: 800, color: theme.heading, marginBottom: '8px', textAlign: 'center' }}>
                {tier.title.replace(/\(.*?\)/, '').trim()}
              </h3>
              {price && (
                <p style={{ fontSize: '28px', fontFamily: theme.displayFont, fontWeight: 800, color: theme.accent, textAlign: 'center', marginBottom: '20px' }}>
                  {price}
                </p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tier.items.filter((it) => !it.toLowerCase().includes('price')).slice(0, 6).map((item, j) => (
                  <div key={j} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="2.5" strokeLinecap="round" style={{ marginTop: '2px', flexShrink: 0 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <p style={{ fontSize: '13px', fontFamily: theme.bodyFont, color: theme.textMuted, lineHeight: 1.5 }}>
                      {item.replace(/\*\*/g, '').replace(/\*/g, '')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CTASlide({ name, section, theme }: { name: string; section: SlideData; theme: Theme }) {
  return (
    <div style={{ width: '100%', height: '100%', background: theme.gradientOverlay, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px', textAlign: 'center' }}>
      <h2 style={{ fontSize: '46px', fontFamily: theme.displayFont, fontWeight: 800, color: theme.heading, marginBottom: '32px', lineHeight: 1.2 }}>
        {section.title}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '48px', maxWidth: '600px' }}>
        {section.content.slice(0, 5).map((item, i) => {
          const num = item.match(/^(\d+)/)
          return (
            <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'center', textAlign: 'left' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%', background: theme.accentGlow, border: `2px solid ${theme.accent}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', fontWeight: 800, color: theme.accent, fontFamily: theme.displayFont, flexShrink: 0,
              }}>
                {num ? num[1] : i + 1}
              </div>
              <p style={{ fontSize: '17px', fontFamily: theme.bodyFont, color: theme.text, lineHeight: 1.5 }}>
                {item.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '')}
              </p>
            </div>
          )
        })}
      </div>

      <div style={{ width: '80px', height: '2px', background: theme.accent, marginBottom: '32px' }} />
      <p style={{ fontSize: '22px', fontFamily: theme.displayFont, fontWeight: 700, color: theme.accent, marginBottom: '8px' }}>
        Let&apos;s build something great for {name}.
      </p>
      <p style={{ fontSize: '14px', fontFamily: theme.bodyFont, color: theme.textMuted }}>
        Mazero Digital Marketing
      </p>
    </div>
  )
}

// ═══════════════════════════════════
// MAIN PRESENTATION COMPONENT
// ═══════════════════════════════════

export default function ProposalPresentation({ proposal, prospectName, industry, images, onClose }: Props) {
  const [current, setCurrent] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const theme = getTheme(industry)
  const tagline = extractTagline(proposal)
  const sections = parseProposal(proposal)

  // Map sections to slide types
  const findSection = (patterns: RegExp[]): SlideData | null => {
    for (const p of patterns) {
      const s = sections.find((s) => p.test(s.title))
      if (s) return s
    }
    return null
  }

  const execSummary = findSection([/executive summary/i, /summary/i])
  const opportunity = findSection([/opportunity/i, /challenge/i])
  const competitors = findSection([/competitor/i])
  const insights = findSection([/industry/i, /insight/i])
  const solution = findSection([/solution/i, /approach/i, /strategy/i])
  const contentStrategy = findSection([/content strategy/i, /content/i])
  const deliverables = findSection([/deliverable/i])
  const roadmap = findSection([/roadmap/i, /timeline/i])
  const investment = findSection([/investment/i, /pricing/i])
  const whyMazero = findSection([/why mazero/i, /why us/i])
  const nextSteps = findSection([/next step/i, /getting started/i])

  // Build slides array
  type Slide = { render: () => React.ReactElement }
  const slides: Slide[] = []

  // Slide 1: Cover
  slides.push({
    render: () => <CoverSlide name={prospectName} tagline={tagline} image={images.cover} theme={theme} />,
  })

  // Slide 2: The Problem (exec summary + opportunity merged)
  const problemItems = [
    ...(execSummary?.content || []),
    ...(opportunity?.content || []),
  ]
  if (problemItems.length > 0 || opportunity) {
    slides.push({
      render: () => (
        <ContentSlide
          title={opportunity?.title || 'The Opportunity'}
          items={problemItems}
          image={images.situation}
          layout="image-right"
          theme={theme}
        />
      ),
    })
  }

  // Slide 3: Competitors
  if (competitors && competitors.subsections.length > 0) {
    slides.push({ render: () => <CompetitorSlide section={competitors} theme={theme} /> })
  }

  // Slide 4: Our Solution
  if (solution) {
    slides.push({
      render: () => (
        <ContentSlide
          title={solution.title}
          items={[...solution.content, ...solution.subsections.flatMap((s) => s.items)]}
          image={images.solution}
          layout="image-left"
          theme={theme}
        />
      ),
    })
  }

  // Slide 5: Content Strategy
  if (contentStrategy) {
    slides.push({
      render: () => (
        <ContentSlide
          title={contentStrategy.title}
          items={[...contentStrategy.content, ...contentStrategy.subsections.flatMap((s) => [`**${s.title}**`, ...s.items])]}
          theme={theme}
        />
      ),
    })
  }

  // Slide 6: Deliverables
  if (deliverables) {
    slides.push({
      render: () => (
        <ContentSlide
          title={deliverables.title}
          items={[...deliverables.content, ...deliverables.subsections.flatMap((s) => s.items)]}
          theme={theme}
        />
      ),
    })
  }

  // Slide 7: Roadmap
  if (roadmap && roadmap.subsections.length > 0) {
    slides.push({ render: () => <TimelineSlide section={roadmap} theme={theme} /> })
  }

  // Slide 8: Investment
  if (investment && investment.subsections.length > 0) {
    slides.push({ render: () => <PricingSlide section={investment} theme={theme} /> })
  }

  // Slide 9: Why Mazero
  if (whyMazero) {
    slides.push({
      render: () => (
        <ContentSlide
          title={whyMazero.title}
          items={[...whyMazero.content, ...whyMazero.subsections.flatMap((s) => s.items)]}
          theme={theme}
        />
      ),
    })
  }

  // Slide 10: Next Steps / CTA
  if (nextSteps) {
    slides.push({
      render: () => <CTASlide name={prospectName} section={nextSteps} theme={theme} />,
    })
  }

  const totalSlides = slides.length

  const goNext = useCallback(() => setCurrent((c) => Math.min(c + 1, totalSlides - 1)), [totalSlides])
  const goPrev = useCallback(() => setCurrent((c) => Math.max(c - 1, 0)), [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev() }
      if (e.key === 'Escape') { isFullscreen ? exitFullscreen() : onClose() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev, isFullscreen, onClose])

  function enterFullscreen() {
    containerRef.current?.requestFullscreen?.()
    setIsFullscreen(true)
  }

  function exitFullscreen() {
    document.exitFullscreen?.()
    setIsFullscreen(false)
  }

  useEffect(() => {
    function onFsChange() {
      if (!document.fullscreenElement) setIsFullscreen(false)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  const isDark = theme.bg.startsWith('#0') || theme.bg.startsWith('#1')

  return (
    <div ref={containerRef} style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: theme.bg,
      display: 'flex', flexDirection: 'column', fontFamily: theme.bodyFont,
    }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Montserrat:wght@600;700;800&family=Lora:wght@600;700&family=Space+Grotesk:wght@600;700&family=Oswald:wght@600;700&family=Syne:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px', flexShrink: 0, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
        borderBottom: `1px solid ${theme.cardBorder}`,
      }}>
        <button onClick={onClose} style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px',
          background: 'transparent', border: `1px solid ${theme.cardBorder}`, color: theme.textMuted,
          cursor: 'pointer', fontSize: '13px', fontFamily: theme.bodyFont,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          Exit
        </button>

        <span style={{ fontSize: '13px', color: theme.textMuted, fontWeight: 600, fontFamily: theme.bodyFont }}>
          {current + 1} / {totalSlides}
        </span>

        <button onClick={isFullscreen ? exitFullscreen : enterFullscreen} style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px',
          background: theme.accentGlow, border: `1px solid ${theme.accent}`, color: theme.accent,
          cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: theme.bodyFont,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {isFullscreen ? (
              <><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" /></>
            ) : (
              <><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></>
            )}
          </svg>
          {isFullscreen ? 'Exit Fullscreen' : 'Present'}
        </button>
      </div>

      {/* Slide area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
        onClick={(e) => {
          const rect = (e.target as HTMLElement).getBoundingClientRect()
          const x = e.clientX - rect.left
          x > rect.width / 2 ? goNext() : goPrev()
        }}>
        {slides[current]?.render()}

        {/* Navigation arrows */}
        {current > 0 && (
          <button onClick={(e) => { e.stopPropagation(); goPrev() }} style={{
            position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
            width: '44px', height: '44px', borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.textMuted} strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
        )}
        {current < totalSlides - 1 && (
          <button onClick={(e) => { e.stopPropagation(); goNext() }} style={{
            position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
            width: '44px', height: '44px', borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.textMuted} strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        )}
      </div>

      {/* Slide dots */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: '6px', padding: '12px',
        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', flexShrink: 0,
      }}>
        {slides.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} style={{
            width: i === current ? '24px' : '8px', height: '8px', borderRadius: '4px',
            background: i === current ? theme.accent : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
            border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
          }} />
        ))}
      </div>
    </div>
  )
}

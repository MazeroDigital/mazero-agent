import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

// Industry → color scheme mapping for design context
const INDUSTRY_THEMES: Record<string, { name: string; primary: string; accent: string }> = {
  'SaaS / Technology': { name: 'Modern Tech', primary: '#0f172a', accent: '#06b6d4' },
  'Fashion & Beauty': { name: 'Luxury', primary: '#0a0a0a', accent: '#d4af37' },
  'Food & Beverage': { name: 'Warm Lifestyle', primary: '#431407', accent: '#f97316' },
  'Healthcare / Wellness': { name: 'Wellness', primary: '#052e16', accent: '#22c55e' },
  'Real Estate': { name: 'Premium Estate', primary: '#0c1222', accent: '#94a3b8' },
  'Finance / Fintech': { name: 'Corporate Finance', primary: '#1e1b4b', accent: '#818cf8' },
  'Travel & Hospitality': { name: 'Wanderlust', primary: '#172554', accent: '#38bdf8' },
  'Fitness & Sports': { name: 'Active Energy', primary: '#1c1917', accent: '#ef4444' },
}

const DEFAULT_THEME = { name: 'Mazero Brand', primary: '#0a0a0f', accent: '#f5a623' }

async function getCanvaAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch('https://api.canva.com/rest/v1/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'design:content:write design:meta:read design:content:read',
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Canva auth failed: ${error}`)
  }

  const data = await res.json()
  return data.access_token
}

export async function POST(req: NextRequest) {
  const clientId = process.env.CANVA_CLIENT_ID
  const clientSecret = process.env.CANVA_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'Canva credentials not configured', designUrl: null },
      { status: 200 } // Not a server error — Canva is optional
    )
  }

  try {
    const { companyName, industry, proposalSections } = await req.json()
    const theme = INDUSTRY_THEMES[industry] || DEFAULT_THEME

    // Step 1: Get access token
    const accessToken = await getCanvaAccessToken(clientId, clientSecret)

    // Step 2: Create a presentation design
    const designRes = await fetch('https://api.canva.com/rest/v1/designs', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        design_type: {
          type: 'preset',
          name: 'presentation',
        },
        title: `Marketing Proposal — ${companyName} | Mazero Digital`,
      }),
    })

    if (!designRes.ok) {
      const error = await designRes.text()
      throw new Error(`Canva design creation failed: ${error}`)
    }

    const designData = await designRes.json()
    const designId = designData.design?.id
    const editUrl = designData.design?.urls?.edit_url
    const viewUrl = designData.design?.urls?.view_url

    return NextResponse.json({
      designUrl: editUrl || viewUrl || null,
      designId: designId || null,
      theme,
      proposalSections,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[create-canva-design] Error:', message)
    // Return null URL instead of error — Canva is optional
    return NextResponse.json({ error: message, designUrl: null }, { status: 200 })
  }
}

import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const agentName = req.nextUrl.searchParams.get('agent') ?? 'secretary'

  const [{ data: agent }, { data: global }] = await Promise.all([
    supabase
      .from('agent_memory')
      .select('*')
      .eq('user_id', user.id)
      .eq('agent_name', agentName)
      .order('updated_at', { ascending: false })
      .limit(50),
    supabase
      .from('agent_memory')
      .select('*')
      .eq('user_id', user.id)
      .eq('agent_name', 'global')
      .order('updated_at', { ascending: false })
      .limit(30),
  ])

  return Response.json({ agent: agent ?? [], global: global ?? [] })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  await supabase.from('agent_memory').delete().eq('id', id).eq('user_id', user.id)

  return Response.json({ success: true })
}

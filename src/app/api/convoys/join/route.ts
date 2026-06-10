import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  const supabase = createServiceClient()
  const { data: invite } = await supabase.from('invites').select('*').eq('token', token).single()

  if (!invite) return NextResponse.json({ error: 'Invalid invite' }, { status: 404 })
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invite expired' }, { status: 410 })
  }
  if (invite.max_uses && invite.use_count >= invite.max_uses) {
    return NextResponse.json({ error: 'Invite full' }, { status: 410 })
  }

  const userId = session.user.supabaseUserId

  // Already a member?
  const { data: existing } = await supabase
    .from('convoy_members').select('id').eq('convoy_id', invite.convoy_id).eq('user_id', userId).single()
  if (existing) return NextResponse.json({ convoy_id: invite.convoy_id, already_member: true })

  await Promise.all([
    supabase.from('convoy_members').insert({ convoy_id: invite.convoy_id, user_id: userId, role: 'member' }),
    supabase.from('invites').update({ use_count: invite.use_count + 1 }).eq('id', invite.id),
  ])

  return NextResponse.json({ convoy_id: invite.convoy_id }, { status: 201 })
}

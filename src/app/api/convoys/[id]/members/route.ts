import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { canManageRole, canKick, hasPermission } from '@/lib/roles'
import type { Role } from '@/types/convoy'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { data: self } = await supabase
    .from('convoy_members').select('role').eq('convoy_id', id).eq('user_id', session.user.supabaseUserId).single()
  if (!self) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data } = await supabase
    .from('convoy_members')
    .select('*, user:users(id, username, avatar_url)')
    .eq('convoy_id', id)
    .order('joined_at')

  return NextResponse.json(data)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { target_user_id, role, action } = await req.json()

  const supabase = createServiceClient()
  const [{ data: actorMember }, { data: targetMember }] = await Promise.all([
    supabase.from('convoy_members').select('role').eq('convoy_id', id).eq('user_id', session.user.supabaseUserId).single(),
    supabase.from('convoy_members').select('role').eq('convoy_id', id).eq('user_id', target_user_id).single(),
  ])

  if (!actorMember || !targetMember) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const actorRole = actorMember.role as Role
  const targetRole = targetMember.role as Role

  if (action === 'kick') {
    if (!canKick(actorRole, targetRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    await supabase.from('convoy_members').delete().eq('convoy_id', id).eq('user_id', target_user_id)
    return new NextResponse(null, { status: 204 })
  }

  if (action === 'set_role') {
    if (!hasPermission(actorRole, 'admin') || !canManageRole(actorRole, role as Role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { data, error } = await supabase
      .from('convoy_members').update({ role }).eq('convoy_id', id).eq('user_id', target_user_id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

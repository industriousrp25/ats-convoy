import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/roles'
import type { Role } from '@/types/convoy'

async function getMemberRole(supabase: ReturnType<typeof createServiceClient>, convoyId: string, userId: string): Promise<Role | null> {
  const { data } = await (await supabase).from('convoy_members')
    .select('role')
    .eq('convoy_id', convoyId)
    .eq('user_id', userId)
    .single()
  return (data?.role as Role) ?? null
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const role = await getMemberRole(supabase, id, session.user.supabaseUserId)
  if (!role) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data } = await supabase.from('convoys').select('*').eq('id', id).single()
  return NextResponse.json(data)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const role = await getMemberRole(supabase, id, session.user.supabaseUserId)
  if (!role || !hasPermission(role, 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const allowed = ['name', 'description', 'server', 'departure_time', 'status']
  const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  const { data, error } = await supabase.from('convoys').update(update).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const role = await getMemberRole(supabase, id, session.user.supabaseUserId)
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await supabase.from('convoys').delete().eq('id', id)
  return new NextResponse(null, { status: 204 })
}

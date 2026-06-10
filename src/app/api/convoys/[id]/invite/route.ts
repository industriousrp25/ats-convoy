import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/roles'
import type { Role } from '@/types/convoy'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { data: member } = await supabase
    .from('convoy_members')
    .select('role')
    .eq('convoy_id', id)
    .eq('user_id', session.user.supabaseUserId)
    .single()

  if (!member || !hasPermission(member.role as Role, 'mod')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { expires_in_days, max_uses } = body

  const expires_at = expires_in_days
    ? new Date(Date.now() + expires_in_days * 86400000).toISOString()
    : null

  const { data: invite, error } = await supabase
    .from('invites')
    .insert({
      convoy_id: id,
      created_by: session.user.supabaseUserId,
      expires_at,
      max_uses: max_uses ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  return NextResponse.json({ ...invite, url: `${baseUrl}/join?token=${invite.token}` }, { status: 201 })
}

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('convoy_members')
    .select('role, convoy:convoys(*)')
    .eq('user_id', session.user.supabaseUserId)
    .order('joined_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ALLOWED_CREATORS = ['329103914831970304']
  if (!ALLOWED_CREATORS.includes(session.user.discordId)) {
    return NextResponse.json({ error: 'Only authorized users can create convoys' }, { status: 403 })
  }

  const { name, description, server, departure_time } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const supabase = createServiceClient()
  const userId = session.user.supabaseUserId

  const { data: convoy, error } = await supabase
    .from('convoys')
    .insert({ name: name.trim(), description, server, departure_time, owner_id: userId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('convoy_members').insert({
    convoy_id: convoy.id,
    user_id: userId,
    role: 'owner',
  })

  return NextResponse.json(convoy, { status: 201 })
}

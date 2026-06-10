import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('convoy_members')
    .select('convoy_id, truckersmp_id, convoy:convoys(name)')
    .eq('user_id', session.user.supabaseUserId)

  const result = (data ?? []).map(m => ({
    convoy_id: m.convoy_id,
    truckersmp_id: m.truckersmp_id ?? '',
    convoy_name: (Array.isArray(m.convoy) ? m.convoy[0] : m.convoy as { name: string } | null)?.name ?? '',
  }))

  return NextResponse.json(result)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { convoy_id, truckersmp_id } = await req.json()
  if (!convoy_id) return NextResponse.json({ error: 'convoy_id required' }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('convoy_members')
    .update({ truckersmp_id: truckersmp_id || null })
    .eq('convoy_id', convoy_id)
    .eq('user_id', session.user.supabaseUserId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}

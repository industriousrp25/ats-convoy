import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { data: member } = await supabase
    .from('convoy_members').select('id').eq('convoy_id', id).eq('user_id', session.user.supabaseUserId).single()
  if (!member) return NextResponse.json({ error: 'Not in convoy' }, { status: 403 })

  const { x, y, heading, speed, truckersmp_id } = await req.json()

  const { error } = await supabase.from('positions').upsert(
    { convoy_id: id, user_id: session.user.supabaseUserId, x, y, heading, speed, truckersmp_id, updated_at: new Date().toISOString() },
    { onConflict: 'convoy_id,user_id' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}

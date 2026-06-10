import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPlayerByTruckersmpId } from '@/lib/trucky'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const server = searchParams.get('server') ?? 'ATS1'

  const player = await getPlayerByTruckersmpId(server, id)
  if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  return NextResponse.json(player)
}

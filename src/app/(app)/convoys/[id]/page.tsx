import dynamic from 'next/dynamic'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { InviteLink } from '@/components/InviteLink'
import { RoleBadge } from '@/components/RoleBadge'
import { PositionReporter } from '@/components/PositionReporter'
import type { Role } from '@/types/convoy'
import { hasPermission } from '@/lib/roles'

const ConvoyMap = dynamic(() => import('@/components/ConvoyMap').then(m => m.ConvoyMap), { ssr: false })

export default async function ConvoyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const supabase = createServiceClient()

  const [{ data: convoy }, { data: member }, { data: members }, { data: positions }] = await Promise.all([
    supabase.from('convoys').select('*').eq('id', id).single(),
    supabase.from('convoy_members').select('role, truckersmp_id').eq('convoy_id', id).eq('user_id', session!.user.supabaseUserId).single(),
    supabase.from('convoy_members').select('*, user:users(id, username, avatar_url)').eq('convoy_id', id).order('joined_at'),
    supabase.from('positions').select('*, user:users(id, username)').eq('convoy_id', id),
  ])

  if (!convoy || !member) return <p className="text-gray-400">Convoy not found.</p>

  const myRole = member.role as Role
  const canManage = hasPermission(myRole, 'admin')

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{convoy.name}</h1>
          {convoy.description && <p className="text-gray-400 mt-1">{convoy.description}</p>}
          {convoy.departure_time && (
            <p className="text-sm text-gray-500 mt-1">
              Departs: {new Date(convoy.departure_time).toLocaleString()}
            </p>
          )}
          {convoy.server && <p className="text-sm text-gray-500">Server: {convoy.server}</p>}
        </div>
        <div className="flex items-center gap-3">
          <RoleBadge role={myRole} />
          {canManage && (
            <Link href={`/convoys/${id}/manage`} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors">
              Manage
            </Link>
          )}
        </div>
      </div>

      {/* Live map */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Live Map</h2>
        <ConvoyMap convoyId={id} initialPositions={positions ?? []} />
        {member.truckersmp_id && convoy.server && (
          <PositionReporter convoyId={id} truckersmpId={member.truckersmp_id} server={convoy.server} />
        )}
        {!member.truckersmp_id && (
          <p className="text-sm text-yellow-400 mt-2">
            Set your TruckersMP ID in settings to appear on the map.
          </p>
        )}
      </section>

      {/* Members */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Members ({members?.length ?? 0})</h2>
        <ul className="space-y-2">
          {members?.map(m => {
            const u = m.user as { id: string; username: string; avatar_url: string | null }
            return (
              <li key={m.id} className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg">
                <span className="flex-1">{u?.username ?? 'Unknown'}</span>
                <RoleBadge role={m.role as Role} />
              </li>
            )
          })}
        </ul>
      </section>

      {/* Invite */}
      {hasPermission(myRole, 'mod') && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Invite</h2>
          <InviteLink convoyId={id} />
        </section>
      )}
    </div>
  )
}

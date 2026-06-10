import Link from 'next/link'
import { auth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { RoleBadge } from '@/components/RoleBadge'
import type { Role } from '@/types/convoy'

const ALLOWED_CREATORS = ['329103914831970304']

export default async function ConvoysPage() {
  const session = await auth()
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('convoy_members')
    .select('role, convoy:convoys(id, name, status, departure_time, server)')
    .eq('user_id', session!.user.supabaseUserId)
    .order('joined_at', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Convoys</h1>
        {ALLOWED_CREATORS.includes(session!.user.discordId) && (
          <Link href="/convoys/new" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition-colors">
            New Convoy
          </Link>
        )}
      </div>

      {!data?.length ? (
        <p className="text-gray-500">No convoys yet. <Link href="/convoys/new" className="text-indigo-400 hover:underline">Create one</Link>.</p>
      ) : (
        <ul className="space-y-2">
          {data.map(m => {
            const c = (Array.isArray(m.convoy) ? m.convoy[0] : m.convoy) as { id: string; name: string; status: string; departure_time: string | null; server: string | null }
            return (
              <li key={c.id}>
                <Link href={`/convoys/${c.id}`} className="flex items-center justify-between p-4 bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    {c.server && <p className="text-xs text-gray-500 mt-0.5">{c.server}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <RoleBadge role={m.role as Role} />
                    <span className="text-xs text-gray-500 capitalize">{c.status}</span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

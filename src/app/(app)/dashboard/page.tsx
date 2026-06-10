import Link from 'next/link'
import { auth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

const ALLOWED_CREATORS = ['329103914831970304']

export default async function DashboardPage() {
  const session = await auth()
  const supabase = createServiceClient()

  const { data: memberships } = await supabase
    .from('convoy_members')
    .select('role, convoy:convoys(id, name, status, departure_time)')
    .eq('user_id', session!.user.supabaseUserId)
    .order('joined_at', { ascending: false })
    .limit(5)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {ALLOWED_CREATORS.includes(session!.user.discordId) && (
          <Link href="/convoys/new" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition-colors">
            New Convoy
          </Link>
        )}
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3 text-gray-300">Recent Convoys</h2>
        {memberships?.length ? (
          <ul className="space-y-2">
            {memberships.map((m) => {
              const convoy = (Array.isArray(m.convoy) ? m.convoy[0] : m.convoy) as { id: string; name: string; status: string; departure_time: string | null }
              return (
                <li key={convoy.id}>
                  <Link
                    href={`/convoys/${convoy.id}`}
                    className="flex items-center justify-between p-4 bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <span className="font-medium">{convoy.name}</span>
                    <span className="text-xs text-gray-400 capitalize">{convoy.status}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-gray-500">No convoys yet. <Link href="/convoys/new" className="text-indigo-400 hover:underline">Create one</Link>.</p>
        )}
      </section>
    </div>
  )
}

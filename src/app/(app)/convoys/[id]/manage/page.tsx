import { auth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/roles'
import { ManageClient } from './ManageClient'
import type { Role } from '@/types/convoy'
import { redirect } from 'next/navigation'

export default async function ManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const supabase = createServiceClient()

  const [{ data: member }, { data: members }] = await Promise.all([
    supabase.from('convoy_members').select('role').eq('convoy_id', id).eq('user_id', session!.user.supabaseUserId).single(),
    supabase.from('convoy_members').select('*, user:users(id, username, avatar_url)').eq('convoy_id', id).order('joined_at'),
  ])

  if (!member || !hasPermission(member.role as Role, 'admin')) redirect(`/convoys/${id}`)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Manage Convoy</h1>
      <section>
        <h2 className="text-lg font-semibold mb-3">Members</h2>
        <ManageClient members={members ?? []} myRole={member.role as Role} convoyId={id} />
      </section>
    </div>
  )
}

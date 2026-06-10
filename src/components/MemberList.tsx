'use client'
import Image from 'next/image'
import type { ConvoyMember, Role } from '@/types/convoy'
import { RoleBadge } from './RoleBadge'

const ROLES: Role[] = ['owner', 'admin', 'mod', 'member']

type Props = {
  members: ConvoyMember[]
  myRole: Role
  convoyId: string
  onUpdate: () => void
}

export function MemberList({ members, myRole, convoyId, onUpdate }: Props) {
  const roleRank: Record<Role, number> = { owner: 4, admin: 3, mod: 2, member: 1 }

  async function setRole(userId: string, role: Role) {
    await fetch(`/api/convoys/${convoyId}/members`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_user_id: userId, role, action: 'set_role' }),
    })
    onUpdate()
  }

  async function kick(userId: string) {
    await fetch(`/api/convoys/${convoyId}/members`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_user_id: userId, action: 'kick' }),
    })
    onUpdate()
  }

  return (
    <ul className="space-y-2">
      {members.map((m) => {
        const canAct = roleRank[myRole] > roleRank[m.role as Role] && roleRank[myRole] >= roleRank['admin']
        return (
          <li key={m.id} className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg">
            {m.user?.avatar_url && (
              <Image src={m.user.avatar_url} alt="" width={32} height={32} className="rounded-full" />
            )}
            <span className="flex-1 font-medium">{m.user?.username ?? 'Unknown'}</span>
            <RoleBadge role={m.role as Role} />
            {canAct && (
              <div className="flex gap-2">
                <select
                  value={m.role}
                  onChange={e => setRole(m.user_id, e.target.value as Role)}
                  className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs"
                >
                  {ROLES.filter(r => r !== 'owner' && roleRank[myRole] > roleRank[r]).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <button onClick={() => kick(m.user_id)} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                  Kick
                </button>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

import type { Role } from '@/types/convoy'

const colors: Record<Role, string> = {
  owner: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  admin: 'bg-red-500/20 text-red-400 border-red-500/30',
  mod: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  member: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded border capitalize font-medium ${colors[role]}`}>
      {role}
    </span>
  )
}

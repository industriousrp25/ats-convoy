import type { Role } from '@/types/convoy'

const hierarchy: Record<Role, number> = { owner: 4, admin: 3, mod: 2, member: 1 }

export function canManageRole(actor: Role, target: Role): boolean {
  return hierarchy[actor] > hierarchy[target]
}

export function hasPermission(role: Role, min: Role): boolean {
  return hierarchy[role] >= hierarchy[min]
}

// canKick: admin+ can kick members below their level
export function canKick(actor: Role, target: Role): boolean {
  return hierarchy[actor] > hierarchy[target] && hierarchy[actor] >= hierarchy['admin']
}

export type ConvoyStatus = 'draft' | 'active' | 'completed' | 'cancelled'
export type Role = 'owner' | 'admin' | 'mod' | 'member'

export interface User {
  id: string
  discord_id: string
  username: string
  avatar_url: string | null
  created_at: string
}

export interface Convoy {
  id: string
  name: string
  description: string | null
  owner_id: string
  server: string | null
  departure_time: string | null
  status: ConvoyStatus
  created_at: string
}

export interface ConvoyMember {
  id: string
  convoy_id: string
  user_id: string
  role: Role
  truckersmp_id: string | null
  joined_at: string
  user?: User
}

export interface Invite {
  id: string
  convoy_id: string
  token: string
  created_by: string
  expires_at: string | null
  max_uses: number | null
  use_count: number
  created_at: string
}

export interface Position {
  id: string
  convoy_id: string
  user_id: string
  truckersmp_id: string | null
  x: number
  y: number
  heading: number
  speed: number
  updated_at: string
  user?: User
}

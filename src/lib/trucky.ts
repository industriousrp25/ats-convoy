const BASE = process.env.TRUCKY_API_BASE ?? 'https://api.truckyapp.com/v2'

export interface TruckyPlayer {
  id: number
  name: string
  x: number
  y: number
  heading: number
  speed: number
  truck?: string
  online: boolean
}

export async function getPlayerByTruckersmpId(
  serverId: string,
  playerId: string
): Promise<TruckyPlayer | null> {
  const res = await fetch(`${BASE}/map/${serverId}/players/${playerId}`, {
    next: { revalidate: 0 },
  })
  if (!res.ok) return null
  return res.json()
}

export async function getServerPlayers(serverId: string): Promise<TruckyPlayer[]> {
  const res = await fetch(`${BASE}/map/${serverId}/players`, {
    next: { revalidate: 0 },
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.response ?? []
}

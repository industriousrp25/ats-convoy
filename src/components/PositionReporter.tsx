'use client'
import { useEffect, useRef } from 'react'

type Props = {
  convoyId: string
  truckersmpId: string
  server: string
}

export function PositionReporter({ convoyId, truckersmpId, server }: Props) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    async function report() {
      try {
        const res = await fetch(`/api/trucky/player/${truckersmpId}?server=${encodeURIComponent(server)}`)
        if (!res.ok) return
        const player = await res.json()
        await fetch(`/api/convoys/${convoyId}/positions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            x: player.x,
            y: player.y,
            heading: player.heading,
            speed: player.speed,
            truckersmp_id: truckersmpId,
          }),
        })
      } catch {}
    }

    report()
    timerRef.current = setInterval(report, 10000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [convoyId, truckersmpId, server])

  return null
}

'use client'
import { useEffect, useState } from 'react'

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Departed'
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  return `${minutes}m ${seconds}s`
}

export function DepartureCountdown({ departureTime }: { departureTime: string }) {
  const target = new Date(departureTime).getTime()
  const [remaining, setRemaining] = useState(target - Date.now())

  useEffect(() => {
    const timer = setInterval(() => setRemaining(target - Date.now()), 1000)
    return () => clearInterval(timer)
  }, [target])

  const departed = remaining <= 0
  return (
    <span className={departed ? 'text-gray-500' : 'text-green-400 font-mono'}>
      {departed
        ? `Departed ${new Date(departureTime).toLocaleDateString()}`
        : `Departs in ${formatCountdown(remaining)}`}
    </span>
  )
}

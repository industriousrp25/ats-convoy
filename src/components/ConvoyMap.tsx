'use client'
import { useEffect, useRef, useState } from 'react'
import type { Position } from '@/types/convoy'
import { createClient } from '@/lib/supabase/client'

// ATS map bounds (approximate, in game coordinates)
const ATS_BOUNDS = { minX: -94000, maxX: 94000, minY: -80000, maxY: 80000 }

function gameToLatLng(x: number, y: number): [number, number] {
  const lat = ((ATS_BOUNDS.maxY - y) / (ATS_BOUNDS.maxY - ATS_BOUNDS.minY)) * 180 - 90
  const lng = ((x - ATS_BOUNDS.minX) / (ATS_BOUNDS.maxX - ATS_BOUNDS.minX)) * 360 - 180
  return [lat, lng]
}

type Props = { convoyId: string; initialPositions: Position[] }

export function ConvoyMap({ convoyId, initialPositions }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<typeof import('leaflet') | null>(null)
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null)
  const markersRef = useRef<Map<string, import('leaflet').Marker>>(new Map())
  const [positions, setPositions] = useState<Position[]>(initialPositions)

  // Init Leaflet
  useEffect(() => {
    if (!mapRef.current) return
    let destroyed = false

    import('leaflet').then((L) => {
      if (destroyed || !mapRef.current) return

      // Destroy any existing Leaflet instance on this DOM node
      const el = mapRef.current as HTMLElement & { _leaflet_id?: number }
      if (el._leaflet_id) {
        mapInstanceRef.current?.remove()
        mapInstanceRef.current = null
        markersRef.current.clear()
      }
      if (destroyed || !mapRef.current) return

      leafletRef.current = L
      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        maxZoom: 19,
      }).addTo(map)
      map.setView([36.7, -119.7], 6)
      mapInstanceRef.current = map
    })

    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => {
      destroyed = true
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
      markersRef.current.clear()
    }
  }, [])

  // Update markers when positions change
  useEffect(() => {
    const L = leafletRef.current
    const map = mapInstanceRef.current
    if (!L || !map) return

    positions.forEach((pos) => {
      const latlng = gameToLatLng(pos.x, pos.y)
      const label = `${pos.user?.username ?? 'Driver'} — ${Math.round(pos.speed ?? 0)} km/h`
      const existing = markersRef.current.get(pos.user_id)
      if (existing) {
        existing.setLatLng(latlng)
        existing.setTooltipContent(label)
      } else {
        const avatarUrl = (pos.user as { avatar_url?: string } | undefined)?.avatar_url
        const icon = avatarUrl
          ? L.divIcon({
              html: `<img src="${avatarUrl}" style="width:32px;height:32px;border-radius:50%;border:2px solid #6366f1;" />`,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
              className: '',
            })
          : L.icon({
              iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
            })
        const marker = L.marker(latlng, { icon })
          .addTo(map)
          .bindTooltip(label, { permanent: false })
        markersRef.current.set(pos.user_id, marker)
      }
    })
  }, [positions])

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`positions:${convoyId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'positions',
        filter: `convoy_id=eq.${convoyId}`,
      }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setPositions(prev => prev.filter(p => p.id !== payload.old.id))
        } else {
          setPositions(prev => {
            const updated = payload.new as Position
            const idx = prev.findIndex(p => p.user_id === updated.user_id)
            if (idx >= 0) { const n = [...prev]; n[idx] = updated; return n }
            return [...prev, updated]
          })
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [convoyId])

  return (
    <div className="relative">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} className="w-full h-96 rounded-lg overflow-hidden bg-gray-900" />
    </div>
  )
}

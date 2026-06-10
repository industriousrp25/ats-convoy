'use client'
import { useEffect, useState } from 'react'

export default function SettingsPage() {
  const [convoys, setConvoys] = useState<{ convoy_id: string; convoy_name: string; truckersmp_id: string }[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings/truckersmp').then(r => r.json()).then(data => {
      setConvoys(data)
      const init: Record<string, string> = {}
      data.forEach((c: { convoy_id: string; truckersmp_id: string }) => {
        init[c.convoy_id] = c.truckersmp_id ?? ''
      })
      setValues(init)
      setLoading(false)
    })
  }, [])

  async function save(convoyId: string) {
    await fetch('/api/settings/truckersmp', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ convoy_id: convoyId, truckersmp_id: values[convoyId] }),
    })
    setSaved(s => ({ ...s, [convoyId]: true }))
    setTimeout(() => setSaved(s => ({ ...s, [convoyId]: false })), 2000)
  }

  if (loading) return <p className="text-gray-400">Loading…</p>

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-300">TruckersMP ID</h2>
        <p className="text-sm text-gray-400">
          Your TruckersMP player ID is used to show your position on the live map.
          Find it at <span className="text-indigo-400">truckersmp.com/profile</span> — it&apos;s the number in the URL.
        </p>

        {convoys.length === 0 && (
          <p className="text-gray-500 text-sm">Join a convoy first to set your TruckersMP ID.</p>
        )}

        {convoys.map(c => (
          <div key={c.convoy_id} className="bg-gray-900 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-gray-300">{c.convoy_name}</p>
            <div className="flex gap-2">
              <input
                value={values[c.convoy_id] ?? ''}
                onChange={e => setValues(v => ({ ...v, [c.convoy_id]: e.target.value }))}
                placeholder="e.g. 1234567"
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => save(c.convoy_id)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-sm font-semibold transition-colors"
              >
                {saved[c.convoy_id] ? 'Saved!' : 'Save'}
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

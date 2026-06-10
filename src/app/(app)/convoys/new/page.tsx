'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewConvoyPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [server, setServer] = useState('')
  const [departureTime, setDepartureTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/convoys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, server, departure_time: departureTime || null }),
    })
    setLoading(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to create convoy')
      return
    }
    const convoy = await res.json()
    router.push(`/convoys/${convoy.id}`)
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">New Convoy</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Name *</label>
          <input
            value={name} onChange={e => setName(e.target.value)} required
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
            placeholder="Friday Night Run"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Description</label>
          <textarea
            value={description} onChange={e => setDescription(e.target.value)} rows={3}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
            placeholder="Route details, rules, etc."
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">TruckersMP Server</label>
          <input
            value={server} onChange={e => setServer(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
            placeholder="e.g. ATS 1"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Departure Time</label>
          <input
            type="datetime-local" value={departureTime} onChange={e => setDepartureTime(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit" disabled={loading}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg font-semibold transition-colors"
        >
          {loading ? 'Creating…' : 'Create Convoy'}
        </button>
      </form>
    </div>
  )
}

'use client'
import { useState } from 'react'

export function InviteLink({ convoyId }: { convoyId: string }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  async function generate() {
    setLoading(true)
    const res = await fetch(`/api/convoys/${convoyId}/invite`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    setLoading(false)
    if (res.ok) {
      const data = await res.json()
      setUrl(data.url)
    }
  }

  function copy() {
    navigator.clipboard.writeText(url)
  }

  return (
    <div className="space-y-2">
      {url ? (
        <div className="flex gap-2">
          <input readOnly value={url} className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm" />
          <button onClick={copy} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors">
            Copy
          </button>
        </div>
      ) : (
        <button
          onClick={generate} disabled={loading}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded text-sm transition-colors"
        >
          {loading ? 'Generating…' : 'Generate Invite Link'}
        </button>
      )}
    </div>
  )
}

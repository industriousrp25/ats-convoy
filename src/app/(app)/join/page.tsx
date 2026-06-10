'use client'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function JoinPage() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token')
  const [status, setStatus] = useState<'loading' | 'error' | 'done'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('No invite token found.'); return }
    fetch('/api/convoys/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).then(async res => {
      const data = await res.json()
      if (!res.ok) { setStatus('error'); setMessage(data.error ?? 'Failed to join'); return }
      setStatus('done')
      setTimeout(() => router.push(`/convoys/${data.convoy_id}`), 1500)
    })
  }, [token, router])

  return (
    <main className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-2">
        {status === 'loading' && <p className="text-gray-400">Joining convoy…</p>}
        {status === 'done' && <p className="text-green-400">Joined! Redirecting…</p>}
        {status === 'error' && <p className="text-red-400">{message}</p>}
      </div>
    </main>
  )
}

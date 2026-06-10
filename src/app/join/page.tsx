'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'

function JoinInner() {
  const params = useSearchParams()
  const router = useRouter()
  const { status } = useSession()
  const token = params.get('token')
  const [joinStatus, setJoinStatus] = useState<'idle' | 'loading' | 'error' | 'done'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn('discord', { callbackUrl: `/join?token=${token}` })
    }
  }, [status, token])

  useEffect(() => {
    if (status !== 'authenticated' || !token || joinStatus !== 'idle') return
    setJoinStatus('loading')
    fetch('/api/convoys/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).then(async res => {
      const data = await res.json()
      if (!res.ok) { setJoinStatus('error'); setMessage(data.error ?? 'Failed to join'); return }
      setJoinStatus('done')
      setTimeout(() => router.push(`/convoys/${data.convoy_id}`), 1500)
    })
  }, [status, token, joinStatus, router])

  if (status === 'loading' || status === 'unauthenticated') {
    return <p className="text-gray-400">Signing you in…</p>
  }

  return (
    <div className="text-center space-y-2">
      {joinStatus === 'loading' && <p className="text-gray-400">Joining convoy…</p>}
      {joinStatus === 'done' && <p className="text-green-400">Joined! Redirecting…</p>}
      {joinStatus === 'error' && <p className="text-red-400">{message}</p>}
    </div>
  )
}

export default function JoinPage() {
  return (
    <main className="flex items-center justify-center min-h-screen">
      <Suspense fallback={<p className="text-gray-400">Loading…</p>}>
        <JoinInner />
      </Suspense>
    </main>
  )
}

'use client'
import { useState, useCallback } from 'react'
import { MemberList } from '@/components/MemberList'
import type { ConvoyMember, Role } from '@/types/convoy'

type Props = { members: ConvoyMember[]; myRole: Role; convoyId: string }

export function ManageClient({ members: initial, myRole, convoyId }: Props) {
  const [members, setMembers] = useState<ConvoyMember[]>(initial)

  const reload = useCallback(async () => {
    const res = await fetch(`/api/convoys/${convoyId}/members`)
    if (res.ok) setMembers(await res.json())
  }, [convoyId])

  return <MemberList members={members} myRole={myRole} convoyId={convoyId} onUpdate={reload} />
}

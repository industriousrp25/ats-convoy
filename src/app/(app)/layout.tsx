import Link from 'next/link'
import { auth, signOut } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-lg hover:text-indigo-400 transition-colors">
          ATS Convoy
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/convoys" className="text-gray-400 hover:text-white text-sm transition-colors">
            My Convoys
          </Link>
          <Link href="/settings" className="text-gray-400 hover:text-white text-sm transition-colors">
            Settings
          </Link>
          <span className="text-gray-500 text-sm">{session.user.name}</span>
          <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }) }}>
            <button className="text-gray-400 hover:text-white text-sm transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}

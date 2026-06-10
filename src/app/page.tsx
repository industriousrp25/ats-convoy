import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
      <h1 className="text-4xl font-bold tracking-tight">ATS Convoy</h1>
      <p className="text-gray-400 text-lg text-center max-w-md">
        Organize, track, and run American Truck Simulator convoys with your crew.
      </p>
      <Link
        href="/login"
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold transition-colors"
      >
        Sign in with Discord
      </Link>
    </main>
  )
}

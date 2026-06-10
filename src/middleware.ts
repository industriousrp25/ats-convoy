import { auth } from '@/lib/auth'

export default auth((req) => {
  const isAuthed = !!req.auth
  if (!isAuthed) {
    return Response.redirect(new URL('/login', req.url))
  }
})

export const config = {
  matcher: ['/dashboard/:path*', '/convoys/:path*', '/settings/:path*'],
  runtime: 'nodejs',
}

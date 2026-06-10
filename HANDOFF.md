# ATS Convoy — HANDOFF

## Session 1 — 2026-06-10 (in progress)

### Completed
- Full Next.js 14 + Supabase + Discord OAuth + Leaflet scaffold created under `projects/ats-convoy/`
- DB schema: `users`, `convoys`, `invites`, `convoy_members`, `positions` w/ RLS + Realtime on `positions`
- Auth: NextAuth v5 Discord provider → upsert `users` table, `supabaseUserId` on session
- Role system: 4-tier (`owner/admin/mod/member`) w/ `canManageRole`, `hasPermission`, `canKick` guards
- All API routes: convoy CRUD, invite generate, join-by-token, member list/role-change/kick, position upsert, Trucky proxy
- UI: login page (Discord button), app layout w/ header/signout, dashboard, new convoy form, convoy detail page (map + members + invite), manage page, join page
- `ConvoyMap.tsx`: Leaflet + Trucky tile layer + Supabase Realtime position subscription
- `PositionReporter.tsx`: polls Trucky API every 10s → posts position to `/api/convoys/[id]/positions`
- TypeScript clean (`tsc --noEmit` passes)

### In Progress
- Needs Supabase project created + `.env.local` filled in
- Needs Discord OAuth app created (redirect URI: `http://localhost:3000/api/auth/callback/discord`)
- Manage page: `myRole` isn't being set from session (need `/api/users/me` endpoint or pass via server component)

### Key Decisions
- Position source: Trucky App API (`api.truckyapp.com`) — no TruckersMP Map API approval needed
- ATS only (no ETS2), all members always visible (no privacy toggle)
- Position poll interval: 10s (not 5s) to stay within Trucky rate limits
- Realtime via Supabase `postgres_changes` on `positions` table — no separate broadcast channel

### Failed / Don't Retry
- `next-auth@beta` w/o `--legacy-peer-deps` — peer dep conflict w/ Next 14, use flag

### Hooks & Gotchas
- Leaflet requires dynamic import w/ `ssr: false` — always wrap in `next/dynamic`
- Leaflet default icon path breaks in Next.js — must delete `_getIconUrl` and merge icon options manually
- ATS map tiles: `https://hub.truckyapp.com/maps/ats/{z}/{x}/{y}.png` — verify CORS/terms before prod
- NextAuth v5 (beta): uses `auth()` not `getServerSession()`, exports from single `src/lib/auth.ts`
- `createServiceClient()` (service role) bypasses RLS — use for API routes; `createClient()` (anon) for browser
- Supabase `upsert` on `positions` uses `onConflict: 'convoy_id,user_id'` — composite unique constraint required

### Load-Bearing Invariants
- `supabase_realtime` publication must include `positions` table — run `ALTER PUBLICATION supabase_realtime ADD TABLE positions` in Supabase SQL editor
- RLS on `users` table uses `auth.uid()` — requires Supabase JWT sync w/ `SUPABASE_JWT_SECRET`; without this, RLS will block all reads. Service role bypasses this for API routes.

### Next Steps
1. Create Supabase project at supabase.com, run `supabase/migrations/001_initial.sql` in SQL editor
2. Fill in `.env.local` (Supabase URL, anon key, service role key, JWT secret)
3. Create Discord app at discord.com/developers, add redirect URI, fill `DISCORD_CLIENT_ID` + `DISCORD_CLIENT_SECRET`
4. Generate `AUTH_SECRET`: `openssl rand -base64 32`
5. Fix manage page `myRole` — add `/api/users/me` returning `{ supabaseUserId, role }` for a given convoy, or fetch from members list
6. Add TruckersMP ID field to user profile settings page so members can self-report position
7. Test full flow: sign in → create convoy → generate invite → join via invite → position appears on map
8. Deploy to Vercel (env vars → settings, update `NEXTAUTH_URL`)

### Files Modified
- `projects/ats-convoy/` — entire scaffold (new project)
- Key files: `src/lib/auth.ts`, `src/lib/roles.ts`, `src/lib/trucky.ts`, `src/lib/supabase/`
- API: `src/app/api/convoys/`, `src/app/api/trucky/`, `src/app/api/auth/`
- UI: `src/app/(app)/`, `src/app/(auth)/`, `src/components/`
- DB: `supabase/migrations/001_initial.sql`

---

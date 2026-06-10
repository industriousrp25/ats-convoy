-- Users (synced from Discord via NextAuth)
create table users (
  id uuid primary key default gen_random_uuid(),
  discord_id text unique not null,
  username text not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- Convoys
create table convoys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid references users(id) on delete cascade,
  server text,
  departure_time timestamptz,
  status text check (status in ('draft','active','completed','cancelled')) default 'draft',
  created_at timestamptz default now()
);

-- Invite links
create table invites (
  id uuid primary key default gen_random_uuid(),
  convoy_id uuid references convoys(id) on delete cascade,
  token text unique not null default encode(gen_random_bytes(16), 'hex'),
  created_by uuid references users(id),
  expires_at timestamptz,
  max_uses int,
  use_count int default 0,
  created_at timestamptz default now()
);

-- Convoy members
create table convoy_members (
  id uuid primary key default gen_random_uuid(),
  convoy_id uuid references convoys(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role text check (role in ('owner','admin','mod','member')) default 'member',
  truckersmp_id text,
  joined_at timestamptz default now(),
  unique(convoy_id, user_id)
);

-- Live positions (upserted every ~10s per member)
create table positions (
  id uuid primary key default gen_random_uuid(),
  convoy_id uuid references convoys(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  truckersmp_id text,
  x float8,
  y float8,
  heading float4,
  speed float4,
  updated_at timestamptz default now(),
  unique(convoy_id, user_id)
);

-- RLS
alter table convoys enable row level security;
alter table convoy_members enable row level security;
alter table positions enable row level security;
alter table invites enable row level security;
alter table users enable row level security;

-- Users: read own row
create policy "read own user" on users for select using (id = auth.uid());
create policy "insert own user" on users for insert with check (id = auth.uid());
create policy "update own user" on users for update using (id = auth.uid());

-- Convoys: visible to members only
create policy "members read convoy" on convoys for select using (
  exists (select 1 from convoy_members where convoy_id = convoys.id and user_id = auth.uid())
);
create policy "members insert convoy" on convoys for insert with check (owner_id = auth.uid());
create policy "admin update convoy" on convoys for update using (
  exists (
    select 1 from convoy_members
    where convoy_id = convoys.id and user_id = auth.uid() and role in ('owner','admin')
  )
);
create policy "owner delete convoy" on convoys for delete using (owner_id = auth.uid());

-- convoy_members: members see their convoy's roster
create policy "members read roster" on convoy_members for select using (
  exists (select 1 from convoy_members cm2 where cm2.convoy_id = convoy_members.convoy_id and cm2.user_id = auth.uid())
);

-- Positions: convoy members only
create policy "members read positions" on positions for select using (
  exists (select 1 from convoy_members where convoy_id = positions.convoy_id and user_id = auth.uid())
);
create policy "self upsert position" on positions for all using (user_id = auth.uid());

-- Invites: convoy members can read; admins can insert
create policy "members read invites" on invites for select using (
  exists (select 1 from convoy_members where convoy_id = invites.convoy_id and user_id = auth.uid())
);
create policy "admin create invite" on invites for insert with check (
  exists (
    select 1 from convoy_members
    where convoy_id = invites.convoy_id and user_id = auth.uid() and role in ('owner','admin','mod')
  )
);

-- Enable realtime on positions table
alter publication supabase_realtime add table positions;

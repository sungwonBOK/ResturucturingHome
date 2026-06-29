-- 초기 마이그레이션: rooms 및 recommendations 테이블 생성

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  floor_plan jsonb,
  scan_image_url text,
  created_at timestamptz default now()
);

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade not null,
  style text not null,
  layouts jsonb,
  created_at timestamptz default now()
);

-- RLS 활성화
alter table public.rooms enable row level security;
alter table public.recommendations enable row level security;

-- 기본 정책: 본인 데이터만 접근
create policy "rooms: own data" on public.rooms
  for all using (auth.uid() = user_id);

create policy "recommendations: via own room" on public.recommendations
  for all using (
    exists (
      select 1 from public.rooms
      where rooms.id = recommendations.room_id
      and rooms.user_id = auth.uid()
    )
  );

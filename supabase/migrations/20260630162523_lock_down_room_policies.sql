-- Restrict public Data API access and make ownership checks explicit.

revoke all on table public.rooms from anon;
revoke all on table public.recommendations from anon;
revoke all on table public.rooms from authenticated;
revoke all on table public.recommendations from authenticated;

grant select, insert, update, delete on table public.rooms to authenticated;
grant select, insert, update, delete on table public.recommendations to authenticated;

drop policy if exists "rooms: own data" on public.rooms;

create policy "rooms: select own data" on public.rooms
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "rooms: insert own data" on public.rooms
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "rooms: update own data" on public.rooms
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "rooms: delete own data" on public.rooms
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "recommendations: via own room" on public.recommendations;

create policy "recommendations: select via own room" on public.recommendations
  for select
  to authenticated
  using (
    exists (
      select 1 from public.rooms
      where rooms.id = recommendations.room_id
      and rooms.user_id = (select auth.uid())
    )
  );

create policy "recommendations: insert via own room" on public.recommendations
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.rooms
      where rooms.id = recommendations.room_id
      and rooms.user_id = (select auth.uid())
    )
  );

create policy "recommendations: update via own room" on public.recommendations
  for update
  to authenticated
  using (
    exists (
      select 1 from public.rooms
      where rooms.id = recommendations.room_id
      and rooms.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.rooms
      where rooms.id = recommendations.room_id
      and rooms.user_id = (select auth.uid())
    )
  );

create policy "recommendations: delete via own room" on public.recommendations
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.rooms
      where rooms.id = recommendations.room_id
      and rooms.user_id = (select auth.uid())
    )
  );

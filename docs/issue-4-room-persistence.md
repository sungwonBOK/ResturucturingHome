# Issue #4 Room Persistence Progress

## Scope
- Persist `RoomFloorPlan` JSON through the existing Supabase `rooms.floor_plan` JSONB column.
- Attach saved rows to the authenticated user through `rooms.user_id`.
- Let the room editor save the current mock floor plan and load the saved record back.

## Implemented
- Added `apps/mobile/src/services/roomPersistenceCore.ts` with testable save/load logic.
- Added `apps/mobile/src/services/roomPersistence.ts` for the production Supabase client instance.
- Added `apps/mobile/src/services/roomPersistence.test.ts` focused assertions for insert payload, load mapping, and dev/mock in-memory persistence.
- Added `apps/mobile/src/features/room-editor/RoomPersistencePanel.tsx`.
- Connected the panel in `apps/mobile/app/(main)/room-editor.tsx`.
- Added a development-only mock persistence path so local dev admin sessions do not call Supabase without a real Auth session.
- Added the Supabase React Native runtime setup: URL polyfill, AsyncStorage-backed auth session persistence, auth `processLock`, and native AppState auto-refresh handling.
- Added `20260630162523_lock_down_room_policies.sql` to revoke anon table access, remove `TRUNCATE`/trigger/reference grants from client roles, and replace broad `public` RLS policies with explicit `to authenticated` ownership policies.

## Verification
- Focused room persistence test compile/run passes.
- Focused Supabase React Native runtime config test compile/run passes.
- Focused Supabase schema config test compile/run passes.
- Mobile TypeScript check passes.
- Domain TypeScript check passes.
- Expo dependency check passes.

## Remaining Before Closing GitHub Issue #4
- Run the save/load round-trip from an authenticated iOS or Android session.
- Re-test iPhone Supabase Auth now that the linked project `rwojodlsrhklnjweevfm` has been restored to `ACTIVE_HEALTHY`.
- Direct checks now show the API host resolves, Auth settings returns `200`, and email auth is enabled.
- Supabase Auth/API logs show successful `/auth/v1/settings` and `/rest/v1/rooms` requests after restore.
- Non-mutating invalid auth checks now reach Supabase Auth without producing `Network request failed`: password login returns/logs `/auth/v1/token` with `400 invalid_credentials`, and invalid email signup returns/logs `/auth/v1/signup` with `400 validation_failed`.
- Anon REST access to `rooms` now returns `401` after the policy/grant migration, while authenticated DML grants remain scoped by ownership RLS policies.
- Remote rollback verification with an authenticated Postgres role and JWT claim can insert/select the user's own room (`own_visible_count=1`) and cannot see it as another user (`other_visible_count=0`); rollback cleanup left both auth user and room counts at `0`.
- A real public signup test is currently rate-limited by Supabase email sending (`429 over_email_send_rate_limit`), and a manually inserted Auth row was not used as proof because password login returned `invalid_credentials`; cleanup left test user, identity, and room counts at `0`.
- Replaced direct Expo SecureStore session persistence with the official React Native AsyncStorage pattern. Supabase's docs warn that Expo SecureStore does not support values larger than 2048 bytes, so storing the whole Auth session directly there can fail on device.
- If iPhone Auth still fails after the React Native runtime setup, capture fresh device-side logs before adding further client code.

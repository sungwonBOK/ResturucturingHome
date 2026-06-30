# Issue #4 Room Persistence Progress

## Scope
- Persist `RoomFloorPlan` JSON through the existing Supabase `rooms.floor_plan` JSONB column.
- Attach saved rows to the authenticated user through `rooms.user_id`.
- Let the room editor save the current mock floor plan and load the saved record back.

## Implemented
- Added `apps/mobile/src/services/roomPersistenceCore.ts` with testable save/load logic.
- Added `apps/mobile/src/services/roomPersistence.ts` for the production Supabase client instance.
- Added `apps/mobile/src/services/roomPersistence.test.ts` focused assertions for insert payload and load mapping.
- Added `apps/mobile/src/features/room-editor/RoomPersistencePanel.tsx`.
- Connected the panel in `apps/mobile/app/(main)/room-editor.tsx`.

## Verification
- Focused room persistence test compile/run passes.
- Mobile TypeScript check passes.
- Domain TypeScript check passes.
- Expo dependency check passes.

## Remaining Before Closing GitHub Issue #4
- Run the save/load round-trip from an authenticated iOS or Android session.
- If Supabase rejects insert/update under RLS, add a proper migration with explicit `TO authenticated`, `USING`, and `WITH CHECK` policies using the Supabase CLI when it is available.

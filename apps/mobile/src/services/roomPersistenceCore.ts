import type { RoomFloorPlan } from '@restructuring-home/domain';

interface PersistenceError {
  message: string;
}

interface RoomRow {
  id: string;
  name: string;
  floor_plan: unknown;
  created_at: string;
}

interface RoomInsert {
  user_id: string;
  name: string;
  floor_plan: RoomFloorPlan;
}

interface SingleRoomQuery {
  single: () => Promise<{ data: RoomRow | null; error: PersistenceError | null }>;
}

interface RoomSelectQuery {
  eq: (column: 'id', value: string) => SingleRoomQuery;
}

interface RoomInsertQuery {
  select: (columns?: string) => SingleRoomQuery;
}

interface RoomTable {
  insert: (rows: RoomInsert[]) => RoomInsertQuery;
  select: (columns: string) => RoomSelectQuery;
}

export interface RoomPersistenceClient {
  auth: {
    getUser: () => Promise<{
      data: { user: { id: string } | null };
      error: PersistenceError | null;
    }>;
  };
  from: (tableName: 'rooms') => RoomTable;
}

export interface SavedRoom {
  id: string;
  name: string;
  floorPlan: RoomFloorPlan;
  createdAt: string;
}

export interface SaveRoomFloorPlanInput {
  name: string;
  floorPlan: RoomFloorPlan;
}

export function createRoomPersistence(client: RoomPersistenceClient) {
  return {
    async saveRoomFloorPlan(input: SaveRoomFloorPlanInput): Promise<SavedRoom> {
      const userResult = await client.auth.getUser();

      if (userResult.error) {
        throw new Error(userResult.error.message);
      }

      const userId = userResult.data.user?.id;

      if (!userId) {
        throw new Error('Cannot save a room without an authenticated user.');
      }

      const result = await client
        .from('rooms')
        .insert([
          {
            user_id: userId,
            name: input.name,
            floor_plan: input.floorPlan,
          },
        ])
        .select('id,name,floor_plan,created_at')
        .single();

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (!result.data) {
        throw new Error('Supabase returned no room after save.');
      }

      return toSavedRoom(result.data);
    },

    async loadRoomFloorPlan(roomId: string): Promise<SavedRoom> {
      const result = await client
        .from('rooms')
        .select('id,name,floor_plan,created_at')
        .eq('id', roomId)
        .single();

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (!result.data) {
        throw new Error('Supabase returned no room.');
      }

      return toSavedRoom(result.data);
    },
  };
}

function toSavedRoom(row: RoomRow): SavedRoom {
  return {
    id: row.id,
    name: row.name,
    floorPlan: row.floor_plan as RoomFloorPlan,
    createdAt: row.created_at,
  };
}

import { supabase } from './supabase';
import {
  createMemoryRoomPersistence,
  createRoomPersistence,
  type RoomPersistence,
  type RoomPersistenceClient,
  type SavedRoom,
  type SaveRoomFloorPlanInput,
} from './roomPersistenceCore';

export { createMemoryRoomPersistence, createRoomPersistence };
export type { RoomPersistence, RoomPersistenceClient, SavedRoom, SaveRoomFloorPlanInput };

export const roomPersistence = createRoomPersistence(supabase as unknown as RoomPersistenceClient);
export const devRoomPersistence = createMemoryRoomPersistence();

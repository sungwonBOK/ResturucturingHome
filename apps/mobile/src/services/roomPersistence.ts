import { supabase } from './supabase';
import {
  createRoomPersistence,
  type RoomPersistenceClient,
  type SavedRoom,
  type SaveRoomFloorPlanInput,
} from './roomPersistenceCore';

export { createRoomPersistence };
export type { RoomPersistenceClient, SavedRoom, SaveRoomFloorPlanInput };

export const roomPersistence = createRoomPersistence(supabase as unknown as RoomPersistenceClient);

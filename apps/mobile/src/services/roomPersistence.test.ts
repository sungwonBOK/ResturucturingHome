import { mockStudioFloorPlan } from '../mocks/mockRoomFloorPlan';
import {
  createMemoryRoomPersistence,
  createRoomPersistence,
  type RoomPersistenceClient,
} from './roomPersistenceCore';

const insertedRows: unknown[] = [];

const client: RoomPersistenceClient = {
  auth: {
    getUser: async () => ({
      data: { user: { id: 'user-123' } },
      error: null,
    }),
  },
  from: (tableName) => {
    if (tableName !== 'rooms') {
      throw new Error(`unexpected table: ${tableName}`);
    }

    return {
      insert: (rows) => {
        insertedRows.push(...rows);

        return {
          select: () => ({
            single: async () => ({
              data: {
                id: 'room-123',
                name: rows[0].name,
                floor_plan: rows[0].floor_plan,
                created_at: '2026-06-30T11:30:00.000Z',
              },
              error: null,
            }),
          }),
        };
      },
      select: () => ({
        eq: (column, value) => {
          if (column !== 'id' || value !== 'room-123') {
            throw new Error(`unexpected filter: ${column}=${value}`);
          }

          return {
            single: async () => ({
              data: {
                id: 'room-123',
                name: '테스트 원룸',
                floor_plan: mockStudioFloorPlan,
                created_at: '2026-06-30T11:30:00.000Z',
              },
              error: null,
            }),
          };
        },
      }),
    };
  },
};

const persistence = createRoomPersistence(client);

async function run() {
  const savedRoom = await persistence.saveRoomFloorPlan({
    name: '테스트 원룸',
    floorPlan: mockStudioFloorPlan,
  });

  assertEqual(savedRoom.id, 'room-123', 'saved room id');
  assertEqual(savedRoom.name, '테스트 원룸', 'saved room name');
  assertEqual(savedRoom.floorPlan.width, mockStudioFloorPlan.width, 'saved floor plan width');
  assertEqual(insertedRows.length, 1, 'inserted row count');
  assertEqual((insertedRows[0] as { user_id: string }).user_id, 'user-123', 'insert user id');

  const loadedRoom = await persistence.loadRoomFloorPlan('room-123');

  assertEqual(loadedRoom.id, 'room-123', 'loaded room id');
  assertEqual(loadedRoom.floorPlan.height, mockStudioFloorPlan.height, 'loaded floor plan height');

  const memoryPersistence = createMemoryRoomPersistence({
    now: () => '2026-07-01T00:25:00.000Z',
  });

  const devSavedRoom = await memoryPersistence.saveRoomFloorPlan({
    name: 'Dev mock room',
    floorPlan: mockStudioFloorPlan,
  });

  assertEqual(devSavedRoom.id, 'mock-room-1', 'dev saved room id');
  assertEqual(devSavedRoom.name, 'Dev mock room', 'dev saved room name');
  assertEqual(devSavedRoom.createdAt, '2026-07-01T00:25:00.000Z', 'dev saved room timestamp');

  const devLoadedRoom = await memoryPersistence.loadRoomFloorPlan(devSavedRoom.id);

  assertEqual(devLoadedRoom.id, devSavedRoom.id, 'dev loaded room id');
  assertEqual(devLoadedRoom.floorPlan.width, mockStudioFloorPlan.width, 'dev loaded floor plan width');
}

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

void run();

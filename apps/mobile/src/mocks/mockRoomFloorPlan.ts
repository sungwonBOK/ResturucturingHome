import type { RoomFloorPlan } from '@restructuring-home/domain';

export const mockStudioFloorPlan = {
  width: 360,
  height: 480,
  walls: [
    { id: 'wall-north', x1: 0, y1: 0, x2: 360, y2: 0, thickness: 10 },
    { id: 'wall-east', x1: 360, y1: 0, x2: 360, y2: 480, thickness: 10 },
    { id: 'wall-south', x1: 360, y1: 480, x2: 0, y2: 480, thickness: 10 },
    { id: 'wall-west', x1: 0, y1: 480, x2: 0, y2: 0, thickness: 10 },
  ],
  doors: [
    { id: 'door-entry', wallId: 'wall-south', x: 140, y: 480, width: 80 },
  ],
  windows: [
    { id: 'window-main', wallId: 'wall-north', x: 72, y: 0, width: 140 },
  ],
  furniture: [
    {
      id: 'bed-main',
      type: 'bed',
      x: 24,
      y: 40,
      width: 150,
      height: 205,
      rotation: 0,
      label: '침대',
    },
    {
      id: 'desk-window',
      type: 'desk',
      x: 220,
      y: 54,
      width: 105,
      height: 58,
      rotation: 0,
      label: '책상',
    },
    {
      id: 'wardrobe-entry',
      type: 'wardrobe',
      x: 244,
      y: 300,
      width: 82,
      height: 132,
      rotation: 0,
      label: '옷장',
    },
  ],
} satisfies RoomFloorPlan;

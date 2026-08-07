export type RoomStyle = 'minimal' | 'nordic' | 'modern' | 'vintage';

export type FurnitureType =
  | 'sofa'
  | 'bed'
  | 'desk'
  | 'wardrobe'
  | 'dining_table'
  | 'chair'
  | 'bookshelf'
  | 'tv_stand'
  | 'other';

export interface RecommendationRequest {
  floorPlan: RoomFloorPlan;
  style: RoomStyle;
  screenshotUrl?: string;
}

export interface RoomFloorPlan {
  width: number;
  height: number;
  walls: Wall[];
  doors: Opening[];
  windows: Opening[];
  furniture: FurnitureItem[];
}

export interface Wall {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
}

export interface Opening {
  id: string;
  wallId: string;
  x: number;
  y: number;
  width: number;
}

export interface FurnitureItem {
  id: string;
  type: FurnitureType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  label?: string;
}

export interface RecommendationLayout {
  id: string;
  style: RoomStyle;
  furniture: FurnitureItem[];
  reason: string;
}

export class RecommendationContractError extends Error {}

const roomStyles: RoomStyle[] = ['minimal', 'nordic', 'modern', 'vintage'];
const furnitureTypes: FurnitureType[] = [
  'sofa',
  'bed',
  'desk',
  'wardrobe',
  'dining_table',
  'chair',
  'bookshelf',
  'tv_stand',
  'other',
];

export function parseRecommendationRequest(value: unknown): RecommendationRequest {
  const record = expectRecord(value, 'request');
  const floorPlan = parseRoomFloorPlan(record.floorPlan);
  const style = parseRoomStyle(record.style);
  const screenshotUrl = parseScreenshotUrl(record.screenshotUrl);

  return screenshotUrl ? { floorPlan, style, screenshotUrl } : { floorPlan, style };
}

export function parseRecommendationLayouts(value: unknown, selectedStyle: RoomStyle): RecommendationLayout[] {
  const record = expectRecord(value, 'recommendation response');
  const recommendations = expectArray(record.recommendations, 'recommendations');

  if (recommendations.length !== 3) {
    throw new RecommendationContractError('AI 응답은 정확히 3개의 추천을 포함해야 합니다.');
  }

  return recommendations.map((layout, index) => parseRecommendationLayout(layout, selectedStyle, index));
}

function parseRoomFloorPlan(value: unknown): RoomFloorPlan {
  const record = expectRecord(value, 'floorPlan');

  return {
    width: expectPositiveNumber(record.width, 'floorPlan.width'),
    height: expectPositiveNumber(record.height, 'floorPlan.height'),
    walls: expectArray(record.walls, 'floorPlan.walls').map(parseWall),
    doors: expectArray(record.doors, 'floorPlan.doors').map(parseOpening),
    windows: expectArray(record.windows, 'floorPlan.windows').map(parseOpening),
    furniture: expectArray(record.furniture, 'floorPlan.furniture').map(parseFurniture),
  };
}

function parseRecommendationLayout(value: unknown, selectedStyle: RoomStyle, index: number): RecommendationLayout {
  const record = expectRecord(value, `recommendations[${index}]`);
  const style = parseRoomStyle(record.style);

  if (style !== selectedStyle) {
    throw new RecommendationContractError('AI 응답의 스타일이 요청한 스타일과 다릅니다.');
  }

  return {
    id: expectNonEmptyString(record.id, `recommendations[${index}].id`),
    style,
    reason: expectNonEmptyString(record.reason, `recommendations[${index}].reason`),
    furniture: expectArray(record.furniture, `recommendations[${index}].furniture`).map(parseFurniture),
  };
}

function parseWall(value: unknown): Wall {
  const record = expectRecord(value, 'wall');

  return {
    id: expectNonEmptyString(record.id, 'wall.id'),
    x1: expectFiniteNumber(record.x1, 'wall.x1'),
    y1: expectFiniteNumber(record.y1, 'wall.y1'),
    x2: expectFiniteNumber(record.x2, 'wall.x2'),
    y2: expectFiniteNumber(record.y2, 'wall.y2'),
    thickness: expectPositiveNumber(record.thickness, 'wall.thickness'),
  };
}

function parseOpening(value: unknown): Opening {
  const record = expectRecord(value, 'opening');

  return {
    id: expectNonEmptyString(record.id, 'opening.id'),
    wallId: expectNonEmptyString(record.wallId, 'opening.wallId'),
    x: expectFiniteNumber(record.x, 'opening.x'),
    y: expectFiniteNumber(record.y, 'opening.y'),
    width: expectPositiveNumber(record.width, 'opening.width'),
  };
}

function parseFurniture(value: unknown): FurnitureItem {
  const record = expectRecord(value, 'furniture');
  const label = record.label === undefined ? undefined : expectNonEmptyString(record.label, 'furniture.label');

  return {
    id: expectNonEmptyString(record.id, 'furniture.id'),
    type: parseFurnitureType(record.type),
    x: expectFiniteNumber(record.x, 'furniture.x'),
    y: expectFiniteNumber(record.y, 'furniture.y'),
    width: expectPositiveNumber(record.width, 'furniture.width'),
    height: expectPositiveNumber(record.height, 'furniture.height'),
    rotation: expectFiniteNumber(record.rotation, 'furniture.rotation'),
    ...(label ? { label } : {}),
  };
}

function parseRoomStyle(value: unknown): RoomStyle {
  if (typeof value !== 'string' || !roomStyles.includes(value as RoomStyle)) {
    throw new RecommendationContractError('지원하지 않는 스타일입니다.');
  }

  return value as RoomStyle;
}

function parseFurnitureType(value: unknown): FurnitureType {
  if (typeof value !== 'string' || !furnitureTypes.includes(value as FurnitureType)) {
    throw new RecommendationContractError('지원하지 않는 가구 유형입니다.');
  }

  return value as FurnitureType;
}

function parseScreenshotUrl(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new RecommendationContractError('스크린샷 URL은 문자열이어야 합니다.');
  }

  try {
    const url = new URL(value);

    if (url.protocol !== 'https:') {
      throw new RecommendationContractError('스크린샷 URL은 HTTPS여야 합니다.');
    }

    return url.toString();
  } catch (error) {
    if (error instanceof RecommendationContractError) {
      throw error;
    }

    throw new RecommendationContractError('스크린샷 URL 형식이 올바르지 않습니다.');
  }
}

function expectRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new RecommendationContractError(`${label}은(는) 객체여야 합니다.`);
  }

  return value as Record<string, unknown>;
}

function expectArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new RecommendationContractError(`${label}은(는) 배열이어야 합니다.`);
  }

  return value;
}

function expectNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new RecommendationContractError(`${label}은(는) 비어 있을 수 없습니다.`);
  }

  return value;
}

function expectFiniteNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new RecommendationContractError(`${label}은(는) 유한한 숫자여야 합니다.`);
  }

  return value;
}

function expectPositiveNumber(value: unknown, label: string): number {
  const number = expectFiniteNumber(value, label);

  if (number <= 0) {
    throw new RecommendationContractError(`${label}은(는) 0보다 커야 합니다.`);
  }

  return number;
}

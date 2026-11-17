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
  /** 벽 안쪽 면으로 둘러싸인 실제 바닥 다각형(cm). 앱이 계산해 보냅니다. */
  roomInterior?: Point[];
  screenshotUrl?: string;
}

export interface Point {
  x: number;
  y: number;
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
  catalogId?: string;
  use?: {
    role: string;
    front?: 'top' | 'bottom';
    clearanceCm?: number;
    allowsFurnitureOnTop?: boolean;
  };
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
  if (new Set(floorPlan.furniture.map(({ id }) => id)).size !== floorPlan.furniture.length) {
    throw new RecommendationContractError('가구 ID가 중복되었습니다.');
  }
  const style = parseRoomStyle(record.style);
  const screenshotUrl = parseScreenshotUrl(record.screenshotUrl);
  const roomInterior = parseRoomInterior(record.roomInterior);

  return {
    floorPlan,
    style,
    ...(roomInterior ? { roomInterior } : {}),
    ...(screenshotUrl ? { screenshotUrl } : {}),
  };
}

export function parseRecommendationLayouts(value: unknown, request: RecommendationRequest): RecommendationLayout[] {
  const record = expectRecord(value, 'recommendation response');
  const recommendations = expectArray(record.recommendations, 'recommendations');

  if (recommendations.length !== 3) {
    throw new RecommendationContractError('AI 응답은 정확히 3개의 추천을 포함해야 합니다.');
  }

  const originals = new Map(request.floorPlan.furniture.map((item) => [item.id, item]));
  const valid: RecommendationLayout[] = [];
  for (const [index, candidate] of recommendations.entries()) {
    try {
      valid.push(parseRecommendationLayout(candidate, request.style, originals, index));
    } catch (error) {
      if (!(error instanceof RecommendationContractError)) throw error;
      // AI 응답이 형식 검사에서 얼마나, 왜 탈락하는지 함수 로그로 확인합니다.
      console.warn(`[get-recommendations] recommendations[${index}] 탈락: ${error.message}`);
    }
  }
  return valid;
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

function parseRecommendationLayout(
  value: unknown, selectedStyle: RoomStyle, originals: Map<string, FurnitureItem>, index: number,
): RecommendationLayout {
  const record = expectRecord(value, `recommendations[${index}]`);
  const style = parseRoomStyle(record.style);

  if (style !== selectedStyle) {
    throw new RecommendationContractError('AI 응답의 스타일이 요청한 스타일과 다릅니다.');
  }

  const seen = new Set<string>();
  const furniture = expectArray(record.furniture, `recommendations[${index}].furniture`).map((value) => {
    const pose = expectRecord(value, 'furniture pose');
    const id = expectNonEmptyString(pose.id, 'furniture.id');
    const original = originals.get(id);
    if (!original || seen.has(id)) throw new RecommendationContractError('추천 가구 ID가 원본과 일치하지 않습니다.');
    seen.add(id);
    const rotation = expectFiniteNumber(pose.rotation, 'furniture.rotation');
    const { use: _use, ...item } = original;
    // The model returns centers. The app stores unrotated top-left positions.
    return {
      ...item,
      x: expectFiniteNumber(pose.x, 'furniture.x') - item.width / 2,
      y: expectFiniteNumber(pose.y, 'furniture.y') - item.height / 2,
      rotation: ((rotation % 360) + 360) % 360,
    };
  });
  if (seen.size !== originals.size) throw new RecommendationContractError('추천에 원본 가구가 누락되었습니다.');

  return {
    id: expectNonEmptyString(record.id, `recommendations[${index}].id`),
    style,
    reason: expectNonEmptyString(record.reason, `recommendations[${index}].reason`),
    furniture,
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
  const catalogId = record.catalogId === undefined ? undefined : expectNonEmptyString(record.catalogId, 'furniture.catalogId');
  const use = record.use === undefined ? undefined : parseFurnitureUse(record.use);

  return {
    id: expectNonEmptyString(record.id, 'furniture.id'),
    type: parseFurnitureType(record.type),
    x: expectFiniteNumber(record.x, 'furniture.x'),
    y: expectFiniteNumber(record.y, 'furniture.y'),
    width: expectPositiveNumber(record.width, 'furniture.width'),
    height: expectPositiveNumber(record.height, 'furniture.height'),
    rotation: expectFiniteNumber(record.rotation, 'furniture.rotation'),
    ...(label ? { label } : {}),
    ...(catalogId ? { catalogId } : {}),
    ...(use ? { use } : {}),
  };
}

function parseFurnitureUse(value: unknown): NonNullable<FurnitureItem['use']> {
  const record = expectRecord(value, 'furniture.use');
  const use: NonNullable<FurnitureItem['use']> = { role: expectNonEmptyString(record.role, 'furniture.use.role') };
  if (record.front !== undefined) {
    if (record.front !== 'top' && record.front !== 'bottom') throw new RecommendationContractError('지원하지 않는 가구 앞면 방향입니다.');
    use.front = record.front;
  }
  if (record.clearanceCm !== undefined) {
    if (!use.front) throw new RecommendationContractError('가구 사용 공간에는 앞면 방향이 필요합니다.');
    use.clearanceCm = expectPositiveNumber(record.clearanceCm, 'furniture.use.clearanceCm');
  }
  if (record.allowsFurnitureOnTop !== undefined) {
    if (typeof record.allowsFurnitureOnTop !== 'boolean') throw new RecommendationContractError('가구의 바닥 공유 값은 참 또는 거짓이어야 합니다.');
    use.allowsFurnitureOnTop = record.allowsFurnitureOnTop;
  }
  return use;
}

function parseRoomInterior(value: unknown): Point[] | undefined {
  if (value === undefined) return undefined;

  const points = expectArray(value, 'roomInterior').map((point) => {
    const record = expectRecord(point, 'roomInterior point');
    return { x: expectFiniteNumber(record.x, 'roomInterior.x'), y: expectFiniteNumber(record.y, 'roomInterior.y') };
  });
  if (points.length < 3) {
    throw new RecommendationContractError('방 바닥 다각형에는 꼭짓점이 세 개 이상 필요합니다.');
  }
  return points;
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

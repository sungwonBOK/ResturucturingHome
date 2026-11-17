import type { RoomStyle } from '@restructuring-home/domain';

export const recommendationStyles: ReadonlyArray<{ value: RoomStyle; label: string; description: string }> = [
  { value: 'minimal', label: '넓게 쓰는 배치', description: '이동하기 편하도록 넓게 이어지는 빈 공간을 확보해요.' },
  { value: 'modern', label: '용도별 배치', description: '작업, 수면, 휴식 등 생활 용도에 따라 가구를 모아요.' },
  { value: 'nordic', label: '아늑한 배치', description: '소파나 침대가 있다면 오가는 길에서 비켜난 휴식 자리를 찾아요.' },
];

export interface SnapCandidate {
  value: number;
  guide: number;
}

export interface SnapLocks {
  x?: SnapCandidate;
  y?: SnapCandidate;
}

export const SNAP_CAPTURE_DISTANCE = 7;
export const SNAP_RELEASE_DISTANCE = 12;

export function getMagneticSnap(
  value: number,
  candidates: readonly SnapCandidate[],
  lock: SnapCandidate | undefined,
  capture: number,
  release: number,
): SnapCandidate | undefined {
  if (lock && Math.abs(value - lock.value) <= release) {
    return lock;
  }

  let nearest: SnapCandidate | undefined;
  let distance = capture;
  for (const candidate of candidates) {
    const delta = Math.abs(value - candidate.value);
    if (delta <= capture && (!nearest || delta < distance)) {
      nearest = candidate;
      distance = delta;
    }
  }
  return nearest;
}

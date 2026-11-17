import { Group, LinearGradient, Oval, Path, RoundedRect, vec } from '@shopify/react-native-skia';
import type { ReactNode } from 'react';
import { colors } from '../../../theme/colors';
import type { FurnitureDetail, FurnitureOutline, FurniturePreset } from '../catalog/furnitureCatalog';
import { furnitureMaterials } from '../catalog/furnitureMaterials';

type DrawingBounds = Pick<FurnitureDetail, 'x' | 'y' | 'width' | 'height'>;

interface FurnitureDrawingProps extends DrawingBounds {
  preset?: FurniturePreset;
  selected?: boolean;
  /** 벽 안쪽 바닥을 벗어난 가구를 빨간 테두리로 표시합니다. */
  outsideRoom?: boolean;
}

const defaultOutline = { kind: 'rectangle' } as const;

export function FurnitureDrawing({ x, y, width, height, preset, selected, outsideRoom }: FurnitureDrawingProps) {
  const bounds = { x, y, width, height };
  const outline = preset?.outline ?? defaultOutline;
  const material = furnitureMaterials[preset?.material ?? 'slateMetal'];
  const relief = Math.min(width, height) * (preset?.allowsFurnitureOnTop ? 0.035 : 0.085);
  const depth = Math.min(relief, 5);
  const top = { ...bounds, height: height - depth };
  const strokeWidth = selected ? 1.8 : Math.min(0.8, width * 0.04, height * 0.04);

  return (
    <Group>
      <FurnitureSilhouette bounds={bounds} outline={outline} color={material.edge} />
      <FurnitureSilhouette bounds={top} outline={outline}>
        <LinearGradient
          start={vec(x, y)}
          end={vec(x + width * 0.46, y + top.height)}
          colors={[material.top, material.bottom]}
        />
      </FurnitureSilhouette>
      <FurnitureSilhouette bounds={top} outline={outline} color={material.outline} strokeWidth={strokeWidth} />
      {preset?.details.map((part, index) => {
        const partBounds = {
          x: x + part.x * width,
          y: y + part.y * top.height,
          width: part.width * width,
          height: part.height * top.height,
        };
        const partColor = material[part.finish ?? 'cushion'];
        return (
          <FurniturePart
            key={index}
            bounds={partBounds}
            color={partColor}
            edge={material.edge}
            oval={part.shape === 'oval'}
          />
        );
      })}
      {selected ? (
        <FurnitureSilhouette bounds={bounds} outline={outline} color={colors.primary} strokeWidth={strokeWidth} />
      ) : null}
      {outsideRoom ? (
        <FurnitureSilhouette bounds={bounds} outline={outline} color={colors.error} strokeWidth={2.2} />
      ) : null}
    </Group>
  );
}

function FurniturePart({ bounds, color, edge, oval }: {
  bounds: DrawingBounds;
  color: string;
  edge: string;
  oval: boolean;
}) {
  const outline = oval ? { kind: 'circle' } as const : defaultOutline;
  const strokeWidth = Math.min(0.55, bounds.width * 0.07, bounds.height * 0.07);
  return (
    <>
      <FurnitureSilhouette bounds={bounds} outline={outline} color={color} />
      <FurnitureSilhouette bounds={bounds} outline={outline} color={edge} strokeWidth={strokeWidth} />
    </>
  );
}

function FurnitureSilhouette({ bounds, outline, color, strokeWidth, children }: {
  bounds: DrawingBounds;
  outline: FurnitureOutline;
  color?: string;
  strokeWidth?: number;
  children?: ReactNode;
}) {
  const paint = { color, style: strokeWidth === undefined ? 'fill' as const : 'stroke' as const, strokeWidth };
  if (outline.kind === 'polygon') {
    const path = outline.points.map(({ x, y }, index) =>
      `${index === 0 ? 'M' : 'L'} ${bounds.x + x * bounds.width} ${bounds.y + y * bounds.height}`,
    ).join(' ') + ' Z';
    return <Path {...paint} path={path} strokeJoin="round">{children}</Path>;
  }

  if (outline.kind === 'circle') {
    return <Oval {...bounds} {...paint}>{children}</Oval>;
  }

  const radius = Math.min(6, bounds.width * 0.09, bounds.height * 0.09);
  return <RoundedRect {...bounds} {...paint} r={radius}>{children}</RoundedRect>;
}

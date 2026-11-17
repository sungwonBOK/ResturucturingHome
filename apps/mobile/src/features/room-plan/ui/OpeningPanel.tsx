import type { RoomFloorPlan } from '@restructuring-home/domain';
import { useState } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../theme/colors';
import {
  addOpening,
  findOpening,
  getWallLength,
  removeOpening,
  setOpeningWidth,
  type OpeningKind,
  type PlanTarget,
} from '../model/openingEditing';

interface OpeningPanelProps {
  plan: RoomFloorPlan;
  selection?: PlanTarget;
  onSelect: (selection: PlanTarget | undefined) => void;
  onPlanChange: (plan: RoomFloorPlan) => void;
}

// 선택한 벽에 문·창을 추가하거나, 선택한 문·창의 폭을 바꾸고 지웁니다.
export function OpeningPanel({ plan, selection, onSelect, onPlanChange }: OpeningPanelProps) {
  const [error, setError] = useState<string>();
  const wallIndex = selection?.kind === 'wall' ? plan.walls.findIndex(({ id }) => id === selection.id) : -1;
  const opening = selection?.kind === 'opening' ? findOpening(plan, selection.id) : undefined;

  const run = (action: () => void) => {
    try {
      action();
      setError(undefined);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '문·창을 수정하지 못했어요.');
    }
  };

  const add = (kind: OpeningKind) => run(() => {
    const next = addOpening(plan, kind, plan.walls[wallIndex].id);
    const added = (kind === 'door' ? next.doors : next.windows).at(-1);
    onPlanChange(next);
    if (added) onSelect({ kind: 'opening', id: added.id });
  });

  if (wallIndex >= 0) {
    return (
      <View style={styles.panel}>
        <Text style={styles.title}>벽 {wallIndex + 1} · {Math.round(getWallLength(plan.walls[wallIndex]))}cm</Text>
        <View style={styles.row}>
          <PanelButton label="+ 문 추가" onPress={() => add('door')} />
          <PanelButton label="+ 창 추가" onPress={() => add('window')} />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  if (opening) {
    const isDoor = plan.doors.some(({ id }) => id === opening.id);
    return (
      <View style={styles.panel}>
        <Text style={styles.title}>{isDoor ? '문' : '창'} · 벽을 따라 드래그해 옮길 수 있어요</Text>
        <WidthInput
          key={`${opening.id}-${opening.width}`}
          width={opening.width}
          onCommit={(width) => run(() => onPlanChange(setOpeningWidth(plan, opening.id, width)))}
        />
        <PanelButton label="삭제" danger onPress={() => {
          onPlanChange(removeOpening(plan, opening.id));
          onSelect(undefined);
          setError(undefined);
        }} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  return <Text style={styles.hint}>벽을 눌러 문·창을 추가하고, 문(초록)·창(보라)을 눌러 폭을 바꾸거나 드래그해 옮기세요.</Text>;
}

function WidthInput({ width, onCommit }: { width: number; onCommit: (width: number) => void }) {
  const [text, setText] = useState(String(Math.round(width)));
  return (
    <View style={styles.row}>
      <Text style={styles.label}>폭 (cm)</Text>
      <TextInput
        accessibilityLabel="문·창 폭 센티미터"
        value={text}
        onChangeText={setText}
        keyboardType="number-pad"
        style={styles.input}
      />
      <PanelButton label="적용" onPress={() => {
        Keyboard.dismiss();
        onCommit(Number(text));
      }} />
    </View>
  );
}

function PanelButton({ label, danger, onPress }: { label: string; danger?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity accessibilityRole="button" activeOpacity={0.85} onPress={onPress} style={[styles.button, danger ? styles.danger : null]}>
      <Text style={[styles.buttonText, danger ? styles.dangerText : null]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  panel: { gap: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg, padding: 12 },
  title: { color: colors.textPrimary, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  label: { color: colors.textSecondary, fontFamily: 'Inter_500Medium', fontSize: 12 },
  input: { flex: 1, color: colors.textPrimary, backgroundColor: colors.bgCard, borderColor: colors.border, borderRadius: 10, borderWidth: 1, minHeight: 40, paddingHorizontal: 12 },
  button: { alignItems: 'center', backgroundColor: colors.primaryDim, borderRadius: 10, flexGrow: 1, paddingHorizontal: 12, paddingVertical: 10 },
  buttonText: { color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  danger: { backgroundColor: 'transparent', borderColor: colors.error, borderWidth: 1 },
  dangerText: { color: colors.error },
  hint: { color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  error: { color: colors.error, fontFamily: 'Inter_500Medium', fontSize: 12 },
});

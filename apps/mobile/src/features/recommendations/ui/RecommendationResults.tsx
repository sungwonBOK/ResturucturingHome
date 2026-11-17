import type { RecommendationSessionEntry } from '../model/recommendationSession';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FloorPlanPreview } from '../../room-editor/FloorPlanPreview';
import { colors } from '../../../theme/colors';
import { recommendationStyles } from '../model/recommendationStyles';

interface RecommendationResultsProps {
  entry: RecommendationSessionEntry;
  onApply: () => void;
}

export function RecommendationResults({ entry, onApply }: RecommendationResultsProps) {
  const styleLabel = recommendationStyles.find((style) => style.value === entry.style)?.label ?? entry.style;
  const recommendation = entry.recommendation;

  if (!recommendation) {
    return null;
  }
  const title = recommendation.source === 'current' ? '현재 배치'
    : recommendation.source === 'adjusted' ? '공간을 확보한 보정 배치' : styleLabel;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.option}>{title}</Text>
        <Text style={styles.reason}>{recommendation.reason}</Text>
        <FloorPlanPreview plan={{ ...entry.plan, furniture: recommendation.furniture }} />
        {recommendation.source === 'current' ? null : (
          <TouchableOpacity accessibilityRole="button" activeOpacity={0.85} onPress={onApply} style={styles.apply}>
            <Text style={styles.applyLabel}>이 배치를 내 도면에 적용하기</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  card: { backgroundColor: colors.bgCard, borderColor: colors.border, borderRadius: 16, borderWidth: 1, gap: 10, padding: 14 },
  option: { color: colors.gradientEnd, fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.8 },
  apply: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 13 },
  applyLabel: { color: colors.textPrimary, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  reason: { color: colors.textPrimary, fontFamily: 'Inter_600SemiBold', fontSize: 14, lineHeight: 21 },
});

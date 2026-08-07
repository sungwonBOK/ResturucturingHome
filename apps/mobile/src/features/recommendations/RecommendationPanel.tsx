import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { RecommendationLayout, RoomFloorPlan, RoomStyle } from '@restructuring-home/domain';
import { colors } from '../../theme/colors';
import { recommendationService } from './recommendationApi';

const styles: Array<{ value: RoomStyle; label: string }> = [
  { value: 'minimal', label: '미니멀' },
  { value: 'nordic', label: '노르딕' },
  { value: 'modern', label: '모던' },
  { value: 'vintage', label: '빈티지' },
];

interface RecommendationPanelProps {
  plan: RoomFloorPlan;
}

export function RecommendationPanel({ plan }: RecommendationPanelProps) {
  const [selectedStyle, setSelectedStyle] = useState<RoomStyle>('minimal');
  const [recommendations, setRecommendations] = useState<RecommendationLayout[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextRecommendations = await recommendationService.request({
        floorPlan: plan,
        style: selectedStyle,
      });

      setRecommendations(nextRecommendations);
    } catch (requestError) {
      setRecommendations([]);
      setError(requestError instanceof Error ? requestError.message : 'AI 추천을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={panelStyles.container}>
      <Text style={panelStyles.eyebrow}>AI LAYOUT</Text>
      <Text style={panelStyles.title}>스타일을 고르면 배치 3개를 제안해요</Text>
      <Text style={panelStyles.description}>추천은 아직 저장되지 않으며, 현재 도면을 바탕으로 바로 생성됩니다.</Text>

      <View style={panelStyles.styleRow}>
        {styles.map((style) => {
          const isSelected = style.value === selectedStyle;

          return (
            <TouchableOpacity
              key={style.value}
              activeOpacity={0.8}
              style={[panelStyles.styleButton, isSelected ? panelStyles.styleButtonSelected : null]}
              onPress={() => setSelectedStyle(style.value)}
            >
              <Text style={[panelStyles.styleButtonText, isSelected ? panelStyles.styleButtonTextSelected : null]}>
                {style.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        disabled={isLoading}
        style={[panelStyles.requestButton, isLoading ? panelStyles.requestButtonDisabled : null]}
        onPress={handleRequest}
      >
        <Text style={panelStyles.requestButtonText}>{isLoading ? '추천을 만드는 중...' : 'AI 배치 추천 받기'}</Text>
      </TouchableOpacity>

      {error ? <Text selectable style={panelStyles.errorText}>{error}</Text> : null}

      {recommendations.map((recommendation, index) => (
        <View key={recommendation.id} style={panelStyles.recommendationCard}>
          <Text style={panelStyles.cardNumber}>OPTION {String(index + 1).padStart(2, '0')}</Text>
          <Text style={panelStyles.cardTitle}>{styles.find((style) => style.value === recommendation.style)?.label} 배치</Text>
          <Text selectable style={panelStyles.cardReason}>{recommendation.reason}</Text>
          <Text style={panelStyles.cardMeta}>가구 {recommendation.furniture.length}개 배치</Text>
        </View>
      ))}
    </View>
  );
}

const panelStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 18,
    gap: 12,
  },
  eyebrow: { color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.8 },
  title: { color: colors.textPrimary, fontFamily: 'Inter_700Bold', fontSize: 18, lineHeight: 26 },
  description: { color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  styleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  styleButton: {
    backgroundColor: colors.primaryDim,
    borderColor: 'transparent',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  styleButtonSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  styleButtonText: { color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  styleButtonTextSelected: { color: '#FFFFFF' },
  requestButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
  },
  requestButtonDisabled: { opacity: 0.6 },
  requestButtonText: { color: colors.textPrimary, fontFamily: 'Inter_700Bold', fontSize: 14 },
  errorText: { color: colors.error, fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 20 },
  recommendationCard: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  cardNumber: { color: colors.gradientEnd, fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.6 },
  cardTitle: { color: colors.textPrimary, fontFamily: 'Inter_700Bold', fontSize: 16 },
  cardReason: { color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  cardMeta: { color: colors.textMuted, fontFamily: 'Inter_500Medium', fontSize: 12 },
});

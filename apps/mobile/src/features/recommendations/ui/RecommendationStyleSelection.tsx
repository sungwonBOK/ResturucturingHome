import type { RoomStyle } from '@restructuring-home/domain';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { recommendationStyles } from '../model/recommendationStyles';

interface RecommendationStyleSelectionProps {
  isLoading: boolean;
  error: string | null;
  onRequest: (style: RoomStyle) => void;
}

export function RecommendationStyleSelection({ isLoading, error, onRequest }: RecommendationStyleSelectionProps) {
  const [selectedStyle, setSelectedStyle] = useState<RoomStyle>('minimal');

  return (
    <View style={styles.container}>
      <View style={styles.styleList}>
        {recommendationStyles.map((style) => {
          const isSelected = style.value === selectedStyle;
          return (
            <TouchableOpacity key={style.value} accessibilityRole="button" accessibilityState={{ selected: isSelected, disabled: isLoading }} activeOpacity={0.85} disabled={isLoading} onPress={() => setSelectedStyle(style.value)} style={[styles.styleCard, isSelected ? styles.styleCardSelected : null]}>
              <Text style={[styles.styleLabel, isSelected ? styles.styleLabelSelected : null]}>{style.label}</Text>
              <Text style={styles.styleDescription}>{style.description}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity activeOpacity={0.85} disabled={isLoading} onPress={() => onRequest(selectedStyle)} style={[styles.button, isLoading ? styles.buttonDisabled : null]}>
        <Text style={styles.buttonText}>{isLoading ? '배치도를 만드는 중...' : '이 종류의 배치도 보기'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.bgCard, borderColor: colors.border, borderRadius: 16, borderWidth: 1, gap: 12, padding: 18 },
  styleList: { gap: 10, marginTop: 4 },
  styleCard: { backgroundColor: colors.bg, borderColor: colors.border, borderRadius: 12, borderWidth: 1, gap: 4, padding: 14 },
  styleCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
  styleLabel: { color: colors.textPrimary, fontFamily: 'Inter_700Bold', fontSize: 16 },
  styleLabelSelected: { color: colors.primary },
  styleDescription: { color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  error: { color: colors.error, fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 20 },
  button: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14 },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 14 },
});

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../theme/colors';

// 추천 배치를 적용한 직후 가구 편집 화면에 보여 주는 되돌리기 안내입니다.
export function AppliedRecommendationBanner({ onUndo }: { onUndo: () => void }) {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>추천 배치를 적용했어요. 가구를 직접 고치면 되돌리기는 사라져요.</Text>
      <TouchableOpacity accessibilityRole="button" activeOpacity={0.85} onPress={onUndo} style={styles.button}>
        <Text style={styles.buttonText}>적용 전으로 되돌리기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { gap: 10, marginBottom: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.success, padding: 12, backgroundColor: colors.bgCard },
  text: { color: colors.textPrimary, fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 19 },
  button: { alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: colors.success, paddingVertical: 10 },
  buttonText: { color: colors.success, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
});

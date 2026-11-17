import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, View } from 'react-native';
import { scanDraftRepository } from '../../src/features/scan/scanDraftStore';
import { colors } from '../../src/theme/colors';

export default function MainLayout() {
  const [isDraftReady, setIsDraftReady] = useState(false);

  useEffect(() => {
    // 저장된 초안을 먼저 불러와야 다시 켠 앱에서 draftId가 있는 화면도 바로 열립니다.
    void scanDraftRepository.hydrate().finally(() => setIsDraftReady(true));

    // 앱이 백그라운드로 가면 OS가 종료할 수 있으므로 대기 중인 저장을 즉시 실행합니다.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') void scanDraftRepository.flush();
    });
    return () => subscription.remove();
  }, []);

  if (!isDraftReady) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="scan" />
      <Stack.Screen name="room-plan-setup" />
      <Stack.Screen name="furniture-editor" />
      <Stack.Screen name="recommendation-style" />
      <Stack.Screen name="recommendation-results" />
    </Stack>
  );
}

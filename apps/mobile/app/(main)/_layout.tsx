import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="scan" />
      <Stack.Screen name="room-editor" />
      <Stack.Screen name="room-detail" />
    </Stack>
  );
}

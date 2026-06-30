import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { supabase } from '../src/services/supabase';
import { Session } from '@supabase/supabase-js';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../src/theme/colors';
import {
  DevAdminSession,
  getDevAdminSession,
  onDevAdminAuthStateChange,
} from '../src/services/devAuth';

const AUTH_SESSION_TIMEOUT_MS = 8000;

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function InitialLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [devAdminSession, setDevAdminSession] = useState<DevAdminSession | null>(null);
  const segments = useSegments();
  const router = useRouter();
  const isAuthenticated = Boolean(session || devAdminSession);
  const isAuthLoading = session === undefined && !devAdminSession;

  useEffect(() => {
    let isMounted = true;
    let didResolveInitialSession = false;
    const sessionTimeout = setTimeout(() => {
      if (!didResolveInitialSession && isMounted) {
        console.warn('Supabase getSession timed out. Continuing as signed out.');
        setSession(null);
      }
    }, AUTH_SESSION_TIMEOUT_MS);

    supabase.auth.getSession().then(({ data: { session } }) => {
      didResolveInitialSession = true;
      clearTimeout(sessionTimeout);
      if (isMounted) {
        setSession(session);
      }
    }).catch((error) => {
      didResolveInitialSession = true;
      clearTimeout(sessionTimeout);
      console.warn('Supabase getSession failed. Continuing as signed out.', error);
      if (isMounted) {
        setSession(null);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session);
      }
    });

    getDevAdminSession().then((session) => {
      if (isMounted) {
        setDevAdminSession(session);
      }
    }).catch((error) => {
      console.warn('Failed to load local dev admin session.', error);
    });

    const unsubscribeDevAdmin = onDevAdminAuthStateChange((session) => {
      if (isMounted) {
        setDevAdminSession(session);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(sessionTimeout);
      subscription.unsubscribe();
      unsubscribeDevAdmin();
    };
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(main)/home');
    }
  }, [isAuthLoading, isAuthenticated, segments]);

  if (isAuthLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontError) {
      console.warn('Font loading failed. Continuing with system fonts.', fontError);
    }

    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <>
      <StatusBar style="light" />
      <InitialLayout />
    </>
  );
}

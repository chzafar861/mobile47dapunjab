import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { useThemeStore } from '../src/store/themeStore';
import { useAuthStore } from '../src/store/authStore';
import { onAuthChange } from '../src/services/auth';
import { getUserProfile } from '../src/services/auth';

function RootLayoutInner() {
  const { colors, mode, loadTheme } = useThemeStore();
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          setUser(profile);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });
    return unsubscribe;
  }, [setUser, setLoading]);

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="protocol" options={{ headerShown: false }} />
        <Stack.Screen name="village" options={{ headerShown: false }} />
        <Stack.Screen name="customs" options={{ headerShown: false }} />
        <Stack.Screen name="shop" options={{ headerShown: false }} />
        <Stack.Screen name="humanfind" options={{ headerShown: false }} />
        <Stack.Screen name="property" options={{ headerShown: false }} />
        <Stack.Screen name="history" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <I18nProvider>
      <RootLayoutInner />
    </I18nProvider>
  );
}

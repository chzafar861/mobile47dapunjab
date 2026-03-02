import React from 'react';
import { Stack } from 'expo-router';
import { useThemeStore } from '../../src/store/themeStore';

export default function AuthLayout() {
  const { colors } = useThemeStore();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Login', headerShown: false }} />
      <Stack.Screen name="signup" options={{ title: 'Sign Up' }} />
      <Stack.Screen name="phone" options={{ title: 'Phone Login' }} />
    </Stack>
  );
}

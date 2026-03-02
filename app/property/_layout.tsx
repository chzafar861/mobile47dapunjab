import React from 'react';
import { Stack } from 'expo-router';
import { useThemeStore } from '../../src/store/themeStore';
import { useTranslate } from '../../src/hooks/useTranslate';

export default function PropertyLayout() {
  const { colors } = useThemeStore();
  const { t } = useTranslate();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="index" options={{ title: t('property_title') }} />
      <Stack.Screen name="new" options={{ title: t('property_new_submission') }} />
    </Stack>
  );
}

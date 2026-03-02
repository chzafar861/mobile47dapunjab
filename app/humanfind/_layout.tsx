import React from 'react';
import { Stack } from 'expo-router';
import { useThemeStore } from '../../src/store/themeStore';
import { useTranslate } from '../../src/hooks/useTranslate';

export default function HumanFindLayout() {
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
      <Stack.Screen name="index" options={{ title: t('humanfind_title') }} />
      <Stack.Screen name="add-person" options={{ title: t('humanfind_add_person') }} />
      <Stack.Screen name="add-property" options={{ title: t('humanfind_add_property') }} />
      <Stack.Screen name="person/[id]" options={{ title: 'Person Details' }} />
      <Stack.Screen name="property/[id]" options={{ title: 'Property Details' }} />
    </Stack>
  );
}

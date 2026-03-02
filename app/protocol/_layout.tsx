import React from 'react';
import { Stack } from 'expo-router';
import { useThemeStore } from '../../src/store/themeStore';
import { useTranslate } from '../../src/hooks/useTranslate';

export default function ProtocolLayout() {
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
      <Stack.Screen name="index" options={{ title: t('protocol_title') }} />
      <Stack.Screen name="new" options={{ title: t('protocol_new_request') }} />
    </Stack>
  );
}

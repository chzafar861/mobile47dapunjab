import React from 'react';
import { Stack } from 'expo-router';
import { useThemeStore } from '../../src/store/themeStore';
import { useTranslate } from '../../src/hooks/useTranslate';

export default function AdminLayout() {
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
      <Stack.Screen name="index" options={{ title: t('admin_title') }} />
      <Stack.Screen name="products" options={{ title: t('admin_manage_products') }} />
      <Stack.Screen name="add-product" options={{ title: t('admin_add_product') }} />
      <Stack.Screen name="properties" options={{ title: t('admin_approve_properties') }} />
      <Stack.Screen name="requests" options={{ title: t('admin_manage_requests') }} />
      <Stack.Screen name="articles" options={{ title: t('admin_upload_articles') }} />
    </Stack>
  );
}

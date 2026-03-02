import React from 'react';
import { Stack } from 'expo-router';
import { useThemeStore } from '../../src/store/themeStore';
import { useTranslate } from '../../src/hooks/useTranslate';

export default function ShopLayout() {
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
      <Stack.Screen name="[id]" options={{ title: 'Product Details' }} />
      <Stack.Screen name="cart" options={{ title: t('shop_cart') }} />
      <Stack.Screen name="orders" options={{ title: t('shop_my_orders') }} />
    </Stack>
  );
}

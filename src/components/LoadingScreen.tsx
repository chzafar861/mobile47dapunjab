import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { ThemedText } from './ThemedText';
import { useTranslate } from '../hooks/useTranslate';

export const LoadingScreen: React.FC = () => {
  const { colors } = useThemeStore();
  const { t } = useTranslate();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <ThemedText style={styles.text}>{t('common_loading')}</ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 16,
  },
});

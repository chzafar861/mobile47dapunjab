import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';
import { ThemedText } from './ThemedText';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  message: string;
  submessage?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'document-text-outline',
  message,
  submessage,
}) => {
  const { colors } = useThemeStore();

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color={colors.placeholder} />
      <ThemedText variant="subtitle" style={styles.message}>
        {message}
      </ThemedText>
      {submessage && (
        <ThemedText variant="caption" secondary style={styles.submessage}>
          {submessage}
        </ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  message: {
    marginTop: 16,
    textAlign: 'center',
  },
  submessage: {
    marginTop: 8,
    textAlign: 'center',
  },
});

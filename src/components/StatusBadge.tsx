import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../store/themeStore';

interface StatusBadgeProps {
  status: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FFF3E0', text: '#E65100' },
  approved: { bg: '#E8F5E9', text: '#1B5E20' },
  in_progress: { bg: '#E3F2FD', text: '#0D47A1' },
  completed: { bg: '#E8F5E9', text: '#1B5E20' },
  rejected: { bg: '#FFEBEE', text: '#B71C1C' },
  processing: { bg: '#E3F2FD', text: '#0D47A1' },
  shipped: { bg: '#F3E5F5', text: '#4A148C' },
  delivered: { bg: '#E8F5E9', text: '#1B5E20' },
  cancelled: { bg: '#FFEBEE', text: '#B71C1C' },
  verified: { bg: '#E8F5E9', text: '#1B5E20' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { mode } = useThemeStore();
  const colorScheme = statusColors[status] || statusColors.pending;

  const bgColor = mode === 'dark' ? `${colorScheme.text}30` : colorScheme.bg;

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={[styles.text, { color: colorScheme.text }]}>
        {status.replace('_', ' ').toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

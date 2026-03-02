import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';
import { ThemedText } from './ThemedText';

interface ServiceCardProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  icon,
  onPress,
  color,
}) => {
  const { colors } = useThemeStore();
  const cardColor = color || colors.primary;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${cardColor}15` }]}>
        <Ionicons name={icon} size={32} color={cardColor} />
      </View>
      <ThemedText variant="label" style={styles.title}>
        {title}
      </ThemedText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '47%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 120,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    textAlign: 'center',
    fontSize: 13,
  },
});

import React, { ReactNode } from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useThemeStore } from '../store/themeStore';

interface ThemedViewProps {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export const ThemedView: React.FC<ThemedViewProps> = ({ children, style }) => {
  const { colors } = useThemeStore();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

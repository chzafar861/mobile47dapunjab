import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { useTranslate } from '../hooks/useTranslate';

interface ThemedTextProps {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
  variant?: 'title' | 'subtitle' | 'body' | 'caption' | 'label';
  secondary?: boolean;
}

export const ThemedText: React.FC<ThemedTextProps> = ({
  children,
  style,
  variant = 'body',
  secondary = false,
}) => {
  const { colors } = useThemeStore();
  const { textAlign } = useTranslate();

  const variantStyle = styles[variant];
  const color = secondary ? colors.textSecondary : colors.text;

  return (
    <Text style={[variantStyle, { color, textAlign }, style]}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
  },
  caption: {
    fontSize: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
});

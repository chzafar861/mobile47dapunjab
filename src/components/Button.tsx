import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useThemeStore } from '../store/themeStore';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const { colors } = useThemeStore();

  const getButtonStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: colors.primary };
      case 'secondary':
        return { backgroundColor: colors.accent };
      case 'outline':
        return { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.primary };
      case 'danger':
        return { backgroundColor: colors.error };
      default:
        return { backgroundColor: colors.primary };
    }
  };

  const getTextColor = (): string => {
    if (variant === 'outline') return colors.primary;
    return '#FFFFFF';
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});

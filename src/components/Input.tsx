import React from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { useTranslate } from '../hooks/useTranslate';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  ...props
}) => {
  const { colors } = useThemeStore();
  const { textAlign, isRtl } = useTranslate();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text, textAlign }]}>{label}</Text>
      )}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBackground,
            color: colors.text,
            borderColor: error ? colors.error : colors.border,
            textAlign,
            writingDirection: isRtl ? 'rtl' : 'ltr',
          },
          style,
        ]}
        placeholderTextColor={colors.placeholder}
        {...props}
      />
      {error && (
        <Text style={[styles.error, { color: colors.error, textAlign }]}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    minHeight: 48,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
});

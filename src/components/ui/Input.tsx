import React from 'react';
import { TextInput, Text, View, TextInputProps, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../lib/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: object;
}

export function Input({ label, error, containerStyle, style, ...props }: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={colors.gray500}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.gray400,
    fontSize: 14,
    marginBottom: spacing.xs + 2,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.dark100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    color: colors.white,
    fontSize: 16,
  },
  inputError: {
    borderColor: colors.red500,
  },
  errorText: {
    color: colors.red500,
    fontSize: 12,
    marginTop: spacing.xs,
  },
});

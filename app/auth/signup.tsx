import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView, ThemedText, Button, Input } from '../../src/components';
import { useTranslate } from '../../src/hooks/useTranslate';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';
import { signUpWithEmail } from '../../src/services/auth';

export default function SignupScreen() {
  const router = useRouter();
  const { t, language } = useTranslate();
  const { colors } = useThemeStore();
  const { setUser } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!phone.trim()) newErrors.phone = 'Phone number is required';
    if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const profile = await signUpWithEmail(
        email.trim(),
        password,
        name.trim(),
        phone.trim(),
        language
      );
      setUser(profile);
      router.replace('/(tabs)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign up failed';
      Alert.alert(t('common_error'), message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText variant="title" style={styles.title}>
            {t('auth_signup')}
          </ThemedText>

          <Input
            label={t('auth_name')}
            value={name}
            onChangeText={setName}
            autoComplete="name"
            error={errors.name}
            placeholder="Full Name"
          />
          <Input
            label={t('auth_email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
            placeholder="email@example.com"
          />
          <Input
            label={t('auth_phone')}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            error={errors.phone}
            placeholder="+92 300 1234567"
          />
          <Input
            label={t('auth_password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
            placeholder="••••••"
          />
          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            error={errors.confirmPassword}
            placeholder="••••••"
          />

          <Button
            title={t('auth_signup')}
            onPress={handleSignup}
            loading={loading}
            fullWidth
            style={styles.signupButton}
          />

          <View style={styles.loginRow}>
            <ThemedText variant="body" secondary>
              {t('auth_have_account')}{' '}
            </ThemedText>
            <ThemedText
              variant="body"
              style={{ color: colors.primary, fontWeight: '600' }}
              onPress={() => router.back()}
            >
              {t('auth_login')}
            </ThemedText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 24,
  },
  title: {
    marginBottom: 24,
    textAlign: 'center',
  },
  signupButton: {
    marginTop: 16,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
});

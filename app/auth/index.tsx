import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView, ThemedText, Button, Input } from '../../src/components';
import { useTranslate } from '../../src/hooks/useTranslate';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';
import { signInWithEmail, getUserProfile } from '../../src/services/auth';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslate();
  const { colors } = useThemeStore();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!password.trim()) newErrors.password = 'Password is required';
    if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const firebaseUser = await signInWithEmail(email.trim(), password);
      const profile = await getUserProfile(firebaseUser.uid);
      setUser(profile);
      router.replace('/(tabs)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
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
          {/* Logo/Header */}
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
              <Ionicons name="location" size={48} color="#FFF" />
            </View>
            <ThemedText variant="title" style={styles.appName}>
              {t('common_app_name')}
            </ThemedText>
            <ThemedText variant="body" secondary>
              {t('home_subtitle')}
            </ThemedText>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
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
              label={t('auth_password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              error={errors.password}
              placeholder="••••••"
            />

            <Button
              title={t('auth_login_with_email')}
              onPress={handleLogin}
              loading={loading}
              fullWidth
              style={styles.loginButton}
            />

            <Button
              title={t('auth_login_with_phone')}
              onPress={() => router.push('/auth/phone')}
              variant="outline"
              fullWidth
              style={styles.phoneButton}
            />

            <View style={styles.signupRow}>
              <ThemedText variant="body" secondary>
                {t('auth_no_account')}{' '}
              </ThemedText>
              <ThemedText
                variant="body"
                style={{ color: colors.primary, fontWeight: '600' }}
                onPress={() => router.push('/auth/signup')}
              >
                {t('auth_signup')}
              </ThemedText>
            </View>
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    marginBottom: 4,
  },
  form: {
    width: '100%',
  },
  loginButton: {
    marginTop: 8,
  },
  phoneButton: {
    marginTop: 12,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
});

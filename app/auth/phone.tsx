import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView, ThemedText, Button, Input } from '../../src/components';
import { useTranslate } from '../../src/hooks/useTranslate';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';
import { getUserProfile, createUserProfile } from '../../src/services/auth';

export default function PhoneLoginScreen() {
  const router = useRouter();
  const { t, language } = useTranslate();
  const { colors } = useThemeStore();
  const { setUser } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  const handleSendOTP = async () => {
    if (!phone.trim()) {
      Alert.alert(t('common_error'), 'Please enter a phone number');
      return;
    }
    setLoading(true);
    try {
      // Note: Phone auth requires a RecaptchaVerifier in web or native setup
      // This is a placeholder - in production, you'd use Firebase's phone auth
      Alert.alert(
        'Phone Auth',
        'Phone authentication requires Firebase phone auth setup with RecaptchaVerifier. ' +
        'Please configure Firebase phone auth in your project settings. ' +
        'For testing, use email login.',
        [{ text: 'OK' }]
      );
      // In production:
      // const vid = await sendPhoneOTP(phone.trim(), recaptchaVerifier);
      // setVerificationId(vid);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send OTP';
      Alert.alert(t('common_error'), message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || !verificationId) return;
    setLoading(true);
    try {
      // In production:
      // const firebaseUser = await verifyPhoneOTP(verificationId, otp.trim());
      // const profile = await getUserProfile(firebaseUser.uid);
      // if (!profile) {
      //   setShowNameInput(true);
      // } else {
      //   setUser(profile);
      //   router.replace('/(tabs)');
      // }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OTP verification failed';
      Alert.alert(t('common_error'), message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      // In production, create the profile with the authenticated user's UID
      // const profile = await createUserProfile(uid, name.trim(), phone.trim(), language);
      // setUser(profile);
      // router.replace('/(tabs)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create profile';
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
            {t('auth_login_with_phone')}
          </ThemedText>

          {showNameInput ? (
            <>
              <ThemedText variant="body" secondary style={styles.subtitle}>
                Please enter your name to complete registration
              </ThemedText>
              <Input
                label={t('auth_name')}
                value={name}
                onChangeText={setName}
                placeholder="Full Name"
              />
              <Button
                title={t('common_submit')}
                onPress={handleCreateProfile}
                loading={loading}
                fullWidth
              />
            </>
          ) : !verificationId ? (
            <>
              <ThemedText variant="body" secondary style={styles.subtitle}>
                Enter your phone number to receive an OTP
              </ThemedText>
              <Input
                label={t('auth_phone')}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+92 300 1234567"
              />
              <Button
                title={t('auth_send_otp')}
                onPress={handleSendOTP}
                loading={loading}
                fullWidth
              />
            </>
          ) : (
            <>
              <ThemedText variant="body" secondary style={styles.subtitle}>
                Enter the OTP sent to {phone}
              </ThemedText>
              <Input
                label={t('auth_otp')}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                placeholder="123456"
                maxLength={6}
              />
              <Button
                title={t('auth_verify_otp')}
                onPress={handleVerifyOTP}
                loading={loading}
                fullWidth
              />
            </>
          )}

          <Button
            title={t('auth_login_with_email')}
            onPress={() => router.back()}
            variant="outline"
            fullWidth
            style={styles.switchButton}
          />
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
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  switchButton: {
    marginTop: 24,
  },
});

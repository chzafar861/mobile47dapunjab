import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
  Alert,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Modal,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import Colors from "@/constants/colors";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { getApiUrl } from "@/lib/query-client";

type Mode = "login" | "signup";
type ResetStep = "email" | "code" | "newPassword" | "done";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const { login, register, refreshUser } = useAuth();
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [oauthStatus, setOauthStatus] = useState<{ google: boolean; facebook: boolean }>({ google: false, facebook: false });

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState<ResetStep>("email");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const codeInputRefs = useRef<(TextInput | null)[]>([]);
  const [codeDigits, setCodeDigits] = useState<string[]>(["", "", "", "", "", ""]);

  useEffect(() => {
    (async () => {
      try {
        const baseUrl = getApiUrl();
        const res = await globalThis.fetch(new URL("/api/auth/oauth/status", baseUrl).toString());
        if (res.ok) {
          const data = await res.json();
          setOauthStatus(data);
        }
      } catch {}
    })();
  }, []);

  const clearMessages = () => {
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSubmit = async () => {
    clearMessages();
    setShowErrors(true);
    if (mode === "signup" && !name.trim()) {
      setErrorMsg("Please enter your name");
      return;
    }
    if (!email.trim()) {
      setErrorMsg("Please enter your email");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg("Please enter a valid email address");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, name.trim(), phone.trim());
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccessMsg(mode === "login" ? "Welcome back!" : "Account created successfully!");
    } catch (e: any) {
      const msg = e.message || "Something went wrong. Please try again.";
      setErrorMsg(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: "google" | "facebook") => {
    clearMessages();
    const isConfigured = provider === "google" ? oauthStatus.google : oauthStatus.facebook;
    if (!isConfigured) {
      setErrorMsg(`${provider === "google" ? "Google" : "Facebook"} login is not configured yet. Please use email login.`);
      return;
    }
    setSocialLoading(provider);
    try {
      const baseUrl = getApiUrl();
      const authUrl = new URL(`/api/auth/${provider}`, baseUrl).toString();
      if (Platform.OS === "web") {
        const popup = window.open(authUrl, "_blank", "width=500,height=600,menubar=no,toolbar=no");
        if (!popup) {
          setErrorMsg("Popup was blocked by your browser. Please allow popups for this site and try again.");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setSocialLoading(null);
          return;
        }
        let handled = false;
        const onMessage = async (event: MessageEvent) => {
          if (event.data?.type === "47da-oauth-success" && !handled) {
            handled = true;
            window.removeEventListener("message", onMessage);
            clearInterval(checkClosed);
            await refreshUser();
            setSocialLoading(null);
          }
        };
        window.addEventListener("message", onMessage);
        const checkClosed = setInterval(async () => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener("message", onMessage);
            if (!handled) {
              handled = true;
              await refreshUser();
              setSocialLoading(null);
            }
          }
        }, 500);
      } else {
        const result = await WebBrowser.openAuthSessionAsync(authUrl, undefined);
        if (result.type === "success" || result.type === "cancel" || result.type === "dismiss") {
          await refreshUser();
        }
        setSocialLoading(null);
      }
    } catch (e: any) {
      setErrorMsg(`${provider === "google" ? "Google" : "Facebook"} login failed. Please try again.`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setSocialLoading(null);
    }
  };

  const openResetModal = () => {
    setResetStep("email");
    setResetEmail(email.trim());
    setResetCode("");
    setResetCodeDisplay("");
    setNewPassword("");
    setConfirmPassword("");
    setResetError("");
    setResetSuccess("");
    setCodeDigits(["", "", "", "", "", ""]);
    setShowNewPassword(false);
    setShowResetModal(true);
  };

  const closeResetModal = () => {
    setShowResetModal(false);
  };

  const handleRequestCode = async () => {
    setResetError("");
    setShowErrors(true);
    if (!resetEmail.trim()) {
      setResetError("Please enter your email address");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail.trim())) {
      setResetError("Please enter a valid email address");
      return;
    }
    setResetLoading(true);
    try {
      const baseUrl = getApiUrl();
      const res = await globalThis.fetch(new URL("/api/auth/forgot-password", baseUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: resetEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error || "Something went wrong");
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResetStep("code");
    } catch (e: any) {
      setResetError("Network error. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleCodeDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/[^0-9]/g, "").split("").slice(0, 6);
      const newDigits = [...codeDigits];
      digits.forEach((d, i) => {
        if (index + i < 6) newDigits[index + i] = d;
      });
      setCodeDigits(newDigits);
      const nextFocus = Math.min(index + digits.length, 5);
      codeInputRefs.current[nextFocus]?.focus();
      return;
    }
    const cleanVal = value.replace(/[^0-9]/g, "");
    const newDigits = [...codeDigits];
    newDigits[index] = cleanVal;
    setCodeDigits(newDigits);
    if (cleanVal && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !codeDigits[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
      const newDigits = [...codeDigits];
      newDigits[index - 1] = "";
      setCodeDigits(newDigits);
    }
  };

  const handleVerifyCode = () => {
    setResetError("");
    const fullCode = codeDigits.join("");
    if (fullCode.length !== 6) {
      setResetError("Please enter the complete 6-digit code");
      return;
    }
    setResetCode(fullCode);
    setResetStep("newPassword");
  };

  const handleResetPassword = async () => {
    setResetError("");
    setShowErrors(true);
    if (!newPassword || newPassword.length < 6) {
      setResetError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords don't match");
      return;
    }
    const fullCode = codeDigits.join("");
    setResetLoading(true);
    try {
      const baseUrl = getApiUrl();
      const res = await globalThis.fetch(new URL("/api/auth/reset-password", baseUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: resetEmail.trim(), code: fullCode, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error || "Reset failed");
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResetStep("done");
      setResetSuccess(data.message || "Password reset successfully!");
    } catch (e: any) {
      setResetError("Network error. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetDone = () => {
    closeResetModal();
    setEmail(resetEmail);
    setPassword("");
    setMode("login");
    clearMessages();
    setSuccessMsg("Password reset! Sign in with your new password.");
  };

  const renderResetContent = () => {
    switch (resetStep) {
      case "email":
        return (
          <>
            <View style={resetStyles.iconCircle}>
              <Ionicons name="mail-outline" size={32} color={Colors.light.primary} />
            </View>
            <Text style={resetStyles.title}>{t.login.forgotPassword}</Text>
            <Text style={resetStyles.subtitle}>
              {t.login.enterEmail}
            </Text>

            {resetError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color="#D32F2F" />
                <Text style={styles.errorText}>{resetError}</Text>
              </View>
            ) : null}

            <View style={[styles.inputRow, showErrors && !resetEmail.trim() && { borderColor: Colors.light.danger, borderWidth: 1.5 }, { marginBottom: 20 }]}>
              <Ionicons name="mail-outline" size={20} color={Colors.light.tabIconDefault} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t.login.enterYourEmail}
                placeholderTextColor={Colors.light.tabIconDefault}
                value={resetEmail}
                onChangeText={(v) => { setResetEmail(v); setResetError(""); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                testID="reset-email-input"
              />
            </View>

            <Pressable
              onPress={handleRequestCode}
              disabled={resetLoading}
              style={({ pressed }) => [styles.submitBtn, { opacity: pressed ? 0.9 : 1, marginTop: 0 }]}
              testID="send-code-btn"
            >
              <LinearGradient
                colors={[Colors.light.primary, Colors.light.primaryDark]}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {resetLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="send-outline" size={18} color="#fff" />
                    <Text style={styles.submitText}>{t.login.sendCode}</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </>
        );

      case "code":
        return (
          <>
            <View style={resetStyles.iconCircle}>
              <Ionicons name="keypad-outline" size={32} color={Colors.light.primary} />
            </View>
            <Text style={resetStyles.title}>{t.login.verificationCode}</Text>
            <Text style={resetStyles.subtitle}>
              {t.login.codeSent}
            </Text>

            <View style={resetStyles.codeDisplayBanner}>
              <Ionicons name="mail-outline" size={18} color={Colors.light.primary} />
              <Text style={resetStyles.codeDisplayText}>
                Contact 47dapunjab@gmail.com to receive your reset code
              </Text>
            </View>

            {resetError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color="#D32F2F" />
                <Text style={styles.errorText}>{resetError}</Text>
              </View>
            ) : null}

            <View style={resetStyles.codeRow}>
              {codeDigits.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => { codeInputRefs.current[i] = ref; }}
                  style={[
                    resetStyles.codeInput,
                    digit ? resetStyles.codeInputFilled : null,
                  ]}
                  value={digit}
                  onChangeText={(v) => handleCodeDigitChange(i, v)}
                  onKeyPress={({ nativeEvent }) => handleCodeKeyPress(i, nativeEvent.key)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  testID={`code-digit-${i}`}
                />
              ))}
            </View>

            <Pressable
              onPress={handleVerifyCode}
              style={({ pressed }) => [styles.submitBtn, { opacity: pressed ? 0.9 : 1, marginTop: 4 }]}
              testID="verify-code-btn"
            >
              <LinearGradient
                colors={[Colors.light.primary, Colors.light.primaryDark]}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="checkmark-outline" size={18} color="#fff" />
                <Text style={styles.submitText}>{t.login.verificationCode}</Text>
              </LinearGradient>
            </Pressable>
          </>
        );

      case "newPassword":
        return (
          <>
            <View style={resetStyles.iconCircle}>
              <Ionicons name="lock-open-outline" size={32} color={Colors.light.primary} />
            </View>
            <Text style={resetStyles.title}>{t.login.newPassword}</Text>
            <Text style={resetStyles.subtitle}>
              {t.login.confirmPassword}
            </Text>

            {resetError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color="#D32F2F" />
                <Text style={styles.errorText}>{resetError}</Text>
              </View>
            ) : null}

            <View style={[styles.inputRow, showErrors && (!newPassword || newPassword.length < 6) && { borderColor: Colors.light.danger, borderWidth: 1.5 }, { marginBottom: 14 }]}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.light.tabIconDefault} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={t.login.enterYourPassword}
                placeholderTextColor={Colors.light.tabIconDefault}
                value={newPassword}
                onChangeText={(v) => { setNewPassword(v); setResetError(""); }}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                testID="new-password-input"
              />
              <Pressable onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeBtn}>
                <Ionicons name={showNewPassword ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.light.tabIconDefault} />
              </Pressable>
            </View>

            <View style={[styles.inputRow, showErrors && (!confirmPassword || confirmPassword !== newPassword) && { borderColor: Colors.light.danger, borderWidth: 1.5 }, { marginBottom: 20 }]}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.light.tabIconDefault} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t.login.confirmPassword}
                placeholderTextColor={Colors.light.tabIconDefault}
                value={confirmPassword}
                onChangeText={(v) => { setConfirmPassword(v); setResetError(""); }}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                testID="confirm-password-input"
              />
            </View>

            <Pressable
              onPress={handleResetPassword}
              disabled={resetLoading}
              style={({ pressed }) => [styles.submitBtn, { opacity: pressed ? 0.9 : 1, marginTop: 0 }]}
              testID="reset-password-btn"
            >
              <LinearGradient
                colors={[Colors.light.primary, Colors.light.primaryDark]}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {resetLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
                    <Text style={styles.submitText}>{t.login.resetPasswordBtn}</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </>
        );

      case "done":
        return (
          <>
            <View style={[resetStyles.iconCircle, { backgroundColor: "#E8F5E9" }]}>
              <Ionicons name="checkmark-circle" size={36} color="#2E7D32" />
            </View>
            <Text style={resetStyles.title}>{t.login.resetPassword}</Text>
            <Text style={resetStyles.subtitle}>
              {resetSuccess || t.login.passwordUpdated}
            </Text>

            <Pressable
              onPress={handleResetDone}
              style={({ pressed }) => [styles.submitBtn, { opacity: pressed ? 0.9 : 1, marginTop: 8 }]}
              testID="back-to-login-btn"
            >
              <LinearGradient
                colors={[Colors.light.primary, Colors.light.primaryDark]}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="log-in-outline" size={18} color="#fff" />
                <Text style={styles.submitText}>{t.login.signIn}</Text>
              </LinearGradient>
            </Pressable>
          </>
        );
    }
  };

  return (
    <View style={styles.container}>
      <SEOHead title="Login" description="Sign in or create an account on 47daPunjab to access services, shop, and connect with Punjab, Pakistan." path="/login" keywords="47daPunjab login, sign up, create account, Punjab Pakistan services" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: insets.bottom + webBottomInset + 40,
            flexGrow: 1,
            backgroundColor: Colors.light.background,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={[Colors.light.primaryDark, Colors.light.primary, Colors.light.primaryDark]}
            style={[styles.headerGradient, { paddingTop: insets.top + 16 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <MaterialCommunityIcons name="mosque" size={36} color={Colors.light.primary} />
              </View>
              <Text style={styles.appName}>47daPunjab</Text>
              <Text style={styles.tagline}>Your Gateway to Punjab</Text>
            </View>
          </LinearGradient>

          <View style={styles.formContainer}>
            <View style={styles.modeToggle}>
              <Pressable
                onPress={() => { setMode("login"); clearMessages(); setShowErrors(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[styles.modeBtn, mode === "login" && styles.modeBtnActive]}
              >
                <Text style={[styles.modeBtnText, mode === "login" && styles.modeBtnTextActive]}>
                  {t.login.signIn}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => { setMode("signup"); clearMessages(); setShowErrors(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[styles.modeBtn, mode === "signup" && styles.modeBtnActive]}
              >
                <Text style={[styles.modeBtnText, mode === "signup" && styles.modeBtnTextActive]}>
                  {t.login.signUp}
                </Text>
              </Pressable>
            </View>

            {errorMsg ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#D32F2F" />
                <Text style={styles.errorText}>{errorMsg}</Text>
                <Pressable onPress={clearMessages}>
                  <Ionicons name="close" size={16} color="#D32F2F" />
                </Pressable>
              </View>
            ) : null}

            {successMsg ? (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
                <Text style={styles.successText}>{successMsg}</Text>
              </View>
            ) : null}

            {mode === "signup" && (
              <>
                <View style={[styles.inputRow, showErrors && mode === "signup" && !name.trim() && { borderColor: Colors.light.danger, borderWidth: 1.5 }]}>
                  <Ionicons name="person-outline" size={20} color={Colors.light.tabIconDefault} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t.login.enterYourName}
                    placeholderTextColor={Colors.light.tabIconDefault}
                    value={name}
                    onChangeText={(v) => { setName(v); clearMessages(); }}
                    autoCapitalize="words"
                    testID="name-input"
                  />
                </View>
                <View style={styles.inputRow}>
                  <Ionicons name="call-outline" size={20} color={Colors.light.tabIconDefault} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone (optional)"
                    placeholderTextColor={Colors.light.tabIconDefault}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    testID="phone-input"
                  />
                </View>
              </>
            )}

            <View style={[styles.inputRow, showErrors && !email.trim() && { borderColor: Colors.light.danger, borderWidth: 1.5 }]}>
              <Ionicons name="mail-outline" size={20} color={Colors.light.tabIconDefault} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t.login.enterYourEmail}
                placeholderTextColor={Colors.light.tabIconDefault}
                value={email}
                onChangeText={(v) => { setEmail(v); clearMessages(); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                testID="email-input"
              />
            </View>

            <View style={[styles.inputRow, showErrors && (!password || password.length < 6) && { borderColor: Colors.light.danger, borderWidth: 1.5 }]}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.light.tabIconDefault} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={t.login.enterYourPassword}
                placeholderTextColor={Colors.light.tabIconDefault}
                value={password}
                onChangeText={(v) => { setPassword(v); clearMessages(); }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                testID="password-input"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.light.tabIconDefault} />
              </Pressable>
            </View>

            {mode === "login" && (
              <Pressable onPress={openResetModal} style={styles.forgotBtn} testID="forgot-password-btn">
                <Text style={styles.forgotText}>{t.login.forgotPassword}</Text>
              </Pressable>
            )}

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => [styles.submitBtn, { opacity: pressed ? 0.9 : 1 }]}
              testID="submit-btn"
            >
              <LinearGradient
                colors={[Colors.light.primary, Colors.light.primaryDark]}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name={mode === "login" ? "log-in-outline" : "person-add-outline"} size={20} color="#fff" />
                    <Text style={styles.submitText}>
                      {mode === "login" ? t.login.signIn : t.login.signUp}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t.login.orContinueWith}</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <Pressable
                onPress={() => handleOAuthLogin("google")}
                disabled={!!socialLoading}
                style={({ pressed }) => [
                  styles.socialBtn,
                  styles.googleBtn,
                  { opacity: pressed ? 0.9 : 1 },
                  !oauthStatus.google && styles.socialBtnDisabled,
                ]}
                testID="google-login-btn"
              >
                {socialLoading === "google" ? (
                  <ActivityIndicator color="#DB4437" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="google" size={22} color={oauthStatus.google ? "#DB4437" : "#999"} />
                    <Text style={[styles.socialBtnText, !oauthStatus.google && styles.socialBtnTextDisabled]}>{t.login.google}</Text>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={() => handleOAuthLogin("facebook")}
                disabled={!!socialLoading}
                style={({ pressed }) => [
                  styles.socialBtn,
                  styles.facebookBtn,
                  { opacity: pressed ? 0.9 : 1 },
                  !oauthStatus.facebook && styles.socialBtnDisabled,
                ]}
                testID="facebook-login-btn"
              >
                {socialLoading === "facebook" ? (
                  <ActivityIndicator color="#1877F2" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="facebook" size={22} color={oauthStatus.facebook ? "#1877F2" : "#999"} />
                    <Text style={[styles.socialBtnText, !oauthStatus.facebook && styles.socialBtnTextDisabled]}>{t.login.facebook}</Text>
                  </>
                )}
              </Pressable>
            </View>

            {(!oauthStatus.google || !oauthStatus.facebook) && (
              <Text style={styles.oauthNote}>
                {!oauthStatus.google && !oauthStatus.facebook
                  ? "Google & Facebook login will be available once OAuth credentials are configured."
                  : !oauthStatus.google
                  ? "Google login will be available once configured."
                  : "Facebook login will be available once configured."}
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showResetModal}
        animationType="slide"
        transparent
        onRequestClose={closeResetModal}
      >
        <View style={resetStyles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={resetStyles.keyboardAvoid}
          >
            <View style={resetStyles.sheet}>
              <View style={resetStyles.handle} />
              <Pressable onPress={closeResetModal} style={resetStyles.closeBtn} testID="close-reset-modal">
                <Ionicons name="close" size={22} color={Colors.light.tabIconDefault} />
              </Pressable>

              <View style={resetStyles.stepIndicator}>
                {["email", "code", "newPassword", "done"].map((step, i) => (
                  <View
                    key={step}
                    style={[
                      resetStyles.stepDot,
                      i <= ["email", "code", "newPassword", "done"].indexOf(resetStep) && resetStyles.stepDotActive,
                    ]}
                  />
                ))}
              </View>

              {renderResetContent()}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const { width: screenWidth } = Dimensions.get("window");

const resetStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  keyboardAvoid: {
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    minHeight: 380,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D9D9D9",
    alignSelf: "center",
    marginBottom: 16,
  },
  closeBtn: {
    position: "absolute" as const,
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  stepIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
  },
  stepDotActive: {
    backgroundColor: Colors.light.primary,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 22,
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  codeDisplayBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  codeDisplayText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#2E7D32",
    flex: 1,
  },
  codeDisplayCode: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    letterSpacing: 3,
    color: Colors.light.primary,
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  codeInput: {
    width: Math.min(48, (screenWidth - 80) / 6),
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundSecondary,
    textAlign: "center",
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: Colors.light.text,
  },
  codeInputFilled: {
    borderColor: Colors.light.primary,
    backgroundColor: "#E8F5E9",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.primaryDark,
  },
  headerGradient: {
    paddingBottom: 48,
    paddingTop: 0,
    alignItems: "center",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoContainer: {
    alignItems: "center",
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    boxShadow: "0px 4px 8px rgba(0,0,0,0.15)",
    elevation: 6,
  },
  appName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: "#fff",
    letterSpacing: 1,
  },
  tagline: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingTop: 28,
    backgroundColor: Colors.light.background,
  },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modeBtnActive: {
    backgroundColor: "#fff",
    boxShadow: "0px 1px 4px rgba(0,0,0,0.08)",
    elevation: 2,
  },
  modeBtnText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    color: Colors.light.tabIconDefault,
  },
  modeBtnTextActive: {
    color: Colors.light.primary,
    fontFamily: "Poppins_600SemiBold",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFEBEE",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#C62828",
    flex: 1,
    lineHeight: 18,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  successText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#2E7D32",
    flex: 1,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 14,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: Colors.light.text,
    paddingVertical: 14,
  },
  eyeBtn: {
    padding: 6,
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: 8,
    marginTop: -6,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  forgotText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.primary,
  },
  submitBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 6,
    marginBottom: 24,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  submitText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  dividerText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.tabIconDefault,
    marginHorizontal: 14,
  },
  socialRow: {
    flexDirection: "row",
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "#fff",
  },
  socialBtnDisabled: {
    backgroundColor: "#F5F5F5",
    borderColor: "#E0E0E0",
  },
  googleBtn: {},
  facebookBtn: {},
  socialBtnText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: Colors.light.text,
  },
  socialBtnTextDisabled: {
    color: "#999",
  },
  oauthNote: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.tabIconDefault,
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 20,
    lineHeight: 16,
  },
});

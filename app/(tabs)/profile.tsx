import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, Image, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView, ThemedText, Button, Card, Input } from '../../src/components';
import { useTranslate } from '../../src/hooks/useTranslate';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';
import { logOut, updateUserProfile } from '../../src/services/auth';
import { languageNames } from '../../src/i18n/translations';
import { SupportedLanguage } from '../../src/types';

export default function ProfileScreen() {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslate();
  const { colors, mode, toggleTheme } = useThemeStore();
  const { user, isAuthenticated, clearUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');

  if (!isAuthenticated || !user) {
    return (
      <ThemedView style={styles.centered}>
        <Ionicons name="person-circle-outline" size={80} color={colors.placeholder} />
        <ThemedText variant="subtitle" style={styles.loginPrompt}>
          {t('auth_login')}
        </ThemedText>
        <Button
          title={t('auth_login')}
          onPress={() => router.push('/auth')}
          fullWidth
          style={styles.loginButton}
        />
      </ThemedView>
    );
  }

  const handleLogout = () => {
    Alert.alert(t('auth_logout'), 'Are you sure?', [
      { text: t('common_cancel'), style: 'cancel' },
      {
        text: t('auth_logout'),
        style: 'destructive',
        onPress: async () => {
          await logOut();
          clearUser();
          router.replace('/auth');
        },
      },
    ]);
  };

  const handleSaveName = async () => {
    if (name.trim() && user) {
      await updateUserProfile(user.uid, { name: name.trim() });
      setEditing(false);
    }
  };

  const handleLanguageChange = async (lang: SupportedLanguage) => {
    await setLanguage(lang);
    if (user) {
      await updateUserProfile(user.uid, { language: lang });
    }
  };

  return (
    <ThemedView>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          {user.profilePhoto ? (
            <Image source={{ uri: user.profilePhoto }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primaryDark }]}>
              <Ionicons name="person" size={40} color="#FFF" />
            </View>
          )}
          <ThemedText variant="title" style={styles.userName}>
            {user.name}
          </ThemedText>
          <ThemedText variant="caption" style={styles.userEmail}>
            {user.email || user.phone}
          </ThemedText>
        </View>

        {/* Edit Name */}
        {editing ? (
          <Card>
            <Input
              label={t('auth_name')}
              value={name}
              onChangeText={setName}
            />
            <View style={styles.editButtons}>
              <Button title={t('common_save')} onPress={handleSaveName} />
              <Button
                title={t('common_cancel')}
                onPress={() => setEditing(false)}
                variant="outline"
                style={styles.cancelButton}
              />
            </View>
          </Card>
        ) : (
          <Card onPress={() => setEditing(true)}>
            <View style={styles.settingRow}>
              <Ionicons name="create-outline" size={22} color={colors.primary} />
              <ThemedText variant="body" style={styles.settingText}>
                {t('auth_edit_profile')}
              </ThemedText>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </Card>
        )}

        {/* Language Selection */}
        <Card>
          <ThemedText variant="label" style={styles.sectionLabel}>
            {t('auth_select_language')}
          </ThemedText>
          {(Object.entries(languageNames) as [SupportedLanguage, string][]).map(
            ([lang, langName]) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.languageOption,
                  language === lang && { backgroundColor: `${colors.primary}15` },
                ]}
                onPress={() => handleLanguageChange(lang)}
              >
                <ThemedText variant="body">{langName}</ThemedText>
                {language === lang && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            )
          )}
        </Card>

        {/* Theme Toggle */}
        <Card onPress={toggleTheme}>
          <View style={styles.settingRow}>
            <Ionicons
              name={mode === 'dark' ? 'moon' : 'sunny'}
              size={22}
              color={colors.primary}
            />
            <ThemedText variant="body" style={styles.settingText}>
              {t('settings_dark_mode')}
            </ThemedText>
            <ThemedText variant="caption" secondary>
              {mode === 'dark' ? 'ON' : 'OFF'}
            </ThemedText>
          </View>
        </Card>

        {/* My Orders */}
        <Card onPress={() => router.push('/shop/orders')}>
          <View style={styles.settingRow}>
            <Ionicons name="receipt-outline" size={22} color={colors.primary} />
            <ThemedText variant="body" style={styles.settingText}>
              {t('shop_my_orders')}
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
        </Card>

        {/* Logout */}
        <Button
          title={t('auth_logout')}
          onPress={handleLogout}
          variant="danger"
          fullWidth
          style={styles.logoutButton}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loginPrompt: {
    marginTop: 16,
    marginBottom: 24,
  },
  loginButton: {
    maxWidth: 300,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    color: '#FFF',
    marginTop: 12,
  },
  userEmail: {
    color: '#C8E6C9',
    marginTop: 4,
  },
  sectionLabel: {
    marginBottom: 8,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    flex: 1,
    marginLeft: 12,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    marginLeft: 8,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 16,
  },
});

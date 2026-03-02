import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView, ThemedText, Card } from '../../src/components';
import { useTranslate } from '../../src/hooks/useTranslate';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

export default function AdminScreen() {
  const router = useRouter();
  const { t } = useTranslate();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  if (user?.role !== 'admin') {
    return (
      <ThemedView style={styles.centered}>
        <Ionicons name="lock-closed" size={64} color={colors.error} />
        <ThemedText variant="subtitle" style={styles.accessDenied}>
          Access Denied
        </ThemedText>
        <ThemedText variant="body" secondary>
          You need admin privileges to access this panel.
        </ThemedText>
      </ThemedView>
    );
  }

  const adminItems = [
    {
      title: t('admin_manage_products'),
      icon: 'cube-outline' as const,
      route: '/admin/products' as const,
      color: '#4A148C',
    },
    {
      title: t('admin_approve_properties'),
      icon: 'business-outline' as const,
      route: '/admin/properties' as const,
      color: '#00695C',
    },
    {
      title: t('admin_manage_requests'),
      icon: 'list-outline' as const,
      route: '/admin/requests' as const,
      color: '#E65100',
    },
    {
      title: t('admin_upload_articles'),
      icon: 'newspaper-outline' as const,
      route: '/admin/articles' as const,
      color: '#4E342E',
    },
  ];

  return (
    <ThemedView>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText variant="title" style={styles.header}>
          {t('admin_title')}
        </ThemedText>
        {adminItems.map((item, index) => (
          <Card key={index} onPress={() => router.push(item.route)}>
            <View style={styles.cardRow}>
              <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon} size={28} color={item.color} />
              </View>
              <ThemedText variant="subtitle" style={styles.cardTitle}>
                {item.title}
              </ThemedText>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </Card>
        ))}
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
  accessDenied: {
    marginTop: 16,
    marginBottom: 8,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardTitle: {
    flex: 1,
  },
});

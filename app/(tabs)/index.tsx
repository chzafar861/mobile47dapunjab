import React from 'react';
import { ScrollView, View, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView, ThemedText, ServiceCard } from '../../src/components';
import { useTranslate } from '../../src/hooks/useTranslate';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';

export default function HomeScreen() {
  const router = useRouter();
  const { t, flexDirection } = useTranslate();
  const { colors } = useThemeStore();
  const { user, isAuthenticated } = useAuthStore();

  const services = [
    {
      title: t('home_protocol'),
      icon: 'shield-checkmark' as const,
      route: '/protocol' as const,
      color: '#1B5E20',
    },
    {
      title: t('home_village'),
      icon: 'videocam' as const,
      route: '/village' as const,
      color: '#0D47A1',
    },
    {
      title: t('home_customs'),
      icon: 'document-text' as const,
      route: '/customs' as const,
      color: '#E65100',
    },
    {
      title: t('home_shop'),
      icon: 'cart' as const,
      route: '/(tabs)/shop' as const,
      color: '#4A148C',
    },
    {
      title: t('home_humanfind'),
      icon: 'people' as const,
      route: '/humanfind' as const,
      color: '#BF360C',
    },
    {
      title: t('home_property'),
      icon: 'business' as const,
      route: '/property' as const,
      color: '#00695C',
    },
    {
      title: t('home_history'),
      icon: 'book' as const,
      route: '/history' as const,
      color: '#4E342E',
    },
  ];

  return (
    <ThemedView>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Banner */}
        <View style={[styles.banner, { backgroundColor: colors.primary }]}>
          <ThemedText variant="title" style={styles.bannerTitle}>
            {t('home_title')}
          </ThemedText>
          <ThemedText variant="body" style={styles.bannerSubtitle}>
            {t('home_subtitle')}
          </ThemedText>
          {user && (
            <ThemedText variant="caption" style={styles.welcomeText}>
              Welcome, {user.name}
            </ThemedText>
          )}
        </View>

        {/* Services Grid */}
        <View style={styles.servicesSection}>
          <ThemedText variant="subtitle" style={styles.sectionTitle}>
            Services
          </ThemedText>
          <View style={[styles.servicesGrid, { flexDirection: 'row' }]}>
            {services.map((service, index) => (
              <ServiceCard
                key={index}
                title={service.title}
                icon={service.icon}
                color={service.color}
                onPress={() => {
                  if (!isAuthenticated && service.route !== '/(tabs)/shop' && service.route !== '/history') {
                    router.push('/auth');
                  } else {
                    router.push(service.route);
                  }
                }}
              />
            ))}
            {/* Admin panel - only for admins */}
            {user?.role === 'admin' && (
              <ServiceCard
                title={t('home_admin')}
                icon="settings"
                color="#D32F2F"
                onPress={() => router.push('/admin')}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 20,
  },
  banner: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  bannerTitle: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  bannerSubtitle: {
    color: '#E8F5E9',
    textAlign: 'center',
    marginTop: 4,
  },
  welcomeText: {
    color: '#C8E6C9',
    textAlign: 'center',
    marginTop: 8,
  },
  servicesSection: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  servicesGrid: {
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

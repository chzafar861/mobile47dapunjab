import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { orderBy } from 'firebase/firestore';
import { ThemedView, ThemedText, Card, Button, EmptyState, LoadingScreen } from '../../src/components';
import { useTranslate } from '../../src/hooks/useTranslate';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';
import { getDocuments } from '../../src/services/firestore';
import { COLLECTIONS } from '../../src/constants/collections';
import { HumanFindPerson, HumanFindProperty } from '../../src/types';
import { Ionicons } from '@expo/vector-icons';

type Tab = 'people' | 'properties';

export default function HumanFindScreen() {
  const router = useRouter();
  const { t } = useTranslate();
  const { colors } = useThemeStore();
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('people');
  const [people, setPeople] = useState<(HumanFindPerson & { id: string })[]>([]);
  const [properties, setProperties] = useState<(HumanFindProperty & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'people') {
        const data = await getDocuments<HumanFindPerson>(COLLECTIONS.HUMANFIND_PEOPLE, [
          orderBy('createdAt', 'desc'),
        ]);
        setPeople(data);
      } else {
        const data = await getDocuments<HumanFindProperty>(COLLECTIONS.HUMANFIND_PROPERTIES, [
          orderBy('createdAt', 'desc'),
        ]);
        setProperties(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderPerson = ({ item }: { item: HumanFindPerson & { id: string } }) => (
    <Card onPress={() => router.push(`/humanfind/person/${item.id}`)}>
      <View style={styles.itemRow}>
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.inputBackground }]}>
            <Ionicons name="person" size={24} color={colors.placeholder} />
          </View>
        )}
        <View style={styles.itemInfo}>
          <ThemedText variant="label">{item.name}</ThemedText>
          <ThemedText variant="caption" secondary>{item.location}</ThemedText>
          <ThemedText variant="caption" secondary numberOfLines={2}>{item.description}</ThemedText>
        </View>
      </View>
    </Card>
  );

  const renderProperty = ({ item }: { item: HumanFindProperty & { id: string } }) => (
    <Card onPress={() => router.push(`/humanfind/property/${item.id}`)}>
      <View style={styles.itemRow}>
        {item.images?.[0] ? (
          <Image source={{ uri: item.images[0] }} style={styles.propertyImage} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.inputBackground }]}>
            <Ionicons name="business" size={24} color={colors.placeholder} />
          </View>
        )}
        <View style={styles.itemInfo}>
          <ThemedText variant="label">{item.title}</ThemedText>
          <ThemedText variant="caption" secondary>{item.location}</ThemedText>
          <ThemedText variant="caption" secondary numberOfLines={2}>{item.details}</ThemedText>
        </View>
      </View>
    </Card>
  );

  return (
    <ThemedView>
      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'people' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('people')}
        >
          <ThemedText variant="label" style={{ color: activeTab === 'people' ? colors.primary : colors.textSecondary }}>
            {t('humanfind_people')}
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'properties' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('properties')}
        >
          <ThemedText variant="label" style={{ color: activeTab === 'properties' ? colors.primary : colors.textSecondary }}>
            {t('humanfind_properties')}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {loading ? (
        <LoadingScreen />
      ) : activeTab === 'people' ? (
        <FlatList
          data={people}
          renderItem={renderPerson}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState icon="people-outline" message={t('common_no_data')} />}
        />
      ) : (
        <FlatList
          data={properties}
          renderItem={renderProperty}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState icon="business-outline" message={t('common_no_data')} />}
        />
      )}

      {isAuthenticated && (
        <Button
          title={activeTab === 'people' ? t('humanfind_add_person') : t('humanfind_add_property')}
          onPress={() => router.push(activeTab === 'people' ? '/humanfind/add-person' : '/humanfind/add-property')}
          fullWidth
          style={styles.fab}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    paddingBottom: 10,
    alignItems: 'center',
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
});

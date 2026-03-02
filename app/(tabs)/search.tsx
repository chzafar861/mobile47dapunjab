import React, { useState, useCallback } from 'react';
import { FlatList, View, StyleSheet, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { where, orderBy } from 'firebase/firestore';
import { ThemedView, ThemedText, Card, EmptyState } from '../../src/components';
import { useTranslate } from '../../src/hooks/useTranslate';
import { useThemeStore } from '../../src/store/themeStore';
import { getDocuments } from '../../src/services/firestore';
import { COLLECTIONS } from '../../src/constants/collections';
import { HumanFindPerson, HumanFindProperty } from '../../src/types';
import { Ionicons } from '@expo/vector-icons';

type SearchTab = 'people' | 'properties';

export default function SearchScreen() {
  const router = useRouter();
  const { t, textAlign, isRtl } = useTranslate();
  const { colors } = useThemeStore();
  const [activeTab, setActiveTab] = useState<SearchTab>('people');
  const [searchQuery, setSearchQuery] = useState('');
  const [people, setPeople] = useState<(HumanFindPerson & { id: string })[]>([]);
  const [properties, setProperties] = useState<(HumanFindProperty & { id: string })[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'people') {
        const data = await getDocuments<HumanFindPerson>(COLLECTIONS.HUMANFIND_PEOPLE, [
          orderBy('createdAt', 'desc'),
        ]);
        const filtered = searchQuery
          ? data.filter(
              (p) =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.location.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : data;
        setPeople(filtered);
      } else {
        const data = await getDocuments<HumanFindProperty>(COLLECTIONS.HUMANFIND_PROPERTIES, [
          orderBy('createdAt', 'desc'),
        ]);
        const filtered = searchQuery
          ? data.filter(
              (p) =>
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.location.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : data;
        setProperties(filtered);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  React.useEffect(() => {
    search();
  }, [activeTab]);

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
          <ThemedText variant="caption" secondary>
            {item.location}
          </ThemedText>
          <ThemedText variant="caption" secondary numberOfLines={2}>
            {item.description}
          </ThemedText>
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
          <ThemedText variant="caption" secondary>
            {item.location}
          </ThemedText>
          <ThemedText variant="caption" secondary numberOfLines={2}>
            {item.details}
          </ThemedText>
        </View>
      </View>
    </Card>
  );

  return (
    <ThemedView>
      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={20} color={colors.placeholder} />
        <TextInput
          style={[styles.searchInput, { color: colors.text, textAlign, writingDirection: isRtl ? 'rtl' : 'ltr' }]}
          placeholder={t('humanfind_search_placeholder')}
          placeholderTextColor={colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={search}
          returnKeyType="search"
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <View
          style={[
            styles.tab,
            activeTab === 'people' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
        >
          <ThemedText
            variant="label"
            style={[
              styles.tabText,
              { color: activeTab === 'people' ? colors.primary : colors.textSecondary },
            ]}
            onPress={() => setActiveTab('people')}
          >
            {t('humanfind_people')}
          </ThemedText>
        </View>
        <View
          style={[
            styles.tab,
            activeTab === 'properties' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
        >
          <ThemedText
            variant="label"
            style={[
              styles.tabText,
              { color: activeTab === 'properties' ? colors.primary : colors.textSecondary },
            ]}
            onPress={() => setActiveTab('properties')}
          >
            {t('humanfind_properties')}
          </ThemedText>
        </View>
      </View>

      {/* Results */}
      {activeTab === 'people' ? (
        <FlatList
          data={people}
          renderItem={renderPerson}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState icon="people-outline" message={t('common_no_data')} />
          }
        />
      ) : (
        <FlatList
          data={properties}
          renderItem={renderProperty}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState icon="business-outline" message={t('common_no_data')} />
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 48,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingBottom: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
  },
  list: {
    padding: 16,
    paddingTop: 0,
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
});

import React from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView, ThemedText, Card, Button, StatusBadge, LoadingScreen, EmptyState } from '../../src/components';
import { useTranslate } from '../../src/hooks/useTranslate';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';
import { useUserDocuments } from '../../src/hooks/useFirestoreQuery';
import { COLLECTIONS } from '../../src/constants/collections';
import { VillageVideoRequest } from '../../src/types';
import { Ionicons } from '@expo/vector-icons';

export default function VillageScreen() {
  const router = useRouter();
  const { t } = useTranslate();
  const { user } = useAuthStore();
  const { colors } = useThemeStore();
  const { data: requests, loading, refresh } = useUserDocuments<VillageVideoRequest>(
    COLLECTIONS.VILLAGE_VIDEO_REQUESTS,
    user?.uid
  );

  const renderRequest = ({ item }: { item: VillageVideoRequest & { id: string } }) => (
    <Card>
      <View style={styles.cardHeader}>
        <ThemedText variant="label">{item.villageName}</ThemedText>
        <StatusBadge status={item.status} />
      </View>
      <View style={styles.cardRow}>
        <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
        <ThemedText variant="caption" secondary style={styles.cardRowText}>
          {item.district}
        </ThemedText>
      </View>
      <ThemedText variant="caption" secondary style={styles.description}>
        {item.description}
      </ThemedText>
      {item.videoLinks?.length > 0 && (
        <View style={styles.videoCount}>
          <Ionicons name="videocam-outline" size={14} color={colors.primary} />
          <ThemedText variant="caption" style={{ color: colors.primary, marginLeft: 4 }}>
            {item.videoLinks.length} video(s) available
          </ThemedText>
        </View>
      )}
    </Card>
  );

  if (loading) return <LoadingScreen />;

  return (
    <ThemedView>
      <FlatList
        data={requests}
        renderItem={renderRequest}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onRefresh={refresh}
        refreshing={loading}
        ListEmptyComponent={
          <EmptyState
            icon="videocam-outline"
            message={t('common_no_data')}
            submessage="Request a village video recording"
          />
        }
      />
      <Button
        title={t('village_new_request')}
        onPress={() => router.push('/village/new')}
        fullWidth
        style={styles.fab}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  cardRowText: {
    marginLeft: 6,
  },
  description: {
    marginTop: 8,
  },
  videoCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
});

import React from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView, ThemedText, Card, Button, StatusBadge, LoadingScreen, EmptyState } from '../../src/components';
import { useTranslate } from '../../src/hooks/useTranslate';
import { useAuthStore } from '../../src/store/authStore';
import { useUserDocuments } from '../../src/hooks/useFirestoreQuery';
import { COLLECTIONS } from '../../src/constants/collections';
import { ProtocolRequest } from '../../src/types';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../src/store/themeStore';

export default function ProtocolScreen() {
  const router = useRouter();
  const { t } = useTranslate();
  const { user } = useAuthStore();
  const { colors } = useThemeStore();
  const { data: requests, loading, refresh } = useUserDocuments<ProtocolRequest>(
    COLLECTIONS.PROTOCOL_REQUESTS,
    user?.uid
  );

  const renderRequest = ({ item }: { item: ProtocolRequest & { id: string } }) => (
    <Card>
      <View style={styles.cardHeader}>
        <ThemedText variant="label">{item.serviceType}</ThemedText>
        <StatusBadge status={item.status} />
      </View>
      <View style={styles.cardRow}>
        <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
        <ThemedText variant="caption" secondary style={styles.cardRowText}>
          {item.location}
        </ThemedText>
      </View>
      <View style={styles.cardRow}>
        <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
        <ThemedText variant="caption" secondary style={styles.cardRowText}>
          {item.date}
        </ThemedText>
      </View>
      {item.notes ? (
        <ThemedText variant="caption" secondary style={styles.notes}>
          {item.notes}
        </ThemedText>
      ) : null}
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
            icon="shield-checkmark-outline"
            message={t('common_no_data')}
            submessage="Create your first protocol service request"
          />
        }
      />
      <Button
        title={t('protocol_new_request')}
        onPress={() => router.push('/protocol/new')}
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
  notes: {
    marginTop: 8,
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
});

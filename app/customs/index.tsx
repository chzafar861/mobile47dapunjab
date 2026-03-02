import React from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView, ThemedText, Card, Button, StatusBadge, LoadingScreen, EmptyState } from '../../src/components';
import { useTranslate } from '../../src/hooks/useTranslate';
import { useAuthStore } from '../../src/store/authStore';
import { useUserDocuments } from '../../src/hooks/useFirestoreQuery';
import { COLLECTIONS } from '../../src/constants/collections';
import { CustomsAssistance } from '../../src/types';

export default function CustomsScreen() {
  const router = useRouter();
  const { t } = useTranslate();
  const { user } = useAuthStore();
  const { data: requests, loading, refresh } = useUserDocuments<CustomsAssistance>(
    COLLECTIONS.CUSTOMS_ASSISTANCE,
    user?.uid
  );

  const renderRequest = ({ item }: { item: CustomsAssistance & { id: string } }) => (
    <Card>
      <View style={styles.cardHeader}>
        <ThemedText variant="label">{item.itemType}</ThemedText>
        <StatusBadge status={item.status} />
      </View>
      <ThemedText variant="caption" secondary style={styles.description}>
        {item.description}
      </ThemedText>
      <ThemedText variant="caption" secondary>
        {new Date(item.createdAt).toLocaleDateString()}
      </ThemedText>
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
            icon="document-text-outline"
            message={t('common_no_data')}
            submessage="Create a customs assistance request"
          />
        }
      />
      <Button
        title={t('customs_new_request')}
        onPress={() => router.push('/customs/new')}
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
  description: {
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
});

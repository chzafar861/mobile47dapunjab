import React from 'react';
import { FlatList, View, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView, ThemedText, Card, Button, StatusBadge, LoadingScreen, EmptyState } from '../../src/components';
import { useTranslate } from '../../src/hooks/useTranslate';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';
import { useUserDocuments } from '../../src/hooks/useFirestoreQuery';
import { COLLECTIONS } from '../../src/constants/collections';
import { PropertySubmission } from '../../src/types';
import { Ionicons } from '@expo/vector-icons';

export default function PropertyScreen() {
  const router = useRouter();
  const { t } = useTranslate();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const { data: submissions, loading, refresh } = useUserDocuments<PropertySubmission>(
    COLLECTIONS.PROPERTY_SUBMISSIONS,
    user?.uid
  );

  const renderSubmission = ({ item }: { item: PropertySubmission & { id: string } }) => (
    <Card>
      <View style={styles.cardHeader}>
        <ThemedText variant="label" style={styles.titleText}>{item.title}</ThemedText>
        <StatusBadge status={item.verificationStatus} />
      </View>
      {item.images?.[0] && (
        <Image source={{ uri: item.images[0] }} style={styles.image} />
      )}
      <View style={styles.infoRow}>
        <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
        <ThemedText variant="caption" secondary style={styles.infoText}>
          {item.location}
        </ThemedText>
      </View>
      <ThemedText variant="caption" secondary numberOfLines={2} style={styles.description}>
        {item.description}
      </ThemedText>
    </Card>
  );

  if (loading) return <LoadingScreen />;

  return (
    <ThemedView>
      <FlatList
        data={submissions}
        renderItem={renderSubmission}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onRefresh={refresh}
        refreshing={loading}
        ListEmptyComponent={
          <EmptyState
            icon="business-outline"
            message={t('common_no_data')}
            submessage="Submit your first property detail"
          />
        }
      />
      <Button
        title={t('property_new_submission')}
        onPress={() => router.push('/property/new')}
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
  titleText: {
    flex: 1,
    marginRight: 8,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoText: {
    marginLeft: 6,
  },
  description: {
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
});

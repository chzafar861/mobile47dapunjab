import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, View, Image, StyleSheet, Alert } from 'react-native';
import { orderBy, where } from 'firebase/firestore';
import { ThemedView, ThemedText, Card, Button, StatusBadge, LoadingScreen, EmptyState } from '../../src/components';
import { useTranslate } from '../../src/hooks/useTranslate';
import { useThemeStore } from '../../src/store/themeStore';
import { getDocuments, updateDocument } from '../../src/services/firestore';
import { COLLECTIONS } from '../../src/constants/collections';
import { PropertySubmission } from '../../src/types';

export default function AdminPropertiesScreen() {
  const { t } = useTranslate();
  const { colors } = useThemeStore();
  const [submissions, setSubmissions] = useState<(PropertySubmission & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDocuments<PropertySubmission>(COLLECTIONS.PROPERTY_SUBMISSIONS, [
        orderBy('createdAt', 'desc'),
      ]);
      setSubmissions(data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleStatusUpdate = async (id: string, status: 'verified' | 'rejected') => {
    try {
      await updateDocument(COLLECTIONS.PROPERTY_SUBMISSIONS, id, { verificationStatus: status });
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, verificationStatus: status } : s))
      );
      Alert.alert(t('common_success'), `Property ${status}`);
    } catch {
      Alert.alert(t('common_error'), 'Failed to update status');
    }
  };

  const renderSubmission = ({ item }: { item: PropertySubmission & { id: string } }) => (
    <Card>
      <View style={styles.cardHeader}>
        <ThemedText variant="label" style={styles.titleText}>{item.title}</ThemedText>
        <StatusBadge status={item.verificationStatus} />
      </View>
      {item.images?.[0] && (
        <Image source={{ uri: item.images[0] }} style={styles.image} />
      )}
      <ThemedText variant="caption" secondary>{item.location}</ThemedText>
      <ThemedText variant="caption" secondary numberOfLines={2} style={styles.desc}>
        {item.description}
      </ThemedText>
      {item.verificationStatus === 'pending' && (
        <View style={styles.actionRow}>
          <Button
            title={t('common_approved')}
            onPress={() => handleStatusUpdate(item.id, 'verified')}
            variant="primary"
            style={styles.actionButton}
            textStyle={styles.actionText}
          />
          <Button
            title={t('common_rejected')}
            onPress={() => handleStatusUpdate(item.id, 'rejected')}
            variant="danger"
            style={styles.actionButton}
            textStyle={styles.actionText}
          />
        </View>
      )}
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
        onRefresh={fetchSubmissions}
        refreshing={loading}
        ListEmptyComponent={<EmptyState icon="business-outline" message={t('common_no_data')} />}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  titleText: { flex: 1, marginRight: 8 },
  image: { width: '100%', height: 120, borderRadius: 8, marginBottom: 8 },
  desc: { marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionButton: { flex: 1, paddingVertical: 8, minHeight: 36 },
  actionText: { fontSize: 13 },
});

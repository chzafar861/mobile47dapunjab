import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { orderBy } from 'firebase/firestore';
import { ThemedView, ThemedText, Card, StatusBadge, LoadingScreen, EmptyState } from '../../src/components';
import { useTranslate } from '../../src/hooks/useTranslate';
import { useThemeStore } from '../../src/store/themeStore';
import { getDocuments, updateDocument } from '../../src/services/firestore';
import { COLLECTIONS } from '../../src/constants/collections';
import { ProtocolRequest, VillageVideoRequest, CustomsAssistance } from '../../src/types';

type RequestType = 'protocol' | 'village' | 'customs';

interface UnifiedRequest {
  id: string;
  type: RequestType;
  title: string;
  subtitle: string;
  status: string;
  createdAt: number;
  collection: string;
}

const STATUS_OPTIONS = ['pending', 'approved', 'in_progress', 'completed', 'rejected'];

export default function AdminRequestsScreen() {
  const { t } = useTranslate();
  const { colors } = useThemeStore();
  const [requests, setRequests] = useState<UnifiedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<RequestType | 'all'>('all');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const [protocols, villages, customs] = await Promise.all([
        getDocuments<ProtocolRequest>(COLLECTIONS.PROTOCOL_REQUESTS, [orderBy('createdAt', 'desc')]),
        getDocuments<VillageVideoRequest>(COLLECTIONS.VILLAGE_VIDEO_REQUESTS, [orderBy('createdAt', 'desc')]),
        getDocuments<CustomsAssistance>(COLLECTIONS.CUSTOMS_ASSISTANCE, [orderBy('createdAt', 'desc')]),
      ]);

      const unified: UnifiedRequest[] = [
        ...protocols.map((p) => ({
          id: p.id,
          type: 'protocol' as const,
          title: p.serviceType,
          subtitle: `${p.location} - ${p.date}`,
          status: p.status,
          createdAt: p.createdAt,
          collection: COLLECTIONS.PROTOCOL_REQUESTS,
        })),
        ...villages.map((v) => ({
          id: v.id,
          type: 'village' as const,
          title: v.villageName,
          subtitle: v.district,
          status: v.status,
          createdAt: v.createdAt,
          collection: COLLECTIONS.VILLAGE_VIDEO_REQUESTS,
        })),
        ...customs.map((c) => ({
          id: c.id,
          type: 'customs' as const,
          title: c.itemType,
          subtitle: c.description.slice(0, 50),
          status: c.status,
          createdAt: c.createdAt,
          collection: COLLECTIONS.CUSTOMS_ASSISTANCE,
        })),
      ].sort((a, b) => b.createdAt - a.createdAt);

      setRequests(unified);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleStatusChange = (request: UnifiedRequest) => {
    Alert.alert(
      'Update Status',
      `Current: ${request.status}`,
      STATUS_OPTIONS.map((status) => ({
        text: status.replace('_', ' ').toUpperCase(),
        onPress: async () => {
          try {
            await updateDocument(request.collection, request.id, { status });
            setRequests((prev) =>
              prev.map((r) => (r.id === request.id ? { ...r, status } : r))
            );
          } catch {
            Alert.alert(t('common_error'), 'Failed to update status');
          }
        },
      })).concat([{ text: t('common_cancel'), onPress: () => {} }])
    );
  };

  const filtered = activeFilter === 'all'
    ? requests
    : requests.filter((r) => r.type === activeFilter);

  const renderRequest = ({ item }: { item: UnifiedRequest }) => (
    <Card onPress={() => handleStatusChange(item)}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeBadge, {
          backgroundColor: item.type === 'protocol' ? '#E8F5E9' : item.type === 'village' ? '#E3F2FD' : '#FFF3E0',
        }]}>
          <ThemedText variant="caption" style={{
            color: item.type === 'protocol' ? '#1B5E20' : item.type === 'village' ? '#0D47A1' : '#E65100',
            fontWeight: '600',
          }}>
            {item.type.toUpperCase()}
          </ThemedText>
        </View>
        <StatusBadge status={item.status} />
      </View>
      <ThemedText variant="label">{item.title}</ThemedText>
      <ThemedText variant="caption" secondary>{item.subtitle}</ThemedText>
      <ThemedText variant="caption" secondary style={styles.date}>
        {new Date(item.createdAt).toLocaleDateString()}
      </ThemedText>
    </Card>
  );

  if (loading) return <LoadingScreen />;

  return (
    <ThemedView>
      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'protocol', 'village', 'customs'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              {
                backgroundColor: activeFilter === filter ? colors.primary : colors.inputBackground,
              },
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <ThemedText variant="caption" style={{
              color: activeFilter === filter ? '#FFF' : colors.text,
              fontWeight: '600',
            }}>
              {filter.toUpperCase()}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        renderItem={renderRequest}
        keyExtractor={(item) => `${item.type}_${item.id}`}
        contentContainerStyle={styles.list}
        onRefresh={fetchRequests}
        refreshing={loading}
        ListEmptyComponent={<EmptyState icon="list-outline" message={t('common_no_data')} />}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: 'row', padding: 16, gap: 8 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  list: { padding: 16, paddingTop: 0 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  date: { marginTop: 4 },
});

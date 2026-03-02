import React from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { ThemedView, ThemedText, Card, StatusBadge, LoadingScreen, EmptyState } from '../../src/components';
import { useTranslate } from '../../src/hooks/useTranslate';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';
import { useUserDocuments } from '../../src/hooks/useFirestoreQuery';
import { COLLECTIONS } from '../../src/constants/collections';
import { Order } from '../../src/types';

export default function OrdersScreen() {
  const { t } = useTranslate();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const { data: orders, loading, refresh } = useUserDocuments<Order>(
    COLLECTIONS.ORDERS,
    user?.uid
  );

  const renderOrder = ({ item }: { item: Order & { id: string } }) => (
    <Card>
      <View style={styles.cardHeader}>
        <ThemedText variant="label">Order #{item.id.slice(0, 8)}</ThemedText>
        <StatusBadge status={item.status} />
      </View>
      {item.products.map((product, index) => (
        <View key={index} style={styles.productRow}>
          <ThemedText variant="body" style={styles.productName}>
            {product.name}
          </ThemedText>
          <ThemedText variant="caption" secondary>
            x{product.quantity} - PKR {(product.price * product.quantity).toLocaleString()}
          </ThemedText>
        </View>
      ))}
      <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
        <ThemedText variant="label">{t('common_total')}</ThemedText>
        <ThemedText variant="subtitle" style={{ color: colors.primary }}>
          PKR {item.totalPrice.toLocaleString()}
        </ThemedText>
      </View>
      <ThemedText variant="caption" secondary>
        {new Date(item.createdAt).toLocaleDateString()}
      </ThemedText>
    </Card>
  );

  if (loading) return <LoadingScreen />;

  return (
    <ThemedView>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onRefresh={refresh}
        refreshing={loading}
        ListEmptyComponent={
          <EmptyState icon="receipt-outline" message={t('common_no_data')} />
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  productName: {
    flex: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
});

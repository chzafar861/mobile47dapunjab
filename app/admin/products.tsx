import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, View, Image, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { orderBy } from 'firebase/firestore';
import { ThemedView, ThemedText, Card, Button, LoadingScreen, EmptyState } from '../../src/components';
import { useTranslate } from '../../src/hooks/useTranslate';
import { useThemeStore } from '../../src/store/themeStore';
import { getDocuments, deleteDocument } from '../../src/services/firestore';
import { COLLECTIONS } from '../../src/constants/collections';
import { Product } from '../../src/types';
import { Ionicons } from '@expo/vector-icons';

export default function AdminProductsScreen() {
  const router = useRouter();
  const { t, getLocalizedField } = useTranslate();
  const { colors } = useThemeStore();
  const [products, setProducts] = useState<(Product & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDocuments<Product>(COLLECTIONS.PRODUCTS, [
        orderBy('category'),
      ]);
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = (productId: string) => {
    Alert.alert('Delete Product', 'Are you sure?', [
      { text: t('common_cancel'), style: 'cancel' },
      {
        text: t('common_delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDocument(COLLECTIONS.PRODUCTS, productId);
            setProducts((prev) => prev.filter((p) => p.id !== productId));
          } catch {
            Alert.alert(t('common_error'), 'Failed to delete product');
          }
        },
      },
    ]);
  };

  const renderProduct = ({ item }: { item: Product & { id: string } }) => (
    <Card>
      <View style={styles.productRow}>
        {item.images?.[0] && (
          <Image source={{ uri: item.images[0] }} style={styles.productImage} />
        )}
        <View style={styles.productInfo}>
          <ThemedText variant="label">{getLocalizedField(item, 'name')}</ThemedText>
          <ThemedText variant="caption" secondary>PKR {item.price.toLocaleString()}</ThemedText>
          <ThemedText variant="caption" secondary>Stock: {item.stock}</ThemedText>
        </View>
        <View style={styles.actions}>
          <Ionicons
            name="trash-outline"
            size={20}
            color={colors.error}
            onPress={() => handleDelete(item.id)}
          />
        </View>
      </View>
    </Card>
  );

  if (loading) return <LoadingScreen />;

  return (
    <ThemedView>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onRefresh={fetchProducts}
        refreshing={loading}
        ListEmptyComponent={
          <EmptyState icon="cube-outline" message={t('common_no_data')} />
        }
      />
      <Button
        title={t('admin_add_product')}
        onPress={() => router.push('/admin/add-product')}
        fullWidth
        style={styles.fab}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 100 },
  productRow: { flexDirection: 'row', alignItems: 'center' },
  productImage: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  productInfo: { flex: 1 },
  actions: { padding: 8 },
  fab: { position: 'absolute', bottom: 20, left: 16, right: 16 },
});

import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { orderBy } from 'firebase/firestore';
import { ThemedView, ThemedText, Card, Button, LoadingScreen, EmptyState } from '../../src/components';
import { useTranslate } from '../../src/hooks/useTranslate';
import { useThemeStore } from '../../src/store/themeStore';
import { useCartStore } from '../../src/store/cartStore';
import { getDocuments } from '../../src/services/firestore';
import { COLLECTIONS } from '../../src/constants/collections';
import { Product } from '../../src/types';
import { Ionicons } from '@expo/vector-icons';

export default function ShopTab() {
  const router = useRouter();
  const { t, getLocalizedField } = useTranslate();
  const { colors } = useThemeStore();
  const { addItem, getTotalItems } = useCartStore();
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

  const totalItems = getTotalItems();

  const renderProduct = ({ item }: { item: Product & { id: string } }) => (
    <Card
      onPress={() => router.push(`/shop/${item.id}`)}
      style={styles.productCard}
    >
      {item.images?.[0] && (
        <Image source={{ uri: item.images[0] }} style={styles.productImage} />
      )}
      <View style={styles.productInfo}>
        <ThemedText variant="label" style={styles.productName}>
          {getLocalizedField(item, 'name')}
        </ThemedText>
        <ThemedText variant="caption" secondary numberOfLines={2}>
          {getLocalizedField(item, 'description')}
        </ThemedText>
        <View style={styles.priceRow}>
          <ThemedText variant="subtitle" style={{ color: colors.primary }}>
            PKR {item.price}
          </ThemedText>
          <Button
            title={t('shop_add_to_cart')}
            onPress={() => addItem(item)}
            variant="primary"
            style={styles.addButton}
            textStyle={styles.addButtonText}
          />
        </View>
      </View>
    </Card>
  );

  if (loading) return <LoadingScreen />;

  return (
    <ThemedView>
      {/* Cart button */}
      {totalItems > 0 && (
        <TouchableOpacity
          style={[styles.cartFab, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/shop/cart')}
        >
          <Ionicons name="cart" size={24} color="#FFF" />
          <View style={[styles.cartBadge, { backgroundColor: colors.error }]}>
            <ThemedText variant="caption" style={styles.cartBadgeText}>
              {totalItems}
            </ThemedText>
          </View>
        </TouchableOpacity>
      )}

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState icon="cart-outline" message={t('common_no_data')} />
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  productCard: {
    flexDirection: 'row',
    padding: 0,
    overflow: 'hidden',
  },
  productImage: {
    width: 100,
    height: 120,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  productInfo: {
    flex: 1,
    padding: 12,
  },
  productName: {
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  addButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    minHeight: 32,
  },
  addButtonText: {
    fontSize: 12,
  },
  cartFab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

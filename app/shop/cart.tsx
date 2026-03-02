import React from 'react';
import { FlatList, View, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView, ThemedText, Button, Card, EmptyState } from '../../src/components';
import { useTranslate } from '../../src/hooks/useTranslate';
import { useThemeStore } from '../../src/store/themeStore';
import { useCartStore } from '../../src/store/cartStore';
import { useAuthStore } from '../../src/store/authStore';
import { addDocument } from '../../src/services/firestore';
import { COLLECTIONS } from '../../src/constants/collections';
import { CartItem, Order } from '../../src/types';
import { Ionicons } from '@expo/vector-icons';

export default function CartScreen() {
  const router = useRouter();
  const { t, getLocalizedField } = useTranslate();
  const { colors } = useThemeStore();
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = useCartStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = React.useState(false);

  const handleCheckout = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    if (items.length === 0) return;

    setLoading(true);
    try {
      const order: Omit<Order, 'id' | 'createdAt'> = {
        userId: user.uid,
        products: items.map((item) => ({
          productId: item.product.id || '',
          name: getLocalizedField(item.product, 'name'),
          quantity: item.quantity,
          price: item.product.price,
        })),
        totalPrice: getTotalPrice(),
        status: 'pending',
      };
      await addDocument(COLLECTIONS.ORDERS, order);
      clearCart();
      Alert.alert(t('common_success'), t('shop_order_placed'));
      router.replace('/shop/orders');
    } catch (error) {
      Alert.alert(t('common_error'), 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <Card>
      <View style={styles.itemRow}>
        {item.product.images?.[0] && (
          <Image source={{ uri: item.product.images[0] }} style={styles.itemImage} />
        )}
        <View style={styles.itemInfo}>
          <ThemedText variant="label">{getLocalizedField(item.product, 'name')}</ThemedText>
          <ThemedText variant="body" style={{ color: colors.primary }}>
            PKR {item.product.price.toLocaleString()}
          </ThemedText>
          <View style={styles.quantityRow}>
            <TouchableOpacity
              style={[styles.quantityButton, { backgroundColor: colors.inputBackground }]}
              onPress={() => updateQuantity(item.product.id || '', item.quantity - 1)}
            >
              <Ionicons name="remove" size={18} color={colors.text} />
            </TouchableOpacity>
            <ThemedText variant="body" style={styles.quantityText}>
              {item.quantity}
            </ThemedText>
            <TouchableOpacity
              style={[styles.quantityButton, { backgroundColor: colors.inputBackground }]}
              onPress={() => updateQuantity(item.product.id || '', item.quantity + 1)}
            >
              <Ionicons name="add" size={18} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeItem(item.product.id || '')}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Card>
  );

  return (
    <ThemedView>
      <FlatList
        data={items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.product.id || ''}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState icon="cart-outline" message={t('shop_empty_cart')} />
        }
      />

      {items.length > 0 && (
        <View style={[styles.footer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.totalRow}>
            <ThemedText variant="subtitle">{t('common_total')}</ThemedText>
            <ThemedText variant="title" style={{ color: colors.primary }}>
              PKR {getTotalPrice().toLocaleString()}
            </ThemedText>
          </View>
          <Button
            title={t('shop_checkout')}
            onPress={handleCheckout}
            loading={loading}
            fullWidth
          />
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    paddingBottom: 200,
  },
  itemRow: {
    flexDirection: 'row',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    marginHorizontal: 16,
    fontWeight: '600',
  },
  removeButton: {
    marginLeft: 'auto',
    padding: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
});

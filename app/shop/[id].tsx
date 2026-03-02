import React, { useState, useEffect } from 'react';
import { ScrollView, View, Image, StyleSheet, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView, ThemedText, Button, LoadingScreen } from '../../src/components';
import { useTranslate } from '../../src/hooks/useTranslate';
import { useThemeStore } from '../../src/store/themeStore';
import { useCartStore } from '../../src/store/cartStore';
import { getDocument } from '../../src/services/firestore';
import { COLLECTIONS } from '../../src/constants/collections';
import { Product } from '../../src/types';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, getLocalizedField } = useTranslate();
  const { colors } = useThemeStore();
  const { addItem } = useCartStore();
  const [product, setProduct] = useState<(Product & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const data = await getDocument<Product>(COLLECTIONS.PRODUCTS, id);
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <LoadingScreen />;
  if (!product) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Product not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Product Image */}
        {product.images?.length > 0 && (
          <Image
            source={{ uri: product.images[currentImageIndex] }}
            style={styles.image}
            resizeMode="cover"
          />
        )}

        {/* Image Thumbnails */}
        {product.images?.length > 1 && (
          <ScrollView horizontal style={styles.thumbnailRow} showsHorizontalScrollIndicator={false}>
            {product.images.map((img, index) => (
              <Image
                key={index}
                source={{ uri: img }}
                style={[
                  styles.thumbnail,
                  index === currentImageIndex && { borderColor: colors.primary, borderWidth: 2 },
                ]}
                onTouchEnd={() => setCurrentImageIndex(index)}
              />
            ))}
          </ScrollView>
        )}

        {/* Product Info */}
        <View style={styles.info}>
          <ThemedText variant="title">
            {getLocalizedField(product, 'name')}
          </ThemedText>

          <ThemedText variant="title" style={[styles.price, { color: colors.primary }]}>
            PKR {product.price.toLocaleString()}
          </ThemedText>

          <View style={styles.stockRow}>
            <View
              style={[
                styles.stockBadge,
                { backgroundColor: product.stock > 0 ? '#E8F5E9' : '#FFEBEE' },
              ]}
            >
              <ThemedText
                variant="caption"
                style={{ color: product.stock > 0 ? '#1B5E20' : '#B71C1C' }}
              >
                {product.stock > 0 ? t('shop_in_stock') : t('shop_out_of_stock')}
              </ThemedText>
            </View>
            <ThemedText variant="caption" secondary>
              {product.category}
            </ThemedText>
          </View>

          <ThemedText variant="body" style={styles.description}>
            {getLocalizedField(product, 'description')}
          </ThemedText>

          <Button
            title={t('shop_add_to_cart')}
            onPress={() => {
              addItem(product);
              router.push('/shop/cart');
            }}
            fullWidth
            disabled={product.stock <= 0}
            style={styles.addToCartButton}
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingBottom: 40,
  },
  image: {
    width,
    height: width * 0.75,
  },
  thumbnailRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
  },
  info: {
    padding: 16,
  },
  price: {
    marginTop: 8,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  stockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  description: {
    marginTop: 16,
    lineHeight: 24,
  },
  addToCartButton: {
    marginTop: 24,
  },
});

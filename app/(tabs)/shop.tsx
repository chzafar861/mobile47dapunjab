import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  FlatList,
  Dimensions,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/lib/auth-context";
import { getApiUrl } from "@/lib/query-client";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

const { width } = Dimensions.get("window");

interface ShopItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  description: string;
  details: string;
  icon: string;
  iconSet: "ionicons" | "material";
  image: any;
  rating: number;
  reviews: number;
  inStock: boolean;
}

interface CartItem extends ShopItem {
  quantity: number;
  cartId?: string;
}

const productImages: Record<string, any> = {
  "1": require("@/assets/images/shop/jutti.jpg"),
  "2": require("@/assets/images/shop/phulkari.jpg"),
  "3": require("@/assets/images/shop/lassi-glass.jpg"),
  "4": require("@/assets/images/shop/truck-art.jpg"),
  "5": require("@/assets/images/shop/ajrak.jpg"),
  "6": require("@/assets/images/shop/spices.jpg"),
  "7": require("@/assets/images/shop/marble.jpg"),
  "8": require("@/assets/images/shop/prayer-rug.jpg"),
};

const defaultProducts: ShopItem[] = [
  {
    id: "1",
    name: "Punjabi Juttis",
    price: 35,
    originalPrice: 50,
    category: "Clothing",
    description: "Handcrafted traditional Punjabi footwear with beautiful embroidery",
    details: "Authentic hand-stitched Punjabi Juttis made by skilled artisans from Punjab. Features intricate embroidery work with gold and silver thread. Available in multiple sizes. Perfect as a gift or for traditional events.",
    icon: "footsteps",
    iconSet: "ionicons",
    image: productImages["1"],
    rating: 4.8,
    reviews: 124,
    inStock: true,
  },
  {
    id: "2",
    name: "Phulkari Dupatta",
    price: 55,
    originalPrice: 75,
    category: "Clothing",
    description: "Authentic hand-embroidered Phulkari from Punjab villages",
    details: "Genuine Phulkari dupatta hand-embroidered by village women of Punjab using traditional techniques passed down through generations. Made with pure cotton base fabric and silk thread embroidery. Each piece is unique.",
    icon: "color-palette",
    iconSet: "ionicons",
    image: productImages["2"],
    rating: 4.9,
    reviews: 89,
    inStock: true,
  },
  {
    id: "3",
    name: "Lassi Glass Set",
    price: 20,
    category: "Kitchen",
    description: "Traditional brass Lassi glasses, set of 4",
    details: "Set of 4 traditional brass Lassi glasses, perfect for serving authentic Punjabi Lassi. Hand-polished finish with a classic design that reflects the rich culture of Punjab. Food-safe brass material.",
    icon: "beer",
    iconSet: "ionicons",
    image: productImages["3"],
    rating: 4.5,
    reviews: 67,
    inStock: true,
  },
  {
    id: "4",
    name: "Truck Art Frame",
    price: 45,
    originalPrice: 60,
    category: "Art",
    description: "Beautiful Pakistani truck art painting in wooden frame",
    details: "Hand-painted Pakistani truck art on canvas, framed in a rustic wooden frame. Each piece celebrates the vibrant truck art tradition of Pakistan. Size: 12x16 inches. Makes a stunning wall piece.",
    icon: "bus",
    iconSet: "ionicons",
    image: productImages["4"],
    rating: 4.7,
    reviews: 156,
    inStock: true,
  },
  {
    id: "5",
    name: "Ajrak Shawl",
    price: 40,
    category: "Clothing",
    description: "Traditional block-printed Sindhi Ajrak in pure cotton",
    details: "Authentic Ajrak shawl from Sindh, Pakistan. Block-printed using natural dyes and traditional techniques. Made from premium cotton. The geometric patterns represent centuries of Sindhi heritage.",
    icon: "shirt",
    iconSet: "ionicons",
    image: productImages["5"],
    rating: 4.6,
    reviews: 93,
    inStock: true,
  },
  {
    id: "6",
    name: "Spice Box",
    price: 25,
    category: "Kitchen",
    description: "Premium Pakistani spice collection - 8 authentic spices",
    details: "Curated collection of 8 premium Pakistani spices: Garam Masala, Turmeric, Red Chili, Cumin, Coriander, Black Pepper, Cardamom, and Biryani Masala. Sourced directly from farms in Punjab and Sindh.",
    icon: "leaf",
    iconSet: "ionicons",
    image: productImages["6"],
    rating: 4.8,
    reviews: 201,
    inStock: true,
  },
  {
    id: "7",
    name: "Marble Handicraft",
    price: 60,
    originalPrice: 80,
    category: "Art",
    description: "Hand-carved marble vase from Swat Valley",
    details: "Exquisite hand-carved marble vase crafted by skilled artisans from the Swat Valley. Made from genuine Pakistani marble with intricate floral patterns. Height: 8 inches. A timeless piece of art.",
    icon: "diamond",
    iconSet: "ionicons",
    image: productImages["7"],
    rating: 4.9,
    reviews: 45,
    inStock: true,
  },
  {
    id: "8",
    name: "Prayer Rug",
    price: 30,
    category: "Home",
    description: "Luxurious velvet prayer rug with intricate design",
    details: "Premium velvet prayer rug with beautiful geometric and floral patterns. Soft, thick pile for comfortable prayers. Size: 27x45 inches. Easy to fold and carry. Perfect for home or travel.",
    icon: "texture",
    iconSet: "material",
    image: productImages["8"],
    rating: 4.7,
    reviews: 178,
    inStock: true,
  },
];

const categories = ["All", "Clothing", "Kitchen", "Art", "Home"];

async function shopFetch(path: string, options: RequestInit = {}) {
  const baseUrl = getApiUrl();
  const url = new URL(path, baseUrl);
  const res = await globalThis.fetch(url.toString(), {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function StarRating({ rating, size = 12 }: { rating: number; size?: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(<Ionicons key={i} name="star" size={size} color="#F59E0B" />);
    } else if (i - 0.5 <= rating) {
      stars.push(<Ionicons key={i} name="star-half" size={size} color="#F59E0B" />);
    } else {
      stars.push(<Ionicons key={i} name="star-outline" size={size} color="#D1D5DB" />);
    }
  }
  return <View style={{ flexDirection: "row", gap: 1 }}>{stars}</View>;
}

function ProductCard({ item, onAddToCart, onPress }: { item: ShopItem; onAddToCart: () => void; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.productCard,
        { transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
      onPress={onPress}
    >
      <Image source={item.image} style={styles.productImage} resizeMode="cover" />
      {item.originalPrice && (
        <View style={styles.saleBadge}>
          <Text style={styles.saleBadgeText}>
            {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
          </Text>
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.ratingRow}>
          <StarRating rating={item.rating} />
          <Text style={styles.reviewCount}>({item.reviews})</Text>
        </View>
        <View style={styles.productBottom}>
          <View>
            <Text style={styles.productPrice}>${item.price}</Text>
            {item.originalPrice && (
              <Text style={styles.originalPrice}>${item.originalPrice}</Text>
            )}
          </View>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onAddToCart();
            }}
            style={({ pressed }) => [styles.addBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Ionicons name="add" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [showProduct, setShowProduct] = useState<ShopItem | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "card">("cod");
  const [cardForm, setCardForm] = useState({ number: "", expiry: "", cvv: "", holder: "" });
  const [showErrors, setShowErrors] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: "",
    city: user?.city || "",
    country: "Pakistan",
  });

  useEffect(() => {
    if (user) {
      setCheckoutForm((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        phone: prev.phone || user.phone || "",
        city: prev.city || user.city || "",
      }));
    }
  }, [user]);

  const addToCart = (item: ShopItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    if (Platform.OS === "web") {
      // silent on web
    } else {
      Alert.alert("Added", `${item.name} added to cart`);
    }
  };

  const removeFromCart = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCart((prev) =>
      prev
        .map((c) => c.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)
        .filter((c) => c.quantity > 0)
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 16);
    return cleaned.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length > 2) return cleaned.slice(0, 2) + "/" + cleaned.slice(2);
    return cleaned;
  };

  const placeOrder = async () => {
    setShowErrors(true);
    if (!checkoutForm.name.trim() || !checkoutForm.phone.trim() || !checkoutForm.address.trim() || !checkoutForm.city.trim()) {
      Alert.alert("Required", "Please fill in all delivery details.");
      return;
    }
    if (paymentMethod === "card") {
      const num = cardForm.number.replace(/\s/g, "");
      if (num.length < 13 || num.length > 19) {
        Alert.alert("Invalid Card", "Please enter a valid card number.");
        return;
      }
      if (cardForm.expiry.length < 5) {
        Alert.alert("Invalid Expiry", "Please enter a valid expiry date (MM/YY).");
        return;
      }
      if (cardForm.cvv.length < 3) {
        Alert.alert("Invalid CVV", "Please enter a valid CVV.");
        return;
      }
      if (!cardForm.holder.trim()) {
        Alert.alert("Required", "Please enter the cardholder name.");
        return;
      }
    }
    setPlacing(true);
    try {
      await shopFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          items: cart.map((c) => ({ id: c.id, name: c.name, price: c.price, quantity: c.quantity })),
          total: cartTotal,
          customer_name: checkoutForm.name.trim(),
          customer_phone: checkoutForm.phone.trim(),
          customer_address: checkoutForm.address.trim(),
          customer_city: checkoutForm.city.trim(),
          customer_country: checkoutForm.country.trim(),
          payment_method: paymentMethod,
        }),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCart([]);
      setShowCheckout(false);
      setShowCart(false);
      setShowErrors(false);
      setOrderPlaced(true);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not place order.");
    } finally {
      setPlacing(false);
    }
  };

  const filteredProducts = defaultProducts.filter((p) => {
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={styles.container}>
      <View style={{ paddingTop: insets.top + webTopInset + 16, paddingHorizontal: 16 }}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.headerTitle}>Shop</Text>
            <Text style={styles.headerSub}>Authentic Pakistani Crafts</Text>
          </View>
          <Pressable
            onPress={() => { setShowCart(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={styles.cartBtn}
          >
            <Ionicons name="bag-handle" size={24} color={Colors.light.text} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.light.tabIconDefault} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={Colors.light.tabIconDefault}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={Colors.light.tabIconDefault} />
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {categories.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat && styles.categoryTextActive,
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingBottom: insets.bottom + webBottomInset + 100,
          paddingTop: 8,
        }}
        columnWrapperStyle={{ gap: 10 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <ProductCard
            item={item}
            onAddToCart={() => addToCart(item)}
            onPress={() => setShowProduct(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="bag-outline" size={48} color={Colors.light.tabIconDefault} />
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        }
        scrollEnabled={filteredProducts.length > 0}
      />

      <Modal visible={showProduct !== null} animationType="slide" transparent>
        {showProduct && (
          <View style={styles.modalOverlay}>
            <View style={[styles.productDetailModal, { paddingTop: insets.top + 10 }]}>
              <Pressable onPress={() => setShowProduct(null)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </Pressable>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <Image source={showProduct.image} style={styles.detailImage} resizeMode="cover" />
                <View style={styles.detailContent}>
                  <View style={styles.detailCategoryBadge}>
                    <Text style={styles.detailCategoryText}>{showProduct.category}</Text>
                  </View>
                  <Text style={styles.detailName}>{showProduct.name}</Text>
                  <View style={styles.detailRatingRow}>
                    <StarRating rating={showProduct.rating} size={16} />
                    <Text style={styles.detailRatingText}>{showProduct.rating} ({showProduct.reviews} reviews)</Text>
                  </View>
                  <View style={styles.detailPriceRow}>
                    <Text style={styles.detailPrice}>${showProduct.price}</Text>
                    {showProduct.originalPrice && (
                      <Text style={styles.detailOriginalPrice}>${showProduct.originalPrice}</Text>
                    )}
                    {showProduct.originalPrice && (
                      <View style={styles.detailSaveBadge}>
                        <Text style={styles.detailSaveText}>Save ${showProduct.originalPrice - showProduct.price}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.detailDivider} />
                  <Text style={styles.detailSectionTitle}>About this product</Text>
                  <Text style={styles.detailDescription}>{showProduct.details}</Text>
                  <View style={styles.detailDivider} />
                  <View style={styles.detailFeatures}>
                    <View style={styles.featureItem}>
                      <Ionicons name="shield-checkmark" size={20} color={Colors.light.success} />
                      <Text style={styles.featureText}>Authentic</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="airplane" size={20} color={Colors.light.primary} />
                      <Text style={styles.featureText}>Free Shipping</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="refresh" size={20} color={Colors.light.accent} />
                      <Text style={styles.featureText}>Easy Returns</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
              <View style={[styles.detailFooter, { paddingBottom: insets.bottom + 10 }]}>
                <View style={styles.detailBtnRow}>
                  <Pressable
                    onPress={() => { addToCart(showProduct); setShowProduct(null); }}
                    style={({ pressed }) => [styles.addToCartBtn, styles.addToCartHalf, { opacity: pressed ? 0.9 : 1 }]}
                  >
                    <Ionicons name="bag-add" size={20} color="#fff" />
                    <Text style={styles.addToCartBtnText}>Add to Cart</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      addToCart(showProduct);
                      setShowProduct(null);
                      setShowCheckout(true);
                    }}
                    style={({ pressed }) => [styles.buyNowBtn, { opacity: pressed ? 0.9 : 1 }]}
                  >
                    <Ionicons name="flash" size={20} color="#fff" />
                    <Text style={styles.addToCartBtnText}>Buy Now</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        )}
      </Modal>

      <Modal visible={showCart} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.cartModal, { paddingTop: insets.top + 10 }]}>
            <View style={styles.cartHeader}>
              <Text style={styles.cartTitle}>Your Cart ({cartCount})</Text>
              <Pressable onPress={() => setShowCart(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </Pressable>
            </View>
            {cart.length === 0 ? (
              <View style={styles.cartEmpty}>
                <Ionicons name="bag-outline" size={64} color={Colors.light.tabIconDefault} />
                <Text style={styles.cartEmptyTitle}>Your cart is empty</Text>
                <Text style={styles.cartEmptyDesc}>Browse our collection and add some authentic Pakistani crafts</Text>
                <Pressable
                  onPress={() => setShowCart(false)}
                  style={({ pressed }) => [styles.continueShopping, { opacity: pressed ? 0.9 : 1 }]}
                >
                  <Text style={styles.continueShoppingText}>Continue Shopping</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                  {cart.map((item) => (
                    <View key={item.id} style={styles.cartItem}>
                      <Image source={item.image} style={styles.cartItemImage} resizeMode="cover" />
                      <View style={styles.cartItemInfo}>
                        <Text style={styles.cartItemName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.cartItemPrice}>${item.price}</Text>
                        <View style={styles.quantityRow}>
                          <Pressable onPress={() => updateQuantity(item.id, -1)} style={styles.qtyBtn}>
                            <Ionicons name="remove" size={16} color={Colors.light.text} />
                          </Pressable>
                          <Text style={styles.qtyText}>{item.quantity}</Text>
                          <Pressable onPress={() => updateQuantity(item.id, 1)} style={styles.qtyBtn}>
                            <Ionicons name="add" size={16} color={Colors.light.text} />
                          </Pressable>
                        </View>
                      </View>
                      <View style={styles.cartItemRight}>
                        <Text style={styles.cartItemTotal}>${(item.price * item.quantity).toFixed(2)}</Text>
                        <Pressable onPress={() => removeFromCart(item.id)}>
                          <Ionicons name="trash-outline" size={18} color={Colors.light.danger} />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </ScrollView>
                <View style={[styles.cartFooter, { paddingBottom: insets.bottom + 10 }]}>
                  <View style={styles.cartSummary}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Subtotal</Text>
                      <Text style={styles.summaryValue}>${cartTotal.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Shipping</Text>
                      <Text style={[styles.summaryValue, { color: Colors.light.success }]}>Free</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                      <Text style={styles.totalLabel}>Total</Text>
                      <Text style={styles.totalValue}>${cartTotal.toFixed(2)}</Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => { setShowCart(false); setShowCheckout(true); }}
                    style={({ pressed }) => [styles.checkoutBtn, { opacity: pressed ? 0.9 : 1 }]}
                  >
                    <Ionicons name="card" size={20} color="#fff" />
                    <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showCheckout} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.cartModal, { paddingTop: insets.top + 10 }]}>
            <View style={styles.cartHeader}>
              <Text style={styles.cartTitle}>Checkout</Text>
              <Pressable onPress={() => { setShowCheckout(false); setShowErrors(false); }} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={styles.checkoutSection}>
                <Text style={styles.checkoutSectionTitle}>Order Summary</Text>
                {cart.map((item) => (
                  <View key={item.id} style={styles.checkoutItem}>
                    <Text style={styles.checkoutItemName}>{item.name} x{item.quantity}</Text>
                    <Text style={styles.checkoutItemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
                  </View>
                ))}
                <View style={styles.summaryDivider} />
                <View style={styles.checkoutItem}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>${cartTotal.toFixed(2)}</Text>
                </View>
              </View>

              <View style={styles.checkoutSection}>
                <Text style={styles.checkoutSectionTitle}>Delivery Details</Text>
                <Text style={styles.checkoutFieldLabel}>Full Name *</Text>
                <TextInput
                  style={[styles.checkoutInput, showErrors && !checkoutForm.name.trim() && { borderColor: Colors.light.danger }]}
                  value={checkoutForm.name}
                  onChangeText={(t) => setCheckoutForm({ ...checkoutForm, name: t })}
                  placeholder="Your full name"
                  placeholderTextColor={Colors.light.tabIconDefault}
                />
                <Text style={styles.checkoutFieldLabel}>Phone Number *</Text>
                <TextInput
                  style={[styles.checkoutInput, showErrors && !checkoutForm.phone.trim() && { borderColor: Colors.light.danger }]}
                  value={checkoutForm.phone}
                  onChangeText={(t) => setCheckoutForm({ ...checkoutForm, phone: t })}
                  placeholder="e.g. +92 300 1234567"
                  placeholderTextColor={Colors.light.tabIconDefault}
                  keyboardType="phone-pad"
                />
                <Text style={styles.checkoutFieldLabel}>Delivery Address *</Text>
                <TextInput
                  style={[styles.checkoutInput, showErrors && !checkoutForm.address.trim() && { borderColor: Colors.light.danger }, { minHeight: 70 }]}
                  value={checkoutForm.address}
                  onChangeText={(t) => setCheckoutForm({ ...checkoutForm, address: t })}
                  placeholder="Full delivery address"
                  placeholderTextColor={Colors.light.tabIconDefault}
                  multiline
                  textAlignVertical="top"
                />
                <Text style={styles.checkoutFieldLabel}>City *</Text>
                <TextInput
                  style={[styles.checkoutInput, showErrors && !checkoutForm.city.trim() && { borderColor: Colors.light.danger }]}
                  value={checkoutForm.city}
                  onChangeText={(t) => setCheckoutForm({ ...checkoutForm, city: t })}
                  placeholder="e.g. Lahore, Karachi"
                  placeholderTextColor={Colors.light.tabIconDefault}
                />
              </View>

              <View style={styles.checkoutSection}>
                <Text style={styles.checkoutSectionTitle}>Country</Text>
                <View style={styles.countryRow}>
                  <Pressable
                    onPress={() => {
                      setCheckoutForm({ ...checkoutForm, country: "Pakistan" });
                      setPaymentMethod("cod");
                    }}
                    style={[styles.countryChip, checkoutForm.country === "Pakistan" && styles.countryChipActive]}
                  >
                    <Text style={styles.countryFlag}>PK</Text>
                    <Text style={[styles.countryChipText, checkoutForm.country === "Pakistan" && styles.countryChipTextActive]}>Pakistan</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setCheckoutForm({ ...checkoutForm, country: "International" });
                      setPaymentMethod("card");
                    }}
                    style={[styles.countryChip, checkoutForm.country === "International" && styles.countryChipActive]}
                  >
                    <Ionicons name="globe-outline" size={16} color={checkoutForm.country === "International" ? "#fff" : Colors.light.textSecondary} />
                    <Text style={[styles.countryChipText, checkoutForm.country === "International" && styles.countryChipTextActive]}>International</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.checkoutSection}>
                <Text style={styles.checkoutSectionTitle}>Payment Method</Text>
                {checkoutForm.country === "Pakistan" ? (
                  <>
                    <Pressable
                      onPress={() => setPaymentMethod("cod")}
                      style={[styles.paymentOption, paymentMethod === "cod" && styles.paymentOptionActive]}
                    >
                      <MaterialCommunityIcons name="cash" size={24} color={paymentMethod === "cod" ? Colors.light.success : Colors.light.textSecondary} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.codTitle}>Cash on Delivery</Text>
                        <Text style={styles.codDesc}>Pay when you receive your order</Text>
                      </View>
                      <View style={[styles.radioOuter, paymentMethod === "cod" && styles.radioOuterActive]}>
                        {paymentMethod === "cod" && <View style={styles.radioInner} />}
                      </View>
                    </Pressable>
                    <Pressable
                      onPress={() => setPaymentMethod("card")}
                      style={[styles.paymentOption, { marginTop: 10 }, paymentMethod === "card" && styles.paymentOptionActive]}
                    >
                      <Ionicons name="card" size={24} color={paymentMethod === "card" ? "#1976D2" : Colors.light.textSecondary} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.codTitle}>ATM / Debit Card</Text>
                        <Text style={styles.codDesc}>Pay with your bank card</Text>
                      </View>
                      <View style={[styles.radioOuter, paymentMethod === "card" && styles.radioOuterActive]}>
                        {paymentMethod === "card" && <View style={styles.radioInner} />}
                      </View>
                    </Pressable>
                  </>
                ) : (
                  <View style={[styles.paymentOption, styles.paymentOptionActive]}>
                    <Ionicons name="card" size={24} color="#1976D2" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.codTitle}>Credit / Debit Card</Text>
                      <Text style={styles.codDesc}>International card payment</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={24} color={Colors.light.success} />
                  </View>
                )}

                {paymentMethod === "card" && (
                  <View style={styles.cardFormWrapper}>
                    <View style={styles.cardIconsRow}>
                      <Ionicons name="card" size={20} color="#1A73E8" />
                      <MaterialCommunityIcons name="credit-card-outline" size={20} color="#EB001B" />
                      <MaterialCommunityIcons name="credit-card" size={20} color="#F79E1B" />
                    </View>
                    <Text style={styles.checkoutFieldLabel}>Card Number *</Text>
                    <TextInput
                      style={[styles.checkoutInput, showErrors && paymentMethod === "card" && cardForm.number.replace(/\s/g, "").length < 13 && { borderColor: Colors.light.danger }]}
                      value={cardForm.number}
                      onChangeText={(t) => setCardForm({ ...cardForm, number: formatCardNumber(t) })}
                      placeholder="1234 5678 9012 3456"
                      placeholderTextColor={Colors.light.tabIconDefault}
                      keyboardType="number-pad"
                      maxLength={19}
                    />
                    <Text style={styles.checkoutFieldLabel}>Cardholder Name *</Text>
                    <TextInput
                      style={[styles.checkoutInput, showErrors && paymentMethod === "card" && !cardForm.holder.trim() && { borderColor: Colors.light.danger }]}
                      value={cardForm.holder}
                      onChangeText={(t) => setCardForm({ ...cardForm, holder: t })}
                      placeholder="Name on card"
                      placeholderTextColor={Colors.light.tabIconDefault}
                      autoCapitalize="characters"
                    />
                    <View style={styles.cardRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.checkoutFieldLabel}>Expiry *</Text>
                        <TextInput
                          style={[styles.checkoutInput, showErrors && paymentMethod === "card" && cardForm.expiry.length < 5 && { borderColor: Colors.light.danger }]}
                          value={cardForm.expiry}
                          onChangeText={(t) => setCardForm({ ...cardForm, expiry: formatExpiry(t) })}
                          placeholder="MM/YY"
                          placeholderTextColor={Colors.light.tabIconDefault}
                          keyboardType="number-pad"
                          maxLength={5}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.checkoutFieldLabel}>CVV *</Text>
                        <TextInput
                          style={[styles.checkoutInput, showErrors && paymentMethod === "card" && cardForm.cvv.length < 3 && { borderColor: Colors.light.danger }]}
                          value={cardForm.cvv}
                          onChangeText={(t) => setCardForm({ ...cardForm, cvv: t.replace(/\D/g, "").slice(0, 4) })}
                          placeholder="123"
                          placeholderTextColor={Colors.light.tabIconDefault}
                          keyboardType="number-pad"
                          maxLength={4}
                          secureTextEntry
                        />
                      </View>
                    </View>
                    <View style={styles.secureNotice}>
                      <Ionicons name="lock-closed" size={14} color={Colors.light.success} />
                      <Text style={styles.secureNoticeText}>Your card details are secure and encrypted</Text>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
            <View style={[styles.cartFooter, { paddingBottom: insets.bottom + 10 }]}>
              <Pressable
                onPress={placeOrder}
                disabled={placing}
                style={({ pressed }) => [styles.placeOrderBtn, { opacity: pressed || placing ? 0.8 : 1 }]}
              >
                {placing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.placeOrderBtnText}>Place Order - ${cartTotal.toFixed(2)}</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={orderPlaced} animationType="fade" transparent>
        <View style={styles.orderSuccessOverlay}>
          <View style={styles.orderSuccessCard}>
            <View style={styles.successCircle}>
              <Ionicons name="checkmark" size={48} color="#fff" />
            </View>
            <Text style={styles.orderSuccessTitle}>Order Placed!</Text>
            <Text style={styles.orderSuccessDesc}>
              Your order has been placed successfully. We'll contact you shortly to confirm delivery details.
            </Text>
            <Text style={styles.orderSuccessNote}>Payment: Cash on Delivery</Text>
            <Pressable
              onPress={() => setOrderPlaced(false)}
              style={({ pressed }) => [styles.orderSuccessBtn, { opacity: pressed ? 0.9 : 1 }]}
            >
              <Text style={styles.orderSuccessBtnText}>Continue Shopping</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const cardWidth = (width - 34) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    color: Colors.light.text,
  },
  headerSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: -2,
  },
  cartBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadge: {
    position: "absolute" as const,
    top: 2,
    right: 2,
    backgroundColor: Colors.light.danger,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    color: "#fff",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.text,
    padding: 0,
  },
  categoryRow: {
    gap: 8,
    paddingBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  categoryChipActive: {
    backgroundColor: Colors.light.primary,
  },
  categoryText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  categoryTextActive: {
    color: "#fff",
  },
  productCard: {
    width: cardWidth,
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: 120,
  },
  saleBadge: {
    position: "absolute" as const,
    top: 8,
    left: 8,
    backgroundColor: Colors.light.danger,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  saleBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    color: "#fff",
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.light.text,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  reviewCount: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  productBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 8,
  },
  productPrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: Colors.light.primary,
  },
  originalPrice: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.tabIconDefault,
    textDecorationLine: "line-through",
  },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  productDetailModal: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 40,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  detailImage: {
    width: "100%",
    height: 260,
  },
  detailContent: {
    padding: 20,
  },
  detailCategoryBadge: {
    alignSelf: "flex-start" as const,
    backgroundColor: Colors.light.primary + "15",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  detailCategoryText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: Colors.light.primary,
  },
  detailName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: Colors.light.text,
  },
  detailRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  detailRatingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  detailPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  detailPrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: Colors.light.primary,
  },
  detailOriginalPrice: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    textDecorationLine: "line-through",
  },
  detailSaveBadge: {
    backgroundColor: Colors.light.danger + "15",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  detailSaveText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: Colors.light.danger,
  },
  detailDivider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 16,
  },
  detailSectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 8,
  },
  detailDescription: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  detailFeatures: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  featureItem: {
    alignItems: "center",
    gap: 6,
  },
  featureText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  detailFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  detailBtnRow: {
    flexDirection: "row",
    gap: 10,
  },
  addToCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    padding: 16,
  },
  addToCartHalf: {
    flex: 1,
  },
  buyNowBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.accent,
    borderRadius: 14,
    padding: 16,
  },
  addToCartBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  cartModal: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 40,
    paddingHorizontal: 20,
  },
  cartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  cartTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: Colors.light.text,
  },
  cartEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  cartEmptyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: Colors.light.text,
    marginTop: 16,
  },
  cartEmptyDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  continueShopping: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  continueShoppingText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border + "60",
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.light.text,
  },
  cartItemPrice: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  qtyText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.light.text,
    minWidth: 20,
    textAlign: "center",
  },
  cartItemRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  cartItemTotal: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: Colors.light.primary,
  },
  cartFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  cartSummary: {
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  summaryLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  summaryValue: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: Colors.light.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 8,
  },
  totalLabel: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: Colors.light.text,
  },
  totalValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: Colors.light.primary,
  },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    padding: 16,
  },
  checkoutBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
  checkoutSection: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  checkoutSectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 12,
  },
  checkoutItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  checkoutItemName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  checkoutItemPrice: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: Colors.light.text,
  },
  checkoutFieldLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 10,
    marginBottom: 6,
  },
  checkoutInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  countryRow: {
    flexDirection: "row",
    gap: 10,
  },
  countryChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
  },
  countryChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  countryFlag: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  countryChipText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  countryChipTextActive: {
    color: "#fff",
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
  },
  paymentOptionActive: {
    borderColor: Colors.light.primary + "60",
    backgroundColor: Colors.light.primary + "08",
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: {
    borderColor: Colors.light.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.light.primary,
  },
  cardFormWrapper: {
    marginTop: 14,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardIconsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 4,
  },
  cardRow: {
    flexDirection: "row",
    gap: 12,
  },
  secureNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    justifyContent: "center",
  },
  secureNoticeText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.success,
  },
  codTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.light.text,
  },
  codDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  placeOrderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.success,
    borderRadius: 14,
    padding: 16,
  },
  placeOrderBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
  orderSuccessOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  orderSuccessCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  orderSuccessTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: Colors.light.text,
  },
  orderSuccessDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  orderSuccessNote: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.success,
    marginTop: 12,
  },
  orderSuccessBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 24,
  },
  orderSuccessBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
});

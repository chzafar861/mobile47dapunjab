import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { firebaseApi } from "@/lib/firebase";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

const { width } = Dimensions.get("window");

interface ShopItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  icon: string;
  iconSet: "ionicons" | "material";
}

const defaultProducts: ShopItem[] = [
  {
    id: "1",
    name: "Punjabi Juttis",
    price: 35,
    category: "Clothing",
    description: "Handcrafted traditional Punjabi footwear with beautiful embroidery",
    icon: "footsteps",
    iconSet: "ionicons",
  },
  {
    id: "2",
    name: "Phulkari Dupatta",
    price: 55,
    category: "Clothing",
    description: "Authentic hand-embroidered Phulkari from Punjab villages",
    icon: "color-palette",
    iconSet: "ionicons",
  },
  {
    id: "3",
    name: "Lassi Glass Set",
    price: 20,
    category: "Kitchen",
    description: "Traditional brass Lassi glasses, set of 4",
    icon: "beer",
    iconSet: "ionicons",
  },
  {
    id: "4",
    name: "Truck Art Frame",
    price: 45,
    category: "Art",
    description: "Beautiful Pakistani truck art painting in wooden frame",
    icon: "bus",
    iconSet: "ionicons",
  },
  {
    id: "5",
    name: "Ajrak Shawl",
    price: 40,
    category: "Clothing",
    description: "Traditional block-printed Sindhi Ajrak in pure cotton",
    icon: "shirt",
    iconSet: "ionicons",
  },
  {
    id: "6",
    name: "Spice Box",
    price: 25,
    category: "Kitchen",
    description: "Premium Pakistani spice collection - 8 authentic spices",
    icon: "leaf",
    iconSet: "ionicons",
  },
  {
    id: "7",
    name: "Marble Handicraft",
    price: 60,
    category: "Art",
    description: "Hand-carved marble vase from Swat Valley",
    icon: "diamond",
    iconSet: "ionicons",
  },
  {
    id: "8",
    name: "Prayer Rug",
    price: 30,
    category: "Home",
    description: "Luxurious velvet prayer rug with intricate design",
    icon: "texture",
    iconSet: "material",
  },
];

const categories = ["All", "Clothing", "Kitchen", "Art", "Home"];

interface ProductCardProps {
  item: ShopItem;
  onAddToCart: () => void;
}

function ProductCard({ item, onAddToCart }: ProductCardProps) {
  const bgColors: Record<string, string> = {
    Clothing: "#E8F5E9",
    Kitchen: "#FFF3E0",
    Art: "#E3F2FD",
    Home: "#F3E5F5",
  };
  const iconColors: Record<string, string> = {
    Clothing: Colors.light.primary,
    Kitchen: Colors.light.accent,
    Art: "#1976D2",
    Home: "#7B1FA2",
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.productCard,
        { transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
      onPress={onAddToCart}
    >
      <View style={[styles.productIconArea, { backgroundColor: bgColors[item.category] || "#F5F5F5" }]}>
        {item.iconSet === "material" ? (
          <MaterialCommunityIcons name={item.icon as any} size={32} color={iconColors[item.category] || Colors.light.primary} />
        ) : (
          <Ionicons name={item.icon as any} size={32} color={iconColors[item.category] || Colors.light.primary} />
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productDesc} numberOfLines={2}>{item.description}</Text>
        <View style={styles.productBottom}>
          <Text style={styles.productPrice}>${item.price}</Text>
          <View style={styles.addBtn}>
            <Ionicons name="add" size={18} color="#fff" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<ShopItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const items = await firebaseApi.getCart();
      setCart(items);
    } catch {}
  };

  const addToCart = async (item: ShopItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await firebaseApi.addToCart(item);
      setCart((prev) => [...prev, item]);
      Alert.alert("Added to Cart", `${item.name} has been added to your cart.`);
    } catch {
      Alert.alert("Error", "Could not add to cart.");
    }
  };

  const filteredProducts = defaultProducts.filter((p) => {
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={styles.container}>
      <View style={{ paddingTop: insets.top + webTopInset + 16, paddingHorizontal: 16 }}>
        <View style={styles.topRow}>
          <Text style={styles.headerTitle}>Shop</Text>
          <Pressable style={styles.cartBtn}>
            <Ionicons name="bag-handle" size={24} color={Colors.light.text} />
            {cart.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cart.length}</Text>
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
          <ProductCard item={item} onAddToCart={() => addToCart(item)} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="bag-outline" size={48} color={Colors.light.tabIconDefault} />
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        }
        scrollEnabled={filteredProducts.length > 0}
      />
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
  cartBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: Colors.light.danger,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
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
  productIconArea: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.light.text,
  },
  productDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  productBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  productPrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: Colors.light.primary,
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
});

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
  TextInput,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { firebaseApi } from "@/lib/firebase";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

interface RentalItem {
  id: string;
  title: string;
  type: "property" | "vehicle" | "equipment";
  price: number;
  priceUnit: string;
  location: string;
  features: string[];
  icon: string;
  available: boolean;
}

const defaultRentals: RentalItem[] = [
  {
    id: "r1",
    title: "Family House in Lahore",
    type: "property",
    price: 500,
    priceUnit: "month",
    location: "Model Town, Lahore",
    features: ["4 Bedrooms", "Garden", "Parking"],
    icon: "home",
    available: true,
  },
  {
    id: "r2",
    title: "Furnished Apartment",
    type: "property",
    price: 350,
    priceUnit: "month",
    location: "Gulberg, Lahore",
    features: ["2 Bedrooms", "AC", "Kitchen"],
    icon: "business",
    available: true,
  },
  {
    id: "r3",
    title: "Toyota Land Cruiser",
    type: "vehicle",
    price: 80,
    priceUnit: "day",
    location: "Islamabad",
    features: ["Driver Included", "AC", "GPS"],
    icon: "car-sport",
    available: true,
  },
  {
    id: "r4",
    title: "Village Farmhouse",
    type: "property",
    price: 200,
    priceUnit: "month",
    location: "Sialkot District",
    features: ["5 Bedrooms", "Farm", "Well Water"],
    icon: "home",
    available: false,
  },
  {
    id: "r5",
    title: "Honda Civic",
    type: "vehicle",
    price: 45,
    priceUnit: "day",
    location: "Lahore / Islamabad",
    features: ["Self-Drive", "AC", "Automatic"],
    icon: "car",
    available: true,
  },
  {
    id: "r6",
    title: "Camera Equipment",
    type: "equipment",
    price: 30,
    priceUnit: "day",
    location: "Lahore",
    features: ["DSLR Camera", "Tripod", "Lights"],
    icon: "camera",
    available: true,
  },
  {
    id: "r7",
    title: "Coaster Bus (22 Seats)",
    type: "vehicle",
    price: 120,
    priceUnit: "day",
    location: "Punjab Wide",
    features: ["Driver", "AC", "22 Seats"],
    icon: "bus",
    available: true,
  },
  {
    id: "r8",
    title: "Wedding Tent & Decor",
    type: "equipment",
    price: 300,
    priceUnit: "event",
    location: "Punjab Wide",
    features: ["Tent", "Lights", "Chairs"],
    icon: "sparkles",
    available: true,
  },
];

const typeFilters = ["All", "Property", "Vehicle", "Equipment"];

interface RentalCardProps {
  item: RentalItem;
  onInquire: () => void;
}

function RentalCard({ item, onInquire }: RentalCardProps) {
  const typeColors: Record<string, string> = {
    property: Colors.light.primary,
    vehicle: "#1976D2",
    equipment: Colors.light.accent,
  };

  return (
    <Pressable
      onPress={onInquire}
      style={({ pressed }) => [
        styles.rentalCard,
        { opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={[styles.rentalIconWrap, { backgroundColor: typeColors[item.type] + "15" }]}>
        <Ionicons name={item.icon as any} size={28} color={typeColors[item.type]} />
      </View>
      <View style={styles.rentalInfo}>
        <View style={styles.rentalTopRow}>
          <Text style={styles.rentalTitle} numberOfLines={1}>{item.title}</Text>
          {!item.available && (
            <View style={styles.unavailableBadge}>
              <Text style={styles.unavailableText}>Booked</Text>
            </View>
          )}
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={Colors.light.textSecondary} />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
        <View style={styles.featuresRow}>
          {item.features.slice(0, 3).map((f, i) => (
            <View key={i} style={styles.featureTag}>
              <Text style={styles.featureTagText}>{f}</Text>
            </View>
          ))}
        </View>
        <View style={styles.rentalBottom}>
          <View style={styles.priceRow}>
            <Text style={styles.rentalPrice}>${item.price}</Text>
            <Text style={styles.rentalUnit}>/{item.priceUnit}</Text>
          </View>
          {item.available && (
            <View style={[styles.inquireBtn, { backgroundColor: typeColors[item.type] }]}>
              <Ionicons name="chatbubble-outline" size={14} color="#fff" />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function RentScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const [selectedType, setSelectedType] = useState("All");

  const filteredRentals = defaultRentals.filter(
    (r) => selectedType === "All" || r.type === selectedType.toLowerCase()
  );

  const handleInquire = async (item: RentalItem) => {
    if (!item.available) {
      Alert.alert("Not Available", "This item is currently booked. Please check back later.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await firebaseApi.addRentalInquiry({
        rentalId: item.id,
        title: item.title,
        type: item.type,
        price: item.price,
        date: new Date().toISOString(),
      });
    } catch {}
    Alert.alert(
      "Inquiry Sent",
      `Your inquiry for "${item.title}" has been sent. We will contact you soon with availability and details.`
    );
  };

  return (
    <View style={styles.container}>
      <View style={{ paddingTop: insets.top + webTopInset + 16, paddingHorizontal: 16 }}>
        <Text style={styles.headerTitle}>Rentals</Text>
        <Text style={styles.headerSubtitle}>Properties, vehicles & equipment in Punjab</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {typeFilters.map((type) => (
            <Pressable
              key={type}
              onPress={() => setSelectedType(type)}
              style={[
                styles.filterChip,
                selectedType === type && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedType === type && styles.filterTextActive,
                ]}
              >
                {type}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredRentals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + webBottomInset + 100,
          paddingTop: 4,
        }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <RentalCard item={item} onInquire={() => handleInquire(item)} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="key-outline" size={48} color={Colors.light.tabIconDefault} />
            <Text style={styles.emptyText}>No rentals available</Text>
          </View>
        }
        scrollEnabled={filteredRentals.length > 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  filterRow: {
    gap: 8,
    paddingBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  filterChipActive: {
    backgroundColor: Colors.light.primary,
  },
  filterText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  filterTextActive: {
    color: "#fff",
  },
  rentalCard: {
    flexDirection: "row",
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  rentalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rentalInfo: {
    flex: 1,
  },
  rentalTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rentalTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
    flex: 1,
  },
  unavailableBadge: {
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  unavailableText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 10,
    color: Colors.light.danger,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  featuresRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
    flexWrap: "wrap",
  },
  featureTag: {
    backgroundColor: Colors.light.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featureTagText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  rentalBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  rentalPrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: Colors.light.primary,
  },
  rentalUnit: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginLeft: 2,
  },
  inquireBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
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

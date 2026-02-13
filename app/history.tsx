import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import Colors from "@/constants/colors";

interface HistoricalPlace {
  id: string;
  name: string;
  era: string;
  description: string;
  status: "preserved" | "destroyed" | "ruins";
  icon: string;
  category: "heritage" | "modern" | "destroyed";
}

const places: HistoricalPlace[] = [
  {
    id: "h1",
    name: "Lahore Fort",
    era: "Mughal Era (1566)",
    description:
      "A citadel in Lahore, one of the most iconic landmarks. It houses palaces, halls, and gardens from various rulers.",
    status: "preserved",
    icon: "castle",
    category: "heritage",
  },
  {
    id: "h2",
    name: "Badshahi Mosque",
    era: "Mughal Era (1673)",
    description:
      "One of the largest mosques in the world, built by Emperor Aurangzeb. A masterpiece of Mughal architecture.",
    status: "preserved",
    icon: "mosque",
    category: "heritage",
  },
  {
    id: "h3",
    name: "Hiran Minar",
    era: "Mughal Era (1606)",
    description:
      "A unique monument built by Emperor Jahangir in memory of his pet deer. Located in Sheikhupura.",
    status: "ruins",
    icon: "pillar",
    category: "destroyed",
  },
  {
    id: "h4",
    name: "Taxila Ruins",
    era: "Ancient (600 BC)",
    description:
      "Ancient Gandhara civilization ruins and one of the oldest universities in the world. UNESCO World Heritage Site.",
    status: "ruins",
    icon: "bank",
    category: "destroyed",
  },
  {
    id: "h5",
    name: "Faisal Mosque",
    era: "Modern (1986)",
    description:
      "A stunning modern mosque in Islamabad, designed by Turkish architect Vedat Dalokay. Symbol of new Pakistan.",
    status: "preserved",
    icon: "star-crescent",
    category: "modern",
  },
  {
    id: "h6",
    name: "Bahria Town Karachi",
    era: "Modern (2014)",
    description:
      "One of the largest private housing societies in Asia, featuring modern architecture and world-class amenities.",
    status: "preserved",
    icon: "city",
    category: "modern",
  },
  {
    id: "h7",
    name: "Mohenjo-daro",
    era: "Ancient (2500 BC)",
    description:
      "Ruins of the ancient Indus Valley Civilization, one of the earliest urban centers. UNESCO World Heritage Site.",
    status: "ruins",
    icon: "bank",
    category: "destroyed",
  },
  {
    id: "h8",
    name: "CPEC Gwadar Port",
    era: "Modern (2013-Present)",
    description:
      "Deep-sea port and economic zone under China-Pakistan Economic Corridor. Gateway to modern development.",
    status: "preserved",
    icon: "ferry",
    category: "modern",
  },
  {
    id: "h9",
    name: "Old Anarkali Bazaar",
    era: "Mughal Era",
    description:
      "One of the oldest markets in South Asia, named after the legendary Anarkali. Many sections now destroyed.",
    status: "destroyed",
    icon: "store",
    category: "destroyed",
  },
  {
    id: "h10",
    name: "Lahore Metro",
    era: "Modern (2020)",
    description:
      "Pakistan's first metro rail system, Orange Line. A symbol of modern infrastructure development.",
    status: "preserved",
    icon: "train",
    category: "modern",
  },
];

const tabs = ["All", "Heritage", "Modern", "Destroyed"];

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const [selectedTab, setSelectedTab] = useState("All");

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) return null;

  const filteredPlaces = places.filter(
    (p) => selectedTab === "All" || p.category === selectedTab.toLowerCase()
  );

  const statusColors: Record<string, string> = {
    preserved: Colors.light.success,
    destroyed: Colors.light.danger,
    ruins: "#FF8F00",
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + webTopInset + 16,
          paddingBottom: insets.bottom + webBottomInset + 40,
        }}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </Pressable>
          <Text style={styles.headerTitle}>History & Heritage</Text>
          <View style={{ width: 24 }} />
        </View>

        <LinearGradient
          colors={["#2C3E50", "#4A6274"]}
          style={styles.heroBanner}
        >
          <MaterialCommunityIcons name="mosque" size={36} color={Colors.light.accent} />
          <Text style={styles.heroTitle}>Pakistan Through Time</Text>
          <Text style={styles.heroDesc}>
            From ancient civilizations to modern development - explore the rich history and transformation of Pakistan.
          </Text>
        </LinearGradient>

        <View style={styles.tabRow}>
          {tabs.map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setSelectedTab(tab)}
              style={[
                styles.tabChip,
                selectedTab === tab && styles.tabChipActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>

        {selectedTab === "Modern" && (
          <View style={styles.noteCard}>
            <Ionicons name="information-circle" size={18} color={Colors.light.primary} />
            <Text style={styles.noteText}>
              This section showcases modern Pakistan - not old Pakistan. See the transformation and progress.
            </Text>
          </View>
        )}

        {selectedTab === "Destroyed" && (
          <View style={[styles.noteCard, { backgroundColor: "#FFF3E0" }]}>
            <Ionicons name="alert-circle" size={18} color="#FF8F00" />
            <Text style={[styles.noteText, { color: "#E65100" }]}>
              These places have been destroyed or are in ruins. Help preserve our heritage.
            </Text>
          </View>
        )}

        <View style={styles.placesList}>
          {filteredPlaces.map((place) => (
            <View key={place.id} style={styles.placeCard}>
              <View style={styles.placeIconWrap}>
                <MaterialCommunityIcons
                  name={place.icon as any}
                  size={28}
                  color={
                    place.category === "modern"
                      ? Colors.light.primary
                      : place.category === "destroyed"
                      ? "#FF8F00"
                      : Colors.light.accent
                  }
                />
              </View>
              <View style={styles.placeInfo}>
                <View style={styles.placeTopRow}>
                  <Text style={styles.placeName} numberOfLines={1}>
                    {place.name}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusColors[place.status] + "18" },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: statusColors[place.status] },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: statusColors[place.status] },
                      ]}
                    >
                      {place.status.charAt(0).toUpperCase() + place.status.slice(1)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.placeEra}>{place.era}</Text>
                <Text style={styles.placeDesc} numberOfLines={3}>
                  {place.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: Colors.light.text,
  },
  heroBanner: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  heroTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: "#fff",
    marginTop: 10,
    textAlign: "center",
  },
  heroDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  tabChipActive: {
    backgroundColor: Colors.light.primary,
  },
  tabText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  tabTextActive: {
    color: "#fff",
  },
  noteCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 16,
    alignItems: "flex-start",
  },
  noteText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.primaryDark,
    flex: 1,
    lineHeight: 18,
  },
  placesList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  placeCard: {
    flexDirection: "row",
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  placeIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  placeInfo: {
    flex: 1,
  },
  placeTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  placeName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 10,
  },
  placeEra: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  placeDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
});

import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Image,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useI18n } from "@/lib/i18n";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_IMG_HEIGHT = 160;

interface HistoricalPlace {
  id: string;
  name: string;
  era: string;
  description: string;
  longDescription: string;
  status: "preserved" | "destroyed" | "ruins";
  icon: string;
  category: "heritage" | "modern" | "destroyed";
  image: any;
  location: string;
  yearBuilt: string;
  significance: string;
}

const places: HistoricalPlace[] = [
  {
    id: "h1",
    name: "Lahore Fort (Shahi Qila)",
    era: "Mughal Era (1566)",
    description: "A citadel in Lahore, one of the most iconic landmarks of Pakistan.",
    longDescription: "The Lahore Fort, also known as Shahi Qila, is a citadel in Lahore spanning over 20 hectares. It houses palaces, halls, and gardens from various rulers including the Mughals, Sikhs, and British. The Sheesh Mahal (Palace of Mirrors), Alamgiri Gate, and Naulakha Pavilion are among its most celebrated structures. Built during Emperor Akbar's reign and expanded by subsequent rulers, it stands as a testament to centuries of artistic excellence.",
    status: "preserved",
    icon: "castle",
    category: "heritage",
    image: require("@/assets/images/lahore-fort.jpg"),
    location: "Lahore, Punjab",
    yearBuilt: "1566 AD",
    significance: "UNESCO World Heritage Site",
  },
  {
    id: "h2",
    name: "Badshahi Mosque",
    era: "Mughal Era (1673)",
    description: "One of the largest mosques in the world, built by Emperor Aurangzeb.",
    longDescription: "The Badshahi Mosque, commissioned by Mughal Emperor Aurangzeb in 1673, is one of the largest mosques in the world with a capacity of over 100,000 worshippers. Its red sandstone and marble construction showcases the pinnacle of Mughal architectural brilliance. The mosque features three grand domes, four minarets, and an immense courtyard. For decades it was the largest mosque in the world until the construction of Faisal Mosque in Islamabad.",
    status: "preserved",
    icon: "mosque",
    category: "heritage",
    image: require("@/assets/images/badshahi-mosque.jpg"),
    location: "Lahore, Punjab",
    yearBuilt: "1673 AD",
    significance: "Mughal Architectural Masterpiece",
  },
  {
    id: "h3",
    name: "Shalimar Gardens",
    era: "Mughal Era (1641)",
    description: "Persian-style terraced Mughal garden built by Emperor Shah Jahan.",
    longDescription: "Shalimar Gardens, built by Mughal Emperor Shah Jahan in 1641, is a stunning example of Mughal garden design. Spread across three descending terraces, the gardens feature 410 fountains, pools, marble pavilions, and intricate waterworks. The name 'Shalimar' comes from Sanskrit meaning 'Abode of Joy.' The gardens were used for royal court and entertainment, and remain one of the finest examples of Persian-Mughal landscape architecture in the world.",
    status: "preserved",
    icon: "flower",
    category: "heritage",
    image: require("@/assets/images/shalimar-gardens.jpg"),
    location: "Lahore, Punjab",
    yearBuilt: "1641 AD",
    significance: "UNESCO World Heritage Site",
  },
  {
    id: "h4",
    name: "Hiran Minar",
    era: "Mughal Era (1606)",
    description: "A unique monument built by Emperor Jahangir in memory of his pet deer.",
    longDescription: "Hiran Minar is a unique monument located in Sheikhupura, built by Mughal Emperor Jahangir in memory of his beloved pet antelope, Mansraj. The complex features a 30-meter tall minar (tower), a large water tank (baoli), a causeway, and a central pavilion. Emperor Jahangir used this site as a royal hunting ground and retreat. The minar is decorated with antlers and features a spiral staircase inside. It represents the sentimental and artistic side of the great Mughals.",
    status: "ruins",
    icon: "pillar",
    category: "destroyed",
    image: require("@/assets/images/hiran-minar.jpg"),
    location: "Sheikhupura, Punjab",
    yearBuilt: "1606 AD",
    significance: "Royal Hunting Ground & Memorial",
  },
  {
    id: "h5",
    name: "Taxila Ruins",
    era: "Ancient (600 BC)",
    description: "Ancient Gandhara civilization ruins and one of the oldest universities.",
    longDescription: "Taxila, located near Islamabad, is one of the most important archaeological sites in South Asia. It was the capital of the ancient Gandhara kingdom and home to one of the world's earliest universities (Takshashila University), predating Oxford by 1,500 years. Students from across the ancient world came to study philosophy, medicine, and warfare here. The ruins showcase Greco-Buddhist art, including stupas, monasteries, and sculptures from 600 BC to 500 AD. Alexander the Great rested here during his campaign.",
    status: "ruins",
    icon: "bank",
    category: "destroyed",
    image: require("@/assets/images/taxila.jpg"),
    location: "Rawalpindi District",
    yearBuilt: "600 BC",
    significance: "UNESCO World Heritage Site",
  },
  {
    id: "h6",
    name: "Mohenjo-daro",
    era: "Ancient (2500 BC)",
    description: "Ruins of the ancient Indus Valley Civilization, one of the earliest urban centers.",
    longDescription: "Mohenjo-daro, meaning 'Mound of the Dead Men,' was one of the largest cities of the ancient Indus Valley Civilization, built around 2500 BC. The city showcased remarkably advanced urban planning with grid-patterned streets, advanced drainage systems, public baths (The Great Bath), and multi-story brick buildings. It is estimated to have had a population of 40,000 people. The civilization's writing system remains undeciphered. The site was designated a UNESCO World Heritage Site in 1980.",
    status: "ruins",
    icon: "bank",
    category: "destroyed",
    image: require("@/assets/images/mohenjo-daro.jpg"),
    location: "Larkana, Sindh",
    yearBuilt: "2500 BC",
    significance: "UNESCO World Heritage Site",
  },
  {
    id: "h7",
    name: "Old Anarkali Bazaar",
    era: "Mughal Era",
    description: "One of the oldest markets in South Asia, named after the legendary Anarkali.",
    longDescription: "Anarkali Bazaar in Lahore is one of the oldest and most famous markets in South Asia, dating back to the Mughal era. Named after the legendary courtesan Anarkali (whose tomb lies nearby), the bazaar has been a center of commerce for centuries. It stretches for over a kilometer and is filled with shops selling traditional clothing, jewelry, handicrafts, spices, and street food. Portions of the original bazaar have been damaged or rebuilt over centuries, but it remains a living piece of Lahore's cultural heritage.",
    status: "destroyed",
    icon: "store",
    category: "destroyed",
    image: require("@/assets/images/old-bazaar.jpg"),
    location: "Lahore, Punjab",
    yearBuilt: "Mughal Period",
    significance: "Cultural Heritage Market",
  },
  {
    id: "h8",
    name: "Faisal Mosque",
    era: "Modern (1986)",
    description: "A stunning modern mosque in Islamabad, largest in South Asia.",
    longDescription: "Faisal Mosque, located at the foot of the Margalla Hills in Islamabad, is the largest mosque in South Asia and was the largest in the world from 1986 to 1993. Designed by Turkish architect Vedat Dalokay and funded by King Faisal of Saudi Arabia, the mosque breaks from traditional dome-based designs, featuring a contemporary tent-like shape inspired by a Bedouin tent. It can accommodate 300,000 worshippers. The mosque's four minarets are 90 meters tall, and the main prayer hall covers 5,000 square meters.",
    status: "preserved",
    icon: "star-crescent",
    category: "modern",
    image: require("@/assets/images/faisal-mosque.jpg"),
    location: "Islamabad",
    yearBuilt: "1986",
    significance: "Largest Mosque in South Asia",
  },
  {
    id: "h9",
    name: "Bahria Town",
    era: "Modern (2014)",
    description: "One of the largest private housing societies in Asia with world-class amenities.",
    longDescription: "Bahria Town, developed by Malik Riaz Hussain, is one of the largest privately developed communities in Asia. The project spans multiple cities including Lahore, Karachi, Islamabad, and Rawalpindi. Bahria Town Karachi alone covers 44,000 acres. The developments feature modern infrastructure, theme parks, golf courses, mosques, hospitals, and educational institutions. The Grand Mosque in Bahria Town is the third largest mosque in the world. It represents Pakistan's ambition in modern urban development.",
    status: "preserved",
    icon: "city",
    category: "modern",
    image: require("@/assets/images/bahria-town.jpg"),
    location: "Multiple Cities",
    yearBuilt: "2005-Present",
    significance: "Largest Private Development in Asia",
  },
  {
    id: "h10",
    name: "CPEC Gwadar Port",
    era: "Modern (2013-Present)",
    description: "Deep-sea port and economic zone under China-Pakistan Economic Corridor.",
    longDescription: "Gwadar Port, a crown jewel of the China-Pakistan Economic Corridor (CPEC), is a deep-water seaport on the southwestern coast of Balochistan. The $62 billion CPEC project connects Gwadar to China's Xinjiang province through a network of highways, railways, and pipelines. The port provides China with the shortest trade route to the Arabian Sea and African markets. The Gwadar Free Zone, international airport, and desalination plants are transforming this fishing village into a modern metropolis and regional trade hub.",
    status: "preserved",
    icon: "ferry",
    category: "modern",
    image: require("@/assets/images/gwadar-port.jpg"),
    location: "Gwadar, Balochistan",
    yearBuilt: "2013-Present",
    significance: "$62B CPEC Gateway",
  },
  {
    id: "h11",
    name: "Lahore Metro (Orange Line)",
    era: "Modern (2020)",
    description: "Pakistan's first metro rail system, a symbol of modern infrastructure.",
    longDescription: "The Lahore Orange Line Metro Train is Pakistan's first urban rail mass transit system. Opened in October 2020, the 27.1 km route has 26 stations (2 underground) connecting Dera Gujran to Ali Town. Built under CPEC with Chinese cooperation, the metro can carry up to 250,000 passengers daily. The Orange Line reduced travel time across the city from 2 hours to just 45 minutes. It features air-conditioned carriages, automated ticketing, and modern safety systems, marking a new era of public transportation in Pakistan.",
    status: "preserved",
    icon: "train",
    category: "modern",
    image: require("@/assets/images/lahore-metro.jpg"),
    location: "Lahore, Punjab",
    yearBuilt: "2020",
    significance: "First Metro Rail in Pakistan",
  },
];

const tabs = ["All", "Heritage", "Modern", "Destroyed/Ruins"];

function PlaceCard({ place }: { place: HistoricalPlace }) {
  const [expanded, setExpanded] = useState(false);

  const statusColors: Record<string, string> = {
    preserved: Colors.light.success,
    destroyed: Colors.light.danger,
    ruins: "#FF8F00",
  };

  return (
    <Pressable
      onPress={() => {
        setExpanded(!expanded);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      style={styles.card}
    >
      <Image source={place.image} style={styles.cardImage} resizeMode="cover" />

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.7)"]}
        style={styles.cardImageOverlay}
      >
        <View style={styles.cardImageBadges}>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[place.status] + "DD" }]}>
            <View style={styles.statusDot} />
            <Text style={styles.statusBadgeText}>
              {place.status.charAt(0).toUpperCase() + place.status.slice(1)}
            </Text>
          </View>
          {place.significance && (
            <View style={styles.significanceBadge}>
              <Ionicons name="ribbon" size={10} color={Colors.light.accent} />
              <Text style={styles.significanceBadgeText}>{place.significance}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <View style={styles.cardContent}>
        <View style={styles.cardTitleRow}>
          <View style={styles.cardIconWrap}>
            <MaterialCommunityIcons
              name={place.icon as any}
              size={20}
              color={
                place.category === "modern"
                  ? Colors.light.primary
                  : place.category === "destroyed"
                  ? "#FF8F00"
                  : Colors.light.accent
              }
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName} numberOfLines={2}>{place.name}</Text>
            <Text style={styles.cardEra}>{place.era}</Text>
          </View>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={Colors.light.textSecondary}
          />
        </View>

        <View style={styles.cardMetaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color={Colors.light.textSecondary} />
            <Text style={styles.metaText}>{place.location}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={13} color={Colors.light.textSecondary} />
            <Text style={styles.metaText}>{place.yearBuilt}</Text>
          </View>
        </View>

        <Text style={styles.cardDesc} numberOfLines={expanded ? undefined : 2}>
          {expanded ? place.longDescription : place.description}
        </Text>

        {expanded && (
          <View style={styles.expandedActions}>
            <View style={styles.expandedTag}>
              <MaterialCommunityIcons
                name={place.category === "heritage" ? "shield-star" : place.category === "modern" ? "rocket-launch" : "alert-circle"}
                size={14}
                color={place.category === "heritage" ? Colors.light.accent : place.category === "modern" ? Colors.light.primary : "#FF8F00"}
              />
              <Text style={[styles.expandedTagText, {
                color: place.category === "heritage" ? Colors.light.accent : place.category === "modern" ? Colors.light.primary : "#FF8F00"
              }]}>
                {place.category === "heritage" ? "Heritage Site" : place.category === "modern" ? "Modern Development" : "Ruins / Destroyed"}
              </Text>
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const [selectedTab, setSelectedTab] = useState("All");

  const filteredPlaces = places.filter((p) => {
    if (selectedTab === "All") return true;
    if (selectedTab === "Destroyed/Ruins") return p.category === "destroyed";
    return p.category === selectedTab.toLowerCase();
  });

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + webBottomInset + 40,
        }}
      >
        <View style={{ position: "relative" }}>
          <Image
            source={require("@/assets/images/badshahi-mosque.jpg")}
            style={styles.heroBannerImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["rgba(5,59,47,0.3)", "rgba(5,59,47,0.85)", Colors.light.primaryDark]}
            style={[styles.heroBannerOverlay, { paddingTop: insets.top + webTopInset + 12 }]}
          >
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </Pressable>

            <MaterialCommunityIcons name="mosque" size={40} color={Colors.light.accent} />
            <Text style={styles.heroTitle}>{t.history.title}</Text>
            <Text style={styles.heroDesc}>
              Pakistan Through Time - From the ancient Indus Valley to the modern CPEC era. Explore 5,000 years of history, culture, and transformation.
            </Text>

            <View style={styles.heroStatsRow}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>5000+</Text>
                <Text style={styles.heroStatLabel}>Years of History</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>6</Text>
                <Text style={styles.heroStatLabel}>UNESCO Sites</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{places.length}</Text>
                <Text style={styles.heroStatLabel}>Landmarks</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.tabRowWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
            {tabs.map((tab) => (
              <Pressable
                key={tab}
                onPress={() => {
                  setSelectedTab(tab);
                  Haptics.selectionAsync();
                }}
                style={[styles.tabChip, selectedTab === tab && styles.tabChipActive]}
              >
                <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                  {tab}
                </Text>
                {selectedTab === tab && (
                  <View style={styles.tabCount}>
                    <Text style={styles.tabCountText}>
                      {places.filter(p => {
                        if (tab === "All") return true;
                        if (tab === "Destroyed/Ruins") return p.category === "destroyed";
                        return p.category === tab.toLowerCase();
                      }).length}
                    </Text>
                  </View>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {selectedTab === "Modern" && (
          <View style={styles.noteCard}>
            <Ionicons name="information-circle" size={18} color={Colors.light.primary} />
            <Text style={styles.noteText}>
              Showcasing modern Pakistan's transformation - infrastructure, development, and progress since independence.
            </Text>
          </View>
        )}

        {selectedTab === "Destroyed/Ruins" && (
          <View style={[styles.noteCard, { backgroundColor: "#FFF3E0" }]}>
            <Ionicons name="alert-circle" size={18} color="#FF8F00" />
            <Text style={[styles.noteText, { color: "#E65100" }]}>
              Ancient ruins and sites that tell the story of civilizations lost to time. Help preserve our heritage.
            </Text>
          </View>
        )}

        <View style={styles.placesList}>
          {filteredPlaces.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </View>

        {filteredPlaces.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="map-search-outline" size={48} color={Colors.light.tabIconDefault} />
            <Text style={styles.emptyText}>No places found in this category</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  heroBannerImage: {
    width: "100%",
    height: 320,
  },
  heroBannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  backBtn: {
    position: "absolute",
    top: Platform.OS === "web" ? 79 : 52,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  heroTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "#fff",
    marginTop: 10,
    textAlign: "center",
  },
  heroDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  heroStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  heroStat: {
    flex: 1,
    alignItems: "center",
  },
  heroStatValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: Colors.light.accent,
  },
  heroStatLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  tabRowWrap: {
    marginTop: 16,
    marginBottom: 8,
  },
  tabRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  tabChipActive: {
    backgroundColor: Colors.light.primary,
  },
  tabText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  tabTextActive: {
    color: "#fff",
  },
  tabCount: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  tabCountText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "#fff",
  },
  noteCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 12,
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
    gap: 16,
  },
  card: {
    borderRadius: 18,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: CARD_IMG_HEIGHT,
  },
  cardImageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: CARD_IMG_HEIGHT,
    justifyContent: "flex-end",
    padding: 10,
  },
  cardImageBadges: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  statusBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    color: "#fff",
  },
  significanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  significanceBadgeText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 10,
    color: Colors.light.accent,
  },
  cardContent: {
    padding: 14,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  cardName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
    flex: 1,
  },
  cardEra: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  cardMetaRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 10,
    paddingLeft: 48,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  cardDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 20,
    marginTop: 10,
    paddingLeft: 48,
  },
  expandedActions: {
    marginTop: 12,
    paddingLeft: 48,
  },
  expandedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  expandedTagText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
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

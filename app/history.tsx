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

function getPlaces(t: any): HistoricalPlace[] {
  return [
    {
      id: "h1",
      name: t.history.h1_name,
      era: t.history.h1_era,
      description: t.history.h1_desc,
      longDescription: t.history.h1_long,
      status: "preserved",
      icon: "castle",
      category: "heritage",
      image: require("@/assets/images/lahore-fort.jpg"),
      location: t.history.h1_location,
      yearBuilt: "1566 AD",
      significance: t.history.h1_significance,
    },
    {
      id: "h2",
      name: t.history.h2_name,
      era: t.history.h2_era,
      description: t.history.h2_desc,
      longDescription: t.history.h2_long,
      status: "preserved",
      icon: "mosque",
      category: "heritage",
      image: require("@/assets/images/badshahi-mosque.jpg"),
      location: t.history.h2_location,
      yearBuilt: "1673 AD",
      significance: t.history.h2_significance,
    },
    {
      id: "h3",
      name: t.history.h3_name,
      era: t.history.h3_era,
      description: t.history.h3_desc,
      longDescription: t.history.h3_long,
      status: "preserved",
      icon: "flower",
      category: "heritage",
      image: require("@/assets/images/shalimar-gardens.jpg"),
      location: t.history.h3_location,
      yearBuilt: "1641 AD",
      significance: t.history.h3_significance,
    },
    {
      id: "h4",
      name: t.history.h4_name,
      era: t.history.h4_era,
      description: t.history.h4_desc,
      longDescription: t.history.h4_long,
      status: "ruins",
      icon: "pillar",
      category: "destroyed",
      image: require("@/assets/images/hiran-minar.jpg"),
      location: t.history.h4_location,
      yearBuilt: "1606 AD",
      significance: t.history.h4_significance,
    },
    {
      id: "h5",
      name: t.history.h5_name,
      era: t.history.h5_era,
      description: t.history.h5_desc,
      longDescription: t.history.h5_long,
      status: "ruins",
      icon: "bank",
      category: "destroyed",
      image: require("@/assets/images/taxila.jpg"),
      location: t.history.h5_location,
      yearBuilt: "600 BC",
      significance: t.history.h5_significance,
    },
    {
      id: "h6",
      name: t.history.h6_name,
      era: t.history.h6_era,
      description: t.history.h6_desc,
      longDescription: t.history.h6_long,
      status: "ruins",
      icon: "bank",
      category: "destroyed",
      image: require("@/assets/images/mohenjo-daro.jpg"),
      location: t.history.h6_location,
      yearBuilt: "2500 BC",
      significance: t.history.h6_significance,
    },
    {
      id: "h7",
      name: t.history.h7_name,
      era: t.history.h7_era,
      description: t.history.h7_desc,
      longDescription: t.history.h7_long,
      status: "destroyed",
      icon: "store",
      category: "destroyed",
      image: require("@/assets/images/old-bazaar.jpg"),
      location: t.history.h7_location,
      yearBuilt: "Mughal Period",
      significance: t.history.h7_significance,
    },
    {
      id: "h8",
      name: t.history.h8_name,
      era: t.history.h8_era,
      description: t.history.h8_desc,
      longDescription: t.history.h8_long,
      status: "preserved",
      icon: "star-crescent",
      category: "modern",
      image: require("@/assets/images/faisal-mosque.jpg"),
      location: t.history.h8_location,
      yearBuilt: "1986",
      significance: t.history.h8_significance,
    },
    {
      id: "h9",
      name: t.history.h9_name,
      era: t.history.h9_era,
      description: t.history.h9_desc,
      longDescription: t.history.h9_long,
      status: "preserved",
      icon: "city",
      category: "modern",
      image: require("@/assets/images/bahria-town.jpg"),
      location: t.history.h9_location,
      yearBuilt: "2005-Present",
      significance: t.history.h9_significance,
    },
    {
      id: "h10",
      name: t.history.h10_name,
      era: t.history.h10_era,
      description: t.history.h10_desc,
      longDescription: t.history.h10_long,
      status: "preserved",
      icon: "ferry",
      category: "modern",
      image: require("@/assets/images/gwadar-port.jpg"),
      location: t.history.h10_location,
      yearBuilt: "2013-Present",
      significance: t.history.h10_significance,
    },
    {
      id: "h11",
      name: t.history.h11_name,
      era: t.history.h11_era,
      description: t.history.h11_desc,
      longDescription: t.history.h11_long,
      status: "preserved",
      icon: "train",
      category: "modern",
      image: require("@/assets/images/lahore-metro.jpg"),
      location: t.history.h11_location,
      yearBuilt: "2020",
      significance: t.history.h11_significance,
    },
  ];
}

function PlaceCard({ place }: { place: HistoricalPlace }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useI18n();

  const statusColors: Record<string, string> = {
    preserved: Colors.light.success,
    destroyed: Colors.light.danger,
    ruins: "#FF8F00",
  };

  const statusLabels: Record<string, string> = {
    preserved: t.history.preserved,
    destroyed: t.history.destroyed,
    ruins: t.history.ruins,
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
              {statusLabels[place.status]}
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
                {place.category === "heritage" ? t.history.heritageSite : place.category === "modern" ? t.history.modernDevelopment : t.history.ruinsDestroyed}
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
  const [selectedTab, setSelectedTab] = useState("all");

  const places = getPlaces(t);

  const tabs = [
    { key: "all", label: t.history.all },
    { key: "heritage", label: t.history.heritage },
    { key: "modern", label: t.history.modern },
    { key: "destroyed", label: t.history.destroyedRuins },
  ];

  const filteredPlaces = places.filter((p) => {
    if (selectedTab === "all") return true;
    if (selectedTab === "destroyed") return p.category === "destroyed";
    return p.category === selectedTab;
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
              {t.history.heroDesc}
            </Text>

            <View style={styles.heroStatsRow}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>5000+</Text>
                <Text style={styles.heroStatLabel}>{t.history.yearsOfHistory}</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>6</Text>
                <Text style={styles.heroStatLabel}>{t.history.unescoSites}</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{places.length}</Text>
                <Text style={styles.heroStatLabel}>{t.history.landmarks}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.tabRowWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
            {tabs.map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => {
                  setSelectedTab(tab.key);
                  Haptics.selectionAsync();
                }}
                style={[styles.tabChip, selectedTab === tab.key && styles.tabChipActive]}
              >
                <Text style={[styles.tabText, selectedTab === tab.key && styles.tabTextActive]}>
                  {tab.label}
                </Text>
                {selectedTab === tab.key && (
                  <View style={styles.tabCount}>
                    <Text style={styles.tabCountText}>
                      {places.filter(p => {
                        if (tab.key === "all") return true;
                        if (tab.key === "destroyed") return p.category === "destroyed";
                        return p.category === tab.key;
                      }).length}
                    </Text>
                  </View>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {selectedTab === "modern" && (
          <View style={styles.noteCard}>
            <Ionicons name="information-circle" size={18} color={Colors.light.primary} />
            <Text style={styles.noteText}>
              {t.history.modernNote}
            </Text>
          </View>
        )}

        {selectedTab === "destroyed" && (
          <View style={[styles.noteCard, { backgroundColor: "#FFF3E0" }]}>
            <Ionicons name="alert-circle" size={18} color="#FF8F00" />
            <Text style={[styles.noteText, { color: "#E65100" }]}>
              {t.history.destroyedNote}
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
            <Text style={styles.emptyText}>{t.history.noPlaces}</Text>
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

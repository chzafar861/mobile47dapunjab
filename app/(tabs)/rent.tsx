import React, { useState, useCallback } from "react";
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
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { SEOHead } from "@/components/SEOHead";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import { useI18n } from "@/lib/i18n";
import { useTranslate } from "@/lib/useTranslate";

interface PersonRecord {
  id: number;
  full_name: string;
  image_url: string | null;
  village_of_origin: string;
  district: string;
  year_of_migration: number | null;
  migration_period: string;
  current_location: string;
  contact_info: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

interface PropertyRecord {
  id: number;
  data: {
    ownerName?: string;
    propertyType?: string;
    location?: string;
    district?: string;
    city?: string;
    area?: string;
    description?: string;
    images?: string[];
    hasImages?: boolean;
    imageCount?: number;
    contact?: string;
    phone?: string;
    [key: string]: any;
  };
  created_at: string;
}

type ActiveSection = "people" | "property";

function PersonCard({ item }: { item: PersonRecord }) {
  const { translated } = useTranslate([
    item.full_name,
    item.village_of_origin,
    item.district,
    item.current_location,
  ]);
  const [name, village, district, location] = translated;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: "/migration-detail", params: { id: String(item.id) } });
      }}
      style={({ pressed }) => [
        styles.card,
        { opacity: pressed ? 0.95 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <View style={styles.cardRow}>
        <View style={styles.avatarContainer}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.avatarImage} />
          ) : (
            <LinearGradient
              colors={[Colors.light.primary, Colors.light.primaryDark]}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>
                {item.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </Text>
            </LinearGradient>
          )}
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{name}</Text>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={13} color={Colors.light.accent} />
            <Text style={styles.detailText} numberOfLines={1}>{village}, {district}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="navigate-outline" size={13} color={Colors.light.primary} />
            <Text style={styles.detailText} numberOfLines={1}>{location}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
      </View>
    </Pressable>
  );
}

function PropertyCard({ item }: { item: PropertyRecord }) {
  const { t } = useI18n();
  const d = item.data || {};
  const { translated } = useTranslate([
    d.ownerName || "",
    d.location || "",
    d.propertyType || "",
    d.description || "",
    d.area || "",
  ]);
  const [ownerName, location, propertyType, description, area] = translated;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: "/property-detail", params: { id: String(item.id) } });
      }}
      style={({ pressed }) => [
        styles.card,
        { opacity: pressed ? 0.95 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <View style={styles.cardRow}>
        <View style={[styles.propertyThumb, styles.propertyThumbPlaceholder]}>
          <MaterialCommunityIcons name="home-city-outline" size={22} color={d.hasImages ? Colors.light.primary : Colors.light.textSecondary} />
          {d.hasImages && (
            <View style={{ position: "absolute", bottom: 2, right: 2 }}>
              <Ionicons name="images" size={10} color={Colors.light.accent} />
            </View>
          )}
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>
            {ownerName || propertyType || t.humanFind.propertyDetails}
          </Text>
          {d.location && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={13} color={Colors.light.accent} />
              <Text style={styles.detailText} numberOfLines={1}>{location}</Text>
            </View>
          )}
          {d.propertyType && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="home-outline" size={13} color={Colors.light.primary} />
              <Text style={styles.detailText} numberOfLines={1}>{propertyType}{d.area ? ` - ${area}` : ""}</Text>
            </View>
          )}
          {d.description && (
            <Text style={styles.descriptionText} numberOfLines={2}>{description}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
      </View>
    </Pressable>
  );
}

export default function HumanFindScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const [activeSection, setActiveSection] = useState<ActiveSection>("people");
  const [searchQuery, setSearchQuery] = useState("");

  const buildPeopleUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append("search", searchQuery.trim());
    const qs = params.toString();
    return `/api/migration-records${qs ? `?${qs}` : ""}`;
  }, [searchQuery]);

  const { data: people = [], isLoading: peopleLoading, refetch: refetchPeople } = useQuery<PersonRecord[]>({
    queryKey: ["/api/migration-records", searchQuery],
    queryFn: async () => {
      const url = buildPeopleUrl();
      const res = await apiRequest("GET", url);
      return res.json();
    },
    enabled: activeSection === "people",
  });

  const { data: properties = [], isLoading: propertiesLoading } = useQuery<PropertyRecord[]>({
    queryKey: ["/api/property-details"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/property-details");
      return res.json();
    },
    enabled: activeSection === "property",
  });

  const filteredProperties = properties.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const d = p.data || {};
    return (
      (d.ownerName && d.ownerName.toLowerCase().includes(q)) ||
      (d.location && d.location.toLowerCase().includes(q)) ||
      (d.city && d.city.toLowerCase().includes(q)) ||
      (d.district && d.district.toLowerCase().includes(q)) ||
      (d.propertyType && d.propertyType.toLowerCase().includes(q)) ||
      (d.description && d.description.toLowerCase().includes(q))
    );
  });

  const handleSearch = () => {
    if (activeSection === "people") {
      refetchPeople();
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const isLoading = activeSection === "people" ? peopleLoading : propertiesLoading;
  const displayData = activeSection === "people" ? people : filteredProperties;

  return (
    <View style={styles.container}>
      <SEOHead title="HumanFind - People & Property Search" description="Search for people, families, and properties in Punjab, Pakistan. Migration portal and family search tool for connecting overseas Pakistanis with their roots." path="/rent" />
      <LinearGradient
        colors={[Colors.light.primaryDark, Colors.light.primary, Colors.light.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + webTopInset + 12 }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="people" size={26} color={Colors.light.accent} />
            <Text style={styles.headerTitle}>{t.humanFind.title}</Text>
          </View>
          <Text style={styles.headerSubtitle}>{t.humanFind.subtitle}</Text>
        </View>

        <View style={styles.tabRow}>
          <Pressable
            onPress={() => { setActiveSection("people"); setSearchQuery(""); }}
            style={[styles.tabBtn, activeSection === "people" && styles.tabBtnActive]}
          >
            <Ionicons name="person-outline" size={16} color={activeSection === "people" ? Colors.light.primaryDark : "rgba(255,255,255,0.6)"} />
            <Text style={[styles.tabText, activeSection === "people" && styles.tabTextActive]}>{t.humanFind.findPeople}</Text>
          </Pressable>
          <Pressable
            onPress={() => { setActiveSection("property"); setSearchQuery(""); }}
            style={[styles.tabBtn, activeSection === "property" && styles.tabBtnActive]}
          >
            <MaterialCommunityIcons name="home-search-outline" size={16} color={activeSection === "property" ? Colors.light.primaryDark : "rgba(255,255,255,0.6)"} />
            <Text style={[styles.tabText, activeSection === "property" && styles.tabTextActive]}>{t.humanFind.propertyDetails}</Text>
          </Pressable>
        </View>
      </LinearGradient>

      <View style={styles.searchSection}>
        <View style={styles.searchBarRow}>
          <View style={styles.searchInputWrap}>
            <Ionicons name="search" size={18} color={Colors.light.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={activeSection === "people" ? t.humanFind.searchPeople : t.humanFind.searchProperty}
              placeholderTextColor={Colors.light.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              testID="humanfind-search-input"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={Colors.light.textSecondary} />
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={handleSearch}
            style={styles.searchBtn}
            testID="humanfind-search-btn"
          >
            <Ionicons name="search" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>
            {t.common.loading}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayData as any[]}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + webBottomInset + 100,
            paddingTop: 4,
          }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) =>
            activeSection === "people" ? (
              <PersonCard item={item as PersonRecord} />
            ) : (
              <PropertyCard item={item as PropertyRecord} />
            )
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name={activeSection === "people" ? "people-outline" : "home-outline"}
                size={48}
                color={Colors.light.tabIconDefault}
              />
              <Text style={styles.emptyTitle}>
                {t.humanFind.noRecords}
              </Text>
              <Text style={styles.emptyText}>
                {activeSection === "people"
                  ? t.humanFind.searchPeople
                  : t.humanFind.searchProperty}
              </Text>
            </View>
          }
          ListHeaderComponent={
            displayData.length > 0 ? (
              <View style={styles.resultCount}>
                <Text style={styles.resultCountText}>
                  {displayData.length} {activeSection === "people" ? t.humanFind.findPeople : t.humanFind.propertyDetails}
                </Text>
              </View>
            ) : null
          }
          scrollEnabled={displayData.length > 0}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  headerContent: {
    marginBottom: 14,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: "#fff",
  },
  headerSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 14,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  tabBtnActive: {
    backgroundColor: "#fff",
  },
  tabText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
  },
  tabTextActive: {
    color: Colors.light.primaryDark,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  searchBarRow: {
    flexDirection: "row",
    gap: 8,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.text,
    height: 44,
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  resultCount: {
    marginBottom: 8,
  },
  resultCountText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#fff",
  },
  propertyThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  propertyThumbPlaceholder: {
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardInfo: {
    flex: 1,
    gap: 3,
  },
  cardName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  detailText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  descriptionText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
    marginTop: 8,
  },
  emptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});

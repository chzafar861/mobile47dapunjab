import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { SEOHead } from "@/components/SEOHead";
import { useI18n } from "@/lib/i18n";
import { useTranslate } from "@/lib/useTranslate";

const screenWidth = Dimensions.get("window").width;

interface PropertyData {
  ownerName?: string;
  propertyType?: string;
  location?: string;
  district?: string;
  city?: string;
  area?: string;
  description?: string;
  images?: string[];
  contact?: string;
  phone?: string;
  email?: string;
  price?: string;
  status?: string;
  [key: string]: any;
}

interface PropertyRecord {
  id: number;
  data: PropertyData;
  created_at: string;
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon as any} size={16} color={Colors.light.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const { data: property, isLoading } = useQuery<PropertyRecord>({
    queryKey: ["/api/property-details", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/property-details/${id}`);
      return res.json();
    },
    enabled: !!id,
  });

  const d = property?.data || {} as PropertyData;
  const images = d.images || [];

  const { translated } = useTranslate([
    d.ownerName || "",
    d.location || d.city || "",
    d.district || "",
    d.area || "",
    d.description || "",
    d.propertyType || "",
    d.price || "",
    d.status || "",
  ]);
  const [trOwner, trLocation, trDistrict, trArea, trDescription, trPropertyType, trPrice, trStatus] = translated;

  const title = trOwner || trPropertyType || t.humanFind.propertyDetails;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.light.textSecondary} />
        <Text style={styles.notFoundText}>{t.common.noResults}</Text>
        <Pressable onPress={() => router.back()} style={styles.goBackBtn}>
          <Text style={styles.goBackBtnText}>{t.common.back}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SEOHead title="Property Details" description="View detailed property information on the 47daPunjab directory for Punjab, Pakistan." path="/property-detail" keywords="property details Punjab, land information Pakistan, 47daPunjab directory" />
      <View style={[styles.headerBar, { paddingTop: insets.top + webTopInset }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.headerBarTitle} numberOfLines={1}>{t.humanFind.propertyDetails}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + webBottomInset + 40 }}
      >
        {images.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.imageCarousel}
          >
            {images.map((img, i) => (
              <Image key={i} source={{ uri: img }} style={styles.carouselImage} />
            ))}
          </ScrollView>
        ) : (
          <LinearGradient
            colors={[Colors.light.primary + "20", Colors.light.backgroundSecondary]}
            style={styles.noImageBanner}
          >
            <MaterialCommunityIcons name="home-city-outline" size={48} color={Colors.light.textSecondary} />
            <Text style={styles.noImageText}>{t.humanFind.noPhotos || "No photos available"}</Text>
          </LinearGradient>
        )}

        {images.length > 1 && (
          <View style={styles.imageCount}>
            <Ionicons name="images-outline" size={14} color={Colors.light.textSecondary} />
            <Text style={styles.imageCountText}>{images.length} {t.humanFind.photos || "photos"}</Text>
          </View>
        )}

        <View style={styles.contentSection}>
          <Text style={styles.propertyTitle}>{title}</Text>

          {d.propertyType && (
            <View style={styles.typeBadge}>
              <MaterialCommunityIcons name="home-outline" size={14} color={Colors.light.primary} />
              <Text style={styles.typeBadgeText}>{trPropertyType}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.contentSection}>
          <Text style={styles.sectionHeading}>{t.humanFind.viewDetails}</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="person-outline" label={t.humanFind.owner} value={trOwner} />
            <InfoRow icon="location-outline" label={t.humanFind.location} value={trLocation} />
            <InfoRow icon="map-outline" label={t.humanFind.district || "District"} value={trDistrict} />
            <InfoRow icon="resize-outline" label={t.humanFind.area} value={trArea} />
            <InfoRow icon="pricetag-outline" label={t.humanFind.price || "Price"} value={trPrice} />
            <InfoRow icon="flag-outline" label={t.humanFind.status || "Status"} value={trStatus} />
          </View>
        </View>

        {d.description && (
          <>
            <View style={styles.divider} />
            <View style={styles.contentSection}>
              <Text style={styles.sectionHeading}>{t.humanFind.description}</Text>
              <Text style={styles.descriptionText}>{trDescription}</Text>
            </View>
          </>
        )}

        {(d.contact || d.phone || d.email) && (
          <>
            <View style={styles.divider} />
            <View style={styles.contentSection}>
              <Text style={styles.sectionHeading}>{t.humanFind.contact || "Contact"}</Text>
              <View style={styles.infoCard}>
                <InfoRow icon="call-outline" label={t.humanFind.phone} value={d.phone || d.contact || ""} />
                <InfoRow icon="mail-outline" label={t.humanFind.email || "Email"} value={d.email || ""} />
              </View>
            </View>
          </>
        )}

        <View style={styles.contentSection}>
          <Text style={styles.submittedDate}>
            {t.humanFind.submittedBy ? `${t.humanFind.submittedBy}: ` : "Submitted: "}{new Date(property.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </Text>
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
  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBarTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 17,
    color: Colors.light.text,
    flex: 1,
    textAlign: "center",
  },
  notFoundText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  goBackBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.light.primary,
    marginTop: 8,
  },
  goBackBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  imageCarousel: {
    height: 240,
  },
  carouselImage: {
    width: screenWidth,
    height: 240,
    resizeMode: "cover",
  },
  noImageBanner: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  noImageText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  imageCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  imageCountText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  contentSection: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  propertyTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: Colors.light.text,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.primary + "12",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 10,
  },
  typeBadgeText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginHorizontal: 20,
  },
  sectionHeading: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 14,
    padding: 14,
    gap: 0,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border + "40",
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.light.primary + "12",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
  },
  infoValue: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: Colors.light.text,
    marginTop: 1,
  },
  descriptionText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  submittedDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    textAlign: "center",
    marginTop: 8,
  },
});

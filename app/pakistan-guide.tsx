import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
  Animated,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function ServiceShowcase({
  icon,
  iconFamily,
  title,
  description,
  price,
  priceNote,
  features,
  gradient,
  buttonLabel,
  onPress,
}: {
  icon: string;
  iconFamily: "ionicons" | "mci";
  title: string;
  description: string;
  price: string;
  priceNote: string;
  features: { icon: string; label: string }[];
  gradient: readonly [string, string, ...string[]];
  buttonLabel: string;
  onPress: () => void;
}) {
  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.serviceShowcase}
    >
      <View style={styles.serviceShowcaseHeader}>
        {iconFamily === "mci" ? (
          <MaterialCommunityIcons name={icon as any} size={36} color="#fff" />
        ) : (
          <Ionicons name={icon as any} size={36} color="#fff" />
        )}
        <View style={styles.serviceShowcaseHeaderText}>
          <Text style={styles.serviceShowcaseTitle}>{title}</Text>
          <View style={styles.serviceShowcasePriceBadge}>
            <Text style={styles.serviceShowcasePriceText}>{price}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.serviceShowcaseDesc}>{description}</Text>
      <Text style={styles.serviceShowcasePriceNote}>{priceNote}</Text>
      <View style={styles.serviceShowcaseFeatures}>
        {features.map((f, i) => (
          <View key={i} style={styles.serviceFeatureChip}>
            <Ionicons name={f.icon as any} size={13} color="#fff" />
            <Text style={styles.serviceFeatureText}>{f.label}</Text>
          </View>
        ))}
      </View>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        style={({ pressed }) => [
          styles.serviceShowcaseBtn,
          { opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={styles.serviceShowcaseBtnText}>{buttonLabel}</Text>
        <Ionicons name="arrow-forward" size={16} color={gradient[0]} />
      </Pressable>
    </LinearGradient>
  );
}

function ImageInfoSection({
  image,
  icon,
  iconColor,
  title,
  subtitle,
  children,
}: {
  image?: any;
  icon: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.infoSection}>
      {image && (
        <Image source={image} style={styles.infoSectionImage} resizeMode="cover" />
      )}
      <Pressable
        onPress={() => {
          setExpanded(!expanded);
          Haptics.selectionAsync();
        }}
        style={styles.infoSectionHeader}
      >
        <View style={[styles.infoSectionIcon, { backgroundColor: iconColor + "15" }]}>
          <Ionicons name={icon as any} size={22} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.infoSectionTitle}>{title}</Text>
          {subtitle && <Text style={styles.infoSectionSubtitle}>{subtitle}</Text>}
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={Colors.light.textSecondary}
        />
      </Pressable>
      {expanded && <View style={styles.infoSectionBody}>{children}</View>}
    </View>
  );
}

function InfoBullet({ text, icon }: { text: string; icon?: string }) {
  return (
    <View style={styles.bulletRow}>
      {icon ? (
        <Ionicons name={icon as any} size={14} color={Colors.light.primary} style={{ marginTop: 2 }} />
      ) : (
        <View style={styles.bulletDot} />
      )}
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

function StatCard({ value, label, icon, color }: { value: string; label: string; icon: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ImagePlaceCard({ name, desc, image }: { name: string; desc: string; image: any }) {
  return (
    <View style={styles.imgPlaceCard}>
      <Image source={image} style={styles.imgPlaceImage} resizeMode="cover" />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.75)"]}
        style={styles.imgPlaceOverlay}
      >
        <Text style={styles.imgPlaceName}>{name}</Text>
        <Text style={styles.imgPlaceDesc}>{desc}</Text>
      </LinearGradient>
    </View>
  );
}

function PlaceCard({ name, desc, icon }: { name: string; desc: string; icon: string }) {
  return (
    <View style={styles.placeCard}>
      <Ionicons name={icon as any} size={22} color={Colors.light.primary} />
      <View style={styles.placeCardText}>
        <Text style={styles.placeCardName}>{name}</Text>
        <Text style={styles.placeCardDesc}>{desc}</Text>
      </View>
    </View>
  );
}

function CurrentServicesPage() {
  const { t } = useI18n();
  const { formatPrice } = useCurrency();
  return (
    <View style={styles.pageContent}>
      <Text style={styles.pageIntro}>
        {t.pakistanGuide.servicesIntro}
      </Text>

      <ServiceShowcase
        icon="videocam"
        iconFamily="ionicons"
        title={t.pakistanGuide.villageVideoTitle}
        description={t.pakistanGuide.villageVideoDesc}
        price={formatPrice(100)}
        priceNote={t.pakistanGuide.villageVideoPriceNote}
        features={[
          { icon: "camera", label: t.pakistanGuide.hdQuality },
          { icon: "time", label: t.pakistanGuide.oneHour },
          { icon: "today", label: t.pakistanGuide.sameDay },
          { icon: "videocam-outline", label: t.pakistanGuide.rawFootage },
        ]}
        gradient={[Colors.light.accent, "#E8C96A"]}
        buttonLabel={t.pakistanGuide.requestVideo}
        onPress={() => router.push("/video-request")}
      />

      <ServiceShowcase
        icon="shield-star"
        iconFamily="mci"
        title={t.pakistanGuide.protocolTitle}
        description={t.pakistanGuide.protocolDesc}
        price={t.pakistanGuide.customQuote}
        priceNote={t.pakistanGuide.protocolPriceNote}
        features={[
          { icon: "car", label: t.pakistanGuide.transport },
          { icon: "shield-checkmark", label: t.pakistanGuide.security },
          { icon: "navigate", label: t.pakistanGuide.guide },
          { icon: "airplane", label: t.pakistanGuide.airportPickup },
        ]}
        gradient={[Colors.light.primary, "#14A76C"]}
        buttonLabel={t.pakistanGuide.bookNow}
        onPress={() => router.push("/protocol-request")}
      />

      <ServiceShowcase
        icon="passport"
        iconFamily="mci"
        title={t.pakistanGuide.customsTitle}
        description={t.pakistanGuide.customsDesc}
        price={t.pakistanGuide.customQuote}
        priceNote={t.pakistanGuide.customsPriceNote}
        features={[
          { icon: "cart", label: t.pakistanGuide.buyGoods },
          { icon: "arrow-down-circle", label: t.pakistanGuide.importLabel },
          { icon: "arrow-up-circle", label: t.pakistanGuide.exportLabel },
          { icon: "document-text", label: t.pakistanGuide.clearance },
        ]}
        gradient={["#1B4332", "#2D6A4F"]}
        buttonLabel={t.pakistanGuide.getStarted}
        onPress={() => router.push("/customs-request")}
      />

      <View style={styles.contactBanner}>
        <LinearGradient
          colors={[Colors.light.primaryDark, Colors.light.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contactBannerInner}
        >
          <Ionicons name="call" size={28} color="#fff" />
          <Text style={styles.contactBannerTitle}>{t.pakistanGuide.needCustomPackage}</Text>
          <Text style={styles.contactBannerDesc}>
            {t.pakistanGuide.customPackageDesc}
          </Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/(tabs)/profile");
            }}
            style={({ pressed }) => [
              styles.contactBannerBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.contactBannerBtnText}>{t.pakistanGuide.contactUs}</Text>
          </Pressable>
        </LinearGradient>
      </View>
    </View>
  );
}

function PakistanInfoPage() {
  const { t } = useI18n();
  return (
    <View style={styles.pageContent}>
      <View style={styles.infoHeroBanner}>
        <Image
          source={require("@/assets/images/faisal-mosque.jpg")}
          style={styles.infoHeroImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={styles.infoHeroOverlay}
        >
          <Text style={styles.infoHeroTitle}>{t.pakistanGuide.discoverPakistan}</Text>
          <Text style={styles.infoHeroDesc}>
            {t.pakistanGuide.discoverDesc}
          </Text>
        </LinearGradient>
      </View>

      <View style={styles.statsRow}>
        <StatCard value="220M+" label={t.pakistanGuide.population} icon="people" color={Colors.light.primary} />
        <StatCard value="1947" label={t.pakistanGuide.founded} icon="flag" color={Colors.light.accent} />
        <StatCard value="796K" label={t.pakistanGuide.areaKm} icon="map" color="#1B4332" />
      </View>

      <ImageInfoSection
        image={require("@/assets/images/lahore-fort.jpg")}
        icon="time-outline"
        iconColor="#8B0000"
        title={t.pakistanGuide.partition}
        subtitle={t.pakistanGuide.partitionSubtitle}
      >
        <Text style={styles.infoBody}>
          {t.pakistanGuide.partitionBody}
        </Text>
        <InfoBullet icon="flag" text={t.pakistanGuide.partitionBullet1} />
        <InfoBullet icon="cut" text={t.pakistanGuide.partitionBullet2} />
        <InfoBullet icon="people" text={t.pakistanGuide.partitionBullet3} />
        <InfoBullet icon="business" text={t.pakistanGuide.partitionBullet4} />
        <InfoBullet icon="heart" text={t.pakistanGuide.partitionBullet5} />
        <InfoBullet icon="book" text={t.pakistanGuide.partitionBullet6} />
      </ImageInfoSection>

      <ImageInfoSection
        image={require("@/assets/images/mohenjo-daro.jpg")}
        icon="library-outline"
        iconColor="#4A148C"
        title={t.pakistanGuide.oldHistory}
        subtitle={t.pakistanGuide.oldHistorySubtitle}
      >
        <Text style={styles.infoBody}>
          {t.pakistanGuide.oldHistoryBody}
        </Text>
        <InfoBullet icon="business" text={t.pakistanGuide.oldHistoryBullet1} />
        <InfoBullet icon="school" text={t.pakistanGuide.oldHistoryBullet2} />
        <InfoBullet icon="globe" text={t.pakistanGuide.oldHistoryBullet3} />
        <InfoBullet icon="shield" text={t.pakistanGuide.oldHistoryBullet4} />
        <InfoBullet icon="people" text={t.pakistanGuide.oldHistoryBullet5} />
        <InfoBullet icon="train" text={t.pakistanGuide.oldHistoryBullet6} />
        <View style={styles.infoPlaces}>
          <ImagePlaceCard name={t.pakistanGuide.mohenjoDaro} desc={t.pakistanGuide.mohenjoDaroDesc} image={require("@/assets/images/mohenjo-daro.jpg")} />
          <ImagePlaceCard name={t.pakistanGuide.taxila} desc={t.pakistanGuide.taxilaDesc} image={require("@/assets/images/taxila.jpg")} />
          <ImagePlaceCard name={t.pakistanGuide.lahoreFort} desc={t.pakistanGuide.lahoreFortDesc} image={require("@/assets/images/lahore-fort.jpg")} />
        </View>
      </ImageInfoSection>

      <ImageInfoSection
        image={require("@/assets/images/modern-city.jpg")}
        icon="rocket-outline"
        iconColor="#0D47A1"
        title={t.pakistanGuide.modernHistory}
        subtitle={t.pakistanGuide.modernHistorySubtitle}
      >
        <Text style={styles.infoBody}>
          {t.pakistanGuide.modernHistoryBody}
        </Text>
        <InfoBullet icon="document-text" text={t.pakistanGuide.modernHistoryBullet1} />
        <InfoBullet icon="trending-up" text={t.pakistanGuide.modernHistoryBullet2} />
        <InfoBullet icon="nuclear" text={t.pakistanGuide.modernHistoryBullet3} />
        <InfoBullet icon="construct" text={t.pakistanGuide.modernHistoryBullet4} />
        <InfoBullet icon="code-slash" text={t.pakistanGuide.modernHistoryBullet5} />
        <InfoBullet icon="phone-portrait" text={t.pakistanGuide.modernHistoryBullet6} />
      </ImageInfoSection>

      <ImageInfoSection
        image={require("@/assets/images/islamabad.jpg")}
        icon="business-outline"
        iconColor="#1B5E20"
        title={t.pakistanGuide.capital}
        subtitle={t.pakistanGuide.capitalSubtitle}
      >
        <Text style={styles.infoBody}>
          {t.pakistanGuide.capitalBody}
        </Text>
        <InfoBullet icon="calendar" text={t.pakistanGuide.capitalBullet1} />
        <InfoBullet icon="star" text={t.pakistanGuide.capitalBullet2} />
        <InfoBullet icon="business" text={t.pakistanGuide.capitalBullet3} />
        <InfoBullet icon="leaf" text={t.pakistanGuide.capitalBullet4} />
        <InfoBullet icon="restaurant" text={t.pakistanGuide.capitalBullet5} />
        <InfoBullet icon="globe" text={t.pakistanGuide.capitalBullet6} />
        <View style={styles.infoPlaces}>
          <ImagePlaceCard name={t.pakistanGuide.faisalMosque} desc={t.pakistanGuide.faisalMosqueDesc} image={require("@/assets/images/faisal-mosque.jpg")} />
          <PlaceCard name={t.pakistanGuide.margallaHills} desc={t.pakistanGuide.margallaHillsDesc} icon="leaf-outline" />
          <PlaceCard name={t.pakistanGuide.pakistanMonument} desc={t.pakistanGuide.pakistanMonumentDesc} icon="flag-outline" />
        </View>
      </ImageInfoSection>

      <ImageInfoSection
        icon="trending-up-outline"
        iconColor="#E65100"
        title={t.pakistanGuide.economy}
        subtitle={t.pakistanGuide.economySubtitle}
      >
        <Text style={styles.infoBody}>
          {t.pakistanGuide.economyBody}
        </Text>
        <View style={styles.industryGrid}>
          <View style={styles.industryItem}>
            <View style={[styles.industryIcon, { backgroundColor: "#E8F5E9" }]}>
              <Ionicons name="leaf" size={20} color="#2E7D32" />
            </View>
            <Text style={styles.industryName}>{t.pakistanGuide.agriculture}</Text>
            <Text style={styles.industryDesc}>{t.pakistanGuide.agricultureDesc}</Text>
          </View>
          <View style={styles.industryItem}>
            <View style={[styles.industryIcon, { backgroundColor: "#E3F2FD" }]}>
              <MaterialCommunityIcons name="tshirt-crew" size={20} color="#1565C0" />
            </View>
            <Text style={styles.industryName}>{t.pakistanGuide.textiles}</Text>
            <Text style={styles.industryDesc}>{t.pakistanGuide.textilesDesc}</Text>
          </View>
          <View style={styles.industryItem}>
            <View style={[styles.industryIcon, { backgroundColor: "#FFF3E0" }]}>
              <Ionicons name="code-slash" size={20} color="#E65100" />
            </View>
            <Text style={styles.industryName}>{t.pakistanGuide.itTech}</Text>
            <Text style={styles.industryDesc}>{t.pakistanGuide.itTechDesc}</Text>
          </View>
          <View style={styles.industryItem}>
            <View style={[styles.industryIcon, { backgroundColor: "#F3E5F5" }]}>
              <Ionicons name="construct" size={20} color="#6A1B9A" />
            </View>
            <Text style={styles.industryName}>{t.pakistanGuide.construction}</Text>
            <Text style={styles.industryDesc}>{t.pakistanGuide.constructionDesc}</Text>
          </View>
        </View>
        <InfoBullet icon="cash" text={t.pakistanGuide.economyBullet1} />
        <InfoBullet icon="swap-horizontal" text={t.pakistanGuide.economyBullet2} />
        <InfoBullet icon="send" text={t.pakistanGuide.economyBullet3} />
        <InfoBullet icon="people" text={t.pakistanGuide.economyBullet4} />
      </ImageInfoSection>

      <ImageInfoSection
        image={require("@/assets/images/hunza-valley.jpg")}
        icon="airplane-outline"
        iconColor="#00695C"
        title={t.pakistanGuide.tourism}
        subtitle={t.pakistanGuide.tourismSubtitle}
      >
        <Text style={styles.infoBody}>
          {t.pakistanGuide.tourismBody}
        </Text>
        <View style={styles.infoPlaces}>
          <ImagePlaceCard name={t.pakistanGuide.hunzaValley} desc={t.pakistanGuide.hunzaValleyDesc} image={require("@/assets/images/hunza-valley.jpg")} />
          <ImagePlaceCard name={t.pakistanGuide.k2} desc={t.pakistanGuide.k2Desc} image={require("@/assets/images/k2-mountain.jpg")} />
          <ImagePlaceCard name={t.pakistanGuide.swatValley} desc={t.pakistanGuide.swatValleyDesc} image={require("@/assets/images/swat-valley.jpg")} />
        </View>
        <PlaceCard name={t.pakistanGuide.skardu} desc={t.pakistanGuide.skarduDesc} icon="water-outline" />
        <PlaceCard name={t.pakistanGuide.lahoreOldCity} desc={t.pakistanGuide.lahoreOldCityDesc} icon="restaurant-outline" />
        <PlaceCard name={t.pakistanGuide.fairyMeadows} desc={t.pakistanGuide.fairyMeadowsDesc} icon="flower-outline" />
        <PlaceCard name={t.pakistanGuide.deosaiPark} desc={t.pakistanGuide.deosaiParkDesc} icon="paw-outline" />
        <PlaceCard name={t.pakistanGuide.makranCoast} desc={t.pakistanGuide.makranCoastDesc} icon="sunny-outline" />
        <View style={styles.tourContactCard}>
          <LinearGradient
            colors={[Colors.light.primary + "10", Colors.light.primary + "05"]}
            style={styles.tourContactInner}
          >
            <Ionicons name="globe-outline" size={28} color={Colors.light.primary} />
            <Text style={styles.tourContactTitle}>{t.pakistanGuide.planningTrip}</Text>
            <Text style={styles.tourContactDesc}>
              {t.pakistanGuide.planningTripDesc}
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/(tabs)/services");
              }}
              style={({ pressed }) => [
                styles.tourContactBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={styles.tourContactBtnText}>{t.pakistanGuide.viewOurServices}</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </Pressable>
          </LinearGradient>
        </View>
      </ImageInfoSection>
    </View>
  );
}

export default function PakistanGuideScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { formatPrice } = useCurrency();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const [activeTab, setActiveTab] = useState<"services" | "info">("services");
  const slideAnim = useRef(new Animated.Value(0)).current;

  const switchTab = (tab: "services" | "info") => {
    setActiveTab(tab);
    Animated.spring(slideAnim, {
      toValue: tab === "services" ? 0 : 1,
      useNativeDriver: false,
      tension: 80,
      friction: 12,
    }).start();
    Haptics.selectionAsync();
  };

  const indicatorLeft = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "50%"],
  });

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + webTopInset,
          paddingBottom: insets.bottom + webBottomInset + 40,
        }}
      >
        <LinearGradient
          colors={[Colors.light.primaryDark, Colors.light.primary, "#14A76C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroHeader}
        >
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <MaterialCommunityIcons name="star-crescent" size={44} color={Colors.light.accent} />
          <Text style={styles.heroTitle}>{t.pakistanGuide.title}</Text>
          <Text style={styles.heroSubtitle}>
            {t.pakistanGuide.subtitle}
          </Text>
        </LinearGradient>

        <View style={styles.tabBar}>
          <Animated.View
            style={[
              styles.tabIndicator,
              { left: indicatorLeft },
            ]}
          />
          <Pressable
            onPress={() => switchTab("services")}
            style={styles.tabItem}
          >
            <Ionicons
              name="briefcase"
              size={18}
              color={activeTab === "services" ? "#fff" : Colors.light.textSecondary}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === "services" && styles.tabLabelActive,
              ]}
            >
              {t.pakistanGuide.currentServices}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => switchTab("info")}
            style={styles.tabItem}
          >
            <Ionicons
              name="book"
              size={18}
              color={activeTab === "info" ? "#fff" : Colors.light.textSecondary}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === "info" && styles.tabLabelActive,
              ]}
            >
              {t.pakistanGuide.pakistanInfo}
            </Text>
          </Pressable>
        </View>

        {activeTab === "services" ? <CurrentServicesPage /> : <PakistanInfoPage />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  heroHeader: {
    padding: 24,
    paddingTop: 16,
    alignItems: "center",
    paddingBottom: 30,
  },
  backBtn: {
    alignSelf: "flex-start",
    marginBottom: 12,
    padding: 4,
  },
  heroTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: "#fff",
    marginTop: 10,
    textAlign: "center",
  },
  heroSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
    textAlign: "center",
  },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: -18,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 16,
    padding: 4,
    position: "relative",
    elevation: 4,
    boxShadow: "0px 2px 8px rgba(0,0,0,0.1)",
  },
  tabIndicator: {
    position: "absolute",
    top: 4,
    width: "50%",
    height: "100%",
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    zIndex: 1,
  },
  tabLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  tabLabelActive: {
    color: "#fff",
  },
  pageContent: {
    padding: 16,
    gap: 16,
    paddingTop: 20,
  },
  pageIntro: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  infoHeroBanner: {
    borderRadius: 18,
    overflow: "hidden",
    height: 180,
    position: "relative",
  },
  infoHeroImage: {
    width: "100%",
    height: "100%",
  },
  infoHeroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    padding: 18,
  },
  infoHeroTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: "#fff",
  },
  infoHeroDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 18,
    marginTop: 4,
  },
  serviceShowcase: {
    borderRadius: 20,
    padding: 20,
    gap: 8,
  },
  serviceShowcaseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  serviceShowcaseHeaderText: {
    flex: 1,
    gap: 4,
  },
  serviceShowcaseTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#fff",
  },
  serviceShowcasePriceBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  serviceShowcasePriceText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    color: "#fff",
  },
  serviceShowcaseDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.88)",
    lineHeight: 18,
    marginTop: 4,
  },
  serviceShowcasePriceNote: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    fontStyle: "italic" as const,
  },
  serviceShowcaseFeatures: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  serviceFeatureChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 16,
  },
  serviceFeatureText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 10,
    color: "#fff",
  },
  serviceShowcaseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 8,
  },
  serviceShowcaseBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.light.primaryDark,
  },
  contactBanner: {
    borderRadius: 20,
    overflow: "hidden",
  },
  contactBannerInner: {
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  contactBannerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
  },
  contactBannerDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 18,
  },
  contactBannerBtn: {
    backgroundColor: Colors.light.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  contactBannerBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.light.primaryDark,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 4,
    borderLeftWidth: 3,
  },
  statValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: Colors.light.text,
  },
  statLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  infoSection: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 16,
    overflow: "hidden",
  },
  infoSectionImage: {
    width: "100%",
    height: 140,
  },
  infoSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  infoSectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  infoSectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
  },
  infoSectionSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  infoSectionBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  infoBody: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
    marginTop: 7,
  },
  bulletText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.text,
    lineHeight: 18,
    flex: 1,
  },
  infoPlaces: {
    gap: 10,
    marginTop: 10,
  },
  imgPlaceCard: {
    borderRadius: 14,
    overflow: "hidden",
    height: 120,
    position: "relative",
  },
  imgPlaceImage: {
    width: "100%",
    height: "100%",
  },
  imgPlaceOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    padding: 12,
  },
  imgPlaceName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  imgPlaceDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  placeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  placeCardText: {
    flex: 1,
  },
  placeCardName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.light.text,
  },
  placeCardDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  industryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  industryItem: {
    width: "48%" as any,
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  industryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  industryName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.light.text,
  },
  industryDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: Colors.light.textSecondary,
    lineHeight: 14,
  },
  tourContactCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.light.primary + "20",
  },
  tourContactInner: {
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  tourContactTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: Colors.light.text,
    textAlign: "center",
  },
  tourContactDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  tourContactBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  tourContactBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
});

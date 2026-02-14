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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

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

function InfoSection({
  icon,
  iconColor,
  title,
  children,
}: {
  icon: string;
  iconColor: string;
  title: string;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.infoSection}>
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
        <Text style={styles.infoSectionTitle}>{title}</Text>
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

function InfoBullet({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletDot} />
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
  return (
    <View style={styles.pageContent}>
      <Text style={styles.pageIntro}>
        We offer premium services tailored for overseas Pakistanis and international visitors. Each service includes professional support, transparent pricing, and dedicated customer care.
      </Text>

      <ServiceShowcase
        icon="videocam"
        iconFamily="ionicons"
        title="Village Video Service"
        description="Capture personal or memorable village locations in professional HD video. Relive the streets, homes, fields, and sacred places of your childhood village."
        price="$100"
        priceNote="1-hour HD video, no editing, same-day delivery"
        features={[
          { icon: "camera", label: "HD Quality" },
          { icon: "time", label: "1 Hour" },
          { icon: "today", label: "Same Day" },
          { icon: "videocam-outline", label: "Raw Footage" },
        ]}
        gradient={[Colors.light.accent, "#E8C96A"]}
        buttonLabel="Request Video"
        onPress={() => router.push("/video-request")}
      />

      <ServiceShowcase
        icon="shield-star"
        iconFamily="mci"
        title="Protocol Service"
        description="VIP protocol, transport, security, and experienced guide assistance for visitors to Pakistan. From airport pickup to full city escort, we ensure a smooth, secure visit."
        price="Custom Quote"
        priceNote="Price based on duration, coverage & requirements"
        features={[
          { icon: "car", label: "Transport" },
          { icon: "shield-checkmark", label: "Security" },
          { icon: "navigate", label: "Guide" },
          { icon: "airplane", label: "Airport Pickup" },
        ]}
        gradient={[Colors.light.primary, "#14A76C"]}
        buttonLabel="Book Now"
        onPress={() => router.push("/protocol-request")}
      />

      <ServiceShowcase
        icon="passport"
        iconFamily="mci"
        title="Customs Service"
        description="Full support for buying goods, importing, exporting, and handling all customs procedures in Pakistan. Legal, documented, and hassle-free customs clearance."
        price="Custom Quote"
        priceNote="Price based on type and scope of work"
        features={[
          { icon: "cart", label: "Buy Goods" },
          { icon: "arrow-down-circle", label: "Import" },
          { icon: "arrow-up-circle", label: "Export" },
          { icon: "document-text", label: "Clearance" },
        ]}
        gradient={["#1B4332", "#2D6A4F"]}
        buttonLabel="Get Started"
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
          <Text style={styles.contactBannerTitle}>Need a Custom Package?</Text>
          <Text style={styles.contactBannerDesc}>
            Contact us for personalized service combinations and special pricing for extended stays or group visits.
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
            <Text style={styles.contactBannerBtnText}>Contact Us</Text>
          </Pressable>
        </LinearGradient>
      </View>
    </View>
  );
}

function PakistanInfoPage() {
  return (
    <View style={styles.pageContent}>
      <Text style={styles.pageIntro}>
        Discover the rich history, vibrant culture, and modern achievements of Pakistan. From ancient civilizations to a thriving modern nation.
      </Text>

      <View style={styles.statsRow}>
        <StatCard value="220M+" label="Population" icon="people" color={Colors.light.primary} />
        <StatCard value="1947" label="Founded" icon="flag" color={Colors.light.accent} />
        <StatCard value="796K" label="Area (km2)" icon="map" color="#1B4332" />
      </View>

      <InfoSection icon="time-outline" iconColor="#8B0000" title="Punjab 1947 - The Partition">
        <Text style={styles.infoBody}>
          The partition of British India in 1947 was one of the most significant events in South Asian history. Punjab, the "Land of Five Rivers," was divided between Pakistan and India, reshaping millions of lives.
        </Text>
        <InfoBullet text="August 14, 1947: Pakistan gained independence under the leadership of Quaid-e-Azam Muhammad Ali Jinnah" />
        <InfoBullet text="The Radcliffe Line divided Punjab, separating communities that had coexisted for centuries" />
        <InfoBullet text="Millions of Muslims migrated to West Punjab (Pakistan), while Hindus and Sikhs moved east" />
        <InfoBullet text="Lahore, the cultural capital of Punjab, became part of Pakistan" />
        <InfoBullet text="The partition led to one of the largest mass migrations in human history" />
        <InfoBullet text="Despite the tragedy, Pakistan emerged as a sovereign nation with rich cultural heritage" />
      </InfoSection>

      <InfoSection icon="library-outline" iconColor="#4A148C" title="Pakistan Old History">
        <Text style={styles.infoBody}>
          The land that is now Pakistan has been home to some of the world's oldest and most sophisticated civilizations, spanning over 5,000 years of recorded history.
        </Text>
        <InfoBullet text="Indus Valley Civilization (3300-1300 BC): Mohenjo-daro and Harappa were among the world's most advanced ancient cities" />
        <InfoBullet text="Gandhara Civilization: Taxila was a renowned center of Buddhist learning and Greco-Buddhist art" />
        <InfoBullet text="Persian & Greek Influence: Alexander the Great passed through in 326 BC" />
        <InfoBullet text="Mughal Empire (1526-1857): Lahore became a jewel of Mughal architecture with the Badshahi Mosque, Lahore Fort, and Shalimar Gardens" />
        <InfoBullet text="Sikh Empire (1799-1849): Ranjit Singh ruled Punjab from Lahore" />
        <InfoBullet text="British Colonial Period (1849-1947): Infrastructure development, railways, and the seeds of independence movement" />
        <View style={styles.infoPlaces}>
          <PlaceCard name="Mohenjo-daro" desc="Ancient Indus Valley city, UNESCO site" icon="business-outline" />
          <PlaceCard name="Taxila" desc="Ancient Gandhara university town" icon="school-outline" />
          <PlaceCard name="Lahore Fort" desc="Mughal citadel, UNESCO World Heritage" icon="shield-outline" />
        </View>
      </InfoSection>

      <InfoSection icon="rocket-outline" iconColor="#0D47A1" title="Pakistan Modern History">
        <Text style={styles.infoBody}>
          Since independence in 1947, Pakistan has grown into a dynamic nation with significant achievements in defense, science, infrastructure, and culture.
        </Text>
        <InfoBullet text="1956: Pakistan became an Islamic Republic with its first constitution" />
        <InfoBullet text="1960s: 'Decade of Development' with rapid industrialization under Ayub Khan" />
        <InfoBullet text="1970s: Bhutto era - nationalization, nuclear program begins" />
        <InfoBullet text="1998: Pakistan becomes the 7th nuclear power in the world" />
        <InfoBullet text="CPEC (2015+): China-Pakistan Economic Corridor, $62 billion infrastructure investment" />
        <InfoBullet text="IT & Tech: Rapidly growing freelance and tech industry, one of the top freelancing countries globally" />
        <InfoBullet text="2023+: Digital Pakistan initiative, expanding 5G, fintech, and e-commerce" />
      </InfoSection>

      <InfoSection icon="business-outline" iconColor="#1B5E20" title="Capital City - Islamabad">
        <Text style={styles.infoBody}>
          Islamabad, the capital city, is one of the most beautiful and well-planned capitals in the world. Nestled at the foot of the Margalla Hills, it combines modern governance with natural beauty.
        </Text>
        <InfoBullet text="Founded in 1960 as a purpose-built capital to replace Karachi" />
        <InfoBullet text="Home to Faisal Mosque, one of the largest mosques in the world" />
        <InfoBullet text="Parliament House, Supreme Court, and all federal institutions" />
        <InfoBullet text="Margalla Hills National Park offers hiking, wildlife, and stunning views" />
        <InfoBullet text="Centaurus Mall, F-7 Jinnah Super, and vibrant food scenes" />
        <InfoBullet text="Diplomatic enclave hosts 75+ embassies and international organizations" />
        <View style={styles.infoPlaces}>
          <PlaceCard name="Faisal Mosque" desc="Iconic Turkish-designed mosque" icon="star-outline" />
          <PlaceCard name="Margalla Hills" desc="National park & hiking trails" icon="leaf-outline" />
          <PlaceCard name="Pakistan Monument" desc="Petal-shaped national landmark" icon="flag-outline" />
        </View>
      </InfoSection>

      <InfoSection icon="trending-up-outline" iconColor="#E65100" title="Industries & Economy">
        <Text style={styles.infoBody}>
          Pakistan has a diverse and growing economy driven by agriculture, textiles, IT services, and strategic trade partnerships.
        </Text>
        <View style={styles.industryGrid}>
          <View style={styles.industryItem}>
            <View style={[styles.industryIcon, { backgroundColor: "#E8F5E9" }]}>
              <Ionicons name="leaf" size={20} color="#2E7D32" />
            </View>
            <Text style={styles.industryName}>Agriculture</Text>
            <Text style={styles.industryDesc}>World's 5th largest cotton, 4th largest milk producer</Text>
          </View>
          <View style={styles.industryItem}>
            <View style={[styles.industryIcon, { backgroundColor: "#E3F2FD" }]}>
              <MaterialCommunityIcons name="tshirt-crew" size={20} color="#1565C0" />
            </View>
            <Text style={styles.industryName}>Textiles</Text>
            <Text style={styles.industryDesc}>Largest export sector, global supplier of garments</Text>
          </View>
          <View style={styles.industryItem}>
            <View style={[styles.industryIcon, { backgroundColor: "#FFF3E0" }]}>
              <Ionicons name="code-slash" size={20} color="#E65100" />
            </View>
            <Text style={styles.industryName}>IT & Tech</Text>
            <Text style={styles.industryDesc}>$2.6B+ IT exports, top freelancing nation</Text>
          </View>
          <View style={styles.industryItem}>
            <View style={[styles.industryIcon, { backgroundColor: "#F3E5F5" }]}>
              <Ionicons name="construct" size={20} color="#6A1B9A" />
            </View>
            <Text style={styles.industryName}>Construction</Text>
            <Text style={styles.industryDesc}>CPEC, new cities, dams, and motorways</Text>
          </View>
        </View>
        <InfoBullet text="GDP: $350+ billion (PPP), one of the Next Eleven economies" />
        <InfoBullet text="Key trade partners: China, UAE, Saudi Arabia, USA, EU" />
        <InfoBullet text="Remittances from overseas Pakistanis exceed $30 billion annually" />
      </InfoSection>

      <InfoSection icon="airplane-outline" iconColor="#00695C" title="Tourism & Contacts">
        <Text style={styles.infoBody}>
          Pakistan is home to some of the world's most breathtaking landscapes, from the highest peaks of the Karakoram to the ancient ruins of Mohenjo-daro.
        </Text>
        <View style={styles.infoPlaces}>
          <PlaceCard name="Hunza Valley" desc="Stunning mountain valley, 'Shangri-La' of Pakistan" icon="mountain-outline" />
          <PlaceCard name="Swat Valley" desc="'Switzerland of the East' - lush green paradise" icon="leaf-outline" />
          <PlaceCard name="K2 Base Camp" desc="World's 2nd highest peak, trekker's dream" icon="trail-sign-outline" />
          <PlaceCard name="Skardu" desc="Gateway to the Karakoram, crystal lakes" icon="water-outline" />
          <PlaceCard name="Lahore Old City" desc="Mughal heritage, food capital of Pakistan" icon="restaurant-outline" />
          <PlaceCard name="Fairy Meadows" desc="Green meadow with Nanga Parbat views" icon="flower-outline" />
        </View>
        <View style={styles.tourContactCard}>
          <LinearGradient
            colors={[Colors.light.primary + "10", Colors.light.primary + "05"]}
            style={styles.tourContactInner}
          >
            <Ionicons name="globe-outline" size={28} color={Colors.light.primary} />
            <Text style={styles.tourContactTitle}>Planning a Trip to Pakistan?</Text>
            <Text style={styles.tourContactDesc}>
              We help overseas Pakistanis and international visitors plan their visits. From protocol services to guided tours, we've got you covered.
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
              <Text style={styles.tourContactBtnText}>View Our Services</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </Pressable>
          </LinearGradient>
        </View>
      </InfoSection>
    </View>
  );
}

export default function PakistanGuideScreen() {
  const insets = useSafeAreaInsets();
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
          <Text style={styles.heroTitle}>Our Services & Pakistan Guide</Text>
          <Text style={styles.heroSubtitle}>
            Everything you need for your visit to Pakistan
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
              Current Services
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
              Pakistan Info
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
    flex: 1,
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
    gap: 8,
    marginTop: 8,
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

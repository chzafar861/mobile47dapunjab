import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Colors from "@/constants/colors";

const { width } = Dimensions.get("window");

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  gradient: string[];
  onPress: () => void;
}

function ServiceCard({ icon, title, subtitle, gradient, onPress }: ServiceCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.serviceCard,
        { transform: [{ scale: pressed ? 0.96 : 1 }] },
      ]}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.serviceGradient}
      >
        <View style={styles.serviceIconWrap}>{icon}</View>
        <Text style={styles.serviceTitle}>{title}</Text>
        <Text style={styles.serviceSubtitle}>{subtitle}</Text>
      </LinearGradient>
    </Pressable>
  );
}

interface FeatureRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
}

function FeatureRow({ icon, title, description, onPress }: FeatureRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.featureRow,
        { opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={styles.featureIcon}>{icon}</View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.light.tabIconDefault} />
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + webTopInset + 16,
          paddingBottom: insets.bottom + webBottomInset + 100,
        }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <LinearGradient
          colors={[Colors.light.primaryDark, Colors.light.primary, "#0E8C5E"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroTopRow}>
              <View>
                <Text style={styles.heroWelcome}>Welcome to</Text>
                <Text style={styles.heroTitle}>47daPunjab</Text>
              </View>
              <Pressable
                onPress={() => router.push("/(tabs)/profile")}
                style={styles.avatarBtn}
              >
                <Ionicons name="person-circle" size={40} color="rgba(255,255,255,0.9)" />
              </Pressable>
            </View>
            <Text style={styles.heroSubtitle}>
              Your gateway to Punjab, Pakistan. Protocol services, village videos, rentals & more.
            </Text>
          </View>
          <View style={styles.heroWave} />
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Services</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.servicesRow}
          >
            <ServiceCard
              icon={<MaterialCommunityIcons name="shield-star" size={28} color="#fff" />}
              title="Protocol"
              subtitle="VIP escort service"
              gradient={["#0A6847", "#14A76C"]}
              onPress={() => router.push("/(tabs)/services")}
            />
            <ServiceCard
              icon={<Ionicons name="videocam" size={28} color="#fff" />}
              title="Video Service"
              subtitle="$100 / 1 hour"
              gradient={["#D4A843", "#E8C96A"]}
              onPress={() => router.push("/(tabs)/services")}
            />
            <ServiceCard
              icon={<MaterialCommunityIcons name="passport" size={28} color="#fff" />}
              title="Customs"
              subtitle="Travel assistance"
              gradient={["#2C3E50", "#4A6274"]}
              onPress={() => router.push("/(tabs)/services")}
            />
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore</Text>
          <FeatureRow
            icon={<Ionicons name="bag-handle" size={22} color={Colors.light.primary} />}
            title="Shop"
            description="Browse Pakistani products & souvenirs"
            onPress={() => router.push("/(tabs)/shop")}
          />
          <FeatureRow
            icon={<Ionicons name="key" size={22} color={Colors.light.accent} />}
            title="Rentals"
            description="Properties, vehicles & equipment"
            onPress={() => router.push("/(tabs)/rent")}
          />
          <FeatureRow
            icon={<MaterialCommunityIcons name="mosque" size={22} color={Colors.light.primaryDark} />}
            title="History"
            description="Historical & memorable places"
            onPress={() => router.push("/history")}
          />
          <FeatureRow
            icon={<MaterialCommunityIcons name="star-crescent" size={22} color="#1B4332" />}
            title="Pakistan Guide"
            description="Services overview & Pakistan info"
            onPress={() => router.push("/pakistan-guide")}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modern Pakistan</Text>
          <View style={styles.modernCard}>
            <LinearGradient
              colors={["#0A6847", "#053B2F"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modernGradient}
            >
              <MaterialCommunityIcons name="city-variant" size={40} color={Colors.light.accent} />
              <Text style={styles.modernTitle}>Discover Modern Pakistan</Text>
              <Text style={styles.modernDesc}>
                Experience the new face of Pakistan - smart cities, modern infrastructure, and vibrant culture.
              </Text>
              <Pressable
                onPress={() => router.push("/history")}
                style={({ pressed }) => [
                  styles.modernBtn,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={styles.modernBtnText}>Explore</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.light.primaryDark} />
              </Pressable>
            </LinearGradient>
          </View>
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
  hero: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: "hidden",
    minHeight: 180,
  },
  heroContent: {
    padding: 24,
    paddingBottom: 32,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroWelcome: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  heroTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: "#fff",
    marginTop: 2,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  heroSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    marginTop: 12,
    lineHeight: 20,
  },
  heroWave: {
    height: 20,
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -10,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: Colors.light.text,
    marginBottom: 12,
  },
  servicesRow: {
    gap: 12,
    paddingRight: 16,
  },
  serviceCard: {
    width: (width - 56) / 2.2,
    borderRadius: 16,
    overflow: "hidden",
  },
  serviceGradient: {
    padding: 16,
    minHeight: 130,
    justifyContent: "flex-end",
  },
  serviceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  serviceTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  serviceSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.light.text,
  },
  featureDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  modernCard: {
    borderRadius: 20,
    overflow: "hidden",
  },
  modernGradient: {
    padding: 24,
    alignItems: "center",
  },
  modernTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#fff",
    marginTop: 12,
    textAlign: "center",
  },
  modernDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  modernBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
    gap: 6,
  },
  modernBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.light.primaryDark,
  },
});

import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";

const ADMIN_EMAIL = "47dapunjab@gmail.com";

const FEATURES = [
  {
    icon: "storefront" as const,
    title: "Post & Sell Products",
    description: "List your products in the marketplace and reach thousands of buyers across Punjab and beyond.",
    gradient: ["#0A6847", "#2D6A4F"] as [string, string],
  },
  {
    icon: "create" as const,
    title: "Write Blog Posts",
    description: "Share your stories, travel tips, and cultural insights with the community through blog posts.",
    gradient: ["#053B2F", "#0A6847"] as [string, string],
  },
  {
    icon: "headset" as const,
    title: "Priority Support",
    description: "Get dedicated customer support with faster response times and personalized assistance.",
    gradient: ["#8B6914", "#D4A843"] as [string, string],
  },
];

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const { user } = useAuth();
  const { t } = useI18n();

  const handleContactAdmin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const message = `To request premium access, please contact the admin at:\n\n${ADMIN_EMAIL}\n\nInclude your name and registered email in your request.`;
    if (Platform.OS === "web") {
      window.alert(message);
    } else {
      Alert.alert("Contact Admin", message, [{ text: "OK" }]);
    }
  };

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

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
          colors={["#053B2F", Colors.light.primary, "#2D6A4F"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Pressable onPress={handleGoBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>

          <View style={styles.heroContent}>
            <View style={styles.crownCircle}>
              <LinearGradient
                colors={["#D4A843", "#F5D77A", "#D4A843"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.crownGradient}
              >
                <Ionicons name="diamond" size={36} color="#053B2F" />
              </LinearGradient>
            </View>
            <Text style={styles.heroTitle}>Premium Access</Text>
            <Text style={styles.heroSubtitle}>
              Posting products and writing blog posts requires premium or admin access. Upgrade to unlock all features.
            </Text>

            <View style={styles.heroBadge}>
              <Ionicons name="lock-closed" size={14} color={Colors.light.accent} />
              <Text style={styles.heroBadgeText}>Exclusive Features</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionTitle}>What You Get</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={styles.featuresContainer}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <LinearGradient
                colors={feature.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.featureIconWrap}
              >
                <Ionicons name={feature.icon} size={24} color="#fff" />
              </LinearGradient>
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </View>
              <View style={styles.featureAccent}>
                <Ionicons name="checkmark-circle" size={22} color={Colors.light.accent} />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.ctaSection}>
          <LinearGradient
            colors={["#D4A843", "#C4972E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradientBorder}
          >
            <View style={styles.ctaInner}>
              <Ionicons name="star" size={28} color={Colors.light.accent} />
              <Text style={styles.ctaTitle}>Ready to Unlock Premium?</Text>
              <Text style={styles.ctaDesc}>
                Contact the admin to request premium access and start posting products and writing blog posts today.
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.buttonsContainer}>
          <Pressable
            onPress={handleContactAdmin}
            style={({ pressed }) => [
              styles.contactBtn,
              { transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <LinearGradient
              colors={[Colors.light.accent, "#C4972E"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.contactBtnGradient}
            >
              <Ionicons name="mail" size={20} color="#fff" />
              <Text style={styles.contactBtnText}>Request Access</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={handleGoBack}
            style={({ pressed }) => [
              styles.goBackBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="arrow-back-circle-outline" size={20} color={Colors.light.textSecondary} />
            <Text style={styles.goBackBtnText}>Go Back</Text>
          </Pressable>
        </View>

        {user && (
          <View style={styles.userInfo}>
            <Ionicons name="person-circle-outline" size={16} color={Colors.light.textSecondary} />
            <Text style={styles.userInfoText}>
              Logged in as {user.name || user.email}
            </Text>
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
  hero: {
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  heroContent: {
    alignItems: "center",
    paddingTop: 8,
  },
  crownCircle: {
    marginBottom: 16,
  },
  crownGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#D4A843",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  heroTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    color: "#fff",
    textAlign: "center",
  },
  heroSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  heroBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: Colors.light.accent,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 16,
    gap: 12,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
  },
  featuresContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 14,
  },
  featureIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 3,
  },
  featureDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  featureAccent: {
    marginLeft: 4,
  },
  ctaSection: {
    paddingHorizontal: 16,
    marginTop: 28,
  },
  ctaGradientBorder: {
    borderRadius: 18,
    padding: 2,
  },
  ctaInner: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  ctaTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: Colors.light.text,
    marginTop: 10,
    textAlign: "center",
  },
  ctaDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  buttonsContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 12,
  },
  contactBtn: {
    borderRadius: 16,
    overflow: "hidden",
  },
  contactBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  contactBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
  goBackBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  goBackBtnText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 20,
    paddingHorizontal: 16,
  },
  userInfoText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});

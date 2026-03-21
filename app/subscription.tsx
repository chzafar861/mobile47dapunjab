import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { SEOHead } from "@/components/SEOHead";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { showAlert } from "@/lib/platform-alert";
import Colors from "@/constants/colors";

type Plan = "monthly" | "yearly";

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const { authFetch, user } = useAuth();
  const params = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [pendingSub, setPendingSub] = useState<any>(null);

  const [selectedPlan, setSelectedPlan] = useState<Plan>("yearly");
  const [processing, setProcessing] = useState(false);


  const checkStatus = useCallback(async () => {
    try {
      const data = await authFetch("/api/subscription/status");
      setIsActive(data.active);
      setSubscription(data.subscription || null);
      setPendingSub(data.pending || null);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    if (params.success === "true" && params.session_id) {
      verifyStripe(params.session_id as string);
    }
  }, [params.success, params.session_id]);

  const verifyStripe = async (sessionId: string) => {
    try {
      setProcessing(true);
      const result = await authFetch("/api/subscription/verify-stripe", {
        method: "POST",
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (result.active) {
        setIsActive(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showAlert("Success!", "Your subscription is now active. Enjoy all premium features!");
      }
    } catch {
      showAlert("Error", "Could not verify payment. Please contact support.");
    } finally {
      setProcessing(false);
      checkStatus();
    }
  };

  const handleSubscribe = async () => {
    setProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await authFetch("/api/subscription/create", {
        method: "POST",
        body: JSON.stringify({ plan: selectedPlan, payment_method: "stripe" }),
      });

      if (result.url) {
        if (Platform.OS === "web") {
          window.location.href = result.url;
        } else {
          Linking.openURL(result.url);
        }
      } else {
        showAlert("Error", "Could not create checkout session. Please try again.");
      }
    } catch (err: any) {
      showAlert("Error", err.message || "Failed to create subscription");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.light.primary} style={{ marginTop: 100 }} />
      </View>
    );
  }

  const planAmount = selectedPlan === "monthly" ? "$10" : "$40";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <SEOHead title="Subscription - 47daPunjab" description="Subscribe to 47daPunjab premium. Unlimited listings, boost visibility, get real orders." path="/subscription" keywords="47daPunjab subscription, premium, JazzCash, EasyPaisa, Stripe" />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Subscription</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        {isActive && subscription ? (
          <View style={styles.activeCard}>
            <LinearGradient
              colors={["#053B2F", Colors.light.primary, "#2D6A4F"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.activeCardGradient}
            >
              <View style={styles.activeIconWrap}>
                <Ionicons name="checkmark-circle" size={48} color="#fff" />
              </View>
              <Text style={styles.activeTitle}>You're Subscribed!</Text>
              <Text style={styles.activePlan}>
                {subscription.plan === "yearly" ? "Yearly" : "Monthly"} Plan
              </Text>
              <View style={styles.activeDetail}>
                <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.activeDetailText}>
                  Expires: {new Date(subscription.expires_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.featureList}>
                {["Unlimited Listings", "Boost Your Visibility", "Get Real Orders", "Premium Features"].map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <Ionicons name="checkmark" size={16} color="#A8E6CF" />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>
        ) : (
          <>
            {pendingSub && (pendingSub.status === "pending" || pendingSub.status === "awaiting_review") && (
              <View style={styles.pendingBanner}>
                <Ionicons name="time-outline" size={20} color={Colors.light.accent} />
                <Text style={styles.pendingText}>
                  {pendingSub.status === "awaiting_review"
                    ? "Your payment is being reviewed. We'll activate your subscription soon!"
                    : "You have a pending subscription. Complete payment to activate."}
                </Text>
              </View>
            )}

            <LinearGradient
              colors={["#053B2F", Colors.light.primary, "#2D6A4F"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <Text style={styles.heroEmoji}>🚀</Text>
              <Text style={styles.heroTitle}>Launch Your Listings{"\n"}Like a Pro!</Text>
              <Text style={styles.heroSubtitle}>
                Publish your products and reach real buyers instantly.
              </Text>
            </LinearGradient>

            <Text style={styles.sectionLabel}>Choose Your Plan</Text>
            <View style={styles.planRow}>
              <Pressable
                onPress={() => { setSelectedPlan("monthly"); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[styles.planCard, selectedPlan === "monthly" && styles.planCardSelected]}
              >
                <Text style={[styles.planPrice, selectedPlan === "monthly" && styles.planPriceSelected]}>$10</Text>
                <Text style={[styles.planPeriod, selectedPlan === "monthly" && styles.planPeriodSelected]}>/month</Text>
                <Text style={[styles.planName, selectedPlan === "monthly" && styles.planNameSelected]}>Monthly</Text>
              </Pressable>

              <Pressable
                onPress={() => { setSelectedPlan("yearly"); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[styles.planCard, selectedPlan === "yearly" && styles.planCardSelected]}
              >
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>Save 67%</Text>
                </View>
                <Text style={[styles.planPrice, selectedPlan === "yearly" && styles.planPriceSelected]}>$40</Text>
                <Text style={[styles.planPeriod, selectedPlan === "yearly" && styles.planPeriodSelected]}>/year</Text>
                <Text style={[styles.planName, selectedPlan === "yearly" && styles.planNameSelected]}>Yearly</Text>
              </Pressable>
            </View>

            <View style={styles.featuresSection}>
              <Text style={styles.featuresTitle}>What You Get</Text>
              {[
                { icon: "infinite-outline", text: "Unlimited Listings" },
                { icon: "trending-up-outline", text: "Boost Your Visibility" },
                { icon: "cart-outline", text: "Get Real Orders" },
                { icon: "star-outline", text: "Premium Features" },
                { icon: "shield-checkmark-outline", text: "Secure Payments" },
                { icon: "earth-outline", text: "Works Internationally" },
              ].map((f) => (
                <View key={f.text} style={styles.featureItem}>
                  <View style={styles.featureItemIcon}>
                    <Ionicons name={f.icon as any} size={20} color={Colors.light.primary} />
                  </View>
                  <Text style={styles.featureItemText}>{f.text}</Text>
                </View>
              ))}
            </View>

            <Pressable
              onPress={handleSubscribe}
              disabled={processing}
              style={({ pressed }) => [styles.subscribeBtn, { opacity: pressed || processing ? 0.85 : 1 }]}
            >
              <LinearGradient
                colors={[Colors.light.primary, "#2D6A4F"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.subscribeBtnGradient}
              >
                {processing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="rocket-outline" size={20} color="#fff" />
                    <Text style={styles.subscribeBtnText}>Subscribe Now — {planAmount}</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <View style={styles.secureRow}>
              <Ionicons name="card-outline" size={16} color={Colors.light.primary} />
              <Text style={styles.secureText}>Secure card payment via Stripe</Text>
              <Ionicons name="lock-closed-outline" size={14} color={Colors.light.primary} />
            </View>

            <Text style={styles.guarantee}>
              Cancel anytime  •  24/7 support  •  Works internationally
            </Text>

            <View style={styles.noticeBox}>
              <Ionicons name="alert-circle-outline" size={20} color={Colors.light.accent} />
              <Text style={styles.noticeText}>
                <Text style={{ fontFamily: "Poppins_600SemiBold" }}>Pakistani Users: </Text>
                Please make sure international online payments are enabled on your debit/credit card before subscribing. You can enable this from your bank's mobile app or by visiting your nearest branch.
              </Text>
            </View>

            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.goBackBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="arrow-back-circle-outline" size={20} color={Colors.light.textSecondary} />
              <Text style={styles.goBackBtnText}>Go Back</Text>
            </Pressable>
          </>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: Colors.light.text,
  },
  heroGradient: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  heroTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
  activeCard: {
    margin: 16,
    borderRadius: 20,
    overflow: "hidden",
  },
  activeCardGradient: {
    padding: 28,
    alignItems: "center",
  },
  activeIconWrap: {
    marginBottom: 12,
  },
  activeTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "#fff",
    marginBottom: 4,
  },
  activePlan: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 16,
  },
  activeDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  activeDetailText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  featureList: {
    gap: 8,
    alignSelf: "stretch",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#fff",
  },
  pendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    margin: 16,
    padding: 14,
    backgroundColor: Colors.light.accent + "15",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.accent + "30",
  },
  pendingText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.text,
  },
  sectionLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 10,
  },
  planRow: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 16,
  },
  planCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: "center",
  },
  planCardSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + "08",
  },
  planPrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: Colors.light.text,
  },
  planPriceSelected: {
    color: Colors.light.primary,
  },
  planPeriod: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: -4,
  },
  planPeriodSelected: {
    color: Colors.light.primary,
  },
  planName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 6,
  },
  planNameSelected: {
    color: Colors.light.primary,
  },
  saveBadge: {
    position: "absolute",
    top: -1,
    right: -1,
    backgroundColor: Colors.light.accent,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 10,
  },
  saveBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    color: "#fff",
  },
  featuresSection: {
    margin: 16,
    padding: 20,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 16,
  },
  featuresTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 14,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  featureItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.primary + "12",
    alignItems: "center",
    justifyContent: "center",
  },
  featureItemText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: Colors.light.text,
  },
  subscribeBtn: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
  },
  subscribeBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
  },
  subscribeBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#fff",
  },
  secureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
  },
  secureText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.primary,
  },
  guarantee: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 10,
  },
  noticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 14,
    backgroundColor: Colors.light.accent + "12",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.accent + "25",
  },
  noticeText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.text,
    lineHeight: 18,
  },
  goBackBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  goBackBtnText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});

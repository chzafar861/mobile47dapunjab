import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { showAlert } from "@/lib/platform-alert";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/query-client";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useAuth } from "@/lib/auth-context";

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [reason, setReason] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  const { data: myStatus, isLoading: statusLoading } = useQuery<any>({
    queryKey: ["/api/access-requests/my-status"],
    enabled: !!user,
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/access-requests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/access-requests/my-status"] });
      setReason("");
      setShowErrors(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: any) => {
      showAlert("Error", err.message || "Could not submit request");
    },
  });

  const handleSubmit = () => {
    setShowErrors(true);
    if (!name.trim() || !email.trim() || !reason.trim()) {
      showAlert("Required", "Please fill in name, email, and reason.");
      return;
    }
    submitMutation.mutate({
      user_name: name.trim(),
      user_email: email.trim(),
      phone: phone.trim() || null,
      reason: reason.trim(),
      request_type: "premium",
    });
  };

  const isPending = myStatus?.status === "pending";
  const isApproved = myStatus?.status === "approved";
  const isRejected = myStatus?.status === "rejected";

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
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
                <Ionicons name="key" size={32} color="#053B2F" />
              </LinearGradient>
            </View>
            <Text style={styles.heroTitle}>Request Access</Text>
            <Text style={styles.heroSubtitle}>
              Submit a request to get premium access for posting products and writing blog posts.
            </Text>
          </View>
        </LinearGradient>

        {isPending && (
          <View style={styles.statusBanner}>
            <LinearGradient
              colors={["#FFF8E1", "#FFFDE7"]}
              style={styles.statusGradient}
            >
              <Ionicons name="time" size={28} color="#F9A825" />
              <View style={styles.statusTextWrap}>
                <Text style={styles.statusTitle}>Request Pending</Text>
                <Text style={styles.statusDesc}>
                  Your access request is being reviewed by the admin. You will be notified once it is approved.
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {isApproved && (
          <View style={styles.statusBanner}>
            <LinearGradient
              colors={["#E8F5E9", "#F1F8E9"]}
              style={styles.statusGradient}
            >
              <Ionicons name="checkmark-circle" size={28} color={Colors.light.primary} />
              <View style={styles.statusTextWrap}>
                <Text style={[styles.statusTitle, { color: Colors.light.primary }]}>Access Approved</Text>
                <Text style={styles.statusDesc}>
                  Your request has been approved! You now have premium access.
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {isRejected && (
          <View style={styles.statusBanner}>
            <LinearGradient
              colors={["#FFEBEE", "#FFF3F3"]}
              style={styles.statusGradient}
            >
              <Ionicons name="close-circle" size={28} color="#E53935" />
              <View style={styles.statusTextWrap}>
                <Text style={[styles.statusTitle, { color: "#E53935" }]}>Request Rejected</Text>
                <Text style={styles.statusDesc}>
                  {myStatus?.admin_note
                    ? `Admin note: ${myStatus.admin_note}`
                    : "Your previous request was not approved. You can submit a new request below."}
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {!isPending && !isApproved && (
          <View style={styles.formSection}>
            <View style={styles.formHeader}>
              <MaterialCommunityIcons name="form-textbox" size={22} color={Colors.light.primary} />
              <Text style={styles.formHeaderTitle}>Access Request Form</Text>
            </View>

            <View style={styles.formCard}>
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Full Name *</Text>
                <TextInput
                  style={[
                    styles.input,
                    showErrors && !name.trim() && styles.inputError,
                  ]}
                  placeholder="Enter your full name"
                  placeholderTextColor={Colors.light.tabIconDefault}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Email *</Text>
                <TextInput
                  style={[
                    styles.input,
                    showErrors && !email.trim() && styles.inputError,
                  ]}
                  placeholder="Enter your email address"
                  placeholderTextColor={Colors.light.tabIconDefault}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Phone (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  placeholderTextColor={Colors.light.tabIconDefault}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Reason for Access *</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    showErrors && !reason.trim() && styles.inputError,
                  ]}
                  placeholder="Tell us why you need premium access (e.g., sell products, write blog posts, share cultural stories...)"
                  placeholderTextColor={Colors.light.tabIconDefault}
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <Pressable
                onPress={handleSubmit}
                disabled={submitMutation.isPending}
                style={({ pressed }) => [
                  styles.submitBtn,
                  { opacity: submitMutation.isPending ? 0.6 : pressed ? 0.9 : 1 },
                ]}
              >
                <LinearGradient
                  colors={[Colors.light.accent, "#C4972E"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitBtnGradient}
                >
                  {submitMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="paper-plane" size={20} color="#fff" />
                      <Text style={styles.submitBtnText}>Submit Request</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <View style={styles.infoLine} />
            <Text style={styles.infoHeaderText}>What You Get</Text>
            <View style={styles.infoLine} />
          </View>

          {[
            { icon: "storefront", title: "Post & Sell Products", desc: "List products in the marketplace" },
            { icon: "create", title: "Write Blog Posts", desc: "Share stories and cultural insights" },
            { icon: "headset", title: "Priority Support", desc: "Faster response and assistance" },
          ].map((item, i) => (
            <View key={i} style={styles.infoCard}>
              <View style={styles.infoIconWrap}>
                <Ionicons name={item.icon as any} size={22} color={Colors.light.primary} />
              </View>
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoTitle}>{item.title}</Text>
                <Text style={styles.infoDesc}>{item.desc}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color={Colors.light.accent} />
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.goBackBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="arrow-back-circle-outline" size={20} color={Colors.light.textSecondary} />
          <Text style={styles.goBackBtnText}>Go Back</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
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
  statusBanner: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  statusGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statusTextWrap: {
    flex: 1,
  },
  statusTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#F9A825",
    marginBottom: 4,
  },
  statusDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  formSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  formHeaderTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
  },
  formCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 14,
  },
  fieldWrap: {},
  fieldLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.light.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: "#E53935",
  },
  submitBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 6,
  },
  submitBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 15,
  },
  submitBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  infoSection: {
    paddingHorizontal: 16,
    marginTop: 28,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  infoLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  infoHeaderText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 12,
  },
  infoIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.light.primary + "12",
    alignItems: "center",
    justifyContent: "center",
  },
  infoTextWrap: {
    flex: 1,
  },
  infoTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.light.text,
  },
  infoDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  goBackBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 20,
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

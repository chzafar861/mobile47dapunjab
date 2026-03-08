import React, { useState, useEffect } from "react";
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
import { showAlert, showConfirm } from "@/lib/platform-alert";
import { SEOHead } from "@/components/SEOHead";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { firebaseApi } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useI18n, LANGUAGES } from "@/lib/i18n";
import { useCurrency, CURRENCIES } from "@/lib/currency";

function InputField({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  editable = true,
  required,
  showErrors,
}: {
  icon: string;
  label: string;
  value: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "phone-pad" | "email-address";
  multiline?: boolean;
  editable?: boolean;
  required?: boolean;
  showErrors?: boolean;
}) {
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldLabelRow}>
        <Ionicons name={icon as any} size={16} color={Colors.light.primary} />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      <TextInput
        style={[
          styles.input,
          multiline && styles.textArea,
          !editable && styles.inputDisabled,
          showErrors && required && !value.trim() && { borderColor: Colors.light.danger },
        ]}
        placeholder={placeholder || label}
        placeholderTextColor={Colors.light.tabIconDefault}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || "default"}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? "top" : "center"}
        editable={editable}
        testID={`input-${label.toLowerCase().replace(/\s/g, "-")}`}
      />
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const { user, isAdmin, logout, updateProfile } = useAuth();
  const { t, lang, setLanguage, isRTL } = useI18n();
  const { currency, setCurrency, setCurrencyFromCountry, currencyInfo } = useCurrency();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    city: user?.city || "",
    country: user?.country || "",
    purpose: user?.purpose || "",
  });
  const [showErrors, setShowErrors] = useState(false);
  const [showProfileDetails, setShowProfileDetails] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name || "",
        phone: user.phone || "",
        city: user.city || "",
        country: user.country || "",
        purpose: user.purpose || "",
      });
    }
  }, [user]);

  const loadBookings = async () => {
    try {
      const items = await firebaseApi.getBookings();
      setBookings(items);
    } catch {}
  };

  const startEditing = () => {
    setEditData({
      name: user?.name || "",
      phone: user?.phone || "",
      city: user?.city || "",
      country: user?.country || "",
      purpose: user?.purpose || "",
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditData({
      name: user?.name || "",
      phone: user?.phone || "",
      city: user?.city || "",
      country: user?.country || "",
      purpose: user?.purpose || "",
    });
    setShowErrors(false);
    setIsEditing(false);
  };

  const saveProfile = async () => {
    setShowErrors(true);
    if (!editData.name.trim()) {
      showAlert(t.common.required, t.profile.enterName);
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile(editData);
      if (editData.country) {
        setCurrencyFromCountry(editData.country);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsEditing(false);
      showAlert(t.common.save, t.common.success);
    } catch {
      showAlert(t.common.error, t.common.error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    showConfirm(
      t.profile.signOut,
      t.profile.signOutConfirm,
      async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        await logout();
      },
      t.profile.signOut,
      true
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <SEOHead title="Profile" description="Manage your 47daPunjab account, orders, submissions, and settings." path="/profile" keywords="47daPunjab account, user profile, manage orders, settings" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + webTopInset + 16,
          paddingBottom: insets.bottom + webBottomInset + 100,
        }}
      >
        <LinearGradient
          colors={[Colors.light.primaryDark, Colors.light.primary]}
          style={styles.profileHeader}
        >
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={40} color={Colors.light.primary} />
          </View>
          <Text style={styles.profileName}>
            {user?.name || t.profile.editProfile}
          </Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <Text style={styles.profileLocation}>
            {user?.city && user?.country
              ? `${user.city}, ${user.country}`
              : t.profile.city}
          </Text>
          {isAdmin && (
            <View style={styles.adminBadge}>
              <MaterialCommunityIcons name="shield-check" size={14} color="#fff" />
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
          {!isEditing && (
            <Pressable
              onPress={startEditing}
              style={({ pressed }) => [
                styles.editProfileBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              testID="edit-profile-btn"
            >
              <Ionicons name="create-outline" size={16} color={Colors.light.primary} />
              <Text style={styles.editProfileBtnText}>{t.profile.editProfile}</Text>
            </Pressable>
          )}
        </LinearGradient>

        {isEditing ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.profile.editProfile}</Text>

            <View style={styles.formCard}>
              <InputField
                icon="person-outline"
                label={t.profile.fullName}
                value={editData.name}
                onChangeText={(v) => setEditData({ ...editData, name: v })}
                placeholder={t.profile.enterName}
                required={true}
                showErrors={showErrors}
              />
              <InputField
                icon="mail-outline"
                label={t.profile.email}
                value={user?.email || ""}
                editable={false}
              />
              <InputField
                icon="call-outline"
                label={t.profile.phone}
                value={editData.phone}
                onChangeText={(v) => setEditData({ ...editData, phone: v })}
                placeholder={t.profile.enterPhone}
                keyboardType="phone-pad"
              />
              <InputField
                icon="location-outline"
                label={t.profile.city}
                value={editData.city}
                onChangeText={(v) => setEditData({ ...editData, city: v })}
                placeholder={t.profile.enterCity}
              />
              <InputField
                icon="globe-outline"
                label={t.profile.country}
                value={editData.country}
                onChangeText={(v) => setEditData({ ...editData, country: v })}
                placeholder={t.profile.enterCountry}
              />
              <InputField
                icon="airplane-outline"
                label={t.profile.purpose}
                value={editData.purpose}
                onChangeText={(v) => setEditData({ ...editData, purpose: v })}
                placeholder={t.profile.enterPurpose}
                multiline
              />
            </View>

            <View style={styles.formActions}>
              <Pressable
                onPress={cancelEditing}
                style={({ pressed }) => [
                  styles.cancelBtn,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
                testID="cancel-edit-btn"
              >
                <Ionicons name="close" size={18} color={Colors.light.textSecondary} />
                <Text style={styles.cancelBtnText}>{t.common.cancel}</Text>
              </Pressable>
              <Pressable
                onPress={saveProfile}
                disabled={isSaving}
                style={({ pressed }) => [
                  styles.saveBtn,
                  { opacity: pressed || isSaving ? 0.75 : 1 },
                ]}
                testID="save-profile-btn"
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>{t.profile.saveChanges}</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Pressable
              onPress={() => {
                setShowProfileDetails(!showProfileDetails);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={styles.profileDetailsToggle}
            >
              <Text style={styles.sectionTitle}>{t.profile.profileDetails}</Text>
              <Ionicons
                name={showProfileDetails ? "chevron-up" : "chevron-down"}
                size={20}
                color={Colors.light.textSecondary}
              />
            </Pressable>
            {showProfileDetails && (
              <View style={styles.profileDetails}>
                <ProfileRow icon="person-outline" label={t.profile.fullName} value={user?.name || ""} />
                <View style={styles.rowDivider} />
                <ProfileRow icon="call-outline" label={t.profile.phone} value={user?.phone || ""} />
                <View style={styles.rowDivider} />
                <ProfileRow icon="mail-outline" label={t.profile.email} value={user?.email || ""} />
                <View style={styles.rowDivider} />
                <ProfileRow icon="location-outline" label={t.profile.city} value={user?.city || ""} />
                <View style={styles.rowDivider} />
                <ProfileRow icon="globe-outline" label={t.profile.country} value={user?.country || ""} />
                <View style={styles.rowDivider} />
                <ProfileRow icon="airplane-outline" label={t.profile.purpose} value={user?.purpose || ""} />
              </View>
            )}
          </View>
        )}

        {isAdmin && !isEditing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.profile.adminPanel}</Text>
            <View style={styles.adminStats}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{bookings.length}</Text>
                <Text style={styles.statLabel}>{t.profile.bookings}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>8</Text>
                <Text style={styles.statLabel}>{t.profile.products}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>8</Text>
                <Text style={styles.statLabel}>{t.profile.rentals}</Text>
              </View>
            </View>

            {bookings.length > 0 && (
              <View style={styles.bookingsList}>
                <Text style={styles.bookingsTitle}>{t.profile.recentBookings}</Text>
                {bookings.slice(-5).reverse().map((b, i) => (
                  <View key={i} style={styles.bookingItem}>
                    <View style={styles.bookingDot} />
                    <View style={styles.bookingInfo}>
                      <Text style={styles.bookingType}>{b.type}</Text>
                      <Text style={styles.bookingName}>{b.name} - {b.phone}</Text>
                      <Text style={styles.bookingDate}>
                        {new Date(b.date).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <Pressable
              onPress={() => router.push("/admin")}
              style={({ pressed }) => [
                styles.adminBtn,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <MaterialCommunityIcons name="cog" size={20} color="#fff" />
              <Text style={styles.adminBtnText}>{t.profile.fullAdminDashboard}</Text>
            </Pressable>
          </View>
        )}

        {!isEditing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.profile.contentManagement || "Content Management"}</Text>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                if (isAdmin) {
                  router.push({ pathname: "/(tabs)/shop", params: { addProduct: "true" } });
                } else {
                  router.push("/subscription");
                }
              }}
              style={({ pressed }) => [
                styles.contentCard,
                { transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}
            >
              <LinearGradient
                colors={[Colors.light.primary, "#2D6A4F"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.contentCardGradient}
              >
                <View style={styles.contentCardIconWrap}>
                  <Ionicons name="bag-add" size={24} color={Colors.light.primary} />
                </View>
                <View style={styles.contentCardContent}>
                  <Text style={styles.contentCardTitle}>{t.profile.addProduct || "Add Product"}</Text>
                  <Text style={styles.contentCardDesc}>
                    {isAdmin
                      ? (t.profile.addProductAdminDesc || "Publish a new product to the shop")
                      : (t.profile.addProductDesc || "Subscribe to list your products")}
                  </Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={22} color="rgba(255,255,255,0.85)" />
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                if (isAdmin) {
                  router.push({ pathname: "/blog", params: { writePost: "true" } });
                } else {
                  router.push("/subscription");
                }
              }}
              style={({ pressed }) => [
                styles.contentCard,
                { transform: [{ scale: pressed ? 0.97 : 1 }], marginTop: 10 },
              ]}
            >
              <LinearGradient
                colors={[Colors.light.accent, "#C4972E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.contentCardGradient}
              >
                <View style={[styles.contentCardIconWrap, { backgroundColor: "rgba(212,175,55,0.15)" }]}>
                  <Feather name="edit-3" size={22} color={Colors.light.accent} />
                </View>
                <View style={styles.contentCardContent}>
                  <Text style={styles.contentCardTitle}>{t.profile.writeBlog || "Write Blog Post"}</Text>
                  <Text style={styles.contentCardDesc}>
                    {isAdmin
                      ? (t.profile.writeBlogAdminDesc || "Create a new blog article")
                      : (t.profile.writeBlogDesc || "Subscribe to publish your stories")}
                  </Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={22} color="rgba(255,255,255,0.85)" />
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {!isEditing && (
          <View style={styles.section}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/submit-details");
              }}
              style={({ pressed }) => [
                styles.submitDetailsCard,
                { transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}
              testID="submit-details-btn"
            >
              <LinearGradient
                colors={[Colors.light.accent, "#E8C96A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitDetailsGradient}
              >
                <View style={styles.submitDetailsIconWrap}>
                  <MaterialCommunityIcons name="file-document-edit" size={28} color={Colors.light.accent} />
                </View>
                <View style={styles.submitDetailsContent}>
                  <Text style={styles.submitDetailsTitle}>{t.profile.submitRequest}</Text>
                  <Text style={styles.submitDetailsDesc}>
                    {t.profile.submitRequestDesc}
                  </Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={24} color="rgba(255,255,255,0.85)" />
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {!isEditing && (
          <View style={styles.section}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/my-orders");
              }}
              style={({ pressed }) => [
                styles.mySubmissionsCard,
                { transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}
              testID="my-orders-btn"
            >
              <View style={styles.mySubmissionsInner}>
                <View style={[styles.mySubmissionsIconWrap, { backgroundColor: Colors.light.primary + "12" }]}>
                  <MaterialCommunityIcons name="package-variant" size={24} color={Colors.light.primary} />
                </View>
                <View style={styles.mySubmissionsContent}>
                  <Text style={styles.mySubmissionsTitle}>{t.profile.myOrders}</Text>
                  <Text style={styles.mySubmissionsDesc}>
                    {t.profile.myOrdersDesc}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.light.tabIconDefault} />
              </View>
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/my-submissions");
              }}
              style={({ pressed }) => [
                styles.mySubmissionsCard,
                { transform: [{ scale: pressed ? 0.97 : 1 }], marginTop: 10 },
              ]}
              testID="my-submissions-btn"
            >
              <View style={styles.mySubmissionsInner}>
                <View style={styles.mySubmissionsIconWrap}>
                  <Ionicons name="documents" size={24} color={Colors.light.primary} />
                </View>
                <View style={styles.mySubmissionsContent}>
                  <Text style={styles.mySubmissionsTitle}>{t.profile.mySubmissions}</Text>
                  <Text style={styles.mySubmissionsDesc}>
                    {t.profile.mySubmissionsDesc}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.light.tabIconDefault} />
              </View>
            </Pressable>
          </View>
        )}

        {!isEditing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.profile.language}</Text>
            <View style={styles.languageSelector}>
              {LANGUAGES.map((l) => (
                <Pressable key={l.code} onPress={() => { setLanguage(l.code); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={[styles.languageBtn, lang === l.code && styles.languageBtnActive]}>
                  <Text style={[styles.languageBtnText, lang === l.code && styles.languageBtnTextActive]}>{l.nativeLabel}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {!isEditing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.profile.currency}</Text>
            <Text style={styles.currencySubtitle}>{t.profile.selectCurrency}</Text>
            <View style={styles.currencySelector}>
              {CURRENCIES.map((c) => (
                <Pressable
                  key={c.code}
                  onPress={() => {
                    setCurrency(c.code);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[
                    styles.currencyBtn,
                    currency === c.code && styles.currencyBtnActive,
                  ]}
                >
                  <Text style={[styles.currencySymbol, currency === c.code && styles.currencySymbolActive]}>
                    {c.symbol} {c.code}
                  </Text>
                  <Text style={[styles.currencyName, currency === c.code && styles.currencyNameActive]}>
                    {c.nativeName}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {!isEditing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.profile.quickLinks}</Text>
            <Pressable
              onPress={() => router.push("/history")}
              style={({ pressed }) => [
                styles.linkRow,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <MaterialCommunityIcons name="mosque" size={20} color={Colors.light.primary} />
              <Text style={styles.linkText}>{t.profile.historyHeritage}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.light.tabIconDefault} />
            </Pressable>
            <Pressable
              onPress={() => router.push("/pakistan-guide")}
              style={({ pressed }) => [
                styles.linkRow,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <MaterialCommunityIcons name="star-crescent" size={20} color={Colors.light.primary} />
              <Text style={styles.linkText}>{t.profile.pakistanGuide}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.light.tabIconDefault} />
            </Pressable>
            <Pressable
              onPress={() => router.push("/privacy-policy")}
              style={({ pressed }) => [
                styles.linkRow,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Ionicons name="shield-checkmark-outline" size={20} color={Colors.light.primary} />
              <Text style={styles.linkText}>{t.profile.privacyPolicy}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.light.tabIconDefault} />
            </Pressable>
            <Pressable
              onPress={() => router.push("/terms")}
              style={({ pressed }) => [
                styles.linkRow,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Ionicons name="document-text-outline" size={20} color={Colors.light.primary} />
              <Text style={styles.linkText}>{t.profile.termsOfService}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.light.tabIconDefault} />
            </Pressable>
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.linkRow,
                { opacity: pressed ? 0.8 : 1 },
              ]}
              testID="sign-out-btn"
            >
              <Ionicons name="log-out-outline" size={20} color={Colors.light.danger} />
              <Text style={[styles.linkText, { color: Colors.light.danger }]}>{t.profile.signOut}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.light.tabIconDefault} />
            </Pressable>
          </View>
        )}
      </ScrollView>

    </KeyboardAvoidingView>
  );
}

function ProfileRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.profileRow}>
      <View style={styles.profileIconWrap}>
        <Ionicons name={icon as any} size={16} color={Colors.light.primary} />
      </View>
      <View style={styles.profileRowText}>
        <Text style={styles.profileLabel}>{label}</Text>
        <Text style={styles.profileValue} numberOfLines={1}>
          {value || ""}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  profileHeader: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  profileName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#fff",
  },
  profileEmail: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  profileLocation: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
  },
  adminBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#fff",
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 14,
  },
  editProfileBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.light.primary,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: Colors.light.text,
    marginBottom: 12,
  },
  profileDetailsToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 4,
  },
  formCard: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  fieldContainer: {
    gap: 6,
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fieldLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  input: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  inputDisabled: {
    backgroundColor: Colors.light.border + "40",
    color: Colors.light.tabIconDefault,
  },
  textArea: {
    minHeight: 80,
  },
  formActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cancelBtnText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  saveBtn: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    padding: 14,
  },
  saveBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  profileDetails: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    gap: 0,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  profileIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.light.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  profileRowText: {
    flex: 1,
  },
  profileLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.tabIconDefault,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  profileValue: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: Colors.light.text,
    marginTop: 1,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.light.border + "60",
  },
  adminStats: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  statNumber: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: Colors.light.primary,
  },
  statLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  bookingsList: {
    marginBottom: 16,
  },
  bookingsTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 10,
  },
  bookingItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  bookingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
    marginTop: 6,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingType: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.light.text,
  },
  bookingName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  bookingDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.tabIconDefault,
  },
  adminBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.primaryDark,
    borderRadius: 14,
    padding: 14,
  },
  adminBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  submitDetailsCard: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 4,
  },
  submitDetailsGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 14,
  },
  submitDetailsIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  submitDetailsContent: {
    flex: 1,
  },
  submitDetailsTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: "#fff",
  },
  submitDetailsDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 16,
    marginTop: 2,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  linkText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  mySubmissionsCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  mySubmissionsInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  mySubmissionsIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.light.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  mySubmissionsContent: {
    flex: 1,
  },
  mySubmissionsTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
  },
  mySubmissionsDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  languageSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  languageBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  languageBtnActive: {
    backgroundColor: Colors.light.primary + "15",
    borderColor: Colors.light.primary,
  },
  languageBtnText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  languageBtnTextActive: {
    color: Colors.light.primary,
    fontFamily: "Poppins_600SemiBold",
  },
  currencySubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 12,
  },
  currencySelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  currencyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    borderWidth: 1.5,
    borderColor: "transparent",
    minWidth: 90,
    alignItems: "center",
  },
  currencyBtnActive: {
    backgroundColor: Colors.light.primary + "15",
    borderColor: Colors.light.primary,
  },
  currencySymbol: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.light.text,
  },
  currencySymbolActive: {
    color: Colors.light.primary,
  },
  currencyName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  currencyNameActive: {
    color: Colors.light.primary,
  },
  contentCard: {
    borderRadius: 16,
    overflow: "hidden" as const,
    boxShadow: "0px 2px 6px rgba(0,0,0,0.1)",
    elevation: 3,
  },
  contentCardGradient: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    padding: 16,
    gap: 12,
  },
  contentCardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  contentCardContent: {
    flex: 1,
  },
  contentCardTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  contentCardDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
});

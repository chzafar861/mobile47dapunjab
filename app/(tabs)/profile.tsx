import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Image,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { firebaseApi } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/query-client";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import Colors from "@/constants/colors";

function InputField({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  editable = true,
}: {
  icon: string;
  label: string;
  value: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "phone-pad" | "email-address";
  multiline?: boolean;
  editable?: boolean;
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
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    city: user?.city || "",
    country: user?.country || "",
    purpose: user?.purpose || "",
  });
  const [showProfileDetails, setShowProfileDetails] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [personSubmitting, setPersonSubmitting] = useState(false);
  const [personImageUrl, setPersonImageUrl] = useState("");
  const [personForm, setPersonForm] = useState({
    full_name: "",
    village_of_origin: "",
    district: "",
    current_location: "",
    year_of_migration: "",
    migration_period: "after_1947" as "before_1947" | "after_1947",
    contact_info: "",
    notes: "",
  });

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
    setIsEditing(false);
  };

  const saveProfile = async () => {
    if (!editData.name.trim()) {
      if (Platform.OS === "web") {
        window.alert("Please enter your name.");
      } else {
        Alert.alert("Required", "Please enter your name.");
      }
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile(editData);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsEditing(false);
      if (Platform.OS === "web") {
        window.alert("Your profile has been updated.");
      } else {
        Alert.alert("Saved", "Your profile has been updated.");
      }
    } catch {
      if (Platform.OS === "web") {
        window.alert("Could not save profile. Please try again.");
      } else {
        Alert.alert("Error", "Could not save profile. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const resetPersonForm = () => {
    setPersonForm({
      full_name: "",
      village_of_origin: "",
      district: "",
      current_location: "",
      year_of_migration: "",
      migration_period: "after_1947",
      contact_info: "",
      notes: "",
    });
    setPersonImageUrl("");
  };

  const handleSubmitPerson = async () => {
    if (!personForm.full_name.trim()) {
      Alert.alert("Required", "Please enter the full name.");
      return;
    }
    if (!personForm.village_of_origin.trim()) {
      Alert.alert("Required", "Please enter the village of origin.");
      return;
    }
    if (!personForm.district.trim()) {
      Alert.alert("Required", "Please enter the district.");
      return;
    }
    if (!personForm.current_location.trim()) {
      Alert.alert("Required", "Please enter the current location.");
      return;
    }
    if (personForm.year_of_migration && (isNaN(parseInt(personForm.year_of_migration)) || parseInt(personForm.year_of_migration) < 1900 || parseInt(personForm.year_of_migration) > 2026)) {
      Alert.alert("Invalid Year", "Please enter a valid year.");
      return;
    }

    setPersonSubmitting(true);
    try {
      await apiRequest("POST", "/api/migration-records", {
        full_name: personForm.full_name.trim(),
        image_url: personImageUrl || null,
        village_of_origin: personForm.village_of_origin.trim(),
        district: personForm.district.trim(),
        year_of_migration: personForm.year_of_migration ? parseInt(personForm.year_of_migration) : null,
        migration_period: personForm.migration_period,
        current_location: personForm.current_location.trim(),
        contact_info: personForm.contact_info.trim() || null,
        notes: personForm.notes.trim() || null,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/migration-records"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetPersonForm();
      setShowPersonForm(false);
      Alert.alert("Success", "Person info submitted successfully!");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to submit. Please try again.");
    } finally {
      setPersonSubmitting(false);
    }
  };

  const pickPersonImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow photo library access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      setPersonImageUrl(`data:image/jpeg;base64,${result.assets[0].base64}`);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to sign out?");
      if (confirmed) {
        await logout();
      }
    } else {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await logout();
          },
        },
      ]);
    }
  };

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
            {user?.name || "Set Up Your Profile"}
          </Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <Text style={styles.profileLocation}>
            {user?.city && user?.country
              ? `${user.city}, ${user.country}`
              : "Add your location"}
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
              <Text style={styles.editProfileBtnText}>Edit Profile</Text>
            </Pressable>
          )}
        </LinearGradient>

        {isEditing ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Edit Profile</Text>

            <View style={styles.formCard}>
              <InputField
                icon="person-outline"
                label="Full Name"
                value={editData.name}
                onChangeText={(t) => setEditData({ ...editData, name: t })}
                placeholder="Enter your full name"
              />
              <InputField
                icon="mail-outline"
                label="Email"
                value={user?.email || ""}
                editable={false}
              />
              <InputField
                icon="call-outline"
                label="Phone"
                value={editData.phone}
                onChangeText={(t) => setEditData({ ...editData, phone: t })}
                placeholder="e.g. +92 300 1234567"
                keyboardType="phone-pad"
              />
              <InputField
                icon="location-outline"
                label="City"
                value={editData.city}
                onChangeText={(t) => setEditData({ ...editData, city: t })}
                placeholder="e.g. Lahore, London, New York"
              />
              <InputField
                icon="globe-outline"
                label="Country"
                value={editData.country}
                onChangeText={(t) => setEditData({ ...editData, country: t })}
                placeholder="e.g. Pakistan, UK, USA"
              />
              <InputField
                icon="airplane-outline"
                label="Purpose of Visit"
                value={editData.purpose}
                onChangeText={(t) => setEditData({ ...editData, purpose: t })}
                placeholder="e.g. Tourism, Family Visit, Business"
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
                <Text style={styles.cancelBtnText}>Cancel</Text>
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
                    <Text style={styles.saveBtnText}>Save Changes</Text>
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
              <Text style={styles.sectionTitle}>Profile Details</Text>
              <Ionicons
                name={showProfileDetails ? "chevron-up" : "chevron-down"}
                size={20}
                color={Colors.light.textSecondary}
              />
            </Pressable>
            {showProfileDetails && (
              <View style={styles.profileDetails}>
                <ProfileRow icon="person-outline" label="Name" value={user?.name || ""} />
                <View style={styles.rowDivider} />
                <ProfileRow icon="call-outline" label="Phone" value={user?.phone || ""} />
                <View style={styles.rowDivider} />
                <ProfileRow icon="mail-outline" label="Email" value={user?.email || ""} />
                <View style={styles.rowDivider} />
                <ProfileRow icon="location-outline" label="City" value={user?.city || ""} />
                <View style={styles.rowDivider} />
                <ProfileRow icon="globe-outline" label="Country" value={user?.country || ""} />
                <View style={styles.rowDivider} />
                <ProfileRow icon="airplane-outline" label="Purpose" value={user?.purpose || ""} />
              </View>
            )}
          </View>
        )}

        {isAdmin && !isEditing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Panel</Text>
            <View style={styles.adminStats}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{bookings.length}</Text>
                <Text style={styles.statLabel}>Bookings</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>8</Text>
                <Text style={styles.statLabel}>Products</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>8</Text>
                <Text style={styles.statLabel}>Rentals</Text>
              </View>
            </View>

            {bookings.length > 0 && (
              <View style={styles.bookingsList}>
                <Text style={styles.bookingsTitle}>Recent Bookings</Text>
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
              <Text style={styles.adminBtnText}>Full Admin Dashboard</Text>
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
                  <Text style={styles.submitDetailsTitle}>Submit Property Details</Text>
                  <Text style={styles.submitDetailsDesc}>
                    Submit details about your property, land, or memorable places in Pakistan with photos
                  </Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={24} color="rgba(255,255,255,0.85)" />
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowPersonForm(true);
              }}
              style={({ pressed }) => [
                styles.submitDetailsCard,
                { transform: [{ scale: pressed ? 0.97 : 1 }], marginTop: 12 },
              ]}
              testID="submit-person-btn"
            >
              <LinearGradient
                colors={[Colors.light.primary, Colors.light.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitDetailsGradient}
              >
                <View style={styles.submitDetailsIconWrap}>
                  <Ionicons name="people" size={28} color={Colors.light.primary} />
                </View>
                <View style={styles.submitDetailsContent}>
                  <Text style={styles.submitDetailsTitle}>Submit Person Info</Text>
                  <Text style={styles.submitDetailsDesc}>
                    Add a person to HumanFind - share family or community member details
                  </Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={24} color="rgba(255,255,255,0.85)" />
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {!isEditing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Links</Text>
            <Pressable
              onPress={() => router.push("/history")}
              style={({ pressed }) => [
                styles.linkRow,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <MaterialCommunityIcons name="mosque" size={20} color={Colors.light.primary} />
              <Text style={styles.linkText}>History & Heritage</Text>
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
              <Text style={styles.linkText}>Pakistan Guide & Services</Text>
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
              <Text style={[styles.linkText, { color: Colors.light.danger }]}>Sign Out</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.light.tabIconDefault} />
            </Pressable>
          </View>
        )}
      </ScrollView>

      <Modal visible={showPersonForm} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>Submit Person Info</Text>
            <Pressable onPress={() => { setShowPersonForm(false); resetPersonForm(); }}>
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.modalFormScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.personFormSection}>
              <Text style={styles.personFormLabel}>Full Name <Text style={{ color: Colors.light.danger }}>*</Text></Text>
              <TextInput
                style={styles.personFormInput}
                placeholder="e.g. Muhammad Aslam Khan"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={personForm.full_name}
                onChangeText={(t) => setPersonForm({ ...personForm, full_name: t })}
                testID="person-name"
              />
            </View>

            <View style={styles.personFormSection}>
              <Text style={styles.personFormLabel}>Photo (optional)</Text>
              {personImageUrl ? (
                <View style={styles.personImageWrap}>
                  <Image source={{ uri: personImageUrl }} style={styles.personImage} />
                  <Pressable onPress={() => setPersonImageUrl("")} style={styles.personImageRemove}>
                    <Ionicons name="close-circle" size={24} color={Colors.light.danger} />
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={pickPersonImage} style={styles.personImagePicker}>
                  <Ionicons name="images" size={24} color={Colors.light.primary} />
                  <Text style={styles.personImagePickerText}>Choose Photo</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.personFormSection}>
              <Text style={styles.personFormLabel}>Village of Origin <Text style={{ color: Colors.light.danger }}>*</Text></Text>
              <TextInput
                style={styles.personFormInput}
                placeholder="e.g. Amritsar, Jullundur"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={personForm.village_of_origin}
                onChangeText={(t) => setPersonForm({ ...personForm, village_of_origin: t })}
              />
            </View>

            <View style={styles.personFormSection}>
              <Text style={styles.personFormLabel}>District <Text style={{ color: Colors.light.danger }}>*</Text></Text>
              <TextInput
                style={styles.personFormInput}
                placeholder="e.g. Jalandhar, Amritsar"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={personForm.district}
                onChangeText={(t) => setPersonForm({ ...personForm, district: t })}
              />
            </View>

            <View style={styles.personFormSection}>
              <Text style={styles.personFormLabel}>Current Location <Text style={{ color: Colors.light.danger }}>*</Text></Text>
              <TextInput
                style={styles.personFormInput}
                placeholder="e.g. Lahore, Pakistan"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={personForm.current_location}
                onChangeText={(t) => setPersonForm({ ...personForm, current_location: t })}
              />
            </View>

            <View style={styles.personFormSection}>
              <Text style={styles.personFormLabel}>Year of Migration</Text>
              <TextInput
                style={styles.personFormInput}
                placeholder="e.g. 1947"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={personForm.year_of_migration}
                onChangeText={(t) => setPersonForm({ ...personForm, year_of_migration: t })}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            <View style={styles.personFormSection}>
              <Text style={styles.personFormLabel}>Migration Period</Text>
              <View style={styles.periodRow}>
                <Pressable
                  onPress={() => setPersonForm({ ...personForm, migration_period: "before_1947" })}
                  style={[styles.periodChip, personForm.migration_period === "before_1947" && styles.periodChipActive]}
                >
                  <Text style={[styles.periodChipText, personForm.migration_period === "before_1947" && styles.periodChipTextActive]}>Before 1947</Text>
                </Pressable>
                <Pressable
                  onPress={() => setPersonForm({ ...personForm, migration_period: "after_1947" })}
                  style={[styles.periodChip, personForm.migration_period === "after_1947" && styles.periodChipActive]}
                >
                  <Text style={[styles.periodChipText, personForm.migration_period === "after_1947" && styles.periodChipTextActive]}>After 1947</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.personFormSection}>
              <Text style={styles.personFormLabel}>Contact Info (optional)</Text>
              <TextInput
                style={styles.personFormInput}
                placeholder="Phone or email"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={personForm.contact_info}
                onChangeText={(t) => setPersonForm({ ...personForm, contact_info: t })}
              />
            </View>

            <View style={styles.personFormSection}>
              <Text style={styles.personFormLabel}>Notes / Story (optional)</Text>
              <TextInput
                style={[styles.personFormInput, { height: 90, textAlignVertical: "top" }]}
                placeholder="Share their story..."
                placeholderTextColor={Colors.light.tabIconDefault}
                value={personForm.notes}
                onChangeText={(t) => setPersonForm({ ...personForm, notes: t })}
                multiline
                numberOfLines={4}
              />
            </View>

            <Pressable
              onPress={handleSubmitPerson}
              disabled={personSubmitting}
              style={({ pressed }) => [
                styles.personSubmitBtn,
                { opacity: pressed || personSubmitting ? 0.75 : 1 },
              ]}
              testID="submit-person-confirm"
            >
              <LinearGradient
                colors={[Colors.light.primary, Colors.light.primaryDark]}
                style={styles.personSubmitGradient}
              >
                {personSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                    <Text style={styles.personSubmitText}>Submit Person</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
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
          {value || "Not set"}
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
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "web" ? 20 : 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalHeaderTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: Colors.light.text,
  },
  modalFormScroll: {
    padding: 20,
    paddingBottom: 60,
  },
  personFormSection: {
    marginBottom: 16,
  },
  personFormLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.text,
    marginBottom: 6,
  },
  personFormInput: {
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
  personImageWrap: {
    width: 90,
    height: 90,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative" as const,
  },
  personImage: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  personImageRemove: {
    position: "absolute" as const,
    top: 4,
    right: 4,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  personImagePicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: "dashed" as const,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  personImagePickerText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  periodRow: {
    flexDirection: "row",
    gap: 10,
  },
  periodChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  periodChipActive: {
    backgroundColor: Colors.light.primary + "15",
    borderColor: Colors.light.primary,
  },
  periodChipText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  periodChipTextActive: {
    color: Colors.light.primary,
  },
  personSubmitBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 8,
  },
  personSubmitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  personSubmitText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#fff",
  },
});

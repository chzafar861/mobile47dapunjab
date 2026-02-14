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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { firebaseApi } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const { user, isAdmin, logout, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    city: user?.city || "",
    country: user?.country || "",
    purpose: user?.purpose || "",
  });
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

  const saveProfile = async () => {
    if (!editData.name.trim()) {
      Alert.alert("Required", "Please enter your name.");
      return;
    }
    try {
      await updateProfile(editData);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsEditing(false);
      Alert.alert("Saved", "Your profile has been updated.");
    } catch {
      Alert.alert("Error", "Could not save profile.");
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
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
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
        </LinearGradient>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {isEditing ? "Edit Profile" : "Profile"}
            </Text>
            <Pressable
              onPress={() => {
                if (isEditing) {
                  saveProfile();
                } else {
                  setIsEditing(true);
                }
              }}
            >
              <Ionicons
                name={isEditing ? "checkmark" : "create-outline"}
                size={22}
                color={Colors.light.primary}
              />
            </Pressable>
          </View>

          {isEditing ? (
            <View style={styles.formFields}>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={editData.name}
                onChangeText={(t) => setEditData({ ...editData, name: t })}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={editData.phone}
                onChangeText={(t) => setEditData({ ...editData, phone: t })}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={editData.city}
                onChangeText={(t) => setEditData({ ...editData, city: t })}
              />
              <TextInput
                style={styles.input}
                placeholder="Country"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={editData.country}
                onChangeText={(t) => setEditData({ ...editData, country: t })}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Purpose of Visit (e.g., tourism, family visit)"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={editData.purpose}
                onChangeText={(t) => setEditData({ ...editData, purpose: t })}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          ) : (
            <View style={styles.profileDetails}>
              <ProfileRow icon="call-outline" label="Phone" value={user?.phone || ""} />
              <ProfileRow icon="mail-outline" label="Email" value={user?.email || ""} />
              <ProfileRow icon="location-outline" label="City" value={user?.city || ""} />
              <ProfileRow icon="globe-outline" label="Country" value={user?.country || ""} />
              <ProfileRow icon="airplane-outline" label="Purpose" value={user?.purpose || ""} />
            </View>
          )}
        </View>

        {isAdmin && (
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
            onPress={() => router.push("/submit-details")}
            style={({ pressed }) => [
              styles.linkRow,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="send" size={20} color={Colors.light.accent} />
            <Text style={styles.linkText}>Submit Property Details</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.light.tabIconDefault} />
          </Pressable>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.linkRow,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.light.danger} />
            <Text style={[styles.linkText, { color: Colors.light.danger }]}>Sign Out</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.light.tabIconDefault} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function ProfileRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.profileRow}>
      <Ionicons name={icon as any} size={18} color={Colors.light.textSecondary} />
      <Text style={styles.profileLabel}>{label}</Text>
      <Text style={styles.profileValue} numberOfLines={1}>
        {value || "Not set"}
      </Text>
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
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: Colors.light.text,
    marginBottom: 12,
  },
  formFields: {
    gap: 10,
  },
  input: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 14,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  textArea: {
    minHeight: 80,
  },
  profileDetails: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  profileLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
    width: 60,
  },
  profileValue: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.text,
    flex: 1,
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
});

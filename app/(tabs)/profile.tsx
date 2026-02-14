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
  Switch,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { db, collection, getDocs, doc, setDoc, getDoc, deleteDoc, query } from "@/lib/firebase";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

interface UserProfile {
  name: string;
  phone: string;
  email: string;
  city: string;
  country: string;
  purpose: string;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    phone: "",
    email: "",
    city: "",
    country: "",
    purpose: "",
  });
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    loadProfile();
    loadBookings();
  }, []);

  const loadProfile = async () => {
    try {
      const docSnap = await getDoc(doc(db, "users", "defaultUser"));
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      }
    } catch {}
  };

  const loadBookings = async () => {
    try {
      const snapshot = await getDocs(collection(db, "bookings"));
      const items = snapshot.docs.map((d) => ({ ...d.data(), docId: d.id }));
      setBookings(items);
    } catch {}
  };

  const saveProfile = async () => {
    if (!profile.name.trim()) {
      Alert.alert("Required", "Please enter your name.");
      return;
    }
    try {
      await setDoc(doc(db, "users", "defaultUser"), profile);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsEditing(false);
      Alert.alert("Saved", "Your profile has been updated.");
    } catch {
      Alert.alert("Error", "Could not save profile.");
    }
  };

  const clearAllData = async () => {
    Alert.alert(
      "Clear All Data",
      "This will remove all your saved data including profile, bookings, and cart. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await setDoc(doc(db, "users", "defaultUser"), { name: "", phone: "", email: "", city: "", country: "", purpose: "" });
              const bookSnap = await getDocs(collection(db, "bookings"));
              for (const d of bookSnap.docs) {
                await deleteDoc(doc(db, "bookings", d.id));
              }
              const cartSnap = await getDocs(collection(db, "cart"));
              for (const d of cartSnap.docs) {
                await deleteDoc(doc(db, "cart", d.id));
              }
            } catch {}
            setProfile({ name: "", phone: "", email: "", city: "", country: "", purpose: "" });
            setBookings([]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

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
          colors={[Colors.light.primaryDark, Colors.light.primary]}
          style={styles.profileHeader}
        >
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={40} color={Colors.light.primary} />
          </View>
          <Text style={styles.profileName}>
            {profile.name || "Set Up Your Profile"}
          </Text>
          <Text style={styles.profileLocation}>
            {profile.city && profile.country
              ? `${profile.city}, ${profile.country}`
              : "Add your location"}
          </Text>
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
                value={profile.name}
                onChangeText={(t) => setProfile({ ...profile, name: t })}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={profile.phone}
                onChangeText={(t) => setProfile({ ...profile, phone: t })}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={profile.email}
                onChangeText={(t) => setProfile({ ...profile, email: t })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={profile.city}
                onChangeText={(t) => setProfile({ ...profile, city: t })}
              />
              <TextInput
                style={styles.input}
                placeholder="Country"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={profile.country}
                onChangeText={(t) => setProfile({ ...profile, country: t })}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Purpose of Visit (e.g., tourism, family visit)"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={profile.purpose}
                onChangeText={(t) => setProfile({ ...profile, purpose: t })}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          ) : (
            <View style={styles.profileDetails}>
              <ProfileRow icon="call-outline" label="Phone" value={profile.phone} />
              <ProfileRow icon="mail-outline" label="Email" value={profile.email} />
              <ProfileRow icon="location-outline" label="City" value={profile.city} />
              <ProfileRow icon="globe-outline" label="Country" value={profile.country} />
              <ProfileRow icon="airplane-outline" label="Purpose" value={profile.purpose} />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.adminToggleRow}>
            <View style={styles.adminToggleLeft}>
              <MaterialCommunityIcons name="shield-account" size={22} color={Colors.light.primary} />
              <Text style={styles.adminToggleText}>Admin Mode</Text>
            </View>
            <Switch
              value={isAdmin}
              onValueChange={(v) => {
                setIsAdmin(v);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              trackColor={{ false: Colors.light.border, true: Colors.light.primary + "60" }}
              thumbColor={isAdmin ? Colors.light.primary : "#f4f4f4"}
            />
          </View>
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
            onPress={clearAllData}
            style={({ pressed }) => [
              styles.linkRow,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.light.danger} />
            <Text style={[styles.linkText, { color: Colors.light.danger }]}>Clear All Data</Text>
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
  profileLocation: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
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
  adminToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 14,
    padding: 16,
  },
  adminToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  adminToggleText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
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

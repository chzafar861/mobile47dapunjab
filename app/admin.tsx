import React, { useState, useEffect } from "react";
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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { firebaseApi } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { getApiUrl } from "@/lib/query-client";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

interface AuthUser {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: string;
  provider: string;
  avatar_url: string | null;
  created_at: string;
}

async function adminFetch(path: string, options: RequestInit = {}) {
  const baseUrl = getApiUrl();
  const url = new URL(path, baseUrl);
  const res = await globalThis.fetch(url.toString(), {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "include",
  });
  return res.json();
}

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const { user: currentUser, isAdmin } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [propertyDetails, setPropertyDetails] = useState<any[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [activeSection, setActiveSection] = useState<"overview" | "bookings" | "properties" | "users">("overview");

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert("Access Denied", "Admin access required.");
      router.back();
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [b, p] = await Promise.all([
        firebaseApi.getBookings(),
        firebaseApi.getPropertyDetails(),
      ]);
      setBookings(b);
      setPropertyDetails(p);
    } catch {}
    try {
      const u = await adminFetch("/api/auth/users");
      if (Array.isArray(u)) setUsers(u);
    } catch {}
  };

  const deleteBooking = async (id: string) => {
    Alert.alert("Delete Booking", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try { await firebaseApi.deleteBooking(id); } catch {}
          setBookings((prev) => prev.filter((b) => b.docId !== id));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  };

  const deleteProperty = async (id: string) => {
    Alert.alert("Delete Property", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try { await firebaseApi.deletePropertyDetail(id); } catch {}
          setPropertyDetails((prev) => prev.filter((p) => p.docId !== id));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  };

  const toggleUserRole = async (targetUser: AuthUser) => {
    const newRole = targetUser.role === "admin" ? "user" : "admin";
    Alert.alert(
      "Change Role",
      `Make ${targetUser.name || targetUser.email} a${newRole === "admin" ? "n admin" : " regular user"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              await adminFetch(`/api/auth/users/${targetUser.id}/role`, {
                method: "PUT",
                body: JSON.stringify({ role: newRole }),
              });
              setUsers((prev) => prev.map((u) => u.id === targetUser.id ? { ...u, role: newRole } : u));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {
              Alert.alert("Error", "Failed to update role");
            }
          },
        },
      ]
    );
  };

  const deleteUser = async (targetUser: AuthUser) => {
    if (targetUser.id === currentUser?.id) {
      Alert.alert("Error", "You cannot delete your own account.");
      return;
    }
    Alert.alert("Delete User", `Delete ${targetUser.name || targetUser.email}? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await adminFetch(`/api/auth/users/${targetUser.id}`, { method: "DELETE" });
            setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          } catch {
            Alert.alert("Error", "Failed to delete user");
          }
        },
      },
    ]);
  };

  const sections = ["overview", "bookings", "properties", "users"] as const;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + webTopInset + 16,
          paddingBottom: insets.bottom + webBottomInset + 40,
        }}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Pressable onPress={loadData}>
            <Ionicons name="refresh" size={22} color={Colors.light.primary} />
          </Pressable>
        </View>

        <LinearGradient
          colors={[Colors.light.primaryDark, Colors.light.primary]}
          style={styles.statsRow}
        >
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{bookings.length}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{propertyDetails.length}</Text>
            <Text style={styles.statLabel}>Properties</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{users.length}</Text>
            <Text style={styles.statLabel}>Users</Text>
          </View>
        </LinearGradient>

        <View style={styles.navRow}>
          {sections.map((sec) => (
            <Pressable
              key={sec}
              onPress={() => setActiveSection(sec)}
              style={[styles.navChip, activeSection === sec && styles.navChipActive]}
            >
              <Text style={[styles.navText, activeSection === sec && styles.navTextActive]}>
                {sec.charAt(0).toUpperCase() + sec.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeSection === "overview" && (
          <View style={styles.content}>
            <Pressable onPress={() => setActiveSection("bookings")} style={styles.actionCard}>
              <MaterialCommunityIcons name="calendar-check" size={28} color={Colors.light.primary} />
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Service Bookings</Text>
                <Text style={styles.actionDesc}>{bookings.length} total bookings</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.light.tabIconDefault} />
            </Pressable>
            <Pressable onPress={() => setActiveSection("properties")} style={styles.actionCard}>
              <MaterialCommunityIcons name="file-document" size={28} color={Colors.light.accent} />
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Property Submissions</Text>
                <Text style={styles.actionDesc}>{propertyDetails.length} submissions</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.light.tabIconDefault} />
            </Pressable>
            <Pressable onPress={() => setActiveSection("users")} style={styles.actionCard}>
              <Ionicons name="people" size={28} color="#1976D2" />
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>User Management</Text>
                <Text style={styles.actionDesc}>{users.length} registered users</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.light.tabIconDefault} />
            </Pressable>
          </View>
        )}

        {activeSection === "bookings" && (
          <View style={styles.content}>
            {bookings.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="calendar-blank" size={48} color={Colors.light.tabIconDefault} />
                <Text style={styles.emptyText}>No bookings yet</Text>
              </View>
            ) : (
              bookings.map((b, i) => (
                <View key={i} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemBadge}>
                      <Text style={styles.itemBadgeText}>{b.type}</Text>
                    </View>
                    <Pressable onPress={() => deleteBooking(b.docId || b.id)}>
                      <Ionicons name="trash-outline" size={18} color={Colors.light.danger} />
                    </Pressable>
                  </View>
                  <Text style={styles.itemName}>{b.name}</Text>
                  <Text style={styles.itemDetail}>{b.phone}</Text>
                  {b.details ? <Text style={styles.itemDetail}>{b.details}</Text> : null}
                  <Text style={styles.itemDate}>{new Date(b.date).toLocaleDateString()}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {activeSection === "properties" && (
          <View style={styles.content}>
            {propertyDetails.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="file-document-outline" size={48} color={Colors.light.tabIconDefault} />
                <Text style={styles.emptyText}>No property submissions yet</Text>
              </View>
            ) : (
              propertyDetails.map((p, i) => (
                <View key={i} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={[styles.itemBadge, { backgroundColor: Colors.light.accent + "20" }]}>
                      <Text style={[styles.itemBadgeText, { color: Colors.light.accent }]}>{p.propertyType}</Text>
                    </View>
                    <Pressable onPress={() => deleteProperty(p.docId || p.id)}>
                      <Ionicons name="trash-outline" size={18} color={Colors.light.danger} />
                    </Pressable>
                  </View>
                  <Text style={styles.itemName}>{p.ownerName}</Text>
                  <Text style={styles.itemDetail}>{p.phone}</Text>
                  <Text style={styles.itemDetail}>{p.location}</Text>
                  {p.area ? <Text style={styles.itemDetail}>Area: {p.area}</Text> : null}
                  {p.description ? <Text style={styles.itemDetail} numberOfLines={2}>{p.description}</Text> : null}
                  <Text style={styles.itemDate}>{new Date(p.date).toLocaleDateString()}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {activeSection === "users" && (
          <View style={styles.content}>
            {users.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={Colors.light.tabIconDefault} />
                <Text style={styles.emptyText}>No users yet</Text>
              </View>
            ) : (
              users.map((u) => (
                <View key={u.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={[styles.itemBadge, u.role === "admin" ? styles.adminRoleBadge : {}]}>
                      <Text style={[styles.itemBadgeText, u.role === "admin" ? { color: "#fff" } : {}]}>
                        {u.role.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.userActions}>
                      <Pressable
                        onPress={() => toggleUserRole(u)}
                        style={styles.userActionBtn}
                      >
                        <MaterialCommunityIcons
                          name={u.role === "admin" ? "shield-remove" : "shield-check"}
                          size={18}
                          color={u.role === "admin" ? Colors.light.accent : Colors.light.primary}
                        />
                      </Pressable>
                      {u.id !== currentUser?.id && (
                        <Pressable onPress={() => deleteUser(u)} style={styles.userActionBtn}>
                          <Ionicons name="trash-outline" size={18} color={Colors.light.danger} />
                        </Pressable>
                      )}
                    </View>
                  </View>
                  <Text style={styles.itemName}>{u.name || "No name"}</Text>
                  <Text style={styles.itemDetail}>{u.email}</Text>
                  {u.phone ? <Text style={styles.itemDetail}>{u.phone}</Text> : null}
                  <View style={styles.providerRow}>
                    <MaterialCommunityIcons
                      name={u.provider === "google" ? "google" : u.provider === "facebook" ? "facebook" : "email"}
                      size={14}
                      color={Colors.light.tabIconDefault}
                    />
                    <Text style={styles.providerText}>
                      {u.provider.charAt(0).toUpperCase() + u.provider.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.itemDate}>
                    Joined {new Date(u.created_at).toLocaleDateString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 20, color: Colors.light.text },
  statsRow: {
    marginHorizontal: 16,
    borderRadius: 16,
    flexDirection: "row",
    padding: 20,
    marginBottom: 20,
  },
  statItem: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.3)" },
  statNum: { fontFamily: "Poppins_700Bold", fontSize: 28, color: "#fff" },
  statLabel: { fontFamily: "Poppins_400Regular", fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  navRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 16, flexWrap: "wrap" },
  navChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.light.backgroundSecondary },
  navChipActive: { backgroundColor: Colors.light.primary },
  navText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: Colors.light.textSecondary },
  navTextActive: { color: "#fff" },
  content: { paddingHorizontal: 16, gap: 12 },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  actionInfo: { flex: 1 },
  actionTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: Colors.light.text },
  actionDesc: { fontFamily: "Poppins_400Regular", fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 40, gap: 12 },
  emptyText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: Colors.light.textSecondary },
  itemCard: { backgroundColor: Colors.light.backgroundSecondary, borderRadius: 14, padding: 16 },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  itemBadge: { backgroundColor: Colors.light.primary + "20", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  itemBadgeText: { fontFamily: "Poppins_500Medium", fontSize: 11, color: Colors.light.primary },
  adminRoleBadge: { backgroundColor: Colors.light.primary },
  itemName: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: Colors.light.text },
  itemDetail: { fontFamily: "Poppins_400Regular", fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  itemDate: { fontFamily: "Poppins_400Regular", fontSize: 11, color: Colors.light.tabIconDefault, marginTop: 6 },
  userActions: { flexDirection: "row", gap: 8 },
  userActionBtn: { padding: 4 },
  providerRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  providerText: { fontFamily: "Poppins_400Regular", fontSize: 11, color: Colors.light.tabIconDefault },
});

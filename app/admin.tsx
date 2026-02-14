import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { firebaseApi } from "@/lib/firebase";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const [bookings, setBookings] = useState<any[]>([]);
  const [propertyDetails, setPropertyDetails] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<"bookings" | "properties" | "overview">("overview");

  useEffect(() => {
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
  };

  const deleteBooking = async (id: string) => {
    Alert.alert("Delete Booking", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await firebaseApi.deleteBooking(id);
          } catch {}
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
          try {
            await firebaseApi.deletePropertyDetail(id);
          } catch {}
          setPropertyDetails((prev) => prev.filter((p) => p.docId !== id));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  };

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
            <Text style={styles.statNum}>8</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
        </LinearGradient>

        <View style={styles.navRow}>
          {(["overview", "bookings", "properties"] as const).map((sec) => (
            <Pressable
              key={sec}
              onPress={() => setActiveSection(sec)}
              style={[
                styles.navChip,
                activeSection === sec && styles.navChipActive,
              ]}
            >
              <Text
                style={[
                  styles.navText,
                  activeSection === sec && styles.navTextActive,
                ]}
              >
                {sec.charAt(0).toUpperCase() + sec.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeSection === "overview" && (
          <View style={styles.content}>
            <View style={styles.actionCard}>
              <MaterialCommunityIcons name="calendar-check" size={28} color={Colors.light.primary} />
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Service Bookings</Text>
                <Text style={styles.actionDesc}>
                  {bookings.length} total bookings for protocol, video, and customs services
                </Text>
              </View>
              <Pressable onPress={() => setActiveSection("bookings")}>
                <Ionicons name="chevron-forward" size={20} color={Colors.light.tabIconDefault} />
              </Pressable>
            </View>

            <View style={styles.actionCard}>
              <MaterialCommunityIcons name="file-document" size={28} color={Colors.light.accent} />
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Property Submissions</Text>
                <Text style={styles.actionDesc}>
                  {propertyDetails.length} property details submitted by users
                </Text>
              </View>
              <Pressable onPress={() => setActiveSection("properties")}>
                <Ionicons name="chevron-forward" size={20} color={Colors.light.tabIconDefault} />
              </Pressable>
            </View>

            <View style={styles.actionCard}>
              <Ionicons name="bag-handle" size={28} color="#1976D2" />
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Shop Products</Text>
                <Text style={styles.actionDesc}>8 products listed in the shop</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.light.tabIconDefault} />
            </View>

            <View style={styles.actionCard}>
              <Ionicons name="key" size={28} color="#7B1FA2" />
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Rental Listings</Text>
                <Text style={styles.actionDesc}>8 rental items available</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.light.tabIconDefault} />
            </View>
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
                  <Text style={styles.itemDate}>
                    {new Date(b.date).toLocaleDateString()}
                  </Text>
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
                  {p.description ? (
                    <Text style={styles.itemDetail} numberOfLines={2}>
                      {p.description}
                    </Text>
                  ) : null}
                  <Text style={styles.itemDate}>
                    {new Date(p.date).toLocaleDateString()}
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
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: Colors.light.text,
  },
  statsRow: {
    marginHorizontal: 16,
    borderRadius: 16,
    flexDirection: "row",
    padding: 20,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  statNum: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: "#fff",
  },
  statLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  navRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  navChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  navChipActive: {
    backgroundColor: Colors.light.primary,
  },
  navText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  navTextActive: {
    color: "#fff",
  },
  content: {
    paddingHorizontal: 16,
    gap: 12,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.light.text,
  },
  actionDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  itemCard: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 14,
    padding: 16,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  itemBadge: {
    backgroundColor: Colors.light.primary + "20",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  itemBadgeText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: Colors.light.primary,
  },
  itemName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
  },
  itemDetail: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  itemDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.tabIconDefault,
    marginTop: 6,
  },
});

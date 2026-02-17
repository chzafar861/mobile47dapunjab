import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { firebaseApi } from "@/lib/firebase";
import { showAlert, showConfirm } from "@/lib/platform-alert";
import { useAuth } from "@/lib/auth-context";
import { getApiUrl } from "@/lib/query-client";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
  const [bookings, setBookings] = useState<any[]>([]);
  const [propertyDetails, setPropertyDetails] = useState<any[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [writeRequests, setWriteRequests] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<"overview" | "bookings" | "properties" | "users" | "writers" | "orders">("overview");

  useEffect(() => {
    if (!isAdmin) {
      showAlert("Access Denied", "Admin access required.");
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
    try {
      const wr = await adminFetch("/api/blog-write-requests");
      if (Array.isArray(wr)) setWriteRequests(wr);
    } catch {}
    try {
      const o = await adminFetch("/api/admin/orders");
      if (Array.isArray(o)) setOrders(o.map((ord: any) => ({
        ...ord,
        items: typeof ord.items === "string" ? JSON.parse(ord.items) : ord.items,
      })));
    } catch {}
  };

  const deleteBooking = async (id: string) => {
    showConfirm(t.admin.deleteBooking, "Are you sure?", async () => {
      try { await firebaseApi.deleteBooking(id); } catch {}
      setBookings((prev) => prev.filter((b) => (b.docId || b.id) !== id));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }, t.common.delete, true);
  };

  const deleteProperty = async (id: string) => {
    showConfirm(t.admin.deleteProperty, "Are you sure?", async () => {
      try { await firebaseApi.deletePropertyDetail(id); } catch {}
      setPropertyDetails((prev) => prev.filter((p) => (p.docId || p.id) !== id));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }, t.common.delete, true);
  };

  const toggleUserRole = async (targetUser: AuthUser) => {
    const newRole = targetUser.role === "admin" ? "user" : "admin";
    const msg = `Make ${targetUser.name || targetUser.email} a${newRole === "admin" ? "n admin" : " regular user"}?`;
    showConfirm(t.admin.changeRole, msg, async () => {
      try {
        await adminFetch(`/api/auth/users/${targetUser.id}/role`, {
          method: "PUT",
          body: JSON.stringify({ role: newRole }),
        });
        setUsers((prev) => prev.map((u) => u.id === targetUser.id ? { ...u, role: newRole } : u));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        showAlert(t.common.error, "Failed to update role");
      }
    }, t.common.confirm);
  };

  const deleteUser = async (targetUser: AuthUser) => {
    if (targetUser.id === currentUser?.id) {
      showAlert(t.common.error, "You cannot delete your own account.");
      return;
    }
    const msg = `Delete ${targetUser.name || targetUser.email}? This cannot be undone.`;
    showConfirm(t.admin.deleteUser, msg, async () => {
      try {
        await adminFetch(`/api/auth/users/${targetUser.id}`, { method: "DELETE" });
        setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {
        showAlert(t.common.error, "Failed to delete user");
      }
    }, t.common.delete, true);
  };

  const approveWriteRequest = async (reqId: number) => {
    try {
      await adminFetch(`/api/blog-write-requests/${reqId}/approve`, {
        method: "PATCH",
        body: JSON.stringify({ admin_note: null }),
      });
      setWriteRequests((prev) => prev.map((r) => r.id === reqId ? { ...r, status: "approved" } : r));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      showAlert(t.common.error, "Failed to approve request");
    }
  };

  const rejectWriteRequest = async (reqId: number) => {
    showConfirm(t.admin.reject, "Are you sure you want to reject this writing request?", async () => {
      try {
        await adminFetch(`/api/blog-write-requests/${reqId}/reject`, {
          method: "PATCH",
          body: JSON.stringify({ admin_note: null }),
        });
        setWriteRequests((prev) => prev.map((r) => r.id === reqId ? { ...r, status: "rejected" } : r));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {
        showAlert(t.common.error, "Failed to reject request");
      }
    }, t.admin.reject, true);
  };

  const updateOrderStatus = async (orderId: number, newStatus: string, trackingNum?: string) => {
    try {
      const body: any = { status: newStatus };
      if (trackingNum) body.tracking_number = trackingNum;
      const result = await adminFetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      if (result.error) {
        showAlert(t.common.error, result.error);
        return;
      }
      setOrders((prev) => prev.map((o) => o.id === orderId ? {
        ...result,
        items: typeof result.items === "string" ? JSON.parse(result.items) : result.items,
      } : o));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      showAlert(t.common.error, "Failed to update order status");
    }
  };

  const [statusPickerOrder, setStatusPickerOrder] = useState<any>(null);

  const showStatusPicker = (order: any) => {
    setStatusPickerOrder(order);
  };

  const sections = ["overview", "bookings", "properties", "users", "writers", "orders"] as const;
  const sectionLabels: Record<string, string> = {
    overview: t.admin.overview,
    bookings: t.admin.bookings,
    properties: t.admin.properties,
    users: t.admin.users,
    writers: t.admin.writers,
    orders: t.admin.orders,
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
          <Text style={styles.headerTitle}>{t.admin.title}</Text>
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
            <Text style={styles.statLabel}>{t.admin.bookings}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{propertyDetails.length}</Text>
            <Text style={styles.statLabel}>{t.admin.properties}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{users.length}</Text>
            <Text style={styles.statLabel}>{t.admin.users}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{orders.length}</Text>
            <Text style={styles.statLabel}>{t.admin.orders}</Text>
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
                {sectionLabels[sec]}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeSection === "overview" && (
          <View style={styles.content}>
            <Pressable onPress={() => setActiveSection("bookings")} style={styles.actionCard}>
              <MaterialCommunityIcons name="calendar-check" size={28} color={Colors.light.primary} />
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>{t.admin.serviceBookings}</Text>
                <Text style={styles.actionDesc}>{bookings.length} {t.admin.totalBookings}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.light.tabIconDefault} />
            </Pressable>
            <Pressable onPress={() => setActiveSection("properties")} style={styles.actionCard}>
              <MaterialCommunityIcons name="file-document" size={28} color={Colors.light.accent} />
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>{t.admin.propertySubmissions}</Text>
                <Text style={styles.actionDesc}>{propertyDetails.length} {t.admin.submissions}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.light.tabIconDefault} />
            </Pressable>
            <Pressable onPress={() => setActiveSection("users")} style={styles.actionCard}>
              <Ionicons name="people" size={28} color="#1976D2" />
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>{t.admin.userManagement}</Text>
                <Text style={styles.actionDesc}>{users.length} {t.admin.registeredUsers}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.light.tabIconDefault} />
            </Pressable>
            <Pressable onPress={() => setActiveSection("orders")} style={styles.actionCard}>
              <MaterialCommunityIcons name="package-variant" size={28} color="#E65100" />
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>{t.admin.shopOrders}</Text>
                <Text style={styles.actionDesc}>{orders.length} {t.admin.totalOrders}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.light.tabIconDefault} />
            </Pressable>
            <Pressable onPress={() => setActiveSection("writers")} style={styles.actionCard}>
              <MaterialCommunityIcons name="pencil-lock" size={28} color="#9C27B0" />
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>{t.admin.writerRequests}</Text>
                <Text style={styles.actionDesc}>{writeRequests.filter(r => r.status === "pending").length} {t.admin.pendingRequests}</Text>
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
                <Text style={styles.emptyText}>{t.admin.noBookings}</Text>
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
                <Text style={styles.emptyText}>{t.admin.noProperties}</Text>
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
                <Text style={styles.emptyText}>{t.admin.noUsers}</Text>
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
                    {t.admin.joined} {new Date(u.created_at).toLocaleDateString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {activeSection === "orders" && (
          <View style={styles.content}>
            {orders.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="package-variant" size={48} color={Colors.light.tabIconDefault} />
                <Text style={styles.emptyText}>{t.admin.noOrders}</Text>
              </View>
            ) : (
              orders.map((o) => {
                const statusColors: Record<string, string> = {
                  pending: "#F59E0B",
                  confirmed: "#3B82F6",
                  processing: "#8B5CF6",
                  shipped: "#06B6D4",
                  out_for_delivery: "#10B981",
                  delivered: Colors.light.success,
                  cancelled: Colors.light.danger,
                };
                const sColor = statusColors[o.status] || Colors.light.primary;
                const items = Array.isArray(o.items) ? o.items : [];
                const itemCount = items.reduce((sum: number, v: any) => sum + (v.quantity || 1), 0);
                return (
                  <View key={o.id} style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                      <View style={[styles.itemBadge, { backgroundColor: sColor + "20" }]}>
                        <Text style={[styles.itemBadgeText, { color: sColor }]}>
                          {o.status.toUpperCase().replace("_", " ")}
                        </Text>
                      </View>
                      <Pressable onPress={() => showStatusPicker(o)} style={styles.userActionBtn}>
                        <MaterialCommunityIcons name="pencil-outline" size={18} color={Colors.light.primary} />
                      </Pressable>
                    </View>
                    <Text style={styles.itemName}>Order #{o.id} - {o.customer_name}</Text>
                    <Text style={styles.itemDetail}>
                      {itemCount} item{itemCount !== 1 ? "s" : ""} - ${Number(o.total).toFixed(2)}
                    </Text>
                    <Text style={styles.itemDetail}>
                      {items.map((v: any) => `${v.name} x${v.quantity || 1}`).join(", ")}
                    </Text>
                    <Text style={styles.itemDetail}>
                      {o.customer_phone} | {o.customer_city}, {o.customer_country || "Pakistan"}
                    </Text>
                    <Text style={styles.itemDetail}>
                      Payment: {o.payment_method === "cod" ? "Cash on Delivery" : "Card"}
                    </Text>
                    {o.tracking_number && (
                      <Text style={[styles.itemDetail, { color: Colors.light.primary }]}>
                        Tracking: {o.tracking_number}
                      </Text>
                    )}
                    <Text style={styles.itemDate}>
                      {new Date(o.created_at).toLocaleDateString()} at {new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        )}

        {activeSection === "writers" && (
          <View style={styles.content}>
            {writeRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="pencil-lock-outline" size={48} color={Colors.light.tabIconDefault} />
                <Text style={styles.emptyText}>{t.admin.noWriters}</Text>
              </View>
            ) : (
              writeRequests.map((r) => (
                <View key={r.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={[styles.itemBadge, 
                      r.status === "approved" ? { backgroundColor: Colors.light.primary + "20" } : 
                      r.status === "rejected" ? { backgroundColor: "#EF5350" + "20" } :
                      { backgroundColor: "#F9A825" + "20" }
                    ]}>
                      <Text style={[styles.itemBadgeText, 
                        r.status === "approved" ? { color: Colors.light.primary } : 
                        r.status === "rejected" ? { color: "#EF5350" } :
                        { color: "#F9A825" }
                      ]}>
                        {r.status.toUpperCase()}
                      </Text>
                    </View>
                    {r.status === "pending" && (
                      <View style={styles.userActions}>
                        <Pressable onPress={() => approveWriteRequest(r.id)} style={styles.userActionBtn}>
                          <Ionicons name="checkmark-circle" size={22} color={Colors.light.primary} />
                        </Pressable>
                        <Pressable onPress={() => rejectWriteRequest(r.id)} style={styles.userActionBtn}>
                          <Ionicons name="close-circle" size={22} color="#EF5350" />
                        </Pressable>
                      </View>
                    )}
                  </View>
                  <Text style={styles.itemName}>{r.user_name}</Text>
                  {r.user_email && <Text style={styles.itemDetail}>{r.user_email}</Text>}
                  <Text style={[styles.itemDetail, { marginTop: 6, color: Colors.light.text }]}>Reason: {r.reason}</Text>
                  {r.topics && <Text style={styles.itemDetail}>Topics: {r.topics}</Text>}
                  {r.sample_title && <Text style={styles.itemDetail}>Sample: {r.sample_title}</Text>}
                  <Text style={styles.itemDate}>
                    {t.admin.requested} {new Date(r.created_at).toLocaleDateString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
      {statusPickerOrder && (() => {
        const statuses = ["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled"];
        const labels: Record<string, string> = {
          pending: "Pending", confirmed: "Confirmed", processing: "Processing",
          shipped: "Shipped", out_for_delivery: "Out for Delivery", delivered: "Delivered", cancelled: "Cancelled",
        };
        const statusColors: Record<string, string> = {
          pending: "#F59E0B", confirmed: "#3B82F6", processing: "#8B5CF6",
          shipped: "#06B6D4", out_for_delivery: "#10B981", delivered: Colors.light.success, cancelled: Colors.light.danger,
        };
        return (
          <Modal visible transparent animationType="fade" onRequestClose={() => setStatusPickerOrder(null)}>
            <Pressable style={pickerStyles.overlay} onPress={() => setStatusPickerOrder(null)}>
              <View style={pickerStyles.sheet}>
                <Text style={pickerStyles.title}>{t.admin.updateStatus}</Text>
                <Text style={pickerStyles.subtitle}>Order #{statusPickerOrder.id} - Current: {labels[statusPickerOrder.status]}</Text>
                {statuses.filter((s) => s !== statusPickerOrder.status).map((s) => (
                  <Pressable key={s} style={pickerStyles.option} onPress={() => {
                    updateOrderStatus(statusPickerOrder.id, s);
                    setStatusPickerOrder(null);
                  }}>
                    <View style={[pickerStyles.dot, { backgroundColor: statusColors[s] }]} />
                    <Text style={pickerStyles.optionText}>{labels[s]}</Text>
                  </Pressable>
                ))}
                <Pressable style={pickerStyles.cancelBtn} onPress={() => setStatusPickerOrder(null)}>
                  <Text style={pickerStyles.cancelText}>{t.common.cancel}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Modal>
        );
      })()}
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  sheet: { backgroundColor: "#fff", borderRadius: 16, padding: 20, width: "85%", maxWidth: 360 },
  title: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: Colors.light.text, marginBottom: 4 },
  subtitle: { fontFamily: "Poppins_400Regular", fontSize: 13, color: Colors.light.textSecondary, marginBottom: 16 },
  option: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  dot: { width: 12, height: 12, borderRadius: 6 },
  optionText: { fontFamily: "Poppins_500Medium", fontSize: 14, color: Colors.light.text },
  cancelBtn: { marginTop: 16, alignItems: "center", paddingVertical: 12, borderRadius: 10, backgroundColor: Colors.light.backgroundSecondary },
  cancelText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: Colors.light.textSecondary },
});

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

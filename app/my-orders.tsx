import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { getApiUrl } from "@/lib/query-client";
import { nativeFetch } from "@/lib/api-fetch";
import { SEOHead } from "@/components/SEOHead";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  items: OrderItem[];
  total: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  customer_country: string;
  payment_method: string;
  status: string;
  tracking_number: string | null;
  created_at: string;
  status_updated_at: string;
}

const STATUS_STEPS = [
  { key: "pending", labelKey: "statusPending", icon: "receipt-outline" },
  { key: "confirmed", labelKey: "statusConfirmed", icon: "checkmark-circle-outline" },
  { key: "processing", labelKey: "statusProcessing", icon: "cube-outline" },
  { key: "shipped", labelKey: "statusShipped", icon: "airplane-outline" },
  { key: "out_for_delivery", labelKey: "statusOutForDelivery", icon: "bicycle-outline" },
  { key: "delivered", labelKey: "statusDelivered", icon: "checkmark-done-circle-outline" },
] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  confirmed: "#3B82F6",
  processing: "#8B5CF6",
  shipped: "#06B6D4",
  out_for_delivery: "#10B981",
  delivered: Colors.light.success,
  cancelled: Colors.light.danger,
};

async function orderFetch(path: string) {
  const res = await nativeFetch(path);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

function getStatusIndex(status: string): number {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MyOrdersScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const { t } = useI18n();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const productNameMap: Record<string, string> = useMemo(() => ({
    "1": t.products.p1_name,
    "2": t.products.p2_name,
    "3": t.products.p3_name,
    "4": t.products.p4_name,
    "5": t.products.p5_name,
    "6": t.products.p6_name,
    "7": t.products.p7_name,
    "8": t.products.p8_name,
  }), [t]);

  const getItemName = useCallback((item: OrderItem) => {
    return productNameMap[item.id] || item.name;
  }, [productNameMap]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const data = await orderFetch("/api/orders");
      const parsed = data.map((o: any) => ({
        ...o,
        items: typeof o.items === "string" ? JSON.parse(o.items) : o.items,
      }));
      setOrders(parsed);
    } catch {
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadOrders().finally(() => setLoading(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, [loadOrders]);

  const openOrder = (order: Order) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedOrder(order);
  };

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top || webTopInset }]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="log-in-outline" size={48} color={Colors.light.tabIconDefault} />
          <Text style={styles.emptyText}>Please log in to view your orders</Text>
          <Pressable onPress={() => router.push("/login")} style={styles.loginBtn}>
            <Text style={styles.loginBtnText}>Log In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SEOHead title="My Orders" description="View and track your 47daPunjab orders, bookings, and service requests." path="/my-orders" keywords="47daPunjab orders, order tracking, bookings, service requests" />
      <LinearGradient
        colors={[Colors.light.primaryDark, Colors.light.primary]}
        style={[styles.header, { paddingTop: (insets.top || webTopInset) + 8 }]}
      >
        <Pressable onPress={() => { if (router.canGoBack()) { router.back(); } else { router.replace("/(tabs)/profile"); } }} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>{t.orders.title}</Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={[styles.emptyText, { marginTop: 16 }]}>Loading orders...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="package-variant" size={56} color={Colors.light.tabIconDefault} />
          <Text style={styles.emptyTitle}>{t.orders.noOrders}</Text>
          <Text style={styles.emptyText}>{t.orders.noOrdersDesc}</Text>
          <Pressable
            onPress={() => router.push("/(tabs)/shop")}
            style={({ pressed }) => [styles.shopBtn, { opacity: pressed ? 0.9 : 1 }]}
          >
            <Ionicons name="bag-handle" size={18} color="#fff" />
            <Text style={styles.shopBtnText}>{t.orders.browseShop}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: (insets.bottom || webBottomInset) + 20 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.primary} />}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.orderCount}>{orders.length} {orders.length !== 1 ? t.orders.orderCount : t.orders.orderSingle}</Text>

          {orders.map((order) => {
            const statusIdx = getStatusIndex(order.status);
            const statusColor = STATUS_COLORS[order.status] || Colors.light.primary;
            const isCancelled = order.status === "cancelled";
            const isDelivered = order.status === "delivered";
            const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

            return (
              <Pressable
                key={order.id}
                onPress={() => openOrder(order)}
                style={({ pressed }) => [styles.orderCard, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}
              >
                <View style={styles.orderCardTop}>
                  <View style={styles.orderIdRow}>
                    <View style={[styles.orderIconWrap, { backgroundColor: statusColor + "18" }]}>
                      <MaterialCommunityIcons
                        name={isDelivered ? "package-variant-closed-check" : isCancelled ? "package-variant-closed-remove" : "package-variant"}
                        size={22}
                        color={statusColor}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderId}>{t.orders.orderId} #{order.id}</Text>
                      <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + "18" }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {isCancelled ? t.orders.statusCancelled : (STATUS_STEPS[statusIdx] ? t.orders[STATUS_STEPS[statusIdx].labelKey] : order.status)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.orderCardMid}>
                  <View style={styles.orderItemsPreview}>
                    <Text style={styles.itemsText} numberOfLines={1}>
                      {order.items.map((item) => `${getItemName(item)}${item.quantity > 1 ? ` x${item.quantity}` : ""}`).join(", ")}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderCardBottom}>
                  <View style={styles.orderMeta}>
                    <Ionicons name="cube-outline" size={14} color={Colors.light.textSecondary} />
                    <Text style={styles.metaText}>{itemCount} {itemCount !== 1 ? t.orders.items : t.orders.item}</Text>
                  </View>
                  <View style={styles.orderMeta}>
                    <Ionicons
                      name={order.payment_method === "cod" ? "cash-outline" : "card-outline"}
                      size={14}
                      color={Colors.light.textSecondary}
                    />
                    <Text style={styles.metaText}>{order.payment_method === "cod" ? "COD" : "Card"}</Text>
                  </View>
                  <Text style={styles.orderTotal}>{formatPrice(Number(order.total))}</Text>
                </View>

                {!isCancelled && !isDelivered && (
                  <View style={styles.miniProgress}>
                    {STATUS_STEPS.map((step, i) => (
                      <View
                        key={step.key}
                        style={[
                          styles.miniDot,
                          {
                            backgroundColor: i <= statusIdx ? statusColor : Colors.light.border,
                          },
                        ]}
                      />
                    ))}
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <Modal visible={!!selectedOrder} animationType="slide" transparent>
        {selectedOrder && (
          <OrderDetail
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            insets={insets}
            webTopInset={webTopInset}
            webBottomInset={webBottomInset}
          />
        )}
      </Modal>
    </View>
  );
}

function OrderDetail({
  order,
  onClose,
  insets,
  webTopInset,
  webBottomInset,
}: {
  order: Order;
  onClose: () => void;
  insets: any;
  webTopInset: number;
  webBottomInset: number;
}) {
  const { t } = useI18n();
  const { formatPrice } = useCurrency();
  const statusIdx = getStatusIndex(order.status);
  const isCancelled = order.status === "cancelled";
  const isDelivered = order.status === "delivered";
  const statusColor = STATUS_COLORS[order.status] || Colors.light.primary;

  const productNameMap: Record<string, string> = useMemo(() => ({
    "1": t.products.p1_name,
    "2": t.products.p2_name,
    "3": t.products.p3_name,
    "4": t.products.p4_name,
    "5": t.products.p5_name,
    "6": t.products.p6_name,
    "7": t.products.p7_name,
    "8": t.products.p8_name,
  }), [t]);

  const getItemName = useCallback((item: OrderItem) => {
    return productNameMap[item.id] || item.name;
  }, [productNameMap]);

  return (
    <View style={styles.detailOverlay}>
      <View style={[styles.detailContainer, { paddingTop: (insets.top || webTopInset) }]}>
        <View style={styles.detailHeader}>
          <Pressable onPress={onClose} style={styles.detailBackBtn}>
            <Ionicons name="close" size={24} color={Colors.light.text} />
          </Pressable>
          <Text style={styles.detailHeaderTitle}>{t.orders.orderId} #{order.id}</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.detailScroll, { paddingBottom: (insets.bottom || webBottomInset) + 30 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.statusHero, { backgroundColor: statusColor + "10" }]}>
            <View style={[styles.statusHeroIcon, { backgroundColor: statusColor + "20" }]}>
              <Ionicons
                name={(isCancelled ? "close-circle" : isDelivered ? "checkmark-done-circle" : STATUS_STEPS[statusIdx]?.icon || "time") as any}
                size={36}
                color={statusColor}
              />
            </View>
            <Text style={[styles.statusHeroLabel, { color: statusColor }]}>
              {isCancelled ? t.orders.statusCancelled : isDelivered ? t.orders.statusDelivered : (STATUS_STEPS[statusIdx] ? t.orders[STATUS_STEPS[statusIdx].labelKey] : order.status)}
            </Text>
            <Text style={styles.statusHeroDate}>
              {isDelivered ? `${t.orders.deliveredOn} ` : `${t.orders.lastUpdated} `}{formatDate(order.status_updated_at || order.created_at)}
            </Text>
          </View>

          {!isCancelled && (
            <View style={styles.trackingSection}>
              <Text style={styles.sectionLabel}>{t.orders.orderTracking}</Text>
              <View style={styles.timeline}>
                {STATUS_STEPS.map((step, i) => {
                  const isActive = i <= statusIdx;
                  const isCurrent = i === statusIdx;
                  return (
                    <View key={step.key} style={styles.timelineRow}>
                      <View style={styles.timelineLeft}>
                        <View
                          style={[
                            styles.timelineCircle,
                            {
                              backgroundColor: isActive ? statusColor : "#E8E0D4",
                              borderColor: isCurrent ? statusColor : "transparent",
                              borderWidth: isCurrent ? 3 : 0,
                            },
                          ]}
                        >
                          {isActive && (
                            <Ionicons name={isCurrent ? (step.icon as any) : "checkmark"} size={isCurrent ? 16 : 14} color="#fff" />
                          )}
                        </View>
                        {i < STATUS_STEPS.length - 1 && (
                          <View style={[styles.timelineLine, { backgroundColor: i < statusIdx ? statusColor : "#E8E0D4" }]} />
                        )}
                      </View>
                      <View style={[styles.timelineContent, isCurrent && styles.timelineContentActive]}>
                        <Text style={[styles.timelineLabel, isActive && { color: Colors.light.text, fontWeight: "600" as const }]}>
                          {t.orders[step.labelKey]}
                        </Text>
                        {isCurrent && (
                          <Text style={styles.timelineSubtext}>{t.orders.currentStatus}</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {order.tracking_number && (
            <View style={styles.trackingNumCard}>
              <Feather name="hash" size={16} color={Colors.light.primary} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.trackingNumLabel}>{t.orders.trackingNumber}</Text>
                <Text style={styles.trackingNumValue}>{order.tracking_number}</Text>
              </View>
            </View>
          )}

          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>{t.orders.itemsOrdered}</Text>
            {order.items.map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <View style={styles.itemQtyBadge}>
                  <Text style={styles.itemQtyText}>{item.quantity}x</Text>
                </View>
                <Text style={styles.itemName} numberOfLines={1}>{getItemName(item)}</Text>
                <Text style={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t.shop.total}</Text>
              <Text style={styles.totalValue}>{formatPrice(Number(order.total))}</Text>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>{t.orders.deliveryDetails}</Text>
            <DetailRow icon="person-outline" label="Name" value={order.customer_name} />
            <DetailRow icon="call-outline" label="Phone" value={order.customer_phone} />
            <DetailRow icon="location-outline" label="Address" value={`${order.customer_address}, ${order.customer_city}`} />
            <DetailRow icon="globe-outline" label="Country" value={order.customer_country || "Pakistan"} />
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>{t.orders.payment}</Text>
            <DetailRow
              icon={order.payment_method === "cod" ? "cash-outline" : "card-outline"}
              label={t.orders.method}
              value={order.payment_method === "cod" ? t.orders.cashOnDelivery : t.orders.creditCard}
            />
            <DetailRow icon="calendar-outline" label={t.orders.orderDate} value={`${formatDate(order.created_at)} at ${formatTime(order.created_at)}`} />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon as any} size={16} color={Colors.light.primary} />
      <Text style={styles.detailRowLabel}>{label}</Text>
      <Text style={styles.detailRowValue} numberOfLines={2}>{value}</Text>
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
    paddingBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#fff",
    fontFamily: "Poppins_700Bold",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginTop: 16,
    fontFamily: "Poppins_700Bold",
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center" as const,
    marginTop: 6,
    lineHeight: 20,
  },
  shopBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  shopBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600" as const,
  },
  loginBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  loginBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600" as const,
  },
  scrollContent: {
    padding: 16,
  },
  orderCount: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    boxShadow: "0px 2px 8px rgba(0,0,0,0.04)",
    elevation: 2,
  },
  orderCardTop: {
    marginBottom: 10,
  },
  orderIdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  orderIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  orderId: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.light.text,
    fontFamily: "Poppins_700Bold",
  },
  orderDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600" as const,
  },
  orderCardMid: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border + "60",
  },
  orderItemsPreview: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemsText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  orderCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border + "60",
    gap: 12,
  },
  orderMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  orderTotal: {
    marginLeft: "auto",
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.primary,
    fontFamily: "Poppins_700Bold",
  },
  miniProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border + "40",
  },
  miniDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  detailContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
    marginTop: 0,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  detailBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  detailHeaderTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.text,
    fontFamily: "Poppins_700Bold",
  },
  detailScroll: {
    padding: 16,
  },
  statusHero: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  statusHeroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statusHeroLabel: {
    fontSize: 18,
    fontWeight: "700" as const,
    fontFamily: "Poppins_700Bold",
  },
  statusHeroDate: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  trackingSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 14,
    fontFamily: "Poppins_700Bold",
  },
  timeline: {
    paddingLeft: 4,
  },
  timelineRow: {
    flexDirection: "row",
    minHeight: 52,
  },
  timelineLeft: {
    alignItems: "center",
    width: 34,
  },
  timelineCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineLine: {
    width: 3,
    flex: 1,
    borderRadius: 2,
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
    justifyContent: "center",
  },
  timelineContentActive: {
    paddingBottom: 20,
  },
  timelineLabel: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  timelineSubtext: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  trackingNumCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  trackingNumLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  trackingNumValue: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginTop: 2,
    fontFamily: "Poppins_700Bold",
  },
  detailSection: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border + "60",
    gap: 10,
  },
  itemQtyBadge: {
    backgroundColor: Colors.light.primary + "15",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  itemQtyText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.light.primary,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.primary,
    fontFamily: "Poppins_700Bold",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 8,
  },
  detailRowLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    width: 65,
  },
  detailRowValue: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: "500" as const,
  },
});

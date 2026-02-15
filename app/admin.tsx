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
  Modal,
  KeyboardAvoidingView,
  ActivityIndicator,
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
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<"overview" | "bookings" | "properties" | "users" | "blog" | "products">("overview");

  const [showBlogForm, setShowBlogForm] = useState(false);
  const [blogTitle, setBlogTitle] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [blogImageUrl, setBlogImageUrl] = useState("");
  const [blogLocation, setBlogLocation] = useState("");
  const [blogSubmitting, setBlogSubmitting] = useState(false);

  const [showProductForm, setShowProductForm] = useState(false);
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodCategory, setProdCategory] = useState("");
  const [prodDescription, setProdDescription] = useState("");
  const [prodIcon, setProdIcon] = useState("");
  const [prodSubmitting, setProdSubmitting] = useState(false);

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
    try {
      const bp = await adminFetch("/api/blog-posts/all");
      if (Array.isArray(bp)) setBlogPosts(bp);
    } catch {}
    try {
      const pr = await adminFetch("/api/products");
      if (Array.isArray(pr)) setProducts(pr);
    } catch {}
  };

  const handleSubmitBlog = async () => {
    if (!blogTitle.trim() || !blogContent.trim()) {
      Alert.alert("Required", "Title and content are required.");
      return;
    }
    setBlogSubmitting(true);
    try {
      const post = await adminFetch("/api/blog-posts", {
        method: "POST",
        body: JSON.stringify({
          title: blogTitle.trim(),
          content: blogContent.trim(),
          image_url: blogImageUrl.trim() || null,
          location: blogLocation.trim() || null,
          author_name: currentUser?.name || "Admin",
          author_id: currentUser?.id,
        }),
      });
      setBlogPosts((prev) => [post, ...prev]);
      setBlogTitle("");
      setBlogContent("");
      setBlogImageUrl("");
      setBlogLocation("");
      setShowBlogForm(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Published", "Blog post published successfully!");
    } catch {
      Alert.alert("Error", "Failed to publish post.");
    }
    setBlogSubmitting(false);
  };

  const deleteBlogPost = async (id: number) => {
    Alert.alert("Delete Post", "Are you sure you want to delete this blog post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await adminFetch(`/api/blog-posts/${id}`, { method: "DELETE" });
            setBlogPosts((prev) => prev.filter((p) => p.id !== id));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          } catch {
            Alert.alert("Error", "Failed to delete post.");
          }
        },
      },
    ]);
  };

  const handleSubmitProduct = async () => {
    if (!prodName.trim() || !prodPrice.trim() || !prodCategory.trim()) {
      Alert.alert("Required", "Name, price, and category are required.");
      return;
    }
    if (isNaN(parseFloat(prodPrice))) {
      Alert.alert("Invalid", "Please enter a valid price.");
      return;
    }
    setProdSubmitting(true);
    try {
      const prod = await adminFetch("/api/products", {
        method: "POST",
        body: JSON.stringify({
          name: prodName.trim(),
          price: prodPrice.trim(),
          category: prodCategory.trim(),
          description: prodDescription.trim() || null,
          icon: prodIcon.trim() || "bag-handle",
        }),
      });
      setProducts((prev) => [prod, ...prev]);
      setProdName("");
      setProdPrice("");
      setProdCategory("");
      setProdDescription("");
      setProdIcon("");
      setShowProductForm(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Added", "Product added successfully!");
    } catch {
      Alert.alert("Error", "Failed to add product.");
    }
    setProdSubmitting(false);
  };

  const deleteProduct = async (id: number) => {
    Alert.alert("Delete Product", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await adminFetch(`/api/products/${id}`, { method: "DELETE" });
            setProducts((prev) => prev.filter((p) => p.id !== id));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          } catch {
            Alert.alert("Error", "Failed to delete product.");
          }
        },
      },
    ]);
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

  const sections = ["overview", "bookings", "properties", "users", "blog", "products"] as const;

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
            <Text style={styles.statNum}>{blogPosts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{products.length}</Text>
            <Text style={styles.statLabel}>Products</Text>
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
            <Pressable onPress={() => setActiveSection("blog")} style={styles.actionCard}>
              <Ionicons name="newspaper" size={28} color="#E65100" />
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Blog Posts</Text>
                <Text style={styles.actionDesc}>{blogPosts.length} visit place posts</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.light.tabIconDefault} />
            </Pressable>
            <Pressable onPress={() => setActiveSection("products")} style={styles.actionCard}>
              <Ionicons name="bag-handle" size={28} color="#7B1FA2" />
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Shop Products</Text>
                <Text style={styles.actionDesc}>{products.length} products listed</Text>
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

        {activeSection === "blog" && (
          <View style={styles.content}>
            <Pressable
              onPress={() => setShowBlogForm(true)}
              style={styles.addNewBtn}
            >
              <LinearGradient
                colors={[Colors.light.accent, "#B8922E"]}
                style={styles.addNewGradient}
              >
                <Ionicons name="create" size={18} color="#fff" />
                <Text style={styles.addNewText}>Write New Post</Text>
              </LinearGradient>
            </Pressable>

            {blogPosts.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="newspaper-outline" size={48} color={Colors.light.tabIconDefault} />
                <Text style={styles.emptyText}>No blog posts yet</Text>
              </View>
            ) : (
              blogPosts.map((p) => (
                <View key={p.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={[styles.itemBadge, { backgroundColor: "#E65100" + "20" }]}>
                      <Text style={[styles.itemBadgeText, { color: "#E65100" }]}>{p.category || "Post"}</Text>
                    </View>
                    <Pressable onPress={() => deleteBlogPost(p.id)}>
                      <Ionicons name="trash-outline" size={18} color={Colors.light.danger} />
                    </Pressable>
                  </View>
                  <Text style={styles.itemName}>{p.title}</Text>
                  <Text style={styles.itemDetail} numberOfLines={2}>{p.content}</Text>
                  {p.location && <Text style={styles.itemDetail}>{p.location}</Text>}
                  <Text style={styles.itemDate}>{new Date(p.created_at).toLocaleDateString()}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {activeSection === "products" && (
          <View style={styles.content}>
            <Pressable
              onPress={() => setShowProductForm(true)}
              style={styles.addNewBtn}
            >
              <LinearGradient
                colors={[Colors.light.primary, Colors.light.primaryDark]}
                style={styles.addNewGradient}
              >
                <Ionicons name="add-circle" size={18} color="#fff" />
                <Text style={styles.addNewText}>Add Product</Text>
              </LinearGradient>
            </Pressable>

            {products.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="bag-outline" size={48} color={Colors.light.tabIconDefault} />
                <Text style={styles.emptyText}>No products yet</Text>
              </View>
            ) : (
              products.map((p) => (
                <View key={p.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={[styles.itemBadge, { backgroundColor: "#7B1FA2" + "20" }]}>
                      <Text style={[styles.itemBadgeText, { color: "#7B1FA2" }]}>{p.category}</Text>
                    </View>
                    <Pressable onPress={() => deleteProduct(p.id)}>
                      <Ionicons name="trash-outline" size={18} color={Colors.light.danger} />
                    </Pressable>
                  </View>
                  <Text style={styles.itemName}>{p.name}</Text>
                  <Text style={styles.itemDetail}>${parseFloat(p.price).toFixed(2)}</Text>
                  {p.description && <Text style={styles.itemDetail} numberOfLines={2}>{p.description}</Text>}
                  <Text style={styles.itemDate}>{new Date(p.created_at).toLocaleDateString()}</Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={showBlogForm} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowBlogForm(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Write Blog Post</Text>
              <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled">
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Title *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Post title..."
                    placeholderTextColor={Colors.light.textSecondary}
                    value={blogTitle}
                    onChangeText={setBlogTitle}
                  />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Content *</Text>
                  <TextInput
                    style={[styles.fieldInput, styles.textArea]}
                    placeholder="Write your blog post content..."
                    placeholderTextColor={Colors.light.textSecondary}
                    value={blogContent}
                    onChangeText={setBlogContent}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Image URL (optional)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="https://..."
                    placeholderTextColor={Colors.light.textSecondary}
                    value={blogImageUrl}
                    onChangeText={setBlogImageUrl}
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Location (optional)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g. Lahore, Punjab"
                    placeholderTextColor={Colors.light.textSecondary}
                    value={blogLocation}
                    onChangeText={setBlogLocation}
                  />
                </View>
                <Pressable
                  onPress={handleSubmitBlog}
                  disabled={blogSubmitting}
                  style={[styles.submitFormBtn, blogSubmitting && { opacity: 0.6 }]}
                >
                  {blogSubmitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitFormText}>Publish Post</Text>
                  )}
                </Pressable>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showProductForm} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowProductForm(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Add Product</Text>
              <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled">
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Name *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Product name..."
                    placeholderTextColor={Colors.light.textSecondary}
                    value={prodName}
                    onChangeText={setProdName}
                  />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Price ($) *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="0.00"
                    placeholderTextColor={Colors.light.textSecondary}
                    value={prodPrice}
                    onChangeText={setProdPrice}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Category *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g. Clothing, Kitchen, Art"
                    placeholderTextColor={Colors.light.textSecondary}
                    value={prodCategory}
                    onChangeText={setProdCategory}
                  />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Description (optional)</Text>
                  <TextInput
                    style={[styles.fieldInput, styles.textArea]}
                    placeholder="Product description..."
                    placeholderTextColor={Colors.light.textSecondary}
                    value={prodDescription}
                    onChangeText={setProdDescription}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Icon Name (optional)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g. shirt, diamond, leaf"
                    placeholderTextColor={Colors.light.textSecondary}
                    value={prodIcon}
                    onChangeText={setProdIcon}
                    autoCapitalize="none"
                  />
                </View>
                <Pressable
                  onPress={handleSubmitProduct}
                  disabled={prodSubmitting}
                  style={[styles.submitFormBtn, prodSubmitting && { opacity: 0.6 }]}
                >
                  {prodSubmitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitFormText}>Add Product</Text>
                  )}
                </Pressable>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
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
  addNewBtn: { borderRadius: 12, overflow: "hidden", marginBottom: 4 },
  addNewGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12 },
  addNewText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#fff" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "85%", paddingBottom: 30 },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.light.border, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 16 },
  modalTitle: { fontFamily: "Poppins_700Bold", fontSize: 20, color: Colors.light.text, paddingHorizontal: 20, marginBottom: 16 },
  formScroll: { paddingHorizontal: 20 },
  formField: { marginBottom: 14 },
  fieldLabel: { fontFamily: "Poppins_500Medium", fontSize: 13, color: Colors.light.text, marginBottom: 6 },
  fieldInput: { backgroundColor: Colors.light.backgroundSecondary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Poppins_400Regular", fontSize: 14, color: Colors.light.text, borderWidth: 1, borderColor: Colors.light.border },
  textArea: { height: 120, textAlignVertical: "top" as const, paddingTop: 12 },
  submitFormBtn: { backgroundColor: Colors.light.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center", justifyContent: "center", marginTop: 8, marginBottom: 20 },
  submitFormText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: "#fff" },
});

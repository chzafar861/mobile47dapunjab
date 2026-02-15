import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/query-client";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import Colors from "@/constants/colors";

const { width } = Dimensions.get("window");

interface BlogPost {
  id: number;
  title: string;
  content: string;
  author_name: string;
  author_email?: string;
  image_url?: string;
  category: string;
  likes: number;
  created_at: string;
}

const CATEGORIES = ["All", "Migration Stories", "Travel Tips", "Culture", "General"];

const CATEGORY_ICONS: Record<string, { name: string; color: string }> = {
  "Migration Stories": { name: "trail-sign", color: "#8B4513" },
  "Travel Tips": { name: "airplane", color: "#1976D2" },
  "Culture": { name: "color-palette", color: "#9C27B0" },
  "General": { name: "chatbubble-ellipses", color: Colors.light.primary },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function getReadTime(content: string) {
  const words = content.split(" ").length;
  return Math.max(1, Math.ceil(words / 200));
}

function BlogCard({ post, onLike }: { post: BlogPost; onLike: (id: number) => void }) {
  const catInfo = CATEGORY_ICONS[post.category] || CATEGORY_ICONS["General"];
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.blogCard}>
      {post.image_url ? (
        <Image source={{ uri: post.image_url }} style={styles.blogCardImage} />
      ) : (
        <LinearGradient
          colors={
            post.category === "Migration Stories"
              ? ["#5D4037", "#8D6E63"]
              : post.category === "Travel Tips"
              ? ["#1565C0", "#42A5F5"]
              : post.category === "Culture"
              ? ["#7B1FA2", "#CE93D8"]
              : [Colors.light.primaryDark, Colors.light.primary]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.blogCardImagePlaceholder}
        >
          <Ionicons name={catInfo.name as any} size={36} color="rgba(255,255,255,0.5)" />
        </LinearGradient>
      )}
      <View style={styles.blogCardBody}>
        <View style={styles.blogCardMeta}>
          <View style={[styles.categoryBadge, { backgroundColor: catInfo.color + "18" }]}>
            <Ionicons name={catInfo.name as any} size={12} color={catInfo.color} />
            <Text style={[styles.categoryBadgeText, { color: catInfo.color }]}>{post.category}</Text>
          </View>
          <Text style={styles.blogDate}>{formatDate(post.created_at)}</Text>
        </View>
        <Text style={styles.blogTitle} numberOfLines={expanded ? undefined : 2}>{post.title}</Text>
        <Text style={styles.blogExcerpt} numberOfLines={expanded ? undefined : 3}>{post.content}</Text>
        {!expanded && post.content.length > 150 && (
          <Pressable onPress={() => setExpanded(true)}>
            <Text style={styles.readMoreText}>Read more</Text>
          </Pressable>
        )}
        {expanded && (
          <Pressable onPress={() => setExpanded(false)}>
            <Text style={styles.readMoreText}>Show less</Text>
          </Pressable>
        )}
        <View style={styles.blogCardFooter}>
          <View style={styles.authorRow}>
            <View style={styles.authorAvatar}>
              <Text style={styles.authorAvatarText}>{post.author_name.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.authorName}>{post.author_name}</Text>
              <Text style={styles.readTime}>{getReadTime(post.content)} min read</Text>
            </View>
          </View>
          <Pressable
            onPress={() => {
              onLike(post.id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={({ pressed }) => [styles.likeBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="heart" size={18} color="#E53935" />
            <Text style={styles.likeCount}>{post.likes}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function BlogScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const [activeCategory, setActiveCategory] = useState("All");
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [category, setCategory] = useState("General");
  const [imageUrl, setImageUrl] = useState("");

  const { data: posts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog-posts"],
  });

  const filteredPosts = activeCategory === "All" ? posts : posts.filter(p => p.category === activeCategory);

  const likeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/blog-posts/${id}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/blog-posts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
      setShowWriteModal(false);
      setTitle("");
      setContent("");
      setAuthorName("");
      setCategory("General");
      setImageUrl("");
      Alert.alert("Published!", "Your blog post is now live.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Could not submit post");
    },
  });

  const handleSubmit = () => {
    if (!title.trim() || !content.trim() || !authorName.trim()) {
      Alert.alert("Required", "Please fill in title, content, and your name.");
      return;
    }
    submitMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      author_name: authorName.trim(),
      category,
      image_url: imageUrl || null,
    });
  };

  const pickImage = async () => {
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
      setImageUrl(`data:image/jpeg;base64,${result.assets[0].base64}`);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + webTopInset,
          paddingBottom: insets.bottom + webBottomInset + 100,
        }}
      >
        <LinearGradient
          colors={["#1B4332", Colors.light.primary, "#2D6A4F"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <View style={styles.heroContent}>
            <MaterialCommunityIcons name="post-outline" size={44} color={Colors.light.accent} />
            <Text style={styles.heroTitle}>Punjab Blog</Text>
            <Text style={styles.heroSubtitle}>
              Stories, tips & insights from the heart of Punjab
            </Text>
          </View>
        </LinearGradient>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => {
                setActiveCategory(cat);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[
                styles.categoryChip,
                activeCategory === cat && styles.categoryChipActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  activeCategory === cat && styles.categoryChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </View>
        ) : filteredPosts.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Feather name="file-text" size={48} color={Colors.light.textSecondary} />
            <Text style={styles.emptyText}>No posts yet in this category</Text>
            <Text style={styles.emptySubtext}>Be the first to write one!</Text>
          </View>
        ) : (
          <View style={styles.postsContainer}>
            {filteredPosts.map((post) => (
              <BlogCard key={post.id} post={post} onLike={(id) => likeMutation.mutate(id)} />
            ))}
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={() => setShowWriteModal(true)}
        style={({ pressed }) => [
          styles.fab,
          {
            transform: [{ scale: pressed ? 0.9 : 1 }],
            bottom: insets.bottom + webBottomInset + 20,
          },
        ]}
      >
        <LinearGradient
          colors={[Colors.light.accent, "#C4972E"]}
          style={styles.fabGradient}
        >
          <Feather name="edit-3" size={24} color="#fff" />
        </LinearGradient>
      </Pressable>

      <Modal visible={showWriteModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View
            style={[
              styles.modalContainer,
              {
                paddingTop: insets.top + webTopInset + 16,
                paddingBottom: insets.bottom + webBottomInset + 20,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowWriteModal(false)}>
                <Ionicons name="close" size={28} color={Colors.light.text} />
              </Pressable>
              <Text style={styles.modalTitle}>Write a Post</Text>
              <Pressable
                onPress={handleSubmit}
                disabled={submitMutation.isPending}
                style={({ pressed }) => [
                  styles.publishBtn,
                  { opacity: pressed || submitMutation.isPending ? 0.6 : 1 },
                ]}
              >
                {submitMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.publishBtnText}>Publish</Text>
                )}
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Your Name</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Enter your name"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={authorName}
                  onChangeText={setAuthorName}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Category</Text>
                <View style={styles.categoryPicker}>
                  {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={[
                        styles.catOption,
                        category === cat && styles.catOptionActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.catOptionText,
                          category === cat && styles.catOptionTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Title</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Give your post a title"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Content</Text>
                <TextInput
                  style={[styles.fieldInput, styles.fieldInputMulti]}
                  placeholder="Write your story, tips, or insights..."
                  placeholderTextColor={Colors.light.textSecondary}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Cover Photo (optional)</Text>
                {imageUrl ? (
                  <View style={styles.coverPreviewWrap}>
                    <Image source={{ uri: imageUrl }} style={styles.coverPreview} />
                    <Pressable onPress={() => setImageUrl("")} style={styles.coverRemoveBtn}>
                      <Ionicons name="close-circle" size={26} color={Colors.light.danger} />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={pickImage}
                    style={({ pressed }) => [styles.coverPickBtn, { opacity: pressed ? 0.7 : 1 }]}
                  >
                    <Ionicons name="images" size={28} color={Colors.light.primary} />
                    <Text style={styles.coverPickText}>Add a cover photo</Text>
                  </Pressable>
                )}
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 50,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroContent: {
    alignItems: "center",
    gap: 8,
  },
  heroTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: "#fff",
  },
  heroSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  categoryRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  categoryChipText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  categoryChipTextActive: {
    color: "#fff",
  },
  loadingWrap: {
    paddingTop: 60,
    alignItems: "center",
  },
  emptyWrap: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
    marginTop: 8,
  },
  emptySubtext: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  postsContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  blogCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  blogCardImage: {
    width: "100%",
    height: 160,
  },
  blogCardImagePlaceholder: {
    width: "100%",
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  blogCardBody: {
    padding: 16,
    gap: 10,
  },
  blogCardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
  },
  blogDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  blogTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: Colors.light.text,
    lineHeight: 24,
  },
  blogExcerpt: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  readMoreText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.light.primary,
  },
  blogCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  authorAvatarText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: "#fff",
  },
  authorName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: Colors.light.text,
  },
  readTime: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#FFEBEE",
  },
  likeCount: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#E53935",
  },
  fab: {
    position: "absolute",
    right: 20,
    zIndex: 10,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.light.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: Colors.light.text,
  },
  publishBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  publishBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  modalScroll: {
    flex: 1,
  },
  formField: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.light.text,
    marginBottom: 6,
  },
  fieldInput: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  fieldInputMulti: {
    height: 160,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  categoryPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  catOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  catOptionActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  catOptionText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  catOptionTextActive: {
    color: "#fff",
  },
  coverPickBtn: {
    height: 100,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  coverPickText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  coverPreviewWrap: {
    width: "100%",
    height: 160,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative" as const,
  },
  coverPreview: {
    width: "100%",
    height: "100%",
  },
  coverRemoveBtn: {
    position: "absolute" as const,
    top: 8,
    right: 8,
    backgroundColor: "#fff",
    borderRadius: 14,
  },
});

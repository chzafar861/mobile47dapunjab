import React, { useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
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
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/query-client";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { showAlert } from "@/lib/platform-alert";
import Colors from "@/constants/colors";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { useTranslate, useTranslateOne } from "@/lib/useTranslate";

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

interface BlogComment {
  id: number;
  post_id: number;
  user_name: string;
  user_email?: string;
  comment: string;
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

function getCategoryGradient(category: string): [string, string] {
  if (category === "Migration Stories") return ["#5D4037", "#8D6E63"];
  if (category === "Travel Tips") return ["#1565C0", "#42A5F5"];
  if (category === "Culture") return ["#7B1FA2", "#CE93D8"];
  return [Colors.light.primaryDark, Colors.light.primary];
}

function BlogCard({ post, onLike, onReadMore }: { post: BlogPost; onLike: (id: number) => void; onReadMore: (post: BlogPost) => void }) {
  const { t } = useI18n();
  const catInfo = CATEGORY_ICONS[post.category] || CATEGORY_ICONS["General"];
  const { translated } = useTranslate([post.title, post.content]);
  const [trTitle, trContent] = translated;

  return (
    <View style={styles.blogCard}>
      {post.image_url ? (
        <Image source={{ uri: post.image_url }} style={styles.blogCardImage} />
      ) : (
        <LinearGradient
          colors={getCategoryGradient(post.category)}
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
        <Text style={styles.blogTitle} numberOfLines={2}>{trTitle}</Text>
        <Text style={styles.blogExcerpt} numberOfLines={3}>{trContent}</Text>
        <Pressable onPress={() => onReadMore(post)}>
          <Text style={styles.readMoreText}>{t.blog.readMore}</Text>
        </Pressable>
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

function BlogDetailModal({
  post,
  visible,
  onClose,
  onLike,
}: {
  post: BlogPost | null;
  visible: boolean;
  onClose: () => void;
  onLike: (id: number) => void;
}) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const { user } = useAuth();
  const [commentText, setCommentText] = useState("");

  const catInfo = post ? (CATEGORY_ICONS[post.category] || CATEGORY_ICONS["General"]) : CATEGORY_ICONS["General"];
  const { translated: detailTranslated } = useTranslate(post ? [post.title, post.content] : []);
  const [detailTitle, detailContent] = post ? detailTranslated : ["", ""];

  const { data: comments = [], isLoading: commentsLoading } = useQuery<BlogComment[]>({
    queryKey: ["/api/blog-posts", String(post?.id), "comments"],
    enabled: !!post,
  });

  const commentMutation = useMutation({
    mutationFn: async (data: { postId: number; comment: string }) => {
      await apiRequest("POST", `/api/blog-posts/${data.postId}/comments`, { comment: data.comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts", String(post?.id), "comments"] });
      setCommentText("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: any) => {
      showAlert("Error", err.message || "Could not post comment");
    },
  });

  const handleComment = () => {
    if (!commentText.trim() || !post) return;
    commentMutation.mutate({ postId: post.id, comment: commentText.trim() });
  };

  if (!post) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View
          style={[
            styles.detailContainer,
            {
              paddingTop: insets.top + webTopInset,
            },
          ]}
        >
          <View style={styles.detailHeader}>
            <Pressable onPress={onClose}>
              <Ionicons name="arrow-back" size={26} color={Colors.light.text} />
            </Pressable>
            <Text style={styles.detailHeaderTitle} numberOfLines={1}>{t.blog.title}</Text>
            <View style={{ width: 26 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + webBottomInset + 80 }}
          >
            {post.image_url ? (
              <Image source={{ uri: post.image_url }} style={styles.detailImage} />
            ) : (
              <LinearGradient
                colors={getCategoryGradient(post.category)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.detailImagePlaceholder}
              >
                <Ionicons name={catInfo.name as any} size={48} color="rgba(255,255,255,0.5)" />
              </LinearGradient>
            )}

            <View style={styles.detailBody}>
              <View style={[styles.categoryBadge, { backgroundColor: catInfo.color + "18", alignSelf: "flex-start" as const }]}>
                <Ionicons name={catInfo.name as any} size={12} color={catInfo.color} />
                <Text style={[styles.categoryBadgeText, { color: catInfo.color }]}>{post.category}</Text>
              </View>

              <Text style={styles.detailTitle}>{detailTitle}</Text>

              <View style={styles.detailAuthorRow}>
                <View style={styles.authorAvatar}>
                  <Text style={styles.authorAvatarText}>{post.author_name.charAt(0).toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.authorName}>{post.author_name}</Text>
                  <Text style={styles.readTime}>{formatDate(post.created_at)} - {getReadTime(post.content)} min read</Text>
                </View>
              </View>

              <Text style={styles.detailContent}>{detailContent}</Text>

              <View style={styles.detailActions}>
                <Pressable
                  onPress={() => {
                    onLike(post.id);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={({ pressed }) => [styles.detailLikeBtn, { opacity: pressed ? 0.6 : 1 }]}
                >
                  <Ionicons name="heart" size={20} color="#E53935" />
                  <Text style={styles.detailLikeText}>{post.likes} {t.blog.likes}</Text>
                </Pressable>
                <View style={styles.detailCommentCount}>
                  <Ionicons name="chatbubble-outline" size={18} color={Colors.light.textSecondary} />
                  <Text style={styles.detailCommentCountText}>{comments.length} Comments</Text>
                </View>
              </View>

              <View style={styles.commentSection}>
                <Text style={styles.commentSectionTitle}>Comments</Text>

                <View style={styles.commentInputRow}>
                  <View style={[styles.authorAvatar, { width: 30, height: 30, borderRadius: 15 }]}>
                    <Text style={[styles.authorAvatarText, { fontSize: 12 }]}>{(user?.name || "U").charAt(0).toUpperCase()}</Text>
                  </View>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Write a comment..."
                    placeholderTextColor={Colors.light.textSecondary}
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                  />
                  <Pressable
                    onPress={handleComment}
                    disabled={!commentText.trim() || commentMutation.isPending}
                    style={({ pressed }) => [
                      styles.commentSendBtn,
                      { opacity: (!commentText.trim() || commentMutation.isPending || pressed) ? 0.4 : 1 },
                    ]}
                  >
                    {commentMutation.isPending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="send" size={16} color="#fff" />
                    )}
                  </Pressable>
                </View>

                {commentsLoading ? (
                  <ActivityIndicator size="small" color={Colors.light.primary} style={{ marginTop: 16 }} />
                ) : comments.length === 0 ? (
                  <Text style={styles.noCommentsText}>No comments yet. Be the first!</Text>
                ) : (
                  comments.map((c) => (
                    <View key={c.id} style={styles.commentCard}>
                      <View style={styles.commentHeader}>
                        <View style={[styles.authorAvatar, { width: 28, height: 28, borderRadius: 14 }]}>
                          <Text style={[styles.authorAvatarText, { fontSize: 11 }]}>{c.user_name.charAt(0).toUpperCase()}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.commentUser}>{c.user_name}</Text>
                          <Text style={styles.commentDate}>{formatDate(c.created_at)}</Text>
                        </View>
                      </View>
                      <Text style={styles.commentBody}>{c.comment}</Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function BlogScreen() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const { isAdmin, user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("All");
  const [showWriteModal, setShowWriteModal] = useState(false);
  const blogParams = useLocalSearchParams<{ writePost?: string }>();

  useEffect(() => {
    if (blogParams.writePost === "true" && isAdmin) {
      setShowWriteModal(true);
    }
  }, [blogParams.writePost, isAdmin]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [imageUrl, setImageUrl] = useState("");

  const { data: posts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog-posts"],
  });

  const canWrite = isAdmin;

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
      setCategory("General");
      setImageUrl("");
      showAlert("Published!", "Your blog post is now live.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: any) => {
      showAlert("Error", err.message || "Could not submit post");
    },
  });

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      showAlert("Required", "Please fill in title and content.");
      return;
    }
    submitMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      author_name: user?.name || "Admin",
      author_email: user?.email || null,
      category,
      image_url: imageUrl || null,
    });
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showAlert("Permission Required", "Please allow photo library access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
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
            <Text style={styles.heroTitle}>{t.blog.title}</Text>
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
          {CATEGORIES.map((cat) => {
            const categoryLabels: Record<string, string> = {
              "All": t.blog.allCategories,
              "Migration Stories": t.blog.stories,
              "Travel Tips": t.blog.travel,
              "Culture": t.blog.culture,
              "General": t.blog.title,
            };
            return (
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
                  {categoryLabels[cat] || cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </View>
        ) : filteredPosts.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Feather name="file-text" size={48} color={Colors.light.textSecondary} />
            <Text style={styles.emptyText}>{t.blog.noPosts}</Text>
            <Text style={styles.emptySubtext}>{t.blog.writePost}</Text>
          </View>
        ) : (
          <View style={styles.postsContainer}>
            {filteredPosts.map((post) => (
              <BlogCard key={post.id} post={post} onLike={(id) => likeMutation.mutate(id)} onReadMore={(p) => setSelectedPost(p)} />
            ))}
          </View>
        )}
      </ScrollView>

      <BlogDetailModal
        post={selectedPost}
        visible={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        onLike={(id) => likeMutation.mutate(id)}
      />

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
              <Text style={styles.modalTitle}>{t.blog.writePost}</Text>
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
                  <Text style={styles.publishBtnText}>{t.blog.publish}</Text>
                )}
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Posting as</Text>
                <View style={styles.authorDisplay}>
                  <View style={styles.authorDisplayAvatar}>
                    <Text style={styles.authorDisplayAvatarText}>{(user?.name || "A").charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.authorDisplayName}>{user?.name || "Admin"}</Text>
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>{t.blog.category}</Text>
                <View style={styles.categoryPicker}>
                  {CATEGORIES.filter((c) => c !== "All").map((cat) => {
                    const categoryLabels: Record<string, string> = {
                      "Migration Stories": t.blog.stories,
                      "Travel Tips": t.blog.travel,
                      "Culture": t.blog.culture,
                      "General": t.blog.title,
                    };
                    return (
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
                          {categoryLabels[cat] || cat}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>{t.blog.postTitle}</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder={t.blog.postTitle}
                  placeholderTextColor={Colors.light.textSecondary}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>{t.blog.postContent}</Text>
                <TextInput
                  style={[styles.fieldInput, styles.fieldInputMulti]}
                  placeholder={t.blog.postContent}
                  placeholderTextColor={Colors.light.textSecondary}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>{t.blog.addImage}</Text>
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
                    <Text style={styles.coverPickText}>{t.blog.addImage}</Text>
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
    boxShadow: "0px 2px 12px rgba(0,0,0,0.08)",
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
  authorDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  authorDisplayAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  authorDisplayAvatarText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#fff",
  },
  authorDisplayName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
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
  detailContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
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
  detailHeaderTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
    flex: 1,
    textAlign: "center" as const,
  },
  detailImage: {
    width: "100%",
    height: 200,
  },
  detailImagePlaceholder: {
    width: "100%",
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  detailBody: {
    padding: 20,
    gap: 14,
  },
  detailTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: Colors.light.text,
    lineHeight: 30,
  },
  detailAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  detailContent: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 24,
  },
  detailActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  detailLikeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFEBEE",
  },
  detailLikeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#E53935",
  },
  detailCommentCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailCommentCountText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  commentSection: {
    marginTop: 8,
  },
  commentSectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: Colors.light.text,
    marginBottom: 14,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    marginBottom: 18,
  },
  commentInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    maxHeight: 80,
  },
  commentSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  noCommentsText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: "center" as const,
    marginTop: 16,
    marginBottom: 8,
  },
  commentCard: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  commentUser: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: Colors.light.text,
  },
  commentDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  commentBody: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 20,
    marginLeft: 38,
  },
  permHeroBanner: {
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  permHeroTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: "#fff",
    textAlign: "center" as const,
  },
  permHeroSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center" as const,
    lineHeight: 20,
  },
  permStatusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#F9A825",
    backgroundColor: "rgba(249,168,37,0.08)",
  },
  permStatusTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#F9A825",
  },
  permStatusText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  permFieldGroup: {
    gap: 6,
  },
  permLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.light.text,
  },
  permInput: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  permSubmitBtn: {
    marginTop: 6,
    borderRadius: 16,
    overflow: "hidden" as const,
  },
  permSubmitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  permSubmitText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#fff",
  },
});

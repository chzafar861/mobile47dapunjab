import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Alert,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/query-client";
import { useAuth } from "@/lib/auth-context";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface BlogPost {
  id: number;
  title: string;
  content: string;
  image_url: string | null;
  location: string;
  category: string;
  author_name: string;
  created_at: string;
}

interface BlogComment {
  id: number;
  post_id: number;
  user_name: string;
  comment: string;
  created_at: string;
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function CommentItem({ item }: { item: BlogComment }) {
  const initials = item.user_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.commentItem}>
      <View style={styles.commentAvatar}>
        <Text style={styles.commentAvatarText}>{initials}</Text>
      </View>
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentName}>{item.user_name}</Text>
          <Text style={styles.commentTime}>{timeAgo(item.created_at)}</Text>
        </View>
        <Text style={styles.commentText}>{item.comment}</Text>
      </View>
    </View>
  );
}

export default function BlogDetailScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [commentText, setCommentText] = useState("");
  const [commentName, setCommentName] = useState(user?.name || "");

  const { data: post, isLoading: postLoading } = useQuery<BlogPost>({
    queryKey: ["/api/blog-posts", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/blog-posts/${id}`);
      return res.json();
    },
    enabled: !!id,
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery<BlogComment[]>({
    queryKey: ["/api/blog-posts", id, "comments"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/blog-posts/${id}/comments`);
      return res.json();
    },
    enabled: !!id,
  });

  const commentMutation = useMutation({
    mutationFn: async (data: { user_name: string; user_email: string | null; comment: string }) => {
      const res = await apiRequest("POST", `/api/blog-posts/${id}/comments`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts", id, "comments"] });
      setCommentText("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      Alert.alert("Error", "Could not post comment. Please try again.");
    },
  });

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    if (!commentName.trim()) {
      Alert.alert("Name Required", "Please enter your name to post a comment.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    commentMutation.mutate({
      user_name: commentName.trim(),
      user_email: user?.email || null,
      comment: commentText.trim(),
    });
  };

  if (postLoading) {
    return (
      <View style={[styles.container, styles.centerWrap]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.container, styles.centerWrap]}>
        <MaterialCommunityIcons name="post-outline" size={48} color={Colors.light.tabIconDefault} />
        <Text style={styles.notFoundText}>Blog post not found</Text>
        <Pressable onPress={() => router.back()} style={styles.goBackBtn}>
          <Text style={styles.goBackText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + webBottomInset + 100 }}
        >
          <View style={styles.heroWrapper}>
            {post.image_url ? (
              <Image source={{ uri: post.image_url }} style={styles.heroImage} />
            ) : null}
            <LinearGradient
              colors={
                post.image_url
                  ? ["transparent", "rgba(5,59,47,0.65)", "rgba(5,59,47,0.92)"]
                  : [Colors.light.primaryDark, Colors.light.primary, Colors.light.primaryDark]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[
                styles.heroGradient,
                { paddingTop: insets.top + webTopInset + 12 },
              ]}
            >
              <Pressable onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </Pressable>

              <View style={styles.heroBottom}>
                {post.category ? (
                  <View style={styles.categoryBadge}>
                    <Ionicons name="bookmark" size={12} color={Colors.light.accent} />
                    <Text style={styles.categoryText}>{post.category}</Text>
                  </View>
                ) : null}
                <Text style={styles.heroTitle}>{post.title}</Text>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.metaSection}>
            <View style={styles.metaCard}>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <View style={[styles.metaIcon, { backgroundColor: Colors.light.primary + "15" }]}>
                    <Ionicons name="person" size={14} color={Colors.light.primary} />
                  </View>
                  <View>
                    <Text style={styles.metaLabel}>Written by</Text>
                    <Text style={styles.metaValue}>{post.author_name}</Text>
                  </View>
                </View>
                <View style={styles.metaItem}>
                  <View style={[styles.metaIcon, { backgroundColor: Colors.light.accent + "20" }]}>
                    <Ionicons name="calendar-outline" size={14} color={Colors.light.accent} />
                  </View>
                  <View>
                    <Text style={styles.metaLabel}>Published</Text>
                    <Text style={styles.metaValue}>{formatDate(post.created_at)}</Text>
                  </View>
                </View>
              </View>
              {post.location ? (
                <View style={styles.locationRow}>
                  <View style={[styles.metaIcon, { backgroundColor: "#E74C3C" + "15" }]}>
                    <Ionicons name="location" size={14} color="#E74C3C" />
                  </View>
                  <View>
                    <Text style={styles.metaLabel}>Location</Text>
                    <Text style={styles.metaValue}>{post.location}</Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.contentSection}>
            <Text style={styles.contentText}>{post.content}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.commentsSection}>
            <View style={styles.commentsTitleRow}>
              <Ionicons name="chatbubbles" size={20} color={Colors.light.primary} />
              <Text style={styles.sectionTitle}>
                Comments {comments.length > 0 ? `(${comments.length})` : ""}
              </Text>
            </View>

            <View style={styles.commentInputCard}>
              {!user?.name && (
                <TextInput
                  style={styles.nameInput}
                  placeholder="Your name"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={commentName}
                  onChangeText={setCommentName}
                />
              )}
              <View style={styles.commentInputRow}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Share your thoughts about this place..."
                  placeholderTextColor={Colors.light.textSecondary}
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                  maxLength={500}
                  testID="comment-input"
                />
                <Pressable
                  onPress={handlePostComment}
                  disabled={commentMutation.isPending || !commentText.trim()}
                  style={[
                    styles.sendBtn,
                    (!commentText.trim() || commentMutation.isPending) && styles.sendBtnDisabled,
                  ]}
                  testID="post-comment-btn"
                >
                  {commentMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="send" size={18} color="#fff" />
                  )}
                </Pressable>
              </View>
            </View>

            {commentsLoading ? (
              <ActivityIndicator size="small" color={Colors.light.primary} style={{ marginTop: 20 }} />
            ) : comments.length === 0 ? (
              <View style={styles.noComments}>
                <Ionicons name="chatbubble-outline" size={32} color={Colors.light.tabIconDefault} />
                <Text style={styles.noCommentsText}>No comments yet. Be the first to share!</Text>
              </View>
            ) : (
              <View style={styles.commentsList}>
                {comments.map((c) => (
                  <CommentItem key={c.id} item={c} />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  centerWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  notFoundText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  goBackBtn: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
  },
  goBackText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  heroWrapper: {
    width: "100%",
    height: 300,
    position: "relative",
    backgroundColor: Colors.light.primaryDark,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 16,
    justifyContent: "space-between",
    paddingBottom: 24,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBottom: {
    gap: 8,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  categoryText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: Colors.light.accent,
    textTransform: "capitalize",
  },
  heroTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "#fff",
    lineHeight: 32,
  },
  metaSection: {
    paddingHorizontal: 16,
    marginTop: -16,
  },
  metaCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      },
    }),
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  metaIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  metaLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  metaValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.light.text,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  contentSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  contentText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 26,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  commentsSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  commentsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: Colors.light.text,
    marginBottom: 12,
  },
  commentInputCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 16,
  },
  nameInput: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  commentInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  noComments: {
    alignItems: "center",
    paddingVertical: 30,
    gap: 8,
  },
  noCommentsText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  commentsList: {
    gap: 12,
  },
  commentItem: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  commentAvatarText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
    color: Colors.light.primary,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  commentName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.light.text,
  },
  commentTime: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  commentText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 20,
  },
});

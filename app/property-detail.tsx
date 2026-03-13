import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  Image,
  Dimensions,
  ActivityIndicator,
  TextInput,
  Alert,
  Share,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { SEOHead } from "@/components/SEOHead";
import { useI18n } from "@/lib/i18n";
import { useTranslate } from "@/lib/useTranslate";
import { useAuth } from "@/lib/auth-context";
import * as Haptics from "expo-haptics";

const screenWidth = Dimensions.get("window").width;

interface PropertyData {
  ownerName?: string;
  propertyType?: string;
  location?: string;
  district?: string;
  city?: string;
  area?: string;
  description?: string;
  images?: string[];
  contact?: string;
  phone?: string;
  email?: string;
  price?: string;
  status?: string;
  [key: string]: any;
}

interface PropertyRecord {
  id: number;
  data: PropertyData;
  created_at: string;
}

interface Comment {
  id: number;
  property_id: number;
  parent_id: number | null;
  user_name: string;
  user_email: string | null;
  user_avatar: string | null;
  comment: string;
  created_at: string;
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon as any} size={16} color={Colors.light.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function CommentItem({
  comment,
  replies,
  onReply,
  onShareLink,
  depth = 0,
}: {
  comment: Comment;
  replies: Comment[];
  onReply: (c: Comment) => void;
  onShareLink: (c: Comment) => void;
  depth?: number;
}) {
  const childReplies = replies.filter(r => r.parent_id === comment.id);
  const maxIndent = 3;
  const indent = Math.min(depth, maxIndent);

  return (
    <View style={{ marginLeft: indent * 20 }}>
      <View style={[styles.commentCard, depth > 0 && styles.replyCard]}>
        <View style={styles.commentHeader}>
          {comment.user_avatar ? (
            <Image source={{ uri: comment.user_avatar }} style={styles.commentAvatar} />
          ) : (
            <View style={[styles.commentAvatar, styles.commentAvatarFallback]}>
              <Text style={styles.commentAvatarText}>{getInitials(comment.user_name)}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.commentAuthor}>{comment.user_name}</Text>
            <Text style={styles.commentTime}>{timeAgo(comment.created_at)}</Text>
          </View>
        </View>
        <Text style={styles.commentText}>{comment.comment}</Text>
        <View style={styles.commentActions}>
          <Pressable style={styles.commentActionBtn} onPress={() => onReply(comment)}>
            <Ionicons name="arrow-undo-outline" size={15} color={Colors.light.textSecondary} />
            <Text style={styles.commentActionText}>Reply</Text>
          </Pressable>
          <Pressable style={styles.commentActionBtn} onPress={() => onShareLink(comment)}>
            <Ionicons name="link-outline" size={15} color={Colors.light.textSecondary} />
            <Text style={styles.commentActionText}>Link</Text>
          </Pressable>
        </View>
      </View>
      {childReplies.map(reply => (
        <CommentItem
          key={reply.id}
          comment={reply}
          replies={replies}
          onReply={onReply}
          onShareLink={onShareLink}
          depth={depth + 1}
        />
      ))}
    </View>
  );
}

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const commentInputRef = useRef<TextInput>(null);

  const { data: property, isLoading } = useQuery<PropertyRecord>({
    queryKey: ["/api/property-details", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/property-details/${id}`);
      return res.json();
    },
    enabled: !!id,
  });

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ["/api/property-details", id, "comments"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/property-details/${id}/comments`);
      return res.json();
    },
    enabled: !!id,
  });

  const postComment = useMutation({
    mutationFn: async ({ comment, parent_id }: { comment: string; parent_id?: number }) => {
      const res = await apiRequest("POST", `/api/property-details/${id}/comments`, {
        comment,
        parent_id: parent_id || null,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to post comment");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/property-details", id, "comments"] });
      setCommentText("");
      setReplyTo(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: Error) => {
      Alert.alert("Error", err.message);
    },
  });

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to post a comment.");
      return;
    }
    postComment.mutate({ comment: commentText.trim(), parent_id: replyTo?.id });
  };

  const handleReply = (c: Comment) => {
    setReplyTo(c);
    commentInputRef.current?.focus();
  };

  const handleShareLink = async (c: Comment) => {
    const url = `https://47dapunjab.com/property-detail?id=${id}#comment-${c.id}`;
    try {
      if (Platform.OS === "web") {
        await navigator.clipboard.writeText(url);
        Alert.alert("Link Copied", "Comment link copied to clipboard.");
      } else {
        await Share.share({ message: url });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  const d = property?.data || {} as PropertyData;
  const images = d.images || [];

  const { translated } = useTranslate([
    d.ownerName || "",
    d.location || d.city || "",
    d.district || "",
    d.area || "",
    d.description || "",
    d.propertyType || "",
    d.price || "",
    d.status || "",
  ]);
  const [trOwner, trLocation, trDistrict, trArea, trDescription, trPropertyType, trPrice, trStatus] = translated;

  const title = trOwner || trPropertyType || t.humanFind.propertyDetails;

  const topLevelComments = comments.filter(c => !c.parent_id);
  const commentCount = comments.length;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.light.textSecondary} />
        <Text style={styles.notFoundText}>{t.common.noResults}</Text>
        <Pressable onPress={() => router.back()} style={styles.goBackBtn}>
          <Text style={styles.goBackBtnText}>{t.common.back}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SEOHead title="Property Details" description="View detailed property information on the 47daPunjab directory for Punjab, Pakistan." path="/property-detail" keywords="property details Punjab, land information Pakistan, 47daPunjab directory" />
      <View style={[styles.headerBar, { paddingTop: insets.top + webTopInset }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.headerBarTitle} numberOfLines={1}>{t.humanFind.propertyDetails}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + webBottomInset + 100 }}
      >
        {images.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.imageCarousel}
          >
            {images.map((img, i) => (
              <Image key={i} source={{ uri: img }} style={styles.carouselImage} />
            ))}
          </ScrollView>
        ) : (
          <LinearGradient
            colors={[Colors.light.primary + "20", Colors.light.backgroundSecondary]}
            style={styles.noImageBanner}
          >
            <MaterialCommunityIcons name="home-city-outline" size={48} color={Colors.light.textSecondary} />
            <Text style={styles.noImageText}>{t.humanFind.noPhotos || "No photos available"}</Text>
          </LinearGradient>
        )}

        {images.length > 1 && (
          <View style={styles.imageCount}>
            <Ionicons name="images-outline" size={14} color={Colors.light.textSecondary} />
            <Text style={styles.imageCountText}>{images.length} {t.humanFind.photos || "photos"}</Text>
          </View>
        )}

        <View style={styles.contentSection}>
          <Text style={styles.propertyTitle}>{title}</Text>

          {d.propertyType && (
            <View style={styles.typeBadge}>
              <MaterialCommunityIcons name="home-outline" size={14} color={Colors.light.primary} />
              <Text style={styles.typeBadgeText}>{trPropertyType}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.contentSection}>
          <Text style={styles.sectionHeading}>{t.humanFind.viewDetails}</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="person-outline" label={t.humanFind.owner} value={trOwner} />
            <InfoRow icon="location-outline" label={t.humanFind.location} value={trLocation} />
            <InfoRow icon="map-outline" label={t.humanFind.district || "District"} value={trDistrict} />
            <InfoRow icon="resize-outline" label={t.humanFind.area} value={trArea} />
            <InfoRow icon="pricetag-outline" label={t.humanFind.price || "Price"} value={trPrice} />
            <InfoRow icon="flag-outline" label={t.humanFind.status || "Status"} value={trStatus} />
          </View>
        </View>

        {d.description && (
          <>
            <View style={styles.divider} />
            <View style={styles.contentSection}>
              <Text style={styles.sectionHeading}>{t.humanFind.description}</Text>
              <Text style={styles.descriptionText}>{trDescription}</Text>
            </View>
          </>
        )}

        {isAdmin && (d.contact || d.phone || d.email) && (
          <>
            <View style={styles.divider} />
            <View style={styles.contentSection}>
              <Text style={styles.sectionHeading}>{t.humanFind.contact || "Contact"}</Text>
              <View style={styles.infoCard}>
                <InfoRow icon="call-outline" label={t.humanFind.phone} value={d.phone || d.contact || ""} />
                <InfoRow icon="mail-outline" label={t.humanFind.email || "Email"} value={d.email || ""} />
              </View>
            </View>
          </>
        )}

        <View style={styles.contentSection}>
          <Text style={styles.submittedDate}>
            {t.humanFind.submittedBy ? `${t.humanFind.submittedBy}: ` : "Submitted: "}{new Date(property.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.contentSection}>
          <View style={styles.commentSectionHeader}>
            <Ionicons name="chatbubbles-outline" size={20} color={Colors.light.text} />
            <Text style={styles.sectionHeading}>Comments {commentCount > 0 ? `(${commentCount})` : ""}</Text>
          </View>

          {replyTo && (
            <View style={styles.replyBanner}>
              <Text style={styles.replyBannerText} numberOfLines={1}>
                Replying to <Text style={{ fontFamily: "Poppins_600SemiBold" }}>{replyTo.user_name}</Text>
              </Text>
              <Pressable onPress={() => setReplyTo(null)}>
                <Ionicons name="close-circle" size={20} color={Colors.light.textSecondary} />
              </Pressable>
            </View>
          )}

          <View style={styles.commentInputRow}>
            <TextInput
              ref={commentInputRef}
              style={styles.commentInput}
              placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
              placeholderTextColor={Colors.light.tabIconDefault}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={1000}
            />
            <Pressable
              style={[styles.commentSendBtn, (!commentText.trim() || postComment.isPending) && { opacity: 0.4 }]}
              onPress={handleSubmitComment}
              disabled={!commentText.trim() || postComment.isPending}
            >
              {postComment.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </Pressable>
          </View>

          {topLevelComments.length === 0 && (
            <View style={styles.noCommentsWrap}>
              <Ionicons name="chatbubble-ellipses-outline" size={32} color={Colors.light.tabIconDefault} />
              <Text style={styles.noCommentsText}>No comments yet. Be the first!</Text>
            </View>
          )}

          {topLevelComments.map(c => (
            <CommentItem
              key={c.id}
              comment={c}
              replies={comments}
              onReply={handleReply}
              onShareLink={handleShareLink}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBarTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 17,
    color: Colors.light.text,
    flex: 1,
    textAlign: "center",
  },
  notFoundText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  goBackBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.light.primary,
    marginTop: 8,
  },
  goBackBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  imageCarousel: {
    height: 240,
  },
  carouselImage: {
    width: screenWidth,
    height: 240,
    resizeMode: "cover" as const,
  },
  noImageBanner: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  noImageText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  imageCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  imageCountText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  contentSection: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  propertyTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: Colors.light.text,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.primary + "12",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 10,
  },
  typeBadgeText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginHorizontal: 20,
  },
  sectionHeading: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 14,
    padding: 14,
    gap: 0,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border + "40",
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.light.primary + "12",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
  },
  infoValue: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: Colors.light.text,
    marginTop: 1,
  },
  descriptionText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  submittedDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    textAlign: "center",
    marginTop: 8,
  },
  commentSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    marginBottom: 16,
  },
  commentInput: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  commentSendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  replyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.primary + "10",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
  },
  replyBannerText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  noCommentsWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
    gap: 8,
  },
  noCommentsText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  commentCard: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  replyCard: {
    backgroundColor: Colors.light.background,
    borderLeftWidth: 2,
    borderLeftColor: Colors.light.primary + "40",
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  commentAvatarFallback: {
    backgroundColor: Colors.light.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  commentAvatarText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: Colors.light.primary,
  },
  commentAuthor: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.light.text,
  },
  commentTime: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.tabIconDefault,
  },
  commentText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 21,
  },
  commentActions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border + "30",
  },
  commentActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  commentActionText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});

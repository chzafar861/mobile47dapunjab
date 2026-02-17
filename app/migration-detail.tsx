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
import { useI18n } from "@/lib/i18n";
import { useTranslate, useTranslateOne } from "@/lib/useTranslate";

interface MigrationRecord {
  id: number;
  full_name: string;
  image_url: string | null;
  village_of_origin: string;
  district: string;
  year_of_migration: number | null;
  migration_period: string;
  current_location: string;
  contact_info: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

interface Comment {
  id: number;
  record_id: number;
  user_name: string;
  user_email: string | null;
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

function DetailRow({ icon, label, value, iconColor }: { icon: string; label: string; value: string; iconColor?: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={[styles.detailIcon, { backgroundColor: (iconColor || Colors.light.primary) + "15" }]}>
        <Ionicons name={icon as any} size={16} color={iconColor || Colors.light.primary} />
      </View>
      <View style={styles.detailTextWrap}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

function CommentItem({ item }: { item: Comment }) {
  const { translated: commentTranslated } = useTranslateOne(item.comment);
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
        <Text style={styles.commentText}>{commentTranslated}</Text>
      </View>
    </View>
  );
}

export default function MigrationDetailScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [commentText, setCommentText] = useState("");
  const [commentName, setCommentName] = useState(user?.name || "");

  const { data: record, isLoading: recordLoading } = useQuery<MigrationRecord>({
    queryKey: ["/api/migration-records", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/migration-records/${id}`);
      return res.json();
    },
    enabled: !!id,
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: ["/api/migration-records", id, "comments"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/migration-records/${id}/comments`);
      return res.json();
    },
    enabled: !!id,
  });

  const commentMutation = useMutation({
    mutationFn: async (data: { user_name: string; user_email: string | null; comment: string }) => {
      const res = await apiRequest("POST", `/api/migration-records/${id}/comments`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/migration-records", id, "comments"] });
      setCommentText("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      Alert.alert("Error", "Could not post comment. Please try again.");
    },
  });

  const { translated: recordTranslated } = useTranslate(
    record
      ? [
          record.full_name,
          record.village_of_origin,
          record.district,
          record.current_location,
          record.notes || "",
          record.contact_info || "",
        ]
      : []
  );
  const [trName, trVillage, trDistrict, trLocation, trNotes, trContact] = record
    ? recordTranslated
    : ["", "", "", "", "", ""];

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

  if (recordLoading) {
    return (
      <View style={[styles.container, styles.centerWrap]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!record) {
    return (
      <View style={[styles.container, styles.centerWrap]}>
        <MaterialCommunityIcons name="file-search-outline" size={48} color={Colors.light.tabIconDefault} />
        <Text style={styles.notFoundText}>{t.common.noResults}</Text>
        <Pressable onPress={() => router.back()} style={styles.goBackBtn}>
          <Text style={styles.goBackText}>{t.common.back}</Text>
        </Pressable>
      </View>
    );
  }

  const initials = record.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
          <LinearGradient
            colors={[Colors.light.primaryDark, Colors.light.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroSection, { paddingTop: insets.top + webTopInset + 12 }]}
          >
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </Pressable>

            <View style={styles.heroContent}>
              <View style={styles.heroAvatar}>
                {record.image_url ? (
                  <Image source={{ uri: record.image_url }} style={styles.heroAvatarImg} />
                ) : (
                  <Text style={styles.heroAvatarText}>{initials}</Text>
                )}
              </View>
              <Text style={styles.heroName}>{trName}</Text>
              <View style={styles.heroBadge}>
                <Ionicons name="calendar-outline" size={13} color={Colors.light.accent} />
                <Text style={styles.heroBadgeText}>
                  {record.year_of_migration || "Unknown"} - {record.migration_period === "before_1947" ? "Pre-Partition" : "Post-Partition"}
                </Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>{t.migrationDetail.title}</Text>
            <View style={styles.detailsCard}>
              <DetailRow icon="home" label={t.humanFind.village} value={trVillage} />
              <DetailRow icon="map" label={t.humanFind.district} value={trDistrict} iconColor={Colors.light.accent} />
              <DetailRow icon="location" label={t.humanFind.currentLocation} value={trLocation} iconColor="#E74C3C" />
              {record.contact_info && (
                <DetailRow icon="call" label="Contact" value={trContact} iconColor="#3498DB" />
              )}
            </View>

            {record.notes && (
              <View style={styles.notesCard}>
                <View style={styles.notesHeader}>
                  <Ionicons name="document-text" size={18} color={Colors.light.primary} />
                  <Text style={styles.notesTitle}>Family Story / Notes</Text>
                </View>
                <Text style={styles.notesText}>{trNotes}</Text>
              </View>
            )}
          </View>

          <View style={styles.commentsSection}>
            <View style={styles.commentsTitleRow}>
              <Ionicons name="chatbubbles" size={20} color={Colors.light.primary} />
              <Text style={styles.sectionTitle}>
                {t.migrationDetail.comments} {comments.length > 0 ? `(${comments.length})` : ""}
              </Text>
            </View>

            <View style={styles.commentInputCard}>
              {!user?.name && (
                <TextInput
                  style={styles.nameInput}
                  placeholder={t.humanFind.name}
                  placeholderTextColor={Colors.light.textSecondary}
                  value={commentName}
                  onChangeText={setCommentName}
                />
              )}
              <View style={styles.commentInputRow}>
                <TextInput
                  style={styles.commentInput}
                  placeholder={t.migrationDetail.addComment}
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
                <Text style={styles.noCommentsText}>{t.migrationDetail.noComments}. {t.migrationDetail.beFirst}</Text>
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
  heroSection: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroContent: {
    alignItems: "center",
  },
  heroAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    overflow: "hidden",
  },
  heroAvatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  heroAvatarText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: "#fff",
  },
  heroName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: "#fff",
    textAlign: "center",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroBadgeText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
  },
  detailsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: Colors.light.text,
    marginBottom: 12,
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  detailTextWrap: {
    flex: 1,
  },
  detailLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  detailValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.light.text,
  },
  notesCard: {
    marginTop: 16,
    backgroundColor: Colors.light.primary + "08",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.primary + "20",
  },
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  notesTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.light.primary,
  },
  notesText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 22,
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

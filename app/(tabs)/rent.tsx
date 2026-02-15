import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  FlatList,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/query-client";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";

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

type ActiveTab = "search" | "submit";
type PeriodFilter = "all" | "before_1947" | "after_1947";

const DISTRICTS = [
  "All Districts",
  "Amritsar", "Jalandhar", "Ludhiana", "Hoshiarpur", "Gurdaspur",
  "Ferozepur", "Patiala", "Kapurthala", "Narowal", "Sialkot",
  "Lahore", "Rawalpindi", "Multan", "Faisalabad", "Gujranwala",
];

function RecordCard({ item }: { item: MigrationRecord }) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: "/migration-detail", params: { id: String(item.id) } });
      }}
      style={({ pressed }) => [
        styles.recordCard,
        { opacity: pressed ? 0.95 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.avatarImage} />
          ) : (
            <LinearGradient
              colors={[Colors.light.primary, Colors.light.primaryDark]}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>
                {item.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </Text>
            </LinearGradient>
          )}
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.recordName} numberOfLines={1}>{item.full_name}</Text>
          <View style={styles.yearBadge}>
            <Ionicons name="calendar-outline" size={11} color={Colors.light.accent} />
            <Text style={styles.yearText}>
              {item.year_of_migration || "Unknown"} - {item.migration_period === "before_1947" ? "Pre-Partition" : "Post-Partition"}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <View style={[styles.infoIcon, { backgroundColor: Colors.light.primary + "15" }]}>
              <MaterialCommunityIcons name="home-map-marker" size={14} color={Colors.light.primary} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Origin Village</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{item.village_of_origin}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <View style={[styles.infoIcon, { backgroundColor: Colors.light.accent + "20" }]}>
              <Ionicons name="location" size={14} color={Colors.light.accent} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Current Location</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{item.current_location}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.districtTag}>
            <Ionicons name="map-outline" size={12} color={Colors.light.primary} />
            <Text style={styles.districtTagText}>{item.district}</Text>
          </View>
          <View style={styles.viewDetailHint}>
            <Ionicons name="chatbubble-outline" size={12} color={Colors.light.textSecondary} />
            <Text style={styles.viewDetailText}>View & Comment</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function MigrationPortalScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const [activeTab, setActiveTab] = useState<ActiveTab>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [districtFilter, setDistrictFilter] = useState("All Districts");
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formName, setFormName] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formVillage, setFormVillage] = useState("");
  const [formDistrict, setFormDistrict] = useState("");
  const [formYear, setFormYear] = useState("");
  const [formPeriod, setFormPeriod] = useState<"before_1947" | "after_1947">("after_1947");
  const [formLocation, setFormLocation] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const buildSearchUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append("search", searchQuery.trim());
    if (periodFilter !== "all") params.append("period", periodFilter);
    if (districtFilter !== "All Districts") params.append("district", districtFilter);
    const qs = params.toString();
    return `/api/migration-records${qs ? `?${qs}` : ""}`;
  }, [searchQuery, periodFilter, districtFilter]);

  const { data: records = [], isLoading, refetch } = useQuery<MigrationRecord[]>({
    queryKey: ["/api/migration-records", searchQuery, periodFilter, districtFilter],
    queryFn: async () => {
      const url = buildSearchUrl();
      const res = await apiRequest("GET", url);
      return res.json();
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/migration-records", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/migration-records"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccess(true);
      resetForm();
      setTimeout(() => setShowSuccess(false), 3000);
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to submit record. Please try again.");
    },
  });

  const resetForm = () => {
    setFormName("");
    setFormImageUrl("");
    setFormVillage("");
    setFormDistrict("");
    setFormYear("");
    setFormPeriod("after_1947");
    setFormLocation("");
    setFormContact("");
    setFormNotes("");
  };

  const handleSubmit = () => {
    if (!formName.trim()) {
      Alert.alert("Required", "Please enter the full name.");
      return;
    }
    if (!formVillage.trim()) {
      Alert.alert("Required", "Please enter the village of origin.");
      return;
    }
    if (!formDistrict.trim()) {
      Alert.alert("Required", "Please enter the district.");
      return;
    }
    if (!formLocation.trim()) {
      Alert.alert("Required", "Please enter the current location.");
      return;
    }
    if (formYear && (isNaN(parseInt(formYear)) || parseInt(formYear) < 1900 || parseInt(formYear) > 1960)) {
      Alert.alert("Invalid Year", "Please enter a valid year between 1900 and 1960.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    submitMutation.mutate({
      full_name: formName.trim(),
      image_url: formImageUrl.trim() || null,
      village_of_origin: formVillage.trim(),
      district: formDistrict.trim(),
      year_of_migration: formYear ? parseInt(formYear) : null,
      migration_period: formPeriod,
      current_location: formLocation.trim(),
      contact_info: formContact.trim() || null,
      notes: formNotes.trim() || null,
    });
  };

  const handleSearch = () => {
    refetch();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.light.primaryDark, Colors.light.primary, Colors.light.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + webTopInset + 12 }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            <MaterialCommunityIcons name="account-search" size={26} color={Colors.light.accent} />
            <Text style={styles.headerTitle}>Migration Portal</Text>
          </View>
          <Text style={styles.headerSubtitle}>Bronze Migration & Family Search - 1947 Partition Records</Text>
        </View>

        <View style={styles.tabRow}>
          <Pressable
            onPress={() => setActiveTab("search")}
            style={[styles.tabBtn, activeTab === "search" && styles.tabBtnActive]}
          >
            <Ionicons name="search" size={16} color={activeTab === "search" ? Colors.light.primaryDark : "rgba(255,255,255,0.6)"} />
            <Text style={[styles.tabText, activeTab === "search" && styles.tabTextActive]}>Search Records</Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("submit")}
            style={[styles.tabBtn, activeTab === "submit" && styles.tabBtnActive]}
          >
            <Ionicons name="add-circle-outline" size={16} color={activeTab === "submit" ? Colors.light.primaryDark : "rgba(255,255,255,0.6)"} />
            <Text style={[styles.tabText, activeTab === "submit" && styles.tabTextActive]}>Submit Info</Text>
          </Pressable>
        </View>
      </LinearGradient>

      {activeTab === "search" ? (
        <View style={{ flex: 1 }}>
          <View style={styles.searchSection}>
            <View style={styles.searchBarRow}>
              <View style={styles.searchInputWrap}>
                <Ionicons name="search" size={18} color={Colors.light.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search name, village, district..."
                  placeholderTextColor={Colors.light.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                  testID="migration-search-input"
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => { setSearchQuery(""); }}>
                    <Ionicons name="close-circle" size={18} color={Colors.light.textSecondary} />
                  </Pressable>
                )}
              </View>
              <Pressable
                onPress={handleSearch}
                style={styles.searchBtn}
                testID="migration-search-btn"
              >
                <Ionicons name="search" size={18} color="#fff" />
              </Pressable>
            </View>

            <View style={styles.filterRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                {(["all", "before_1947", "after_1947"] as PeriodFilter[]).map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => setPeriodFilter(p)}
                    style={[styles.filterChip, periodFilter === p && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterChipText, periodFilter === p && styles.filterChipTextActive]}>
                      {p === "all" ? "All Years" : p === "before_1947" ? "Before 1947" : "After 1947"}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => setShowDistrictPicker(true)}
                  style={[styles.filterChip, districtFilter !== "All Districts" && styles.filterChipActive]}
                >
                  <Ionicons
                    name="funnel-outline"
                    size={12}
                    color={districtFilter !== "All Districts" ? Colors.light.primaryDark : Colors.light.textSecondary}
                  />
                  <Text style={[styles.filterChipText, districtFilter !== "All Districts" && styles.filterChipTextActive]}>
                    {districtFilter === "All Districts" ? "District" : districtFilter}
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
              <Text style={styles.loadingText}>Searching records...</Text>
            </View>
          ) : (
            <FlatList
              data={records}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: insets.bottom + webBottomInset + 100,
                paddingTop: 4,
              }}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              renderItem={({ item }) => <RecordCard item={item} />}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="file-search-outline" size={48} color={Colors.light.tabIconDefault} />
                  <Text style={styles.emptyTitle}>No Records Found</Text>
                  <Text style={styles.emptyText}>Try different search terms or filters. You can also submit your family's migration information.</Text>
                </View>
              }
              ListHeaderComponent={
                records.length > 0 ? (
                  <View style={styles.resultCount}>
                    <Text style={styles.resultCountText}>{records.length} record{records.length !== 1 ? "s" : ""} found</Text>
                  </View>
                ) : null
              }
              scrollEnabled={records.length > 0}
            />
          )}
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={90}
        >
          <ScrollView
            contentContainerStyle={[styles.formContainer, { paddingBottom: insets.bottom + webBottomInset + 120 }]}
            keyboardShouldPersistTaps="handled"
          >
            {showSuccess && (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.successText}>Record submitted successfully!</Text>
              </View>
            )}

            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Personal Details</Text>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Full Name <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="e.g. Muhammad Aslam Khan"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={formName}
                  onChangeText={setFormName}
                  testID="form-name"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Photo URL (optional)</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="https://... image link"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={formImageUrl}
                  onChangeText={setFormImageUrl}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Migration Details</Text>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Village of Origin <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="e.g. Amritsar, Jullundur"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={formVillage}
                  onChangeText={setFormVillage}
                  testID="form-village"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>District <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="e.g. Jalandhar, Amritsar"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={formDistrict}
                  onChangeText={setFormDistrict}
                  testID="form-district"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Year of Migration</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="e.g. 1947"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={formYear}
                  onChangeText={setFormYear}
                  keyboardType="numeric"
                  maxLength={4}
                  testID="form-year"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Migration Period</Text>
                <View style={styles.periodToggle}>
                  <Pressable
                    onPress={() => setFormPeriod("before_1947")}
                    style={[styles.periodOption, formPeriod === "before_1947" && styles.periodOptionActive]}
                  >
                    <Text style={[styles.periodOptionText, formPeriod === "before_1947" && styles.periodOptionTextActive]}>Before 1947</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setFormPeriod("after_1947")}
                    style={[styles.periodOption, formPeriod === "after_1947" && styles.periodOptionActive]}
                  >
                    <Text style={[styles.periodOptionText, formPeriod === "after_1947" && styles.periodOptionTextActive]}>After 1947</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Current Information</Text>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Current Location <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="e.g. Lahore, Pakistan"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={formLocation}
                  onChangeText={setFormLocation}
                  testID="form-location"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Contact Info (optional)</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Phone or email"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={formContact}
                  onChangeText={setFormContact}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Notes / Family Story (optional)</Text>
                <TextInput
                  style={[styles.fieldInput, styles.textArea]}
                  placeholder="Share your family's migration story..."
                  placeholderTextColor={Colors.light.textSecondary}
                  value={formNotes}
                  onChangeText={setFormNotes}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={submitMutation.isPending}
              style={({ pressed }) => [
                styles.submitBtn,
                { opacity: pressed || submitMutation.isPending ? 0.8 : 1 },
              ]}
              testID="submit-migration-btn"
            >
              <LinearGradient
                colors={[Colors.light.primary, Colors.light.primaryDark]}
                style={styles.submitGradient}
              >
                {submitMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                    <Text style={styles.submitBtnText}>Submit Record</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <Modal visible={showDistrictPicker} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowDistrictPicker(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select District</Text>
            <FlatList
              data={DISTRICTS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setDistrictFilter(item);
                    setShowDistrictPicker(false);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[styles.districtOption, districtFilter === item && styles.districtOptionActive]}
                >
                  <Text style={[styles.districtOptionText, districtFilter === item && styles.districtOptionTextActive]}>
                    {item}
                  </Text>
                  {districtFilter === item && (
                    <Ionicons name="checkmark" size={18} color={Colors.light.primary} />
                  )}
                </Pressable>
              )}
              scrollEnabled={true}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  headerContent: {
    marginBottom: 14,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: "#fff",
  },
  headerSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 14,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  tabBtnActive: {
    backgroundColor: "#fff",
  },
  tabText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
  },
  tabTextActive: {
    color: Colors.light.primaryDark,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  searchBarRow: {
    flexDirection: "row",
    gap: 8,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.text,
    height: 44,
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  filterRow: {
    marginTop: 10,
  },
  filterScroll: {
    gap: 8,
    paddingRight: 16,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  filterChipActive: {
    backgroundColor: Colors.light.accent + "25",
    borderWidth: 1,
    borderColor: Colors.light.accent,
  },
  filterChipText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.light.primaryDark,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  resultCount: {
    marginBottom: 8,
  },
  resultCountText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  recordCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: "hidden",
  },
  avatarImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarGradient: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#fff",
  },
  cardHeaderInfo: {
    flex: 1,
  },
  recordName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
  },
  yearBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  yearText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  cardBody: {
    marginTop: 12,
  },
  infoRow: {
    flexDirection: "row",
    gap: 12,
  },
  infoItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  infoValue: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: Colors.light.text,
    maxWidth: 120,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  viewDetailHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewDetailText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  districtTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.light.primary + "10",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  districtTagText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: Colors.light.primary,
  },
  expandedSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: 8,
  },
  expandedRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  expandedText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.text,
    flex: 1,
    lineHeight: 20,
  },
  noExtraInfo: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontStyle: "italic",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
    marginTop: 8,
  },
  emptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.success,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  successText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  formSection: {
    marginBottom: 20,
  },
  formSectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 12,
  },
  formField: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.text,
    marginBottom: 6,
  },
  required: {
    color: Colors.light.danger,
  },
  fieldInput: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  periodToggle: {
    flexDirection: "row",
    gap: 8,
  },
  periodOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  periodOptionActive: {
    backgroundColor: Colors.light.primary + "15",
    borderColor: Colors.light.primary,
  },
  periodOptionText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  periodOptionTextActive: {
    color: Colors.light.primary,
  },
  submitBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 4,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  submitBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
    paddingBottom: 30,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: Colors.light.text,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  districtOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border + "50",
  },
  districtOptionActive: {
    backgroundColor: Colors.light.primary + "08",
  },
  districtOptionText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: Colors.light.text,
  },
  districtOptionTextActive: {
    fontFamily: "Poppins_600SemiBold",
    color: Colors.light.primary,
  },
});

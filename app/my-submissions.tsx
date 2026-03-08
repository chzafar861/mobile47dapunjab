import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { SEOHead } from "@/components/SEOHead";
import { useI18n } from "@/lib/i18n";
import { useTranslate } from "@/lib/useTranslate";
import { getApiUrl } from "@/lib/query-client";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { showAlert, showConfirm } from "@/lib/platform-alert";
import Colors from "@/constants/colors";

type TabType = "property" | "person";

interface PropertySubmission {
  id: number;
  type: "property";
  data: {
    ownerName?: string;
    phone?: string;
    propertyType?: string;
    location?: string;
    area?: string;
    description?: string;
    hasImages?: boolean;
    imageCount?: number;
  };
  created_at: string;
}

interface PersonSubmission {
  id: number;
  type: "person";
  full_name: string;
  village_of_origin: string;
  district: string;
  current_location: string;
  year_of_migration: number | null;
  migration_period: string;
  contact_info: string | null;
  notes: string | null;
  status: string;
  image_url: string | null;
  created_at: string;
}

async function authFetch(path: string, options: RequestInit = {}) {
  const baseUrl = getApiUrl();
  const url = new URL(path, baseUrl);
  const res = await globalThis.fetch(url.toString(), {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

const propertyTypes = ["Land", "House", "Shop", "Farm", "Other"];

function TranslatedText({ text, style, numberOfLines }: { text: string; style?: any; numberOfLines?: number }) {
  const { translated } = useTranslate([text]);
  return <Text style={style} numberOfLines={numberOfLines}>{translated[0]}</Text>;
}

export default function MySubmissionsScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const { user } = useAuth();
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<TabType>("property");
  const [properties, setProperties] = useState<PropertySubmission[]>([]);
  const [persons, setPersons] = useState<PersonSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editPropertyModal, setEditPropertyModal] = useState(false);
  const [editPersonModal, setEditPersonModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertySubmission | null>(null);
  const [editingPerson, setEditingPerson] = useState<PersonSubmission | null>(null);
  const [saving, setSaving] = useState(false);

  const [propForm, setPropForm] = useState({
    ownerName: "",
    phone: "",
    propertyType: "Land",
    location: "",
    area: "",
    description: "",
  });

  const [personForm, setPersonForm] = useState({
    full_name: "",
    village_of_origin: "",
    district: "",
    current_location: "",
    year_of_migration: "",
    migration_period: "after_1947",
    contact_info: "",
    notes: "",
  });

  const loadSubmissions = useCallback(async () => {
    try {
      const data = await authFetch("/api/my-submissions");
      setProperties(data.properties || []);
      setPersons(data.persons || []);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSubmissions();
  };

  const openEditProperty = (item: PropertySubmission) => {
    setEditingProperty(item);
    setPropForm({
      ownerName: item.data.ownerName || "",
      phone: item.data.phone || "",
      propertyType: item.data.propertyType || "Land",
      location: item.data.location || "",
      area: item.data.area || "",
      description: item.data.description || "",
    });
    setEditPropertyModal(true);
  };

  const openEditPerson = (item: PersonSubmission) => {
    setEditingPerson(item);
    setPersonForm({
      full_name: item.full_name || "",
      village_of_origin: item.village_of_origin || "",
      district: item.district || "",
      current_location: item.current_location || "",
      year_of_migration: item.year_of_migration ? String(item.year_of_migration) : "",
      migration_period: item.migration_period || "after_1947",
      contact_info: item.contact_info || "",
      notes: item.notes || "",
    });
    setEditPersonModal(true);
  };

  const saveProperty = async () => {
    if (!editingProperty) return;
    if (!propForm.ownerName.trim() || !propForm.phone.trim() || !propForm.location.trim()) {
      showAlert(t.common.required, "Owner name, phone, and location are required.");
      return;
    }
    setSaving(true);
    try {
      await authFetch(`/api/property-details/${editingProperty.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...editingProperty.data,
          ownerName: propForm.ownerName.trim(),
          phone: propForm.phone.trim(),
          propertyType: propForm.propertyType,
          location: propForm.location.trim(),
          area: propForm.area.trim(),
          description: propForm.description.trim(),
        }),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditPropertyModal(false);
      loadSubmissions();
    } catch (err: any) {
      showAlert(t.common.error, err.message || "Could not update.");
    } finally {
      setSaving(false);
    }
  };

  const savePerson = async () => {
    if (!editingPerson) return;
    if (!personForm.full_name.trim() || !personForm.village_of_origin.trim() || !personForm.district.trim() || !personForm.current_location.trim()) {
      showAlert(t.common.required, "Name, village, district, and location are required.");
      return;
    }
    setSaving(true);
    try {
      await authFetch(`/api/migration-records/${editingPerson.id}`, {
        method: "PUT",
        body: JSON.stringify({
          full_name: personForm.full_name.trim(),
          village_of_origin: personForm.village_of_origin.trim(),
          district: personForm.district.trim(),
          current_location: personForm.current_location.trim(),
          year_of_migration: personForm.year_of_migration || null,
          migration_period: personForm.migration_period,
          contact_info: personForm.contact_info.trim() || null,
          notes: personForm.notes.trim() || null,
          image_url: editingPerson.image_url || null,
        }),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditPersonModal(false);
      loadSubmissions();
    } catch (err: any) {
      showAlert(t.common.error, err.message || "Could not update.");
    } finally {
      setSaving(false);
    }
  };

  const deleteProperty = (item: PropertySubmission) => {
    const doDelete = async () => {
      try {
        await authFetch(`/api/my-submissions/property/${item.id}`, { method: "DELETE" });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        loadSubmissions();
      } catch (err: any) {
        showAlert(t.common.error, err.message || "Could not delete.");
      }
    };
    showConfirm(t.common.delete, t.submissions.deleteConfirm, doDelete, t.common.delete, true);
  };

  const deletePerson = (item: PersonSubmission) => {
    const doDelete = async () => {
      try {
        await authFetch(`/api/my-submissions/person/${item.id}`, { method: "DELETE" });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        loadSubmissions();
      } catch (err: any) {
        showAlert(t.common.error, err.message || "Could not delete.");
      }
    };
    showConfirm(t.common.delete, t.submissions.deleteConfirm, doDelete, t.common.delete, true);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>{t.common.loading}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SEOHead title="My Submissions" description="View and manage your property and person submissions on 47daPunjab." path="/my-submissions" keywords="47daPunjab submissions, property listings, person submissions" />
      <View style={[styles.headerBar, { paddingTop: insets.top + webTopInset }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.headerBarTitle}>{t.submissions.title}</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.tabRow}>
        <Pressable
          onPress={() => { setActiveTab("property"); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          style={[styles.tab, activeTab === "property" && styles.tabActive]}
        >
          <MaterialCommunityIcons
            name="home-city-outline"
            size={18}
            color={activeTab === "property" ? "#fff" : Colors.light.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === "property" && styles.tabTextActive]}>
            {t.submissions.properties} ({properties.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => { setActiveTab("person"); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          style={[styles.tab, activeTab === "person" && styles.tabActive]}
        >
          <Ionicons
            name="people"
            size={18}
            color={activeTab === "person" ? "#fff" : Colors.light.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === "person" && styles.tabTextActive]}>
            {t.submissions.people} ({persons.length})
          </Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + webBottomInset + 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.primary} />}
      >
        {activeTab === "property" ? (
          properties.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="home-city-outline" size={48} color={Colors.light.tabIconDefault} />
              <Text style={styles.emptyTitle}>{t.submissions.noSubmissions}</Text>
              <Text style={styles.emptyDesc}>{t.submissions.noSubmissionsDesc}</Text>
              <Pressable
                onPress={() => router.push("/submit-details")}
                style={({ pressed }) => [styles.addNewBtn, { opacity: pressed ? 0.9 : 1 }]}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addNewBtnText}>{t.submissions.submitNew}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.listSection}>
              {properties.map((item) => (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardIconWrap}>
                      <MaterialCommunityIcons name="home-city" size={20} color={Colors.light.primary} />
                    </View>
                    <View style={styles.cardHeaderText}>
                      <TranslatedText style={styles.cardTitle} numberOfLines={1} text={item.data.ownerName || "Unknown"} />
                      <Text style={styles.cardSubtitle}>{item.data.propertyType || "Property"} - {formatDate(item.created_at)}</Text>
                    </View>
                    {item.data.hasImages && (
                      <View style={styles.imageBadge}>
                        <Ionicons name="images" size={12} color={Colors.light.primary} />
                        <Text style={styles.imageBadgeText}>{item.data.imageCount}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.cardBody}>
                    {item.data.location && (
                      <View style={styles.cardRow}>
                        <Ionicons name="location-outline" size={14} color={Colors.light.textSecondary} />
                        <TranslatedText style={styles.cardRowText} numberOfLines={1} text={item.data.location} />
                      </View>
                    )}
                    {item.data.phone && (
                      <View style={styles.cardRow}>
                        <Ionicons name="call-outline" size={14} color={Colors.light.textSecondary} />
                        <Text style={styles.cardRowText}>{item.data.phone}</Text>
                      </View>
                    )}
                    {item.data.area && (
                      <View style={styles.cardRow}>
                        <Ionicons name="resize-outline" size={14} color={Colors.light.textSecondary} />
                        <TranslatedText style={styles.cardRowText} text={item.data.area} />
                      </View>
                    )}
                  </View>
                  <View style={styles.cardActions}>
                    <Pressable
                      onPress={() => openEditProperty(item)}
                      style={({ pressed }) => [styles.actionBtn, styles.editBtn, { opacity: pressed ? 0.8 : 1 }]}
                    >
                      <Ionicons name="create-outline" size={16} color={Colors.light.primary} />
                      <Text style={[styles.actionBtnText, { color: Colors.light.primary }]}>{t.common.edit}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => deleteProperty(item)}
                      style={({ pressed }) => [styles.actionBtn, styles.deleteBtn, { opacity: pressed ? 0.8 : 1 }]}
                    >
                      <Ionicons name="trash-outline" size={16} color={Colors.light.danger} />
                      <Text style={[styles.actionBtnText, { color: Colors.light.danger }]}>{t.common.delete}</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )
        ) : (
          persons.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people" size={48} color={Colors.light.tabIconDefault} />
              <Text style={styles.emptyTitle}>{t.submissions.noSubmissions}</Text>
              <Text style={styles.emptyDesc}>{t.submissions.noSubmissionsDesc}</Text>
              <Pressable
                onPress={() => router.push("/submit-details")}
                style={({ pressed }) => [styles.addNewBtn, { opacity: pressed ? 0.9 : 1 }]}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addNewBtnText}>{t.submissions.submitNew}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.listSection}>
              {persons.map((item) => (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.cardIconWrap, { backgroundColor: Colors.light.accent + "20" }]}>
                      <Ionicons name="person" size={20} color={Colors.light.accent} />
                    </View>
                    <View style={styles.cardHeaderText}>
                      <TranslatedText style={styles.cardTitle} numberOfLines={1} text={item.full_name} />
                      <Text style={styles.cardSubtitle}>{item.district} - {formatDate(item.created_at)}</Text>
                    </View>
                    <View style={[styles.statusBadge, item.status === "approved" ? styles.statusApproved : styles.statusPending]}>
                      <Text style={[styles.statusText, item.status === "approved" ? styles.statusTextApproved : styles.statusTextPending]}>
                        {item.status === "approved" ? "Live" : "Pending"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.cardRow}>
                      <MaterialCommunityIcons name="home-group" size={14} color={Colors.light.textSecondary} />
                      <TranslatedText style={styles.cardRowText} numberOfLines={1} text={item.village_of_origin} />
                    </View>
                    <View style={styles.cardRow}>
                      <Ionicons name="location-outline" size={14} color={Colors.light.textSecondary} />
                      <TranslatedText style={styles.cardRowText} numberOfLines={1} text={item.current_location} />
                    </View>
                    {item.year_of_migration && (
                      <View style={styles.cardRow}>
                        <Ionicons name="calendar-outline" size={14} color={Colors.light.textSecondary} />
                        <Text style={styles.cardRowText}>{item.year_of_migration} ({item.migration_period === "before_1947" ? "Before 1947" : "After 1947"})</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.cardActions}>
                    <Pressable
                      onPress={() => openEditPerson(item)}
                      style={({ pressed }) => [styles.actionBtn, styles.editBtn, { opacity: pressed ? 0.8 : 1 }]}
                    >
                      <Ionicons name="create-outline" size={16} color={Colors.light.primary} />
                      <Text style={[styles.actionBtnText, { color: Colors.light.primary }]}>{t.common.edit}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => deletePerson(item)}
                      style={({ pressed }) => [styles.actionBtn, styles.deleteBtn, { opacity: pressed ? 0.8 : 1 }]}
                    >
                      <Ionicons name="trash-outline" size={16} color={Colors.light.danger} />
                      <Text style={[styles.actionBtnText, { color: Colors.light.danger }]}>{t.common.delete}</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )
        )}
      </ScrollView>

      <Modal visible={editPropertyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingTop: insets.top + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.common.edit} {t.submissions.properties}</Text>
              <Pressable onPress={() => setEditPropertyModal(false)} style={styles.modalClose}>
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
              <Text style={styles.formLabel}>{t.submitDetails.propertyType}</Text>
              <View style={styles.typeRow}>
                {propertyTypes.map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => setPropForm({ ...propForm, propertyType: type })}
                    style={[styles.typeChip, propForm.propertyType === type && styles.typeChipActive]}
                  >
                    <Text style={[styles.typeText, propForm.propertyType === type && styles.typeTextActive]}>{type}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.formLabel}>{t.submitDetails.ownerName} *</Text>
              <TextInput style={styles.input} value={propForm.ownerName} onChangeText={(v) => setPropForm({ ...propForm, ownerName: v })} placeholder={t.submitDetails.ownerName} placeholderTextColor={Colors.light.tabIconDefault} />

              <Text style={styles.formLabel}>{t.submitDetails.phone} *</Text>
              <TextInput style={styles.input} value={propForm.phone} onChangeText={(v) => setPropForm({ ...propForm, phone: v })} placeholder={t.submitDetails.phone} placeholderTextColor={Colors.light.tabIconDefault} keyboardType="phone-pad" />

              <Text style={styles.formLabel}>{t.submitDetails.location} *</Text>
              <TextInput style={styles.input} value={propForm.location} onChangeText={(v) => setPropForm({ ...propForm, location: v })} placeholder={t.submitDetails.location} placeholderTextColor={Colors.light.tabIconDefault} />

              <Text style={styles.formLabel}>{t.submitDetails.area}</Text>
              <TextInput style={styles.input} value={propForm.area} onChangeText={(v) => setPropForm({ ...propForm, area: v })} placeholder={t.submitDetails.area} placeholderTextColor={Colors.light.tabIconDefault} />

              <Text style={styles.formLabel}>{t.submitDetails.description}</Text>
              <TextInput style={[styles.input, styles.textArea]} value={propForm.description} onChangeText={(v) => setPropForm({ ...propForm, description: v })} placeholder={t.submitDetails.description} placeholderTextColor={Colors.light.tabIconDefault} multiline numberOfLines={4} textAlignVertical="top" />

              <Pressable
                onPress={saveProperty}
                disabled={saving}
                style={({ pressed }) => [styles.saveBtn, { opacity: pressed || saving ? 0.8 : 1 }]}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>{t.profile.saveChanges}</Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={editPersonModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingTop: insets.top + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.common.edit} {t.submissions.people}</Text>
              <Pressable onPress={() => setEditPersonModal(false)} style={styles.modalClose}>
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
              <Text style={styles.formLabel}>{t.submitDetails.personName} *</Text>
              <TextInput style={styles.input} value={personForm.full_name} onChangeText={(v) => setPersonForm({ ...personForm, full_name: v })} placeholder={t.submitDetails.personName} placeholderTextColor={Colors.light.tabIconDefault} />

              <Text style={styles.formLabel}>{t.submitDetails.villageOfOrigin} *</Text>
              <TextInput style={styles.input} value={personForm.village_of_origin} onChangeText={(v) => setPersonForm({ ...personForm, village_of_origin: v })} placeholder={t.humanFind.village} placeholderTextColor={Colors.light.tabIconDefault} />

              <Text style={styles.formLabel}>{t.submitDetails.district} *</Text>
              <TextInput style={styles.input} value={personForm.district} onChangeText={(v) => setPersonForm({ ...personForm, district: v })} placeholder={t.humanFind.district} placeholderTextColor={Colors.light.tabIconDefault} />

              <Text style={styles.formLabel}>{t.submitDetails.currentLocation} *</Text>
              <TextInput style={styles.input} value={personForm.current_location} onChangeText={(v) => setPersonForm({ ...personForm, current_location: v })} placeholder={t.humanFind.currentLocation} placeholderTextColor={Colors.light.tabIconDefault} />

              <Text style={styles.formLabel}>{t.submitDetails.migrationYear}</Text>
              <TextInput style={styles.input} value={personForm.year_of_migration} onChangeText={(v) => setPersonForm({ ...personForm, year_of_migration: v })} placeholder="e.g. 1947" placeholderTextColor={Colors.light.tabIconDefault} keyboardType="numeric" maxLength={4} />

              <Text style={styles.formLabel}>{t.submitDetails.familyInfo}</Text>
              <View style={styles.periodRow}>
                <Pressable
                  onPress={() => setPersonForm({ ...personForm, migration_period: "before_1947" })}
                  style={[styles.typeChip, personForm.migration_period === "before_1947" && styles.typeChipActive]}
                >
                  <Text style={[styles.typeText, personForm.migration_period === "before_1947" && styles.typeTextActive]}>Before 1947</Text>
                </Pressable>
                <Pressable
                  onPress={() => setPersonForm({ ...personForm, migration_period: "after_1947" })}
                  style={[styles.typeChip, personForm.migration_period === "after_1947" && styles.typeChipActive]}
                >
                  <Text style={[styles.typeText, personForm.migration_period === "after_1947" && styles.typeTextActive]}>After 1947</Text>
                </Pressable>
              </View>

              <Text style={styles.formLabel}>{t.submitDetails.phone}</Text>
              <TextInput style={styles.input} value={personForm.contact_info} onChangeText={(v) => setPersonForm({ ...personForm, contact_info: v })} placeholder={t.submitDetails.phone} placeholderTextColor={Colors.light.tabIconDefault} />

              <Text style={styles.formLabel}>{t.submitDetails.additionalNotes}</Text>
              <TextInput style={[styles.input, styles.textArea]} value={personForm.notes} onChangeText={(v) => setPersonForm({ ...personForm, notes: v })} placeholder={t.submitDetails.additionalNotes} placeholderTextColor={Colors.light.tabIconDefault} multiline numberOfLines={4} textAlignVertical="top" />

              <Pressable
                onPress={savePerson}
                disabled={saving}
                style={({ pressed }) => [styles.saveBtn, { opacity: pressed || saving ? 0.8 : 1 }]}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>{t.profile.saveChanges}</Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
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
  loadingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 12,
  },
  tabRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
  },
  tabActive: {
    backgroundColor: Colors.light.primary,
  },
  tabText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  tabTextActive: {
    color: "#fff",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: Colors.light.text,
    marginTop: 16,
  },
  emptyDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  addNewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 20,
  },
  addNewBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  listSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
  },
  cardSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  imageBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.light.primary + "15",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  imageBadgeText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: Colors.light.primary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusApproved: {
    backgroundColor: Colors.light.success + "20",
  },
  statusPending: {
    backgroundColor: Colors.light.accent + "20",
  },
  statusText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
  },
  statusTextApproved: {
    color: Colors.light.success,
  },
  statusTextPending: {
    color: Colors.light.accent,
  },
  cardBody: {
    gap: 6,
    marginBottom: 12,
    paddingLeft: 4,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardRowText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  cardActions: {
    flexDirection: "row",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  editBtn: {
    backgroundColor: Colors.light.primary + "12",
  },
  deleteBtn: {
    backgroundColor: Colors.light.danger + "12",
  },
  actionBtnText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 40,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: Colors.light.text,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  formLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 14,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  typeChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  typeText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  typeTextActive: {
    color: "#fff",
  },
  periodRow: {
    flexDirection: "row",
    gap: 10,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    padding: 16,
    marginTop: 24,
  },
  saveBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
});

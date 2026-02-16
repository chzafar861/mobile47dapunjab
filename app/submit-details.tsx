import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  TextInput,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { firebaseApi } from "@/lib/firebase";
import { apiRequest, queryClient } from "@/lib/query-client";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";

type FormTab = "property" | "person";

const propertyTypes = ["Land", "House", "Shop", "Farm", "Other"];

export default function SubmitDetailsScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const [activeTab, setActiveTab] = useState<FormTab>("property");
  const [submitted, setSubmitted] = useState(false);
  const [submittedType, setSubmittedType] = useState<FormTab>("property");

  const [selectedType, setSelectedType] = useState("Land");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

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
  const [personImageUrl, setPersonImageUrl] = useState("");
  const [personSubmitting, setPersonSubmitting] = useState(false);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library to upload property images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      base64: true,
      selectionLimit: 5,
    });
    if (!result.canceled && result.assets) {
      const newImages = result.assets.filter((a) => a.base64).map((a) => `data:image/jpeg;base64,${a.base64}`);
      setImages((prev) => [...prev, ...newImages].slice(0, 5));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow camera access to take property photos.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
    if (!result.canceled && result.assets[0]?.base64) {
      const newImage = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setImages((prev) => [...prev, newImage].slice(0, 5));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePropertySubmit = async () => {
    if (!ownerName.trim() || !phone.trim() || !location.trim()) {
      Alert.alert("Required", "Please fill in owner name, phone, and location.");
      return;
    }
    setSubmitting(true);
    try {
      await firebaseApi.addPropertyDetail({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        propertyType: selectedType,
        location: location.trim(),
        area: area.trim(),
        description: description.trim(),
        date: new Date().toISOString(),
        images: images,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/property-details"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmittedType("property");
      setSubmitted(true);
    } catch {
      Alert.alert("Error", "Could not save details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePersonSubmit = async () => {
    if (!personForm.full_name.trim()) {
      Alert.alert("Required", "Please enter the full name.");
      return;
    }
    if (!personForm.village_of_origin.trim()) {
      Alert.alert("Required", "Please enter the village of origin.");
      return;
    }
    if (!personForm.district.trim()) {
      Alert.alert("Required", "Please enter the district.");
      return;
    }
    if (!personForm.current_location.trim()) {
      Alert.alert("Required", "Please enter the current location.");
      return;
    }
    if (personForm.year_of_migration && (isNaN(parseInt(personForm.year_of_migration)) || parseInt(personForm.year_of_migration) < 1900 || parseInt(personForm.year_of_migration) > 2026)) {
      Alert.alert("Invalid Year", "Please enter a valid year.");
      return;
    }
    setPersonSubmitting(true);
    try {
      await apiRequest("POST", "/api/migration-records", {
        full_name: personForm.full_name.trim(),
        image_url: personImageUrl || null,
        village_of_origin: personForm.village_of_origin.trim(),
        district: personForm.district.trim(),
        year_of_migration: personForm.year_of_migration ? parseInt(personForm.year_of_migration) : null,
        migration_period: personForm.migration_period,
        current_location: personForm.current_location.trim(),
        contact_info: personForm.contact_info.trim() || null,
        notes: personForm.notes.trim() || null,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/migration-records"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmittedType("person");
      setSubmitted(true);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to submit. Please try again.");
    } finally {
      setPersonSubmitting(false);
    }
  };

  const pickPersonImage = async () => {
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
      setPersonImageUrl(`data:image/jpeg;base64,${result.assets[0].base64}`);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const resetAll = () => {
    setOwnerName("");
    setPhone("");
    setLocation("");
    setArea("");
    setDescription("");
    setImages([]);
    setSelectedType("Land");
    setPersonForm({
      full_name: "",
      village_of_origin: "",
      district: "",
      current_location: "",
      year_of_migration: "",
      migration_period: "after_1947",
      contact_info: "",
      notes: "",
    });
    setPersonImageUrl("");
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <View style={[styles.successContainer, { paddingTop: insets.top + webTopInset + 60 }]}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={48} color={Colors.light.success} />
          </View>
          <Text style={styles.successTitle}>
            {submittedType === "property" ? "Property Submitted" : "Person Submitted"}
          </Text>
          <Text style={styles.successDesc}>
            {submittedType === "property"
              ? "Your property details and photos have been saved. Our team will review and contact you soon."
              : "Person info has been added to HumanFind. Others can now find and connect with this person."}
          </Text>
          <Pressable
            onPress={resetAll}
            style={({ pressed }) => [styles.anotherBtn, { opacity: pressed ? 0.9 : 1 }]}
          >
            <Text style={styles.anotherBtnText}>Submit Another</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.headerBar, { paddingTop: insets.top + webTopInset }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.headerBarTitle}>Submit Your Request</Text>
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
            Property Details
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
            Person Info
          </Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + webBottomInset + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === "property" ? (
          <>
            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="file-document-edit" size={24} color={Colors.light.primary} />
              <Text style={styles.infoText}>
                Submit details about your property, land, or memorable places in Pakistan with photos.
              </Text>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Property Type</Text>
              <View style={styles.typeRow}>
                {propertyTypes.map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => setSelectedType(type)}
                    style={[styles.typeChip, selectedType === type && styles.typeChipActive]}
                  >
                    <Text style={[styles.typeText, selectedType === type && styles.typeTextActive]}>{type}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.formLabel}>Owner Name <Text style={{ color: Colors.light.danger }}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Full name of the owner"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={ownerName}
                onChangeText={setOwnerName}
              />

              <Text style={styles.formLabel}>Contact Phone <Text style={{ color: Colors.light.danger }}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.formLabel}>Location / Address <Text style={{ color: Colors.light.danger }}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Village, city, or full address"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={location}
                onChangeText={setLocation}
              />

              <Text style={styles.formLabel}>Area / Size</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 5 Marla, 1 Kanal, 10 Acres"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={area}
                onChangeText={setArea}
              />

              <Text style={styles.formLabel}>Property Photos (up to 5)</Text>
              <View style={styles.imageSection}>
                <View style={styles.imageGrid}>
                  {images.map((uri, index) => (
                    <View key={index} style={styles.imageThumbWrap}>
                      <Image source={{ uri }} style={styles.imageThumb} />
                      <Pressable onPress={() => removeImage(index)} style={styles.imageRemoveBtn}>
                        <Ionicons name="close-circle" size={22} color={Colors.light.danger} />
                      </Pressable>
                    </View>
                  ))}
                  {images.length < 5 && (
                    <View style={styles.addImageBtns}>
                      <Pressable
                        onPress={pickImages}
                        style={({ pressed }) => [styles.addImageBtn, { opacity: pressed ? 0.7 : 1 }]}
                      >
                        <Ionicons name="images" size={24} color={Colors.light.primary} />
                        <Text style={styles.addImageText}>Gallery</Text>
                      </Pressable>
                      {Platform.OS !== "web" && (
                        <Pressable
                          onPress={takePhoto}
                          style={({ pressed }) => [styles.addImageBtn, { opacity: pressed ? 0.7 : 1 }]}
                        >
                          <Ionicons name="camera" size={24} color={Colors.light.accent} />
                          <Text style={styles.addImageText}>Camera</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>
                {images.length > 0 && (
                  <Text style={styles.imageCount}>{images.length}/5 photos added</Text>
                )}
              </View>

              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Additional details about the property, its history, current condition, etc."
                placeholderTextColor={Colors.light.tabIconDefault}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />

              <Pressable
                onPress={handlePropertySubmit}
                disabled={submitting}
                style={({ pressed }) => [styles.submitBtn, { opacity: pressed || submitting ? 0.8 : 1 }]}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="send" size={18} color="#fff" />
                    <Text style={styles.submitBtnText}>Submit Property</Text>
                  </>
                )}
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <View style={styles.infoCard}>
              <Ionicons name="people" size={24} color={Colors.light.primary} />
              <Text style={styles.infoText}>
                Add a person to HumanFind. Share family or community member details so others can find and reconnect.
              </Text>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Full Name <Text style={{ color: Colors.light.danger }}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Muhammad Aslam Khan"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={personForm.full_name}
                onChangeText={(t) => setPersonForm({ ...personForm, full_name: t })}
                testID="person-name"
              />

              <Text style={styles.formLabel}>Photo (optional)</Text>
              {personImageUrl ? (
                <View style={styles.personImageWrap}>
                  <Image source={{ uri: personImageUrl }} style={styles.personImage} />
                  <Pressable onPress={() => setPersonImageUrl("")} style={styles.personImageRemove}>
                    <Ionicons name="close-circle" size={24} color={Colors.light.danger} />
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={pickPersonImage} style={styles.personImagePicker}>
                  <Ionicons name="images" size={24} color={Colors.light.primary} />
                  <Text style={styles.personImagePickerText}>Choose Photo</Text>
                </Pressable>
              )}

              <Text style={styles.formLabel}>Village of Origin <Text style={{ color: Colors.light.danger }}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Amritsar, Jullundur"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={personForm.village_of_origin}
                onChangeText={(t) => setPersonForm({ ...personForm, village_of_origin: t })}
              />

              <Text style={styles.formLabel}>District <Text style={{ color: Colors.light.danger }}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Jalandhar, Amritsar"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={personForm.district}
                onChangeText={(t) => setPersonForm({ ...personForm, district: t })}
              />

              <Text style={styles.formLabel}>Current Location <Text style={{ color: Colors.light.danger }}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Lahore, Pakistan"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={personForm.current_location}
                onChangeText={(t) => setPersonForm({ ...personForm, current_location: t })}
              />

              <Text style={styles.formLabel}>Year of Migration</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1947"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={personForm.year_of_migration}
                onChangeText={(t) => setPersonForm({ ...personForm, year_of_migration: t })}
                keyboardType="numeric"
                maxLength={4}
              />

              <Text style={styles.formLabel}>Migration Period</Text>
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

              <Text style={styles.formLabel}>Contact Info (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Phone or email"
                placeholderTextColor={Colors.light.tabIconDefault}
                value={personForm.contact_info}
                onChangeText={(t) => setPersonForm({ ...personForm, contact_info: t })}
              />

              <Text style={styles.formLabel}>Notes / Story (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Share their story..."
                placeholderTextColor={Colors.light.tabIconDefault}
                value={personForm.notes}
                onChangeText={(t) => setPersonForm({ ...personForm, notes: t })}
                multiline
                numberOfLines={4}
              />

              <Pressable
                onPress={handlePersonSubmit}
                disabled={personSubmitting}
                style={({ pressed }) => [styles.submitBtn, styles.submitBtnPerson, { opacity: pressed || personSubmitting ? 0.8 : 1 }]}
              >
                {personSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                    <Text style={styles.submitBtnText}>Submit Person</Text>
                  </>
                )}
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
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
  tabRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 14,
    padding: 4,
    gap: 4,
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
  infoCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: "#E8F5E9",
    borderRadius: 14,
    padding: 16,
    gap: 12,
    alignItems: "flex-start",
    marginTop: 12,
    marginBottom: 16,
  },
  infoText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.primaryDark,
    flex: 1,
    lineHeight: 20,
  },
  formSection: {
    paddingHorizontal: 16,
  },
  formLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.light.text,
    marginBottom: 8,
    marginTop: 4,
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  typeChipActive: {
    backgroundColor: Colors.light.primary,
  },
  typeText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  typeTextActive: {
    color: "#fff",
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
    marginBottom: 14,
  },
  textArea: {
    minHeight: 100,
  },
  imageSection: {
    marginBottom: 14,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  imageThumbWrap: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative" as const,
  },
  imageThumb: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  imageRemoveBtn: {
    position: "absolute" as const,
    top: 2,
    right: 2,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  addImageBtns: {
    flexDirection: "row",
    gap: 10,
  },
  addImageBtn: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: "dashed" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 4,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  addImageText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  imageCount: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 8,
  },
  periodRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  personImageWrap: {
    width: 100,
    height: 100,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative" as const,
    marginBottom: 14,
  },
  personImage: {
    width: "100%",
    height: "100%",
  },
  personImageRemove: {
    position: "absolute" as const,
    top: 4,
    right: 4,
    backgroundColor: "#fff",
    borderRadius: 14,
  },
  personImagePicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderStyle: "dashed" as const,
    marginBottom: 14,
  },
  personImagePickerText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: Colors.light.primary,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.accent,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },
  submitBtnPerson: {
    backgroundColor: Colors.light.primary,
  },
  submitBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  successCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.light.success + "18",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: Colors.light.text,
    marginBottom: 10,
  },
  successDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  anotherBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 28,
  },
  anotherBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  backLink: {
    marginTop: 16,
  },
  backLinkText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: Colors.light.primary,
  },
});

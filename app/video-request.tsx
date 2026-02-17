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
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { firebaseApi } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";

const VIDEO_INCLUDES = [
  { key: "streets", label: "Village streets", icon: "trail-sign-outline" },
  { key: "house", label: "Old family house", icon: "home-outline" },
  { key: "fields", label: "Fields / Canal", icon: "leaf-outline" },
  { key: "worship", label: "Gurdwara / Mosque", icon: "business-outline" },
  { key: "graveyard", label: "Graveyard", icon: "flower-outline" },
  { key: "school", label: "School", icon: "school-outline" },
  { key: "other", label: "Any other special place", icon: "add-circle-outline" },
] as const;

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon as any} size={20} color={Colors.light.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function FormField({
  label,
  number,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  multiline,
  optional,
  required,
  showErrors,
}: {
  label: string;
  number: number;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "phone-pad" | "email-address";
  multiline?: boolean;
  optional?: boolean;
  required?: boolean;
  showErrors?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <View style={styles.fieldLabelRow}>
        <View style={styles.fieldNumber}>
          <Text style={styles.fieldNumberText}>{number}</Text>
        </View>
        <Text style={styles.fieldLabel}>
          {label}
          {optional && <Text style={styles.optionalTag}> (Optional)</Text>}
        </Text>
      </View>
      <TextInput
        style={[styles.input, multiline && styles.textArea, showErrors && required && !value.trim() && { borderColor: Colors.light.danger }]}
        placeholder={placeholder}
        placeholderTextColor={Colors.light.tabIconDefault}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || "default"}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

export default function VideoRequestScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { formatPrice } = useCurrency();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const [fullName, setFullName] = useState(user?.name || "");
  const [contactNumber, setContactNumber] = useState(user?.phone || "");
  const [currentLocation, setCurrentLocation] = useState(
    user?.city && user?.country ? `${user.city}, ${user.country}` : ""
  );

  const [villageName, setVillageName] = useState("");
  const [district, setDistrict] = useState("");
  const [exactLocation, setExactLocation] = useState("");
  const [specialMemory, setSpecialMemory] = useState("");

  const [selectedIncludes, setSelectedIncludes] = useState<string[]>([]);
  const [otherPlace, setOtherPlace] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  const [confirmAccurate, setConfirmAccurate] = useState(false);
  const [confirmTerms, setConfirmTerms] = useState(false);

  const toggleInclude = (key: string) => {
    setSelectedIncludes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
    Haptics.selectionAsync();
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSubmit = async () => {
    setShowErrors(true);
    if (!fullName.trim()) {
      showAlert("Required", "Please enter your full name.");
      return;
    }
    if (!contactNumber.trim()) {
      showAlert("Required", "Please enter your contact number.");
      return;
    }
    if (!currentLocation.trim()) {
      showAlert("Required", "Please enter your current country/city.");
      return;
    }
    if (!villageName.trim()) {
      showAlert("Required", "Please enter the village or place name.");
      return;
    }
    if (!district.trim()) {
      showAlert("Required", "Please enter the district or region.");
      return;
    }
    if (selectedIncludes.length === 0) {
      showAlert("Required", "Please select at least one item to include in the video.");
      return;
    }
    if (!confirmAccurate || !confirmTerms) {
      showAlert("Required", "Please confirm both checkboxes before submitting.");
      return;
    }

    setIsSubmitting(true);

    const includeLabels = selectedIncludes.map((key) => {
      const item = VIDEO_INCLUDES.find((v) => v.key === key);
      if (key === "other" && otherPlace.trim()) return `Other: ${otherPlace.trim()}`;
      return item?.label || key;
    });

    const details = [
      `Village/Place: ${villageName.trim()}`,
      `District: ${district.trim()}`,
      exactLocation.trim() ? `Location: ${exactLocation.trim()}` : "",
      specialMemory.trim() ? `Memory: ${specialMemory.trim()}` : "",
      `Includes: ${includeLabels.join(", ")}`,
      specialInstructions.trim() ? `Instructions: ${specialInstructions.trim()}` : "",
      `Current Location: ${currentLocation.trim()}`,
      `Package: ${formatPrice(100)} - 1 Hour HD - No Editing - Same Day`,
    ]
      .filter(Boolean)
      .join("\n");

    const booking = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: "Village Video Service",
      name: fullName.trim(),
      phone: contactNumber.trim(),
      details,
      date: new Date().toISOString(),
    };

    try {
      await firebaseApi.addBooking(booking);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert(
        "Request Submitted",
        "Your village video request has been submitted successfully. We will contact you shortly on WhatsApp to confirm the details."
      );
      router.back();
    } catch {
      showAlert("Error", "Could not submit your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + webTopInset,
          paddingBottom: insets.bottom + webBottomInset + 40,
        }}
      >
        <LinearGradient
          colors={[Colors.light.accent, "#E8C96A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroHeader}
        >
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <Ionicons name="videocam" size={44} color="#fff" />
          <Text style={styles.heroTitle}>{t.videoRequest.title}</Text>
          <Text style={styles.heroSubtitle}>{t.videoRequest.subtitle}</Text>
          <Text style={styles.heroDesc}>
            Want a personal video of your village or any old memorable place?
          </Text>
          <Text style={styles.heroDescSmall}>
            We create professional on-location videos to capture your cherished village or meaningful places exactly as you remember them.
          </Text>
        </LinearGradient>

        <View style={styles.formContent}>
          <SectionHeader icon="person-outline" title="Client Information" />
          <View style={styles.sectionCard}>
            <FormField
              number={1}
              label={t.videoRequest.fullName}
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
              required
              showErrors={showErrors}
            />
            <FormField
              number={2}
              label={t.videoRequest.contactNumber}
              placeholder="Enter a valid contact number"
              value={contactNumber}
              onChangeText={setContactNumber}
              keyboardType="phone-pad"
              required
              showErrors={showErrors}
            />
            <FormField
              number={3}
              label={t.videoRequest.currentLocation}
              placeholder="Where are you currently living?"
              value={currentLocation}
              onChangeText={setCurrentLocation}
              required
              showErrors={showErrors}
            />
          </View>

          <SectionHeader icon="location-outline" title="Location Details" />
          <View style={styles.sectionCard}>
            <FormField
              number={4}
              label={t.videoRequest.villageName}
              placeholder="Enter the name of the village or place"
              value={villageName}
              onChangeText={setVillageName}
              required
              showErrors={showErrors}
            />
            <FormField
              number={5}
              label={t.videoRequest.district}
              placeholder="Enter district or nearby area"
              value={district}
              onChangeText={setDistrict}
              required
              showErrors={showErrors}
            />
            <FormField
              number={6}
              label={t.videoRequest.exactLocation}
              placeholder="Google Maps link or nearby landmark"
              value={exactLocation}
              onChangeText={setExactLocation}
              optional
            />
            <FormField
              number={7}
              label={t.videoRequest.specialMemory}
              placeholder="Share a short story or memory connected to this place"
              value={specialMemory}
              onChangeText={setSpecialMemory}
              multiline
            />
          </View>

          <SectionHeader icon="videocam-outline" title="Video Preferences" />
          <View style={styles.sectionCard}>
            <View style={styles.fieldWrap}>
              <View style={styles.fieldLabelRow}>
                <View style={styles.fieldNumber}>
                  <Text style={styles.fieldNumberText}>8</Text>
                </View>
                <Text style={styles.fieldLabel}>
                  What would you like to include in the video?
                </Text>
              </View>
              <View style={styles.checkboxGrid}>
                {VIDEO_INCLUDES.map((item) => {
                  const isSelected = selectedIncludes.includes(item.key);
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => toggleInclude(item.key)}
                      style={[
                        styles.checkboxRow,
                        isSelected && styles.checkboxRowSelected,
                      ]}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          isSelected && styles.checkboxChecked,
                        ]}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        )}
                      </View>
                      <Ionicons
                        name={item.icon as any}
                        size={18}
                        color={isSelected ? Colors.light.primary : Colors.light.textSecondary}
                      />
                      <Text
                        style={[
                          styles.checkboxLabel,
                          isSelected && styles.checkboxLabelSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {selectedIncludes.includes("other") && (
                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  placeholder="Please specify the other special place"
                  placeholderTextColor={Colors.light.tabIconDefault}
                  value={otherPlace}
                  onChangeText={setOtherPlace}
                />
              )}
            </View>
            <FormField
              number={9}
              label={t.videoRequest.specialInstructions}
              placeholder="Any specific spots, angles, or timing you prefer"
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              multiline
              optional
            />
          </View>

          <SectionHeader icon="briefcase-outline" title="Service Package" />
          <View style={styles.packageCard}>
            <LinearGradient
              colors={[Colors.light.accent + "15", Colors.light.accent + "08"]}
              style={styles.packageInner}
            >
              <Text style={styles.packageName}>Village Video Service</Text>
              <View style={styles.packageDetails}>
                <View style={styles.packageRow}>
                  <Ionicons name="time-outline" size={16} color={Colors.light.textSecondary} />
                  <Text style={styles.packageLabel}>Duration</Text>
                  <Text style={styles.packageValue}>1 Hour</Text>
                </View>
                <View style={styles.packageDivider} />
                <View style={styles.packageRow}>
                  <Ionicons name="camera-outline" size={16} color={Colors.light.textSecondary} />
                  <Text style={styles.packageLabel}>Video Quality</Text>
                  <Text style={styles.packageValue}>HD</Text>
                </View>
                <View style={styles.packageDivider} />
                <View style={styles.packageRow}>
                  <Feather name="film" size={16} color={Colors.light.textSecondary} />
                  <Text style={styles.packageLabel}>Editing</Text>
                  <Text style={styles.packageValue}>No editing</Text>
                </View>
                <View style={styles.packageDivider} />
                <View style={styles.packageRow}>
                  <Ionicons name="today-outline" size={16} color={Colors.light.textSecondary} />
                  <Text style={styles.packageLabel}>Delivery</Text>
                  <Text style={styles.packageValue}>Same-day delivery</Text>
                </View>
              </View>
              <View style={styles.packagePriceRow}>
                <Text style={styles.packagePriceLabel}>Price</Text>
                <Text style={styles.packagePrice}>{formatPrice(100)}</Text>
              </View>
            </LinearGradient>
          </View>

          <SectionHeader icon="checkmark-circle-outline" title="Confirmation" />
          <View style={styles.sectionCard}>
            <Pressable
              onPress={() => {
                setConfirmAccurate(!confirmAccurate);
                Haptics.selectionAsync();
              }}
              style={styles.confirmRow}
            >
              <View
                style={[
                  styles.checkbox,
                  confirmAccurate && styles.checkboxChecked,
                ]}
              >
                {confirmAccurate && (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                )}
              </View>
              <Text style={styles.confirmText}>
                I confirm that the information provided is accurate
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setConfirmTerms(!confirmTerms);
                Haptics.selectionAsync();
              }}
              style={styles.confirmRow}
            >
              <View
                style={[
                  styles.checkbox,
                  confirmTerms && styles.checkboxChecked,
                ]}
              >
                {confirmTerms && (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                )}
              </View>
              <Text style={styles.confirmText}>
                I agree to the service terms and conditions
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.submitBtn,
              { opacity: pressed || isSubmitting ? 0.8 : 1 },
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.submitBtnText}>{t.videoRequest.submitRequest}</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  heroHeader: {
    padding: 24,
    paddingTop: 16,
    alignItems: "center",
  },
  backBtn: {
    alignSelf: "flex-start",
    marginBottom: 12,
    padding: 4,
  },
  heroTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "#fff",
    marginTop: 10,
  },
  heroSubtitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },
  heroDesc: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "#fff",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 20,
  },
  heroDescSmall: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  formContent: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
  },
  sectionCard: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  fieldWrap: {
    gap: 8,
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fieldNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldNumberText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "#fff",
  },
  fieldLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.light.text,
    flex: 1,
  },
  optionalTag: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.tabIconDefault,
  },
  input: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  textArea: {
    minHeight: 90,
  },
  checkboxGrid: {
    gap: 6,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  checkboxRowSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + "08",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  checkboxLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.text,
    flex: 1,
  },
  checkboxLabelSelected: {
    fontFamily: "Poppins_500Medium",
    color: Colors.light.primary,
  },
  packageCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.light.accent + "30",
  },
  packageInner: {
    padding: 20,
  },
  packageName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: Colors.light.text,
    marginBottom: 14,
  },
  packageDetails: {
    gap: 0,
  },
  packageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  packageLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  packageValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.light.text,
  },
  packageDivider: {
    height: 1,
    backgroundColor: Colors.light.border + "60",
  },
  packagePriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 2,
    borderTopColor: Colors.light.accent + "40",
  },
  packagePriceLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
  },
  packagePrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: Colors.light.accent,
  },
  confirmRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  confirmText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.text,
    flex: 1,
    lineHeight: 18,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    padding: 18,
    marginTop: 24,
  },
  submitBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#fff",
  },
});

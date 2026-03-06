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
} from "react-native";
import { showAlert } from "@/lib/platform-alert";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { firebaseApi } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { SEOHead } from "@/components/SEOHead";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useI18n } from "@/lib/i18n";

const SERVICES_REQUIRED = [
  { key: "transport", label: "Transport", icon: "car-outline" },
  { key: "security", label: "Security", icon: "shield-checkmark-outline" },
  { key: "guide", label: "Guide", icon: "navigate-outline" },
  { key: "complete", label: "Complete Protocol Package", icon: "ribbon-outline" },
] as const;

const VISIT_PURPOSES = [
  { key: "personal", label: "Personal", icon: "person-outline" },
  { key: "family", label: "Family", icon: "people-outline" },
  { key: "business", label: "Business", icon: "briefcase-outline" },
  { key: "tourism", label: "Tourism", icon: "airplane-outline" },
  { key: "other", label: "Other", icon: "ellipsis-horizontal-circle-outline" },
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

export default function ProtocolRequestScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const [fullName, setFullName] = useState(user?.name || "");
  const [contactNumber, setContactNumber] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [countryOfResidence, setCountryOfResidence] = useState(
    user?.country || ""
  );

  const [arrivalCity, setArrivalCity] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [durationOfStay, setDurationOfStay] = useState("");

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedPurpose, setSelectedPurpose] = useState<string | null>(null);
  const [otherPurpose, setOtherPurpose] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const [confirmAccurate, setConfirmAccurate] = useState(false);
  const [confirmTerms, setConfirmTerms] = useState(false);

  const toggleService = (key: string) => {
    if (key === "complete") {
      const allKeys = SERVICES_REQUIRED.map((s) => s.key);
      setSelectedServices((prev) =>
        prev.includes("complete") ? [] : allKeys
      );
    } else {
      setSelectedServices((prev) => {
        const next = prev.includes(key)
          ? prev.filter((k) => k !== key)
          : [...prev, key];
        const nonComplete = SERVICES_REQUIRED.filter((s) => s.key !== "complete").map((s) => s.key);
        const allSelected = nonComplete.every((k) => next.includes(k));
        if (allSelected && !next.includes("complete")) return [...next, "complete"];
        if (!allSelected && next.includes("complete")) return next.filter((k) => k !== "complete");
        return next;
      });
    }
    Haptics.selectionAsync();
  };

  const selectPurpose = (key: string) => {
    setSelectedPurpose(key);
    Haptics.selectionAsync();
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
    if (!countryOfResidence.trim()) {
      showAlert("Required", "Please enter your country of residence.");
      return;
    }
    if (!arrivalCity.trim()) {
      showAlert("Required", "Please enter your arrival city or airport.");
      return;
    }
    if (!arrivalDate.trim()) {
      showAlert("Required", "Please enter your arrival date and time.");
      return;
    }
    if (!durationOfStay.trim()) {
      showAlert("Required", "Please enter the duration of your stay.");
      return;
    }
    if (selectedServices.length === 0) {
      showAlert("Required", "Please select at least one service.");
      return;
    }
    if (!selectedPurpose) {
      showAlert("Required", "Please select the purpose of your visit.");
      return;
    }
    if (!confirmAccurate || !confirmTerms) {
      showAlert("Required", "Please confirm both checkboxes before submitting.");
      return;
    }

    setIsSubmitting(true);

    const serviceLabels = selectedServices
      .filter((k) => k !== "complete" || !selectedServices.includes("transport"))
      .map((key) => {
        const item = SERVICES_REQUIRED.find((s) => s.key === key);
        return item?.label || key;
      });

    const purposeLabel = selectedPurpose === "other" && otherPurpose.trim()
      ? `Other: ${otherPurpose.trim()}`
      : VISIT_PURPOSES.find((p) => p.key === selectedPurpose)?.label || selectedPurpose;

    const details = [
      `Arrival: ${arrivalCity.trim()}`,
      `Date/Time: ${arrivalDate.trim()}`,
      `Duration: ${durationOfStay.trim()}`,
      `Services: ${serviceLabels.join(", ")}`,
      `Purpose: ${purposeLabel}`,
      email.trim() ? `Email: ${email.trim()}` : "",
      `Country: ${countryOfResidence.trim()}`,
      specialRequests.trim() ? `Special Requests: ${specialRequests.trim()}` : "",
      `Package: VIP Protocol & Escort - On Request`,
    ]
      .filter(Boolean)
      .join("\n");

    const booking = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: "Protocol Service",
      name: fullName.trim(),
      phone: contactNumber.trim(),
      details,
      date: new Date().toISOString(),
    };

    try {
      await firebaseApi.addBooking(booking);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert(
        "Booking Submitted",
        "Your protocol service request has been submitted successfully. We will contact you shortly on WhatsApp to confirm the details and provide a final quote."
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
      <SEOHead title="Protocol Service Request" description="Request VIP protocol services for your visit to Punjab, Pakistan. Airport reception, transportation, and hospitality." path="/protocol-request" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + webTopInset,
          paddingBottom: insets.bottom + webBottomInset + 40,
        }}
      >
        <LinearGradient
          colors={[Colors.light.primary, "#14A76C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroHeader}
        >
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <MaterialCommunityIcons name="shield-star" size={48} color="#fff" />
          <Text style={styles.heroTitle}>{t.protocolRequest.title}</Text>
          <Text style={styles.heroSubtitle}>
            {t.protocolRequest.subtitle}
          </Text>
          <Text style={styles.heroDesc}>
            Ensure a smooth, secure, and stress-free visit to Pakistan with our professional protocol services.
          </Text>
          <Text style={styles.heroDescSmall}>
            From customs assistance to guided travel, we take care of everything.
          </Text>
        </LinearGradient>

        <View style={styles.formContent}>
          <SectionHeader icon="shield-checkmark-outline" title="What's Included" />
          <View style={styles.includesRow}>
            <View style={styles.includeItem}>
              <View style={styles.includeIcon}>
                <Ionicons name="car" size={22} color={Colors.light.primary} />
              </View>
              <Text style={styles.includeTitle}>Transport</Text>
              <Text style={styles.includeDesc}>Comfortable and reliable transportation</Text>
            </View>
            <View style={styles.includeItem}>
              <View style={styles.includeIcon}>
                <Ionicons name="shield-checkmark" size={22} color={Colors.light.primary} />
              </View>
              <Text style={styles.includeTitle}>Security</Text>
              <Text style={styles.includeDesc}>Professional security support</Text>
            </View>
            <View style={styles.includeItem}>
              <View style={styles.includeIcon}>
                <Ionicons name="navigate" size={22} color={Colors.light.primary} />
              </View>
              <Text style={styles.includeTitle}>Guide</Text>
              <Text style={styles.includeDesc}>Experienced local guide for customs and travel</Text>
            </View>
          </View>

          <SectionHeader icon="briefcase-outline" title="Pricing" />
          <View style={styles.packageCard}>
            <LinearGradient
              colors={[Colors.light.primary + "12", Colors.light.primary + "06"]}
              style={styles.packageInner}
            >
              <Text style={styles.packageName}>Protocol Service Package</Text>
              <View style={styles.packageDetails}>
                <View style={styles.packageRow}>
                  <Ionicons name="ribbon-outline" size={16} color={Colors.light.textSecondary} />
                  <Text style={styles.packageLabel}>Service Type</Text>
                  <Text style={styles.packageValue}>VIP Protocol & Escort</Text>
                </View>
                <View style={styles.packageDivider} />
                <View style={styles.packageRow}>
                  <Ionicons name="airplane-outline" size={16} color={Colors.light.textSecondary} />
                  <Text style={styles.packageLabel}>Coverage</Text>
                  <Text style={styles.packageValue}>Airport + City Assistance</Text>
                </View>
                <View style={styles.packageDivider} />
                <View style={styles.packageRow}>
                  <Ionicons name="calendar-outline" size={16} color={Colors.light.textSecondary} />
                  <Text style={styles.packageLabel}>Availability</Text>
                  <Text style={styles.packageValue}>On Request</Text>
                </View>
                <View style={styles.packageDivider} />
                <View style={styles.packageRow}>
                  <Ionicons name="time-outline" size={16} color={Colors.light.textSecondary} />
                  <Text style={styles.packageLabel}>Duration</Text>
                  <Text style={styles.packageValue}>As per booking</Text>
                </View>
              </View>
              <View style={styles.packagePriceRow}>
                <Text style={styles.packagePriceLabel}>Price</Text>
                <View style={styles.packagePriceWrap}>
                  <Text style={styles.packagePriceNote}>Starting from</Text>
                  <Text style={styles.packagePrice}>Custom Quote</Text>
                </View>
              </View>
              <Text style={styles.packageDisclaimer}>
                Final price depends on duration and requirements
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.formDivider}>
            <View style={styles.formDividerLine} />
            <Text style={styles.formDividerText}>Request / Booking Form</Text>
            <View style={styles.formDividerLine} />
          </View>

          <SectionHeader icon="person-outline" title="Client Information" />
          <View style={styles.sectionCard}>
            <FormField
              number={1}
              label={t.protocolRequest.fullName}
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
              required
              showErrors={showErrors}
            />
            <FormField
              number={2}
              label={t.protocolRequest.contactNumber}
              placeholder="Enter your contact number"
              value={contactNumber}
              onChangeText={setContactNumber}
              keyboardType="phone-pad"
              required
              showErrors={showErrors}
            />
            <FormField
              number={3}
              label={t.protocolRequest.email}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              optional
            />
            <FormField
              number={4}
              label={t.protocolRequest.countryOfResidence}
              placeholder="Where are you traveling from?"
              value={countryOfResidence}
              onChangeText={setCountryOfResidence}
              required
              showErrors={showErrors}
            />
          </View>

          <SectionHeader icon="airplane-outline" title="Travel Details" />
          <View style={styles.sectionCard}>
            <FormField
              number={5}
              label={t.protocolRequest.arrivalCity}
              placeholder="Enter arrival city or airport name"
              value={arrivalCity}
              onChangeText={setArrivalCity}
              required
              showErrors={showErrors}
            />
            <FormField
              number={6}
              label={t.protocolRequest.arrivalDate}
              placeholder="e.g. 15 March 2026, 2:00 PM"
              value={arrivalDate}
              onChangeText={setArrivalDate}
              required
              showErrors={showErrors}
            />
            <FormField
              number={7}
              label={t.protocolRequest.durationOfStay}
              placeholder="Number of days or hours"
              value={durationOfStay}
              onChangeText={setDurationOfStay}
              required
              showErrors={showErrors}
            />
          </View>

          <SectionHeader icon="shield-outline" title="Service Requirements" />
          <View style={styles.sectionCard}>
            <View style={styles.fieldWrap}>
              <View style={styles.fieldLabelRow}>
                <View style={styles.fieldNumber}>
                  <Text style={styles.fieldNumberText}>8</Text>
                </View>
                <Text style={styles.fieldLabel}>Services Required</Text>
              </View>
              <View style={styles.checkboxGrid}>
                {SERVICES_REQUIRED.map((item) => {
                  const isSelected = selectedServices.includes(item.key);
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => toggleService(item.key)}
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
            </View>

            <View style={styles.fieldWrap}>
              <View style={styles.fieldLabelRow}>
                <View style={styles.fieldNumber}>
                  <Text style={styles.fieldNumberText}>9</Text>
                </View>
                <Text style={styles.fieldLabel}>Purpose of Visit</Text>
              </View>
              <View style={styles.purposeGrid}>
                {VISIT_PURPOSES.map((item) => {
                  const isSelected = selectedPurpose === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => selectPurpose(item.key)}
                      style={[
                        styles.purposeChip,
                        isSelected && styles.purposeChipSelected,
                      ]}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={16}
                        color={isSelected ? "#fff" : Colors.light.textSecondary}
                      />
                      <Text
                        style={[
                          styles.purposeChipText,
                          isSelected && styles.purposeChipTextSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {selectedPurpose === "other" && (
                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  placeholder="Please specify the purpose of your visit"
                  placeholderTextColor={Colors.light.tabIconDefault}
                  value={otherPurpose}
                  onChangeText={setOtherPurpose}
                />
              )}
            </View>

            <FormField
              number={10}
              label={t.protocolRequest.specialRequests}
              placeholder="Any specific needs, locations, or instructions"
              value={specialRequests}
              onChangeText={setSpecialRequests}
              multiline
              optional
            />
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
                <Text style={styles.submitBtnText}>{t.protocolRequest.submitRequest}</Text>
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
  includesRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 4,
  },
  includeItem: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },
  includeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.primary + "12",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  includeTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: Colors.light.text,
    textAlign: "center",
  },
  includeDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: 2,
    lineHeight: 14,
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
  purposeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  purposeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.background,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  purposeChipSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  purposeChipText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: Colors.light.text,
  },
  purposeChipTextSelected: {
    color: "#fff",
  },
  packageCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.light.primary + "25",
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
    borderTopColor: Colors.light.primary + "30",
  },
  packagePriceLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
  },
  packagePriceWrap: {
    alignItems: "flex-end",
  },
  packagePriceNote: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  packagePrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: Colors.light.primary,
  },
  packageDisclaimer: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic" as const,
  },
  formDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 28,
    marginBottom: 4,
  },
  formDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  formDividerText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.light.textSecondary,
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

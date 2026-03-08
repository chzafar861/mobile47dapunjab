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

const SERVICE_TYPES = [
  { key: "buy", label: "Buy goods in Pakistan", icon: "cart-outline" },
  { key: "import", label: "Import goods to Pakistan", icon: "arrow-down-circle-outline" },
  { key: "export", label: "Export goods from Pakistan", icon: "arrow-up-circle-outline" },
  { key: "clearance", label: "Customs clearance", icon: "document-text-outline" },
  { key: "other", label: "Other customs-related work", icon: "ellipsis-horizontal-circle-outline" },
] as const;

const SUPPORT_OPTIONS = [
  { key: "docs", label: "Documentation & paperwork", icon: "documents-outline" },
  { key: "duty", label: "Duty & tax guidance", icon: "calculator-outline" },
  { key: "full", label: "Full customs handling", icon: "checkbox-outline" },
  { key: "consult", label: "Consultation only", icon: "chatbubbles-outline" },
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

export default function CustomsRequestScreen() {
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
  const [countryOfResidence, setCountryOfResidence] = useState(user?.country || "");

  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>([]);
  const [otherServiceDesc, setOtherServiceDesc] = useState("");
  const [goodsDescription, setGoodsDescription] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [originDestination, setOriginDestination] = useState("");

  const [selectedSupport, setSelectedSupport] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState("");

  const [confirmAccurate, setConfirmAccurate] = useState(false);
  const [confirmTerms, setConfirmTerms] = useState(false);

  const toggleServiceType = (key: string) => {
    setSelectedServiceTypes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
    Haptics.selectionAsync();
  };

  const toggleSupport = (key: string) => {
    setSelectedSupport((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
    Haptics.selectionAsync();
  };


  const handleSubmit = async () => {
    setShowErrors(true);
    if (!fullName.trim()) { showAlert("Required", "Please enter your full name."); return; }
    if (!contactNumber.trim()) { showAlert("Required", "Please enter your contact number."); return; }
    if (!countryOfResidence.trim()) { showAlert("Required", "Please enter your country of residence."); return; }
    if (selectedServiceTypes.length === 0) { showAlert("Required", "Please select at least one type of service."); return; }
    if (!goodsDescription.trim()) { showAlert("Required", "Please describe the goods or items."); return; }
    if (!originDestination.trim()) { showAlert("Required", "Please enter the origin or destination country."); return; }
    if (selectedSupport.length === 0) { showAlert("Required", "Please select at least one support option."); return; }
    if (!confirmAccurate || !confirmTerms) { showAlert("Required", "Please confirm both checkboxes before submitting."); return; }

    setIsSubmitting(true);

    const serviceLabels = selectedServiceTypes.map((key) => {
      if (key === "other" && otherServiceDesc.trim()) return `Other: ${otherServiceDesc.trim()}`;
      return SERVICE_TYPES.find((s) => s.key === key)?.label || key;
    });

    const supportLabels = selectedSupport.map((key) =>
      SUPPORT_OPTIONS.find((s) => s.key === key)?.label || key
    );

    const details = [
      `Service Types: ${serviceLabels.join(", ")}`,
      `Goods: ${goodsDescription.trim()}`,
      estimatedValue.trim() ? `Estimated Value: ${estimatedValue.trim()}` : "",
      `Origin/Destination: ${originDestination.trim()}`,
      `Support: ${supportLabels.join(", ")}`,
      email.trim() ? `Email: ${email.trim()}` : "",
      `Country: ${countryOfResidence.trim()}`,
      specialInstructions.trim() ? `Instructions: ${specialInstructions.trim()}` : "",
      `Package: Customs Assistance - On Request`,
    ]
      .filter(Boolean)
      .join("\n");

    const booking = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: "Customs Service",
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
        "Your customs service request has been submitted successfully. We will contact you shortly on WhatsApp to discuss the details and provide a quote."
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
      <SEOHead title="Customs Assistance Request" description="Request customs clearance assistance for traveling to Punjab, Pakistan. Professional help with immigration and customs procedures." path="/customs-request" keywords="customs assistance Pakistan, immigration help Punjab, customs clearance, travel Pakistan" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + webTopInset,
          paddingBottom: insets.bottom + webBottomInset + 40,
        }}
      >
        <LinearGradient
          colors={["#1B4332", "#2D6A4F"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroHeader}
        >
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <MaterialCommunityIcons name="passport" size={48} color="#fff" />
          <Text style={styles.heroTitle}>{t.customsRequest.title}</Text>
          <Text style={styles.heroSubtitle}>
            {t.customsRequest.subtitle}
          </Text>
          <Text style={styles.heroDesc}>
            Handle all your customs-related work in Pakistan with confidence.
          </Text>
          <Text style={styles.heroDescSmall}>
            We assist with buying goods, importing, exporting, and managing all customs formalities smoothly and legally.
          </Text>
        </LinearGradient>

        <View style={styles.formContent}>
          <SectionHeader icon="briefcase-outline" title="Pricing" />
          <View style={styles.packageCard}>
            <LinearGradient
              colors={["#1B433212", "#2D6A4F06"]}
              style={styles.packageInner}
            >
              <Text style={styles.packageName}>Customs Assistance Package</Text>
              <View style={styles.packageDetails}>
                <View style={styles.packageRow}>
                  <Ionicons name="ribbon-outline" size={16} color={Colors.light.textSecondary} />
                  <Text style={styles.packageLabel}>Service Type</Text>
                  <Text style={styles.packageValue}>Customs & Trade Support</Text>
                </View>
                <View style={styles.packageDivider} />
                <View style={styles.packageRow}>
                  <Ionicons name="globe-outline" size={16} color={Colors.light.textSecondary} />
                  <Text style={styles.packageLabel}>Coverage</Text>
                  <Text style={styles.packageValue}>All customs-related work</Text>
                </View>
                <View style={styles.packageDivider} />
                <View style={styles.packageRow}>
                  <Ionicons name="cube-outline" size={16} color={Colors.light.textSecondary} />
                  <Text style={styles.packageLabel}>Includes</Text>
                  <Text style={styles.packageValue}>Import, Export, Buying, Clearance</Text>
                </View>
                <View style={styles.packageDivider} />
                <View style={styles.packageRow}>
                  <Ionicons name="document-text-outline" size={16} color={Colors.light.textSecondary} />
                  <Text style={styles.packageLabel}>Processing</Text>
                  <Text style={styles.packageValue}>Legal & documented</Text>
                </View>
                <View style={styles.packageDivider} />
                <View style={styles.packageRow}>
                  <Ionicons name="calendar-outline" size={16} color={Colors.light.textSecondary} />
                  <Text style={styles.packageLabel}>Availability</Text>
                  <Text style={styles.packageValue}>On request</Text>
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
                Final price depends on the type and scope of work
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
              label={t.customsRequest.fullName}
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
              required
              showErrors={showErrors}
            />
            <FormField
              number={2}
              label={t.customsRequest.contactNumber}
              placeholder="Enter your contact number"
              value={contactNumber}
              onChangeText={setContactNumber}
              keyboardType="phone-pad"
              required
              showErrors={showErrors}
            />
            <FormField
              number={3}
              label={t.customsRequest.email}
              placeholder="Enter your email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              optional
            />
            <FormField
              number={4}
              label={t.customsRequest.countryOfResidence}
              placeholder="Where are you currently living?"
              value={countryOfResidence}
              onChangeText={setCountryOfResidence}
              required
              showErrors={showErrors}
            />
          </View>

          <SectionHeader icon="cube-outline" title="Service Details" />
          <View style={styles.sectionCard}>
            <View style={styles.fieldWrap}>
              <View style={styles.fieldLabelRow}>
                <View style={styles.fieldNumber}>
                  <Text style={styles.fieldNumberText}>5</Text>
                </View>
                <Text style={styles.fieldLabel}>{t.customsRequest.serviceType}</Text>
              </View>
              <View style={styles.checkboxGrid}>
                {SERVICE_TYPES.map((item) => {
                  const isSelected = selectedServiceTypes.includes(item.key);
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => toggleServiceType(item.key)}
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
                        color={isSelected ? "#1B4332" : Colors.light.textSecondary}
                      />
                      <Text
                        style={[
                          styles.checkboxLabel,
                          isSelected && styles.checkboxLabelSelectedAlt,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {selectedServiceTypes.includes("other") && (
                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  placeholder="Please describe the customs-related work"
                  placeholderTextColor={Colors.light.tabIconDefault}
                  value={otherServiceDesc}
                  onChangeText={setOtherServiceDesc}
                />
              )}
            </View>
            <FormField
              number={6}
              label={t.customsRequest.goodsDescription}
              placeholder="Briefly describe the items or products"
              value={goodsDescription}
              onChangeText={setGoodsDescription}
              multiline
              required
              showErrors={showErrors}
            />
            <FormField
              number={7}
              label={t.customsRequest.estimatedValue}
              placeholder="Enter approximate value"
              value={estimatedValue}
              onChangeText={setEstimatedValue}
              optional
            />
            <FormField
              number={8}
              label={t.customsRequest.originDestination}
              placeholder="Enter country name"
              value={originDestination}
              onChangeText={setOriginDestination}
              required
              showErrors={showErrors}
            />
          </View>

          <SectionHeader icon="construct-outline" title="Additional Requirements" />
          <View style={styles.sectionCard}>
            <View style={styles.fieldWrap}>
              <View style={styles.fieldLabelRow}>
                <View style={styles.fieldNumber}>
                  <Text style={styles.fieldNumberText}>9</Text>
                </View>
                <Text style={styles.fieldLabel}>Required Support</Text>
              </View>
              <View style={styles.checkboxGrid}>
                {SUPPORT_OPTIONS.map((item) => {
                  const isSelected = selectedSupport.includes(item.key);
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => toggleSupport(item.key)}
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
                        color={isSelected ? "#1B4332" : Colors.light.textSecondary}
                      />
                      <Text
                        style={[
                          styles.checkboxLabel,
                          isSelected && styles.checkboxLabelSelectedAlt,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <FormField
              number={10}
              label={t.customsRequest.specialInstructions}
              placeholder="Any additional details or requirements"
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
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
                <Text style={styles.submitBtnText}>{t.customsRequest.submitRequest}</Text>
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
    textAlign: "center",
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
    backgroundColor: "#1B4332",
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
    borderColor: "#1B4332",
    backgroundColor: "#1B433208",
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
    backgroundColor: "#1B4332",
    borderColor: "#1B4332",
  },
  checkboxLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.text,
    flex: 1,
  },
  checkboxLabelSelectedAlt: {
    fontFamily: "Poppins_500Medium",
    color: "#1B4332",
  },
  packageCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1B433225",
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
    borderTopColor: "#1B433230",
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
    color: "#1B4332",
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
    backgroundColor: "#1B4332",
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

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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { firebaseApi } from "@/lib/firebase";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";

interface ServiceBooking {
  id: string;
  type: string;
  name: string;
  phone: string;
  details: string;
  date: string;
}

interface BookingFormProps {
  serviceType: string;
  onClose: () => void;
  onSubmit: (booking: ServiceBooking) => void;
}

function BookingForm({ serviceType, onClose, onSubmit }: BookingFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [details, setDetails] = useState("");

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Required", "Please fill in your name and phone number.");
      return;
    }
    const booking: ServiceBooking = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: serviceType,
      name: name.trim(),
      phone: phone.trim(),
      details: details.trim(),
      date: new Date().toISOString(),
    };
    try {
      await firebaseApi.addBooking(booking);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSubmit(booking);
    } catch (e: any) {
      Alert.alert("Error", "Could not save booking.");
    }
  };

  return (
    <View style={styles.formContainer}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>Book {serviceType}</Text>
        <Pressable onPress={onClose}>
          <Ionicons name="close" size={24} color={Colors.light.text} />
        </Pressable>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        placeholderTextColor={Colors.light.tabIconDefault}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        placeholderTextColor={Colors.light.tabIconDefault}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Additional Details (dates, locations, etc.)"
        placeholderTextColor={Colors.light.tabIconDefault}
        value={details}
        onChangeText={setDetails}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
      <Pressable
        onPress={handleSubmit}
        style={({ pressed }) => [
          styles.submitBtn,
          { opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Text style={styles.submitBtnText}>Submit Booking</Text>
      </Pressable>
    </View>
  );
}

export default function ServicesScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { formatPrice } = useCurrency();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const [activeBooking, setActiveBooking] = useState<string | null>(null);

  const handleBookingSubmit = () => {
    setActiveBooking(null);
    Alert.alert("Success", "Your booking has been submitted! We will contact you shortly.");
  };

  if (activeBooking) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + webTopInset + 16,
            paddingBottom: insets.bottom + webBottomInset + 100,
            paddingHorizontal: 16,
          }}
        >
          <BookingForm
            serviceType={activeBooking}
            onClose={() => setActiveBooking(null)}
            onSubmit={handleBookingSubmit}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + webTopInset + 16,
          paddingBottom: insets.bottom + webBottomInset + 100,
        }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t.services.title}</Text>
          <Text style={styles.headerSubtitle}>
            {t.services.subtitle}
          </Text>
        </View>

        <View style={styles.serviceSection}>
          <LinearGradient
            colors={[Colors.light.primary, "#14A76C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mainServiceCard}
          >
            <View style={styles.mainServiceBadge}>
              <Text style={styles.badgeText}>POPULAR</Text>
            </View>
            <MaterialCommunityIcons name="shield-star" size={48} color="#fff" />
            <Text style={styles.mainServiceTitle}>{t.services.protocolService}</Text>
            <Text style={styles.mainServiceDesc}>
              {t.services.protocolDesc}
            </Text>
            <View style={styles.mainServiceFeatures}>
              {t.services.protocolFeatures.split("\n").map((feature, idx) => (
                <View key={idx} style={styles.featureChip}>
                  <Ionicons name={idx === 0 ? "car" : idx === 1 ? "shield-checkmark" : idx === 2 ? "navigate" : "checkmark-circle"} size={14} color="#fff" />
                  <Text style={styles.chipText}>{feature}</Text>
                </View>
              ))}
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/protocol-request");
              }}
              style={({ pressed }) => [
                styles.bookBtn,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Text style={styles.bookBtnText}>{t.services.bookNow}</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.light.primaryDark} />
            </Pressable>
          </LinearGradient>
        </View>

        <View style={styles.serviceSection}>
          <LinearGradient
            colors={[Colors.light.accent, "#E8C96A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mainServiceCard}
          >
            <Ionicons name="videocam" size={48} color="#fff" />
            <Text style={styles.mainServiceTitle}>{t.services.videoService}</Text>
            <Text style={styles.mainServiceDesc}>
              {t.services.videoDesc}
            </Text>
            <View style={styles.priceTag}>
              <Text style={styles.priceAmount}>{formatPrice(100)}</Text>
              <Text style={styles.pricePer}>/ {t.services.perHour}</Text>
            </View>
            <View style={styles.mainServiceFeatures}>
              {t.services.videoFeatures.split("\n").map((feature, idx) => (
                <View key={idx} style={styles.featureChip}>
                  <Ionicons name={idx === 0 ? "camera" : idx === 1 ? "time" : idx === 2 ? "today" : "videocam-outline"} size={14} color="#fff" />
                  <Text style={styles.chipText}>{feature}</Text>
                </View>
              ))}
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/video-request");
              }}
              style={({ pressed }) => [
                styles.bookBtn,
                styles.bookBtnDark,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Text style={[styles.bookBtnText, { color: "#fff" }]}>{t.services.requestVideo}</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </Pressable>
          </LinearGradient>
        </View>

        <View style={styles.serviceSection}>
          <View style={styles.secondaryCard}>
            <View style={styles.secondaryIconWrap}>
              <MaterialCommunityIcons name="passport" size={32} color={Colors.light.primary} />
            </View>
            <Text style={styles.secondaryTitle}>{t.services.customsService}</Text>
            <Text style={styles.secondaryDesc}>
              {t.services.customsDesc}
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/customs-request");
              }}
              style={({ pressed }) => [
                styles.secondaryBtn,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Text style={styles.secondaryBtnText}>{t.services.requestCustoms}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.serviceSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={22} color={Colors.light.primary} />
            <Text style={styles.infoText}>
              {t.services.subtitle}
            </Text>
          </View>
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
  header: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  serviceSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  mainServiceCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "flex-start",
  },
  mainServiceBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  badgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    color: "#fff",
    letterSpacing: 1,
  },
  mainServiceTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: "#fff",
    marginTop: 12,
  },
  mainServiceDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    marginTop: 8,
    lineHeight: 20,
  },
  priceTag: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  priceAmount: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "#fff",
  },
  pricePer: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginLeft: 6,
  },
  priceNote: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    marginTop: 6,
    fontStyle: "italic" as const,
  },
  mainServiceFeatures: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    flexWrap: "wrap",
  },
  featureChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: "#fff",
  },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 20,
    alignSelf: "flex-start",
  },
  bookBtnDark: {
    backgroundColor: Colors.light.primaryDark,
  },
  bookBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.light.primaryDark,
  },
  secondaryCard: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 20,
    padding: 24,
  },
  secondaryIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  secondaryTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: Colors.light.text,
  },
  secondaryDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  secondaryBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 16,
    alignSelf: "flex-start",
  },
  secondaryBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#E8F5E9",
    borderRadius: 14,
    padding: 16,
    gap: 10,
    alignItems: "flex-start",
  },
  infoText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.primaryDark,
    flex: 1,
    lineHeight: 18,
  },
  formContainer: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 20,
    padding: 24,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  formTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: Colors.light.text,
  },
  input: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  textArea: {
    minHeight: 100,
  },
  submitBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
});

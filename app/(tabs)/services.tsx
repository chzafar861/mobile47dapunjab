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
import Colors from "@/constants/colors";

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
          <Text style={styles.headerTitle}>Our Services</Text>
          <Text style={styles.headerSubtitle}>
            Premium services for visitors to Punjab, Pakistan
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
            <Text style={styles.mainServiceTitle}>Protocol Service</Text>
            <Text style={styles.mainServiceDesc}>
              Get VIP protocol and escort service when visiting Pakistan. We provide security, transportation, and guided assistance from the customs department.
            </Text>
            <View style={styles.mainServiceFeatures}>
              <View style={styles.featureChip}>
                <Ionicons name="car" size={14} color="#fff" />
                <Text style={styles.chipText}>Transport</Text>
              </View>
              <View style={styles.featureChip}>
                <Ionicons name="shield-checkmark" size={14} color="#fff" />
                <Text style={styles.chipText}>Security</Text>
              </View>
              <View style={styles.featureChip}>
                <Ionicons name="navigate" size={14} color="#fff" />
                <Text style={styles.chipText}>Guide</Text>
              </View>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setActiveBooking("Protocol Service");
              }}
              style={({ pressed }) => [
                styles.bookBtn,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Text style={styles.bookBtnText}>Book Now</Text>
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
            <Text style={styles.mainServiceTitle}>Village Video Service</Text>
            <Text style={styles.mainServiceDesc}>
              Want a personal video of your village or any old memorable place? We create professional 1-hour videos capturing your cherished locations.
            </Text>
            <View style={styles.priceTag}>
              <Text style={styles.priceAmount}>$100</Text>
              <Text style={styles.pricePer}>/ 1 hour video</Text>
            </View>
            <View style={styles.mainServiceFeatures}>
              <View style={styles.featureChip}>
                <Ionicons name="camera" size={14} color="#fff" />
                <Text style={styles.chipText}>HD Quality</Text>
              </View>
              <View style={styles.featureChip}>
                <Ionicons name="time" size={14} color="#fff" />
                <Text style={styles.chipText}>1 Hour</Text>
              </View>
              <View style={styles.featureChip}>
                <Feather name="edit-3" size={14} color="#fff" />
                <Text style={styles.chipText}>Edited</Text>
              </View>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setActiveBooking("Video Service ($100/hr)");
              }}
              style={({ pressed }) => [
                styles.bookBtn,
                styles.bookBtnDark,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Text style={[styles.bookBtnText, { color: "#fff" }]}>Order Video</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </Pressable>
          </LinearGradient>
        </View>

        <View style={styles.serviceSection}>
          <View style={styles.secondaryCard}>
            <View style={styles.secondaryIconWrap}>
              <MaterialCommunityIcons name="passport" size={32} color={Colors.light.primary} />
            </View>
            <Text style={styles.secondaryTitle}>Customs Department Service</Text>
            <Text style={styles.secondaryDesc}>
              Coming from outside Pakistan? Get official protocol assistance from the customs department. We handle all formalities for a smooth arrival.
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setActiveBooking("Customs Service");
              }}
              style={({ pressed }) => [
                styles.secondaryBtn,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Text style={styles.secondaryBtnText}>Request Service</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.serviceSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={22} color={Colors.light.primary} />
            <Text style={styles.infoText}>
              All services are available for overseas Pakistanis and international visitors. Contact us for custom packages.
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

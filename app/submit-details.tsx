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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { db, collection, addDoc } from "@/lib/firebase";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

interface PropertyDetail {
  id: string;
  ownerName: string;
  phone: string;
  propertyType: string;
  location: string;
  area: string;
  description: string;
  date: string;
}

const propertyTypes = ["Land", "House", "Shop", "Farm", "Other"];

export default function SubmitDetailsScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const [selectedType, setSelectedType] = useState("Land");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!ownerName.trim() || !phone.trim() || !location.trim()) {
      Alert.alert("Required", "Please fill in owner name, phone, and location.");
      return;
    }

    const detail: PropertyDetail = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      propertyType: selectedType,
      location: location.trim(),
      area: area.trim(),
      description: description.trim(),
      date: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, "propertyDetails"), detail);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
    } catch {
      Alert.alert("Error", "Could not save details.");
    }
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <View
          style={[
            styles.successContainer,
            { paddingTop: insets.top + webTopInset + 60 },
          ]}
        >
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={48} color={Colors.light.success} />
          </View>
          <Text style={styles.successTitle}>Details Submitted</Text>
          <Text style={styles.successDesc}>
            Your property details have been saved. Our team will review and contact you soon.
          </Text>
          <Pressable
            onPress={() => {
              setSubmitted(false);
              setOwnerName("");
              setPhone("");
              setLocation("");
              setArea("");
              setDescription("");
            }}
            style={({ pressed }) => [
              styles.anotherBtn,
              { opacity: pressed ? 0.9 : 1 },
            ]}
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + webTopInset + 16,
          paddingBottom: insets.bottom + webBottomInset + 40,
        }}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Submit Details</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="file-document-edit" size={24} color={Colors.light.primary} />
          <Text style={styles.infoText}>
            If you left Pakistan and want to give details about your property, land, or any memorable place, submit the information here. We will assist you with documentation and management.
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Property Type</Text>
          <View style={styles.typeRow}>
            {propertyTypes.map((type) => (
              <Pressable
                key={type}
                onPress={() => setSelectedType(type)}
                style={[
                  styles.typeChip,
                  selectedType === type && styles.typeChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.typeText,
                    selectedType === type && styles.typeTextActive,
                  ]}
                >
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.formLabel}>Owner Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Full name of the owner"
            placeholderTextColor={Colors.light.tabIconDefault}
            value={ownerName}
            onChangeText={setOwnerName}
          />

          <Text style={styles.formLabel}>Contact Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="Phone number"
            placeholderTextColor={Colors.light.tabIconDefault}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.formLabel}>Location / Address</Text>
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
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.submitBtn,
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Ionicons name="send" size={18} color="#fff" />
            <Text style={styles.submitBtnText}>Submit Details</Text>
          </Pressable>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: Colors.light.text,
  },
  infoCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: "#E8F5E9",
    borderRadius: 14,
    padding: 16,
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 24,
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
    minHeight: 120,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
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

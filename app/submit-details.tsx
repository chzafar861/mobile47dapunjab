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
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
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
  images: string[];
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
  const [images, setImages] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library to upload property images."
      );
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
      const newImages = result.assets
        .filter((a) => a.base64)
        .map((a) => `data:image/jpeg;base64,${a.base64}`);
      setImages((prev) => [...prev, ...newImages].slice(0, 5));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow camera access to take property photos."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      base64: true,
    });

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

  const handleSubmit = async () => {
    if (!ownerName.trim() || !phone.trim() || !location.trim()) {
      Alert.alert("Required", "Please fill in owner name, phone, and location.");
      return;
    }

    setSubmitting(true);
    const detail: PropertyDetail = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      propertyType: selectedType,
      location: location.trim(),
      area: area.trim(),
      description: description.trim(),
      date: new Date().toISOString(),
      images: images,
    };

    try {
      await firebaseApi.addPropertyDetail(detail);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
    } catch {
      Alert.alert("Error", "Could not save details.");
    } finally {
      setSubmitting(false);
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
            Your property details and photos have been saved. Our team will review and contact you soon.
          </Text>
          <Pressable
            onPress={() => {
              setSubmitted(false);
              setOwnerName("");
              setPhone("");
              setLocation("");
              setArea("");
              setDescription("");
              setImages([]);
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
            If you left Pakistan and want to give details about your property, land, or any memorable place, submit the information here with photos. We will assist you with documentation and management.
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

          <Text style={styles.formLabel}>Property Photos (up to 5)</Text>
          <View style={styles.imageSection}>
            <View style={styles.imageGrid}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageThumbWrap}>
                  <Image source={{ uri }} style={styles.imageThumb} />
                  <Pressable
                    onPress={() => removeImage(index)}
                    style={styles.imageRemoveBtn}
                  >
                    <Ionicons name="close-circle" size={22} color={Colors.light.danger} />
                  </Pressable>
                </View>
              ))}
              {images.length < 5 && (
                <View style={styles.addImageBtns}>
                  <Pressable
                    onPress={pickImages}
                    style={({ pressed }) => [
                      styles.addImageBtn,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Ionicons name="images" size={24} color={Colors.light.primary} />
                    <Text style={styles.addImageText}>Gallery</Text>
                  </Pressable>
                  {Platform.OS !== "web" && (
                    <Pressable
                      onPress={takePhoto}
                      style={({ pressed }) => [
                        styles.addImageBtn,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
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
            onPress={handleSubmit}
            disabled={submitting}
            style={({ pressed }) => [
              styles.submitBtn,
              { opacity: pressed || submitting ? 0.8 : 1 },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.submitBtnText}>Submit Details</Text>
              </>
            )}
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

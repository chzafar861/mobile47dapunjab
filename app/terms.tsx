import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View style={styles.termSection}>
      <Text style={styles.termSectionTitle}>{title}</Text>
      <Text style={styles.termSectionText}>{children}</Text>
    </View>
  );
}

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.light.primaryDark, Colors.light.primary]}
        style={[styles.header, { paddingTop: insets.top + webTopInset + 12 }]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 32 }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: insets.bottom + webBottomInset + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last Updated: February 15, 2026</Text>

        <Section title="Acceptance of Terms">
          {"By accessing or using the 47daPunjab mobile application, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the app."}
        </Section>

        <Section title="Description of Service">
          {"47daPunjab provides a mobile platform for visitors to Punjab, Pakistan. Our services include:\n\n- Protocol and customs assistance services\n- Village video recording services ($100/hour)\n- Product marketplace (Shop)\n- HumanFind: People and property search portal\n- Historical and cultural information\n- Blog and community content platform\n- Property detail submissions"}
        </Section>

        <Section title="User Accounts">
          {"To use certain features, you must create an account. You are responsible for:\n\n- Providing accurate and complete information\n- Maintaining the security of your account credentials\n- All activities that occur under your account\n- Notifying us immediately of any unauthorized use\n\nWe reserve the right to suspend or terminate accounts that violate these terms."}
        </Section>

        <Section title="User Content">
          {"You retain ownership of content you submit (photos, text, records). By submitting content, you grant us a non-exclusive, worldwide license to use, display, and distribute your content within the app. You agree not to submit content that:\n\n- Is false, misleading, or fraudulent\n- Infringes on intellectual property rights\n- Contains harmful, offensive, or illegal material\n- Violates any person's privacy rights"}
        </Section>

        <Section title="Service Bookings">
          {"When booking services through the app:\n\n- All bookings are subject to availability\n- Prices are displayed in USD unless otherwise stated\n- Video recording services are billed at $100/hour\n- Cancellation policies apply as specified at time of booking\n- We reserve the right to refuse service at our discretion"}
        </Section>

        <Section title="HumanFind Feature">
          {"The HumanFind feature allows users to search for people and property details. Users who submit information:\n\n- Must ensure accuracy of submitted information\n- Consent to the information being publicly searchable within the app\n- Are responsible for obtaining consent from individuals whose information they submit\n- Must not submit information for malicious purposes"}
        </Section>

        <Section title="Blog & Community">
          {"Blog writing privileges may be requested and are subject to admin approval. Writers must:\n\n- Create original, accurate content\n- Respect community guidelines\n- Not post spam, promotional, or misleading content\n\nWe reserve the right to remove content and revoke writing privileges at our discretion."}
        </Section>

        <Section title="Intellectual Property">
          {"The app, including its design, features, and content (excluding user-submitted content), is owned by 47daPunjab. You may not copy, modify, distribute, or reverse-engineer any part of the app without our written permission."}
        </Section>

        <Section title="Limitation of Liability">
          {"47daPunjab is provided \"as is\" without warranties of any kind. We are not liable for:\n\n- Accuracy of user-submitted content or search results\n- Service interruptions or data loss\n- Third-party actions or content\n- Any indirect, incidental, or consequential damages\n\nOur total liability shall not exceed the amount you paid for services through the app."}
        </Section>

        <Section title="Governing Law">
          {"These terms are governed by the laws of Pakistan. Any disputes shall be resolved through the courts of Pakistan."}
        </Section>

        <Section title="Changes to Terms">
          {"We may update these Terms of Service at any time. Continued use of the app after changes constitutes acceptance. We will make reasonable efforts to notify users of significant changes."}
        </Section>

        <Section title="Contact">
          {"For questions about these Terms of Service, please contact the 47daPunjab team through the app's support features."}
        </Section>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#fff",
  },
  lastUpdated: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 20,
  },
  termSection: {
    marginBottom: 24,
  },
  termSectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 8,
  },
  termSectionText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
});

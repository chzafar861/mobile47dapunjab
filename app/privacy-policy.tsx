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
    <View style={styles.policySection}>
      <Text style={styles.policySectionTitle}>{title}</Text>
      <Text style={styles.policySectionText}>{children}</Text>
    </View>
  );
}

export default function PrivacyPolicyScreen() {
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 32 }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: insets.bottom + webBottomInset + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last Updated: February 15, 2026</Text>

        <Section title="Introduction">
          {"47daPunjab (\"we\", \"our\", or \"us\") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application. Please read this policy carefully. By using the app, you agree to the collection and use of information as described here."}
        </Section>

        <Section title="Information We Collect">
          {"We collect information you provide directly, including:\n\n- Account Information: Name, email address, phone number, city, country, and purpose of visit when you create an account or update your profile.\n\n- Content You Submit: Property details, person information, migration records, blog posts, comments, and photos you upload through the app.\n\n- Booking Information: Service bookings including name, phone, date, and service type.\n\n- Device Information: We may collect device type, operating system, and app usage data for improving our services."}
        </Section>

        <Section title="How We Use Your Information">
          {"We use the information we collect to:\n\n- Provide, operate, and maintain our services\n- Process your bookings and service requests\n- Enable the HumanFind feature for people and property searches\n- Display blog posts and community content\n- Communicate with you about services and updates\n- Improve and personalize your app experience\n- Ensure security and prevent fraud"}
        </Section>

        <Section title="Data Sharing">
          {"We do not sell your personal information. We may share data with:\n\n- Service Providers: Third-party services that help us operate the app (hosting, analytics)\n- Legal Requirements: When required by law or to protect our rights\n- Community Features: Information you submit to HumanFind, blogs, and migration records is visible to other users as part of the community features"}
        </Section>

        <Section title="Data Security">
          {"We implement appropriate security measures to protect your personal information. However, no method of electronic transmission or storage is 100% secure. We strive to use commercially acceptable means to protect your data but cannot guarantee absolute security."}
        </Section>

        <Section title="Your Rights">
          {"You have the right to:\n\n- Access your personal data\n- Update or correct your information through your profile\n- Request deletion of your account and data\n- Opt out of non-essential communications\n\nTo exercise these rights, contact us through the app or at our support channels."}
        </Section>

        <Section title="Children's Privacy">
          {"Our app is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we learn that we have collected data from a child under 13, we will take steps to delete such information."}
        </Section>

        <Section title="Changes to This Policy">
          {"We may update this Privacy Policy from time to time. We will notify you of changes by posting the new policy in the app. Your continued use of the app after changes constitutes acceptance of the updated policy."}
        </Section>

        <Section title="Contact Us">
          {"If you have questions about this Privacy Policy, please contact us through the app's support features or reach out to the 47daPunjab team."}
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
  policySection: {
    marginBottom: 24,
  },
  policySectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 8,
  },
  policySectionText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
});

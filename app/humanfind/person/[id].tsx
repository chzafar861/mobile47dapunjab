import React, { useState, useEffect } from 'react';
import { ScrollView, View, Image, StyleSheet, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ThemedView, ThemedText, Button, Card, LoadingScreen } from '../../../src/components';
import { useTranslate } from '../../../src/hooks/useTranslate';
import { useThemeStore } from '../../../src/store/themeStore';
import { getDocument } from '../../../src/services/firestore';
import { COLLECTIONS } from '../../../src/constants/collections';
import { HumanFindPerson } from '../../../src/types';
import { Ionicons } from '@expo/vector-icons';

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslate();
  const { colors } = useThemeStore();
  const [person, setPerson] = useState<(HumanFindPerson & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerson = async () => {
      if (!id) return;
      try {
        const data = await getDocument<HumanFindPerson>(COLLECTIONS.HUMANFIND_PEOPLE, id);
        setPerson(data);
      } catch (error) {
        console.error('Error fetching person:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPerson();
  }, [id]);

  if (loading) return <LoadingScreen />;
  if (!person) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Person not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Photo */}
        <View style={styles.photoSection}>
          {person.photo ? (
            <Image source={{ uri: person.photo }} style={styles.photo} />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: colors.inputBackground }]}>
              <Ionicons name="person" size={64} color={colors.placeholder} />
            </View>
          )}
        </View>

        {/* Info */}
        <Card>
          <ThemedText variant="title" style={styles.name}>{person.name}</ThemedText>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
            <ThemedText variant="body" style={styles.infoText}>{person.location}</ThemedText>
          </View>

          {person.description ? (
            <View style={styles.section}>
              <ThemedText variant="label">{t('common_description')}</ThemedText>
              <ThemedText variant="body" secondary style={styles.sectionContent}>
                {person.description}
              </ThemedText>
            </View>
          ) : null}

          {person.contactInfo ? (
            <View style={styles.section}>
              <ThemedText variant="label">{t('humanfind_contact')}</ThemedText>
              <ThemedText variant="body" secondary style={styles.sectionContent}>
                {person.contactInfo}
              </ThemedText>
            </View>
          ) : null}
        </Card>

        {person.contactInfo && (
          <Button
            title="Contact"
            onPress={() => {
              if (person.contactInfo.includes('@')) {
                Linking.openURL(`mailto:${person.contactInfo}`);
              } else {
                Linking.openURL(`tel:${person.contactInfo}`);
              }
            }}
            fullWidth
            style={styles.contactButton}
          />
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  centered: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  photoSection: { alignItems: 'center', marginBottom: 16 },
  photo: { width: 150, height: 150, borderRadius: 75 },
  photoPlaceholder: {
    width: 150, height: 150, borderRadius: 75,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { textAlign: 'center', marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoText: { marginLeft: 8 },
  section: { marginTop: 16 },
  sectionContent: { marginTop: 4, lineHeight: 22 },
  contactButton: { marginTop: 16 },
});

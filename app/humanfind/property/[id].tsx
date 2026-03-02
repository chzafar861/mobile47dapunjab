import React, { useState, useEffect } from 'react';
import { ScrollView, View, Image, StyleSheet, Dimensions, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ThemedView, ThemedText, Button, Card, LoadingScreen } from '../../../src/components';
import { useTranslate } from '../../../src/hooks/useTranslate';
import { useThemeStore } from '../../../src/store/themeStore';
import { getDocument } from '../../../src/services/firestore';
import { COLLECTIONS } from '../../../src/constants/collections';
import { HumanFindProperty } from '../../../src/types';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslate();
  const { colors } = useThemeStore();
  const [property, setProperty] = useState<(HumanFindProperty & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;
      try {
        const data = await getDocument<HumanFindProperty>(COLLECTIONS.HUMANFIND_PROPERTIES, id);
        setProperty(data);
      } catch (error) {
        console.error('Error fetching property:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  if (loading) return <LoadingScreen />;
  if (!property) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Property not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Images */}
        {property.images?.length > 0 && (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {property.images.map((img, index) => (
              <Image key={index} source={{ uri: img }} style={styles.image} resizeMode="cover" />
            ))}
          </ScrollView>
        )}

        {/* Info */}
        <Card style={styles.infoCard}>
          <ThemedText variant="title">{property.title}</ThemedText>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
            <ThemedText variant="body" style={styles.infoText}>{property.location}</ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText variant="label">Details</ThemedText>
            <ThemedText variant="body" secondary style={styles.sectionContent}>
              {property.details}
            </ThemedText>
          </View>

          {property.ownerContact && (
            <View style={styles.section}>
              <ThemedText variant="label">{t('humanfind_contact')}</ThemedText>
              <ThemedText variant="body" secondary style={styles.sectionContent}>
                {property.ownerContact}
              </ThemedText>
            </View>
          )}
        </Card>

        {property.ownerContact && (
          <Button
            title="Contact Owner"
            onPress={() => {
              if (property.ownerContact.includes('@')) {
                Linking.openURL(`mailto:${property.ownerContact}`);
              } else {
                Linking.openURL(`tel:${property.ownerContact}`);
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
  content: { paddingBottom: 40 },
  image: { width, height: width * 0.65 },
  infoCard: { margin: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  infoText: { marginLeft: 8 },
  section: { marginTop: 16 },
  sectionContent: { marginTop: 4, lineHeight: 22 },
  contactButton: { marginHorizontal: 16 },
});

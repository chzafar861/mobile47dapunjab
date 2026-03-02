import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView, ThemedText, Button, Input, Card } from '../../src/components';
import { useTranslate } from '../../src/hooks/useTranslate';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';
import { addDocument } from '../../src/services/firestore';
import { COLLECTIONS } from '../../src/constants/collections';
import { ProtocolRequest } from '../../src/types';
import { Ionicons } from '@expo/vector-icons';

const SERVICE_TYPES = [
  { key: 'protocol_vip_transport', icon: 'car' as const },
  { key: 'protocol_security_escort', icon: 'shield' as const },
  { key: 'protocol_official_reception', icon: 'people' as const },
  { key: 'protocol_cultural_guide', icon: 'compass' as const },
];

export default function NewProtocolRequest() {
  const router = useRouter();
  const { t } = useTranslate();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const [serviceType, setServiceType] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!serviceType || !location || !date) {
      Alert.alert(t('common_error'), 'Please fill in all required fields');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const request: Omit<ProtocolRequest, 'id' | 'createdAt'> = {
        userId: user.uid,
        serviceType,
        location,
        date,
        status: 'pending',
        notes,
      };
      await addDocument(COLLECTIONS.PROTOCOL_REQUESTS, request);
      Alert.alert(t('common_success'), 'Request submitted successfully!');
      router.back();
    } catch (error) {
      Alert.alert(t('common_error'), 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Service Type Selection */}
        <ThemedText variant="label" style={styles.sectionLabel}>
          {t('protocol_service_type')}
        </ThemedText>
        <View style={styles.serviceGrid}>
          {SERVICE_TYPES.map((service) => (
            <TouchableOpacity
              key={service.key}
              style={[
                styles.serviceOption,
                {
                  backgroundColor: serviceType === t(service.key) ? `${colors.primary}15` : colors.card,
                  borderColor: serviceType === t(service.key) ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setServiceType(t(service.key))}
            >
              <Ionicons
                name={service.icon}
                size={24}
                color={serviceType === t(service.key) ? colors.primary : colors.textSecondary}
              />
              <ThemedText variant="caption" style={styles.serviceText}>
                {t(service.key)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label={t('common_location')}
          value={location}
          onChangeText={setLocation}
          placeholder="Enter location"
        />

        <Input
          label={t('protocol_select_date')}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
        />

        <Input
          label={t('protocol_notes')}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional notes..."
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />

        <Button
          title={t('common_submit')}
          onPress={handleSubmit}
          loading={loading}
          fullWidth
          style={styles.submitButton}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionLabel: {
    marginBottom: 12,
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  serviceOption: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceText: {
    marginTop: 6,
    textAlign: 'center',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 16,
  },
});

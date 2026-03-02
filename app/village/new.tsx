import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView, Button, Input } from '../../src/components';
import { useTranslate } from '../../src/hooks/useTranslate';
import { useAuthStore } from '../../src/store/authStore';
import { addDocument } from '../../src/services/firestore';
import { COLLECTIONS } from '../../src/constants/collections';
import { VillageVideoRequest } from '../../src/types';

export default function NewVillageRequest() {
  const router = useRouter();
  const { t } = useTranslate();
  const { user } = useAuthStore();
  const [villageName, setVillageName] = useState('');
  const [district, setDistrict] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!villageName || !district) {
      Alert.alert(t('common_error'), 'Please fill in all required fields');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const request: Omit<VillageVideoRequest, 'id' | 'createdAt'> = {
        userId: user.uid,
        villageName,
        district,
        description,
        videoLinks: [],
        status: 'pending',
      };
      await addDocument(COLLECTIONS.VILLAGE_VIDEO_REQUESTS, request);
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
        <Input
          label={t('village_name')}
          value={villageName}
          onChangeText={setVillageName}
          placeholder="Enter village name"
        />
        <Input
          label={t('village_district')}
          value={district}
          onChangeText={setDistrict}
          placeholder="Enter district"
        />
        <Input
          label={t('common_description')}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe what you'd like recorded..."
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 16,
  },
});

import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView, Button, Input, ImagePickerButton } from '../../src/components';
import { useTranslate } from '../../src/hooks/useTranslate';
import { useAuthStore } from '../../src/store/authStore';
import { addDocument } from '../../src/services/firestore';
import { uploadMultipleFiles } from '../../src/services/storage';
import { COLLECTIONS } from '../../src/constants/collections';
import { PropertySubmission } from '../../src/types';

export default function NewPropertySubmission() {
  const router = useRouter();
  const { t } = useTranslate();
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !location || !description) {
      Alert.alert(t('common_error'), 'Please fill in all required fields');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadMultipleFiles(
          images,
          `properties/${Date.now()}`
        );
      }

      const submission: Omit<PropertySubmission, 'id' | 'createdAt'> = {
        userId: user.uid,
        title,
        location,
        description,
        images: imageUrls,
        verificationStatus: 'pending',
      };
      await addDocument(COLLECTIONS.PROPERTY_SUBMISSIONS, submission);
      Alert.alert(t('common_success'), 'Property submitted for verification!');
      router.back();
    } catch (error) {
      Alert.alert(t('common_error'), 'Failed to submit property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView>
      <ScrollView contentContainerStyle={styles.content}>
        <Input label="Title" value={title} onChangeText={setTitle} placeholder="Property title" />
        <Input label={t('common_location')} value={location} onChangeText={setLocation} placeholder="City, District" />
        <Input
          label={t('common_description')}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the property in detail..."
          multiline
          numberOfLines={5}
          style={styles.textArea}
        />
        <ImagePickerButton
          images={images}
          onImagesSelected={setImages}
          maxImages={5}
          label="Property Images"
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
  content: { padding: 16, paddingBottom: 40 },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  submitButton: { marginTop: 16 },
});

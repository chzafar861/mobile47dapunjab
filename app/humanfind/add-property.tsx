import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView, Button, Input, ImagePickerButton } from '../../src/components';
import { useTranslate } from '../../src/hooks/useTranslate';
import { addDocument } from '../../src/services/firestore';
import { uploadMultipleFiles } from '../../src/services/storage';
import { COLLECTIONS } from '../../src/constants/collections';
import { HumanFindProperty } from '../../src/types';

export default function AddPropertyScreen() {
  const router = useRouter();
  const { t } = useTranslate();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [details, setDetails] = useState('');
  const [ownerContact, setOwnerContact] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !location) {
      Alert.alert(t('common_error'), 'Title and location are required');
      return;
    }

    setLoading(true);
    try {
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadMultipleFiles(images, `humanfind/properties/${Date.now()}`);
      }

      const property: Omit<HumanFindProperty, 'id' | 'createdAt'> = {
        title,
        location,
        details,
        images: imageUrls,
        ownerContact,
      };
      await addDocument(COLLECTIONS.HUMANFIND_PROPERTIES, property);
      Alert.alert(t('common_success'), 'Property added successfully!');
      router.back();
    } catch (error) {
      Alert.alert(t('common_error'), 'Failed to add property');
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
          label="Details"
          value={details}
          onChangeText={setDetails}
          placeholder="Property details..."
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />
        <Input label={t('humanfind_contact')} value={ownerContact} onChangeText={setOwnerContact} placeholder="Owner contact" />
        <ImagePickerButton images={images} onImagesSelected={setImages} maxImages={5} label="Images" />
        <Button title={t('common_submit')} onPress={handleSubmit} loading={loading} fullWidth style={styles.submitButton} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  submitButton: { marginTop: 16 },
});

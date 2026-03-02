import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView, Button, Input, ImagePickerButton } from '../../src/components';
import { useTranslate } from '../../src/hooks/useTranslate';
import { addDocument } from '../../src/services/firestore';
import { uploadFile } from '../../src/services/storage';
import { COLLECTIONS } from '../../src/constants/collections';
import { HumanFindPerson } from '../../src/types';

export default function AddPersonScreen() {
  const router = useRouter();
  const { t } = useTranslate();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !location) {
      Alert.alert(t('common_error'), 'Name and location are required');
      return;
    }

    setLoading(true);
    try {
      let photoUrl = '';
      if (images.length > 0) {
        photoUrl = await uploadFile(
          images[0],
          `humanfind/people/${Date.now()}`
        );
      }

      const person: Omit<HumanFindPerson, 'id' | 'createdAt'> = {
        name,
        location,
        description,
        photo: photoUrl,
        contactInfo,
      };
      await addDocument(COLLECTIONS.HUMANFIND_PEOPLE, person);
      Alert.alert(t('common_success'), 'Person added successfully!');
      router.back();
    } catch (error) {
      Alert.alert(t('common_error'), 'Failed to add person');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView>
      <ScrollView contentContainerStyle={styles.content}>
        <Input label={t('auth_name')} value={name} onChangeText={setName} placeholder="Full Name" />
        <Input label={t('common_location')} value={location} onChangeText={setLocation} placeholder="City, District" />
        <Input
          label={t('common_description')}
          value={description}
          onChangeText={setDescription}
          placeholder="Description..."
          multiline
          numberOfLines={3}
          style={styles.textArea}
        />
        <Input label={t('humanfind_contact')} value={contactInfo} onChangeText={setContactInfo} placeholder="Phone or email" />
        <ImagePickerButton images={images} onImagesSelected={setImages} maxImages={1} label="Photo" />
        <Button title={t('common_submit')} onPress={handleSubmit} loading={loading} fullWidth style={styles.submitButton} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  submitButton: { marginTop: 16 },
});

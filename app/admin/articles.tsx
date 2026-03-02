import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView, ThemedText, Button, Input, ImagePickerButton } from '../../src/components';
import { useTranslate } from '../../src/hooks/useTranslate';
import { addDocument } from '../../src/services/firestore';
import { uploadMultipleFiles } from '../../src/services/storage';
import { COLLECTIONS } from '../../src/constants/collections';
import { HistoryArticle } from '../../src/types';

export default function AdminArticlesScreen() {
  const router = useRouter();
  const { t } = useTranslate();
  const [titleEn, setTitleEn] = useState('');
  const [titleUr, setTitleUr] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [titlePa, setTitlePa] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [contentUr, setContentUr] = useState('');
  const [contentHi, setContentHi] = useState('');
  const [contentPa, setContentPa] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!titleEn || !contentEn) {
      Alert.alert(t('common_error'), 'Title (EN) and Content (EN) are required');
      return;
    }

    setLoading(true);
    try {
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadMultipleFiles(images, `articles/${Date.now()}`);
      }

      const article: Omit<HistoryArticle, 'id' | 'createdAt'> = {
        title_en: titleEn,
        title_ur: titleUr || titleEn,
        title_hi: titleHi || titleEn,
        title_pa: titlePa || titleEn,
        content_en: contentEn,
        content_ur: contentUr || contentEn,
        content_hi: contentHi || contentEn,
        content_pa: contentPa || contentEn,
        images: imageUrls,
      };
      await addDocument(COLLECTIONS.HISTORY_ARTICLES, article);
      Alert.alert(t('common_success'), 'Article published successfully!');
      router.back();
    } catch (error) {
      Alert.alert(t('common_error'), 'Failed to publish article');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText variant="subtitle" style={styles.sectionTitle}>
          Titles
        </ThemedText>
        <Input label="Title (English) *" value={titleEn} onChangeText={setTitleEn} placeholder="Article title" />
        <Input label="Title (Urdu)" value={titleUr} onChangeText={setTitleUr} placeholder="اردو عنوان" />
        <Input label="Title (Hindi)" value={titleHi} onChangeText={setTitleHi} placeholder="हिंदी शीर्षक" />
        <Input label="Title (Punjabi)" value={titlePa} onChangeText={setTitlePa} placeholder="ਪੰਜਾਬੀ ਸਿਰਲੇਖ" />

        <ThemedText variant="subtitle" style={styles.sectionTitle}>
          Content
        </ThemedText>
        <Input label="Content (English) *" value={contentEn} onChangeText={setContentEn} placeholder="Article content" multiline style={styles.textArea} />
        <Input label="Content (Urdu)" value={contentUr} onChangeText={setContentUr} placeholder="اردو مضمون" multiline style={styles.textArea} />
        <Input label="Content (Hindi)" value={contentHi} onChangeText={setContentHi} placeholder="हिंदी सामग्री" multiline style={styles.textArea} />
        <Input label="Content (Punjabi)" value={contentPa} onChangeText={setContentPa} placeholder="ਪੰਜਾਬੀ ਸਮੱਗਰੀ" multiline style={styles.textArea} />

        <ImagePickerButton images={images} onImagesSelected={setImages} maxImages={5} label="Article Images" />

        <Button title="Publish Article" onPress={handleSubmit} loading={loading} fullWidth style={styles.submitButton} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { marginTop: 16, marginBottom: 8 },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  submitButton: { marginTop: 24 },
});

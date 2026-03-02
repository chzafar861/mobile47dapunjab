import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView, ThemedText, Button, Input, ImagePickerButton } from '../../src/components';
import { useTranslate } from '../../src/hooks/useTranslate';
import { addDocument } from '../../src/services/firestore';
import { uploadMultipleFiles } from '../../src/services/storage';
import { COLLECTIONS } from '../../src/constants/collections';
import { Product } from '../../src/types';

export default function AddProductScreen() {
  const router = useRouter();
  const { t } = useTranslate();
  const [nameEn, setNameEn] = useState('');
  const [nameUr, setNameUr] = useState('');
  const [nameHi, setNameHi] = useState('');
  const [namePa, setNamePa] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descUr, setDescUr] = useState('');
  const [descHi, setDescHi] = useState('');
  const [descPa, setDescPa] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!nameEn || !price || !category) {
      Alert.alert(t('common_error'), 'Name (EN), price, and category are required');
      return;
    }

    setLoading(true);
    try {
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadMultipleFiles(images, `products/${Date.now()}`);
      }

      const product: Omit<Product, 'id'> = {
        name_en: nameEn,
        name_ur: nameUr || nameEn,
        name_hi: nameHi || nameEn,
        name_pa: namePa || nameEn,
        description_en: descEn,
        description_ur: descUr || descEn,
        description_hi: descHi || descEn,
        description_pa: descPa || descEn,
        price: parseFloat(price),
        stock: parseInt(stock || '0', 10),
        category,
        images: imageUrls,
      };
      await addDocument(COLLECTIONS.PRODUCTS, product);
      Alert.alert(t('common_success'), 'Product added successfully!');
      router.back();
    } catch (error) {
      Alert.alert(t('common_error'), 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText variant="subtitle" style={styles.sectionTitle}>
          Product Names
        </ThemedText>
        <Input label="Name (English) *" value={nameEn} onChangeText={setNameEn} placeholder="Product name in English" />
        <Input label="Name (Urdu)" value={nameUr} onChangeText={setNameUr} placeholder="اردو میں نام" />
        <Input label="Name (Hindi)" value={nameHi} onChangeText={setNameHi} placeholder="हिंदी में नाम" />
        <Input label="Name (Punjabi)" value={namePa} onChangeText={setNamePa} placeholder="ਪੰਜਾਬੀ ਵਿੱਚ ਨਾਮ" />

        <ThemedText variant="subtitle" style={styles.sectionTitle}>
          Descriptions
        </ThemedText>
        <Input label="Description (English)" value={descEn} onChangeText={setDescEn} placeholder="English description" multiline style={styles.textArea} />
        <Input label="Description (Urdu)" value={descUr} onChangeText={setDescUr} placeholder="اردو تفصیل" multiline style={styles.textArea} />
        <Input label="Description (Hindi)" value={descHi} onChangeText={setDescHi} placeholder="हिंदी विवरण" multiline style={styles.textArea} />
        <Input label="Description (Punjabi)" value={descPa} onChangeText={setDescPa} placeholder="ਪੰਜਾਬੀ ਵੇਰਵਾ" multiline style={styles.textArea} />

        <ThemedText variant="subtitle" style={styles.sectionTitle}>
          Details
        </ThemedText>
        <Input label="Price (PKR) *" value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="0" />
        <Input label="Stock" value={stock} onChangeText={setStock} keyboardType="numeric" placeholder="0" />
        <Input label="Category *" value={category} onChangeText={setCategory} placeholder="e.g., Clothing, Food, Crafts" />

        <ImagePickerButton images={images} onImagesSelected={setImages} maxImages={5} label="Product Images" />

        <Button title={t('common_submit')} onPress={handleSubmit} loading={loading} fullWidth style={styles.submitButton} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { marginTop: 16, marginBottom: 8 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  submitButton: { marginTop: 24 },
});

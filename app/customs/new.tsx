import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView, ThemedText, Button, Input } from '../../src/components';
import { useTranslate } from '../../src/hooks/useTranslate';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';
import { addDocument } from '../../src/services/firestore';
import { COLLECTIONS } from '../../src/constants/collections';
import { CustomsAssistance } from '../../src/types';

const ITEM_TYPES = [
  'Personal Belongings',
  'Electronics',
  'Food & Agriculture',
  'Gifts & Souvenirs',
  'Documents',
  'Other',
];

export default function NewCustomsRequest() {
  const router = useRouter();
  const { t } = useTranslate();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const [itemType, setItemType] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!itemType || !description) {
      Alert.alert(t('common_error'), 'Please fill in all required fields');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const request: Omit<CustomsAssistance, 'id' | 'createdAt'> = {
        userId: user.uid,
        itemType,
        description,
        status: 'pending',
      };
      await addDocument(COLLECTIONS.CUSTOMS_ASSISTANCE, request);
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
        <ThemedText variant="label" style={styles.sectionLabel}>
          {t('customs_item_type')}
        </ThemedText>
        <View style={styles.typeGrid}>
          {ITEM_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeOption,
                {
                  backgroundColor: itemType === type ? `${colors.primary}15` : colors.card,
                  borderColor: itemType === type ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setItemType(type)}
            >
              <ThemedText
                variant="caption"
                style={{
                  color: itemType === type ? colors.primary : colors.text,
                  fontWeight: itemType === type ? '600' : '400',
                }}
              >
                {type}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label={t('common_description')}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe your customs assistance need..."
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
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 16,
  },
});

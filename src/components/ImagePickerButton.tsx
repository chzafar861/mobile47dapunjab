import React from 'react';
import { TouchableOpacity, View, Image, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';
import { ThemedText } from './ThemedText';

interface ImagePickerButtonProps {
  images: string[];
  onImagesSelected: (uris: string[]) => void;
  maxImages?: number;
  label?: string;
}

export const ImagePickerButton: React.FC<ImagePickerButtonProps> = ({
  images,
  onImagesSelected,
  maxImages = 5,
  label = 'Add Images',
}) => {
  const { colors } = useThemeStore();

  const pickImages = async () => {
    if (images.length >= maxImages) {
      Alert.alert('Limit Reached', `Maximum ${maxImages} images allowed`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: maxImages - images.length,
    });

    if (!result.canceled) {
      const newUris = result.assets.map((asset) => asset.uri);
      onImagesSelected([...images, ...newUris].slice(0, maxImages));
    }
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onImagesSelected(updated);
  };

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText variant="label" style={styles.label}>
          {label}
        </ThemedText>
      )}
      <View style={styles.imageRow}>
        {images.map((uri, index) => (
          <View key={index} style={styles.imageWrapper}>
            <Image source={{ uri }} style={styles.image} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeImage(index)}
            >
              <Ionicons name="close-circle" size={22} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))}
        {images.length < maxImages && (
          <TouchableOpacity
            style={[styles.addButton, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}
            onPress={pickImages}
          >
            <Ionicons name="add-outline" size={32} color={colors.placeholder} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  imageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: 'white',
    borderRadius: 11,
  },
  addButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

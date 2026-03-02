import React, { useState, useEffect } from 'react';
import { ScrollView, Image, StyleSheet, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ThemedView, ThemedText, LoadingScreen } from '../../src/components';
import { useTranslate } from '../../src/hooks/useTranslate';
import { getDocument } from '../../src/services/firestore';
import { COLLECTIONS } from '../../src/constants/collections';
import { HistoryArticle } from '../../src/types';

const { width } = Dimensions.get('window');

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getLocalizedField } = useTranslate();
  const [article, setArticle] = useState<(HistoryArticle & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      try {
        const data = await getDocument<HistoryArticle>(COLLECTIONS.HISTORY_ARTICLES, id);
        setArticle(data);
      } catch (error) {
        console.error('Error fetching article:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  if (loading) return <LoadingScreen />;
  if (!article) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Article not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero Image */}
        {article.images?.[0] && (
          <Image source={{ uri: article.images[0] }} style={styles.heroImage} resizeMode="cover" />
        )}

        <ThemedText variant="title" style={styles.title}>
          {getLocalizedField(article, 'title')}
        </ThemedText>

        <ThemedText variant="caption" secondary style={styles.date}>
          {new Date(article.createdAt).toLocaleDateString()}
        </ThemedText>

        <ThemedText variant="body" style={styles.contentText}>
          {getLocalizedField(article, 'content')}
        </ThemedText>

        {/* Additional Images */}
        {article.images?.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageGallery}>
            {article.images.slice(1).map((img, index) => (
              <Image key={index} source={{ uri: img }} style={styles.galleryImage} resizeMode="cover" />
            ))}
          </ScrollView>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  centered: { justifyContent: 'center', alignItems: 'center' },
  content: { paddingBottom: 40 },
  heroImage: { width, height: width * 0.6 },
  title: { padding: 16, paddingBottom: 4 },
  date: { paddingHorizontal: 16, marginBottom: 12 },
  contentText: { paddingHorizontal: 16, lineHeight: 26, fontSize: 17 },
  imageGallery: { marginTop: 24, paddingHorizontal: 16 },
  galleryImage: { width: 200, height: 150, borderRadius: 12, marginRight: 12 },
});

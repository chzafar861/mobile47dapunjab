import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, View, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { orderBy } from 'firebase/firestore';
import { ThemedView, ThemedText, Card, LoadingScreen, EmptyState } from '../../src/components';
import { useTranslate } from '../../src/hooks/useTranslate';
import { useThemeStore } from '../../src/store/themeStore';
import { getDocuments } from '../../src/services/firestore';
import { COLLECTIONS } from '../../src/constants/collections';
import { HistoryArticle } from '../../src/types';

export default function HistoryScreen() {
  const router = useRouter();
  const { t, getLocalizedField } = useTranslate();
  const { colors } = useThemeStore();
  const [articles, setArticles] = useState<(HistoryArticle & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDocuments<HistoryArticle>(COLLECTIONS.HISTORY_ARTICLES, [
        orderBy('createdAt', 'desc'),
      ]);
      setArticles(data);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const renderArticle = ({ item }: { item: HistoryArticle & { id: string } }) => (
    <Card onPress={() => router.push(`/history/${item.id}`)}>
      {item.images?.[0] && (
        <Image source={{ uri: item.images[0] }} style={styles.articleImage} />
      )}
      <ThemedText variant="subtitle" style={styles.articleTitle}>
        {getLocalizedField(item, 'title')}
      </ThemedText>
      <ThemedText variant="body" secondary numberOfLines={3} style={styles.articleContent}>
        {getLocalizedField(item, 'content')}
      </ThemedText>
      <ThemedText variant="caption" style={{ color: colors.primary, marginTop: 8 }}>
        {t('history_read_more')} →
      </ThemedText>
    </Card>
  );

  if (loading) return <LoadingScreen />;

  return (
    <ThemedView>
      <FlatList
        data={articles}
        renderItem={renderArticle}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onRefresh={fetchArticles}
        refreshing={loading}
        ListEmptyComponent={
          <EmptyState
            icon="book-outline"
            message={t('common_no_data')}
            submessage="History articles will appear here"
          />
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  articleImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
  },
  articleTitle: {
    marginBottom: 4,
  },
  articleContent: {
    lineHeight: 22,
  },
});

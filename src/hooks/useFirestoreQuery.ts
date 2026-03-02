import { useState, useEffect, useCallback } from 'react';
import { QueryConstraint } from 'firebase/firestore';
import { getDocuments, getDocumentsByUser } from '../services/firestore';

interface QueryState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch documents from Firestore with auto-refresh
 */
export function useFirestoreQuery<T>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  deps: unknown[] = []
): QueryState<T & { id: string }> {
  const [data, setData] = useState<(T & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await getDocuments<T>(collectionName, constraints);
      setData(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [collectionName, ...deps]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

/**
 * Hook to fetch user-specific documents from Firestore
 */
export function useUserDocuments<T>(
  collectionName: string,
  userId: string | undefined
): QueryState<T & { id: string }> {
  const [data, setData] = useState<(T & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const results = await getDocumentsByUser<T>(collectionName, userId);
      setData(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [collectionName, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

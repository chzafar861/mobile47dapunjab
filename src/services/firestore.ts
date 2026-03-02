import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  DocumentData,
  startAfter,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Generic add document
export const addDocument = async <T extends DocumentData>(
  collectionName: string,
  data: T
): Promise<string> => {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: Date.now(),
  });
  return docRef.id;
};

// Generic get document by ID
export const getDocument = async <T>(
  collectionName: string,
  docId: string
): Promise<(T & { id: string }) | null> => {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T & { id: string };
  }
  return null;
};

// Generic get documents with query
export const getDocuments = async <T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<(T & { id: string })[]> => {
  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as (T & { id: string })[];
};

// Generic get documents by user ID
export const getDocumentsByUser = async <T>(
  collectionName: string,
  userId: string
): Promise<(T & { id: string })[]> => {
  return getDocuments<T>(collectionName, [
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  ]);
};

// Generic update document
export const updateDocument = async (
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>
): Promise<void> => {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, data);
};

// Generic delete document
export const deleteDocument = async (
  collectionName: string,
  docId: string
): Promise<void> => {
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
};

// Paginated query
export const getPaginatedDocuments = async <T>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  pageSize: number = 20,
  lastDoc?: QueryDocumentSnapshot
): Promise<{ data: (T & { id: string })[]; lastVisible: QueryDocumentSnapshot | null }> => {
  const allConstraints = [...constraints, limit(pageSize)];
  if (lastDoc) {
    allConstraints.push(startAfter(lastDoc));
  }
  const q = query(collection(db, collectionName), ...allConstraints);
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as (T & { id: string })[];
  const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
  return { data, lastVisible };
};

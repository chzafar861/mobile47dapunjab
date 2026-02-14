import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection as firestoreCollection,
  addDoc as firestoreAddDoc,
  getDocs as firestoreGetDocs,
  deleteDoc as firestoreDeleteDoc,
  doc as firestoreDoc,
  setDoc as firestoreSetDoc,
  getDoc as firestoreGetDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "dapunjab-replat.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "dapunjab-replat",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "dapunjab-replat.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "782339856043",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:782339856043:web:5e6d7f04f248ad078989ee",
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export function getCollection(name: string) {
  return firestoreCollection(firestore, name);
}

export function getDocRef(collectionName: string, docId: string) {
  return firestoreDoc(firestore, collectionName, docId);
}

export async function addDocument(collectionName: string, data: any) {
  return firestoreAddDoc(firestoreCollection(firestore, collectionName), data);
}

export async function getDocuments(collectionName: string) {
  const snapshot = await firestoreGetDocs(firestoreCollection(firestore, collectionName));
  return snapshot.docs.map((d) => ({ docId: d.id, ...d.data() }));
}

export async function deleteDocument(collectionName: string, docId: string) {
  return firestoreDeleteDoc(firestoreDoc(firestore, collectionName, docId));
}

export async function setDocument(collectionName: string, docId: string, data: any) {
  return firestoreSetDoc(firestoreDoc(firestore, collectionName, docId), data);
}

export async function getDocument(collectionName: string, docId: string) {
  const docSnap = await firestoreGetDoc(firestoreDoc(firestore, collectionName, docId));
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFunctions, Functions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Firebase Configuration for 47daPunjab (dapunjab-b6ee5)
 *
 * Services initialized:
 * - Authentication (Email/Password + Phone OTP)
 * - Cloud Firestore (primary database)
 * - Firebase Storage (media uploads)
 * - Cloud Functions (translation API + FCM triggers)
 *
 * NOTE: firebase/analytics is NOT used — not supported in React Native (Expo).
 */
const firebaseConfig = {
  apiKey: 'AIzaSyA3ZTjriJpiSfHL0FQhUUkcdMVQnIS8u8g',
  authDomain: 'dapunjab-b6ee5.firebaseapp.com',
  projectId: 'dapunjab-b6ee5',
  storageBucket: 'dapunjab-b6ee5.firebasestorage.app',
  messagingSenderId: '619985279654',
  appId: '1:619985279654:web:99c8f39065bd437c3df267',
};

// Initialize Firebase App (singleton)
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth with React Native persistence
// On native platforms, use AsyncStorage for auth state persistence
// On web, use default persistence
let auth: Auth;
if (Platform.OS !== 'web') {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} else {
  auth = getAuth(app);
}

// Initialize Cloud Firestore
const db: Firestore = getFirestore(app);

// Initialize Firebase Storage
const storage: FirebaseStorage = getStorage(app);

// Initialize Cloud Functions
const functions: Functions = getFunctions(app);

export { app, auth, db, storage, functions };
export default app;

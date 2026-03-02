import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  PhoneAuthProvider,
  signInWithCredential,
  ApplicationVerifier,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { COLLECTIONS } from '../constants/collections';
import { UserProfile, SupportedLanguage } from '../types';

// Email/Password Sign Up
export const signUpWithEmail = async (
  email: string,
  password: string,
  name: string,
  phone: string,
  language: SupportedLanguage
): Promise<UserProfile> => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const userProfile: UserProfile = {
    uid: credential.user.uid,
    name,
    phone,
    email,
    language,
    profilePhoto: '',
    role: 'user',
    createdAt: Date.now(),
  };
  await setDoc(doc(db, COLLECTIONS.USERS, credential.user.uid), userProfile);
  return userProfile;
};

// Email/Password Sign In
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
};

// Phone OTP - Send verification code
export const sendPhoneOTP = async (
  phoneNumber: string,
  appVerifier: ApplicationVerifier
): Promise<string> => {
  const provider = new PhoneAuthProvider(auth);
  const verificationId = await provider.verifyPhoneNumber(phoneNumber, appVerifier);
  return verificationId;
};

// Phone OTP - Verify code
export const verifyPhoneOTP = async (
  verificationId: string,
  otp: string
): Promise<User> => {
  const credential = PhoneAuthProvider.credential(verificationId, otp);
  const result = await signInWithCredential(auth, credential);
  return result.user;
};

// Sign Out
export const logOut = async (): Promise<void> => {
  await signOut(auth);
};

// Get user profile from Firestore
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, COLLECTIONS.USERS, uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

// Update user profile
export const updateUserProfile = async (
  uid: string,
  data: Partial<UserProfile>
): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.USERS, uid);
  await updateDoc(docRef, data);
};

// Create user profile for phone auth users
export const createUserProfile = async (
  uid: string,
  name: string,
  phone: string,
  language: SupportedLanguage
): Promise<UserProfile> => {
  const userProfile: UserProfile = {
    uid,
    name,
    phone,
    email: '',
    language,
    profilePhoto: '',
    role: 'user',
    createdAt: Date.now(),
  };
  await setDoc(doc(db, COLLECTIONS.USERS, uid), userProfile);
  return userProfile;
};

// Auth state listener
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Upload a file to Firebase Storage
 * @param uri - Local file URI
 * @param storagePath - Path in Firebase Storage
 * @param onProgress - Optional progress callback (0-100)
 * @returns Download URL
 */
export const uploadFile = async (
  uri: string,
  storagePath: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(storage, storagePath);
  const uploadTask = uploadBytesResumable(storageRef, blob);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
};

/**
 * Upload multiple files to Firebase Storage
 * @param uris - Array of local file URIs
 * @param basePath - Base path in Firebase Storage
 * @returns Array of download URLs
 */
export const uploadMultipleFiles = async (
  uris: string[],
  basePath: string
): Promise<string[]> => {
  const uploadPromises = uris.map((uri, index) =>
    uploadFile(uri, `${basePath}/${Date.now()}_${index}`)
  );
  return Promise.all(uploadPromises);
};

/**
 * Delete a file from Firebase Storage
 * @param storagePath - Path in Firebase Storage
 */
export const deleteFile = async (storagePath: string): Promise<void> => {
  const storageRef = ref(storage, storagePath);
  await deleteObject(storageRef);
};

/**
 * Get download URL for a file
 * @param storagePath - Path in Firebase Storage
 * @returns Download URL
 */
export const getFileURL = async (storagePath: string): Promise<string> => {
  const storageRef = ref(storage, storagePath);
  return getDownloadURL(storageRef);
};

import * as Notifications from 'expo-notifications';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLLECTIONS } from '../constants/collections';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and save token to Firestore
 */
export const registerForPushNotifications = async (userId: string): Promise<string | null> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    // Get the Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Save token to user document
    await setDoc(
      doc(db, COLLECTIONS.USERS, userId),
      { pushToken: token, platform: Platform.OS },
      { merge: true }
    );

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};

/**
 * Schedule a local notification
 */
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
    },
    trigger: null, // Immediate
  });
};

/**
 * Add notification listener
 */
export const addNotificationListener = (
  callback: (notification: Notifications.Notification) => void
) => {
  return Notifications.addNotificationReceivedListener(callback);
};

/**
 * Add notification response listener (when user taps notification)
 */
export const addNotificationResponseListener = (
  callback: (response: Notifications.NotificationResponse) => void
) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

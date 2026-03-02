import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// ============================================================
// Translation Cloud Function
// ============================================================

interface TranslateRequest {
  text: string;
  targetLang: 'en' | 'ur' | 'hi' | 'pa';
}

/**
 * Callable Cloud Function: translate
 * Translates text to the target language using Google Cloud Translate API.
 * Caches results in Firestore `translations_cache` collection.
 */
export const translate = functions.https.onCall(
  async (data: TranslateRequest, context) => {
    const { text, targetLang } = data;

    if (!text || !targetLang) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields: text, targetLang'
      );
    }

    // If target is English and text is already English, return as-is
    if (targetLang === 'en') {
      return { translatedText: text, cached: false };
    }

    // Check Firestore cache first
    const cacheKey = `${Buffer.from(text).toString('base64').slice(0, 100)}_${targetLang}`;
    const cacheRef = db.collection('translations_cache').doc(cacheKey);
    const cacheDoc = await cacheRef.get();

    if (cacheDoc.exists) {
      const cached = cacheDoc.data();
      return { translatedText: cached?.translatedText || text, cached: true };
    }

    // Call Google Cloud Translate API
    try {
      const { Translate } = await import('@google-cloud/translate');
      const translateClient = new Translate.v2.Translate();

      // Map language codes to Google Translate language codes
      const langMap: Record<string, string> = {
        en: 'en',
        ur: 'ur',
        hi: 'hi',
        pa: 'pa',
      };

      const [translation] = await translateClient.translate(
        text,
        langMap[targetLang] || targetLang
      );

      // Cache the result
      await cacheRef.set({
        originalText: text,
        translatedText: translation,
        targetLang,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { translatedText: translation, cached: false };
    } catch (error) {
      console.error('Translation error:', error);
      // Return original text as fallback
      return { translatedText: text, cached: false, error: 'Translation failed' };
    }
  }
);

// ============================================================
// FCM Notification Functions
// ============================================================

/**
 * Sends a push notification to a specific user by their userId.
 * Looks up the user's FCM push token in Firestore.
 */
async function sendNotificationToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const pushToken = userDoc.data()?.pushToken;

    if (!pushToken) {
      console.log(`No push token for user ${userId}`);
      return;
    }

    await messaging.send({
      token: pushToken,
      notification: { title, body },
      data: data || {},
    });

    // Store notification in Firestore
    await db.collection('notifications').add({
      userId,
      title,
      body,
      data: data || {},
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Notification sent to user ${userId}`);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

/**
 * Trigger: When an order status is updated
 * Sends a push notification to the user about the status change.
 */
export const onOrderStatusUpdate = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.status !== after.status) {
      const statusMessages: Record<string, string> = {
        approved: 'Your order has been approved!',
        in_progress: 'Your order is being processed.',
        completed: 'Your order has been completed!',
        rejected: 'Your order has been rejected.',
      };

      const message = statusMessages[after.status] || `Order status: ${after.status}`;

      await sendNotificationToUser(
        after.userId,
        'Order Update',
        message,
        { orderId: context.params.orderId, type: 'order_update' }
      );
    }
  });

/**
 * Trigger: When a protocol request status is updated
 * Sends a push notification about approval/status change.
 */
export const onProtocolRequestUpdate = functions.firestore
  .document('protocol_requests/{requestId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.status !== after.status) {
      const statusMessages: Record<string, string> = {
        approved: 'Your protocol request has been approved!',
        in_progress: 'Your protocol request is being processed.',
        completed: 'Your protocol service is complete!',
        rejected: 'Your protocol request has been rejected.',
      };

      const message = statusMessages[after.status] || `Request status: ${after.status}`;

      await sendNotificationToUser(
        after.userId,
        'Protocol Request Update',
        message,
        { requestId: context.params.requestId, type: 'protocol_update' }
      );
    }
  });

/**
 * Trigger: When a new HumanFind person record is created
 * Could be used for match alerts in the future.
 */
export const onNewHumanFindPerson = functions.firestore
  .document('humanfind_people/{personId}')
  .onCreate(async (snap, context) => {
    const person = snap.data();
    console.log(`New person added to HumanFind: ${person.name} in ${person.location}`);
    // Future: Implement matching logic and send alerts to interested users
  });

/**
 * Trigger: When a property submission status is updated (verified/rejected)
 */
export const onPropertySubmissionUpdate = functions.firestore
  .document('property_submissions/{submissionId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.verificationStatus !== after.verificationStatus) {
      const statusMessages: Record<string, string> = {
        verified: 'Your property submission has been verified!',
        rejected: 'Your property submission was not approved.',
      };

      const message =
        statusMessages[after.verificationStatus] ||
        `Submission status: ${after.verificationStatus}`;

      await sendNotificationToUser(
        after.userId,
        'Property Submission Update',
        message,
        { submissionId: context.params.submissionId, type: 'property_update' }
      );
    }
  });

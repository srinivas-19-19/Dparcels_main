const admin = require('firebase-admin');
import path from 'path';
import fs from 'fs';

let initialized = false;

export const initFirebase = () => {
  try {
    const serviceAccountPath = path.join(__dirname, '../../firebase-adminsdk.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      initialized = true;
      console.log('✅ Firebase Admin initialized successfully.');
    } else {
      console.warn('⚠️ Firebase Admin SDK not initialized: firebase-adminsdk.json not found.');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error);
  }
};

export const sendPushNotification = async (token: string, title: string, body: string) => {
  if (!initialized) {
    console.log(`[FCM Mock] Would send to ${token}: ${title} - ${body}`);
    return;
  }

  try {
    await admin.messaging().send({
      token,
      notification: { title, body }
    });
    console.log(`[FCM] Sent push notification to ${token}`);
  } catch (error) {
    console.error('[FCM Error] Failed to send push notification:', error);
  }
};

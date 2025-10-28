import admin from 'firebase-admin';
import { FIREBASE } from '../config.js';

let initialized = false;

export function getFirestore() {
  if (!initialized) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE.PROJECT_ID,
        clientEmail: FIREBASE.CLIENT_EMAIL,
        privateKey: FIREBASE.PRIVATE_KEY,
      }),
    });
    initialized = true;
  }
  return admin.firestore();
}

import * as admin from "firebase-admin";

// We check if an app is already initialized to prevent Next.js hot-reload crashes
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // The .replace() is strictly required for Vercel deployments. 
        // It ensures the escaped newline characters in your .env are read correctly.
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
    console.log("Firebase Admin Connection: ONLINE");
  } catch (error: any) {
    console.error("CRITICAL: Firebase Admin initialization failed.", error.stack);
  }
}

// Initialize the services we need
const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminDb, adminAuth };
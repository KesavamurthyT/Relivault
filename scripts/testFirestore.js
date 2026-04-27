require('dotenv').config();
const admin = require('firebase-admin');

// Check if Firebase Admin SDK is already initialized
if (!admin.apps.length) {
  // Explicitly load service account key from environment variable
  const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH;

  if (!serviceAccountPath) {
    console.error('Error: FIREBASE_ADMIN_SDK_PATH environment variable is not set in your .env file.');
    console.error('Please add FIREBASE_ADMIN_SDK_PATH="/path/to/your/serviceAccountKey.json" to your .env file.');
    process.exit(1);
  }

  let serviceAccount;
  try {
    // Use path.resolve to ensure correct absolute path resolution
    const path = require('path');
    serviceAccount = require(path.resolve(serviceAccountPath));
  } catch (error) {
    console.error('Error: Could not load service account file from FIREBASE_ADMIN_SDK_PATH:', serviceAccountPath);
    console.error(error);
    process.exit(1);
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully using service account file.');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    process.exit(1);
  }
}

const db = admin.firestore();

async function testFirestoreWrite() {
  try {
    console.log('Attempting to write a test document to Firestore...');

    const testData = {
      testId: `test-${Date.now()}`,
      message: 'This is a test write from the script.',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      source: 'testFirestore.js',
    };

    const docRef = await db.collection('claims').add(testData);

    console.log(`Successfully wrote test document with ID: ${docRef.id}`);
    console.log('Test data:', testData);
    console.log('\nFirestore is accepting write requests for the "claims" collection.');
    console.log('You can verify this in your Firebase Console -> Firestore Database -> Data tab.');

  } catch (error) {
    console.error('Error writing to Firestore:', error);
    console.error('\nFirestore is NOT accepting write requests for the "claims" collection.');
    console.error('Possible reasons:');
    console.error('1. Incorrect Firebase Admin SDK setup (e.g., FIREBASE_ADMIN_SDK_PATH not set or invalid file).');
    console.error('2. Firestore security rules are preventing this write operation.');
    console.error('   - Ensure your rules allow write access to the "claims" collection for the service account.');
    process.exit(1);
  }
}

testFirestoreWrite();

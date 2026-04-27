// Script to set up sample data for testing the real Firestore integration
// Run this after you have your 4 Firebase Auth users created

const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');

// Your Firebase config (same as in your firebase.js)
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setupSampleData() {
  console.log('🚀 Setting up sample data...');
  console.log('');
  console.log('📋 Instructions:');
  console.log('1. Go to Firebase Console → Authentication → Users');
  console.log('2. Copy the UID for each of your 4 test users');
  console.log('3. Update the UIDs in lib/sampleData.ts');
  console.log('4. Run: node -r dotenv/config scripts/setupSampleData.js');
  console.log('');
  console.log('⚠️  Make sure you have these environment variables in .env.local:');
  console.log('   NEXT_PUBLIC_FIREBASE_API_KEY');
  console.log('   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  console.log('   NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  console.log('   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  console.log('   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  console.log('   NEXT_PUBLIC_FIREBASE_APP_ID');
  console.log('');
  console.log('✅ Ready to create sample data once UIDs are updated!');
}

setupSampleData();
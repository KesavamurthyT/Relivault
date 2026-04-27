// Helper script to create user ID mapping for migration
// This script helps you map old custom IDs to Firebase Auth UIDs

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

const db = admin.firestore();

async function analyzeCurrentData() {
  try {
    console.log('🔍 Analyzing current data structure...\n');
    
    // Get Firebase Auth users
    console.log('📋 Firebase Auth Users:');
    const listUsersResult = await admin.auth().listUsers();
    const authUsers = listUsersResult.users;
    
    authUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. UID: ${user.uid}`);
      console.log(`     Email: ${user.email || 'N/A'}`);
      console.log(`     Created: ${user.metadata.creationTime}`);
      console.log('');
    });
    
    // Get users collection documents
    console.log('👥 Users Collection Documents:');
    const usersSnapshot = await db.collection('users').get();
    
    if (!usersSnapshot.empty) {
      usersSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`  ${index + 1}. Document ID: ${doc.id}`);
        console.log(`     UID field: ${data.uid || 'N/A'}`);
        console.log(`     Email: ${data.email || 'N/A'}`);
        console.log(`     Role: ${data.role || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('  No documents found in users collection');
    }
    
    // Get ipfs_cids collection to see what userIds are being used
    console.log('📄 IPFS CIDs Collection - Current User IDs:');
    const ipfsSnapshot = await db.collection('ipfs_cids').get();
    
    if (!ipfsSnapshot.empty) {
      const userIds = new Set();
      ipfsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId) {
          userIds.add(data.userId);
        }
      });
      
      Array.from(userIds).forEach((userId, index) => {
        console.log(`  ${index + 1}. ${userId}`);
      });
    } else {
      console.log('  No documents found in ipfs_cids collection');
    }
    
    // Generate suggested mapping
    console.log('\n📝 Suggested Mapping (update as needed):');
    console.log('const userIdMapping = {');
    
    if (authUsers.length > 0) {
      const demoIds = ['demo-victim-123', 'demo-donor-456', 'demo-ngo-789', 'demo-admin-000'];
      
      demoIds.forEach((demoId, index) => {
        if (authUsers[index]) {
          console.log(`  '${demoId}': '${authUsers[index].uid}', // ${authUsers[index].email || 'No email'}`);
        } else {
          console.log(`  '${demoId}': 'REPLACE_WITH_ACTUAL_UID', // No matching auth user`);
        }
      });
    }
    
    console.log('};');
    
  } catch (error) {
    console.error('❌ Error analyzing data:', error);
  }
}

async function main() {
  console.log('🚀 Creating User ID Mapping Helper...\n');
  await analyzeCurrentData();
  console.log('\n✅ Analysis complete! Use the suggested mapping in updateFirestoreUIDs.js');
}

main().catch((error) => {
  console.error('💥 Analysis failed:', error);
  process.exit(1);
});
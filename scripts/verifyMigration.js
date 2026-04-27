// Verification script to check migration status
// Run this after migration to ensure everything is properly updated

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

async function verifyMigration() {
  try {
    console.log('🔍 Verifying migration status...\n');
    
    // Get all Firebase Auth UIDs
    const listUsersResult = await admin.auth().listUsers();
    const authUIDs = listUsersResult.users.map(user => user.uid);
    
    console.log(`📋 Found ${authUIDs.length} Firebase Auth users`);
    
    // Check ipfs_cids collection
    const ipfsSnapshot = await db.collection('ipfs_cids').get();
    
    if (ipfsSnapshot.empty) {
      console.log('📭 No documents in ipfs_cids collection');
      return;
    }
    
    let totalDocs = 0;
    let migratedDocs = 0;
    let unmatchedDocs = 0;
    const unmatchedUserIds = new Set();
    
    ipfsSnapshot.forEach((doc) => {
      totalDocs++;
      const data = doc.data();
      const userId = data.userId;
      
      if (authUIDs.includes(userId)) {
        migratedDocs++;
      } else {
        unmatchedDocs++;
        unmatchedUserIds.add(userId);
      }
    });
    
    console.log('\n📊 Migration Status:');
    console.log(`  Total documents: ${totalDocs}`);
    console.log(`  ✅ Using Firebase Auth UIDs: ${migratedDocs}`);
    console.log(`  ❌ Not using Firebase Auth UIDs: ${unmatchedDocs}`);
    
    if (unmatchedDocs > 0) {
      console.log('\n⚠️  Documents with non-Firebase Auth UIDs:');
      Array.from(unmatchedUserIds).forEach(userId => {
        console.log(`  - ${userId}`);
      });
      
      console.log('\n💡 These may need manual migration or could be valid UIDs from users not in current Auth list');
    } else {
      console.log('\n🎉 All documents are using Firebase Auth UIDs!');
    }
    
    // Check users collection consistency
    const usersSnapshot = await db.collection('users').get();
    
    if (!usersSnapshot.empty) {
      console.log('\n👥 Users Collection Check:');
      let consistentUsers = 0;
      let inconsistentUsers = 0;
      
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        if (doc.id === data.uid) {
          consistentUsers++;
        } else {
          inconsistentUsers++;
          console.log(`  ⚠️  Document ID (${doc.id}) ≠ UID field (${data.uid})`);
        }
      });
      
      console.log(`  ✅ Consistent documents: ${consistentUsers}`);
      console.log(`  ❌ Inconsistent documents: ${inconsistentUsers}`);
    }
    
    // Overall status
    console.log('\n🎯 Overall Migration Status:');
    if (unmatchedDocs === 0) {
      console.log('  ✅ MIGRATION COMPLETE - All documents use Firebase Auth UIDs');
    } else {
      console.log('  ⚠️  MIGRATION INCOMPLETE - Some documents still need updating');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

async function main() {
  console.log('🚀 Firebase Auth UID Migration Verification\n');
  await verifyMigration();
  console.log('\n✅ Verification completed!');
  process.exit(0);
}

main().catch((error) => {
  console.error('💥 Verification failed:', error);
  process.exit(1);
});
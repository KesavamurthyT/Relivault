// Script to update existing ipfs_cids documents to use Firebase Auth UIDs
// Run this script to migrate your existing data

const admin = require('firebase-admin');

// Initialize Firebase Admin (make sure you have your service account key)
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

// Mapping of old custom IDs to Firebase Auth UIDs
// You'll need to update this mapping based on your actual data
const userIdMapping = {
  'demo-victim-123': 'actual-firebase-uid-1',
  'demo-donor-456': 'actual-firebase-uid-2',
  'demo-ngo-789': 'actual-firebase-uid-3',
  'demo-admin-000': 'actual-firebase-uid-4',
  // Add more mappings as needed
};

async function updateIPFSCIDsCollection() {
  try {
    console.log('🔄 Starting migration of ipfs_cids collection...');
    
    // Get all documents from ipfs_cids collection
    const snapshot = await db.collection('ipfs_cids').get();
    
    if (snapshot.empty) {
      console.log('📭 No documents found in ipfs_cids collection');
      return;
    }
    
    const batch = db.batch();
    let updateCount = 0;
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const oldUserId = data.userId;
      
      // Check if this userId needs to be updated
      if (userIdMapping[oldUserId]) {
        const newUserId = userIdMapping[oldUserId];
        
        console.log(`📝 Updating document ${doc.id}: ${oldUserId} → ${newUserId}`);
        
        // Update the document with new userId
        batch.update(doc.ref, {
          userId: newUserId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          migrationNote: `Updated from ${oldUserId} on ${new Date().toISOString()}`
        });
        
        updateCount++;
      } else {
        console.log(`⏭️  Skipping document ${doc.id}: userId '${oldUserId}' not in mapping`);
      }
    });
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`✅ Successfully updated ${updateCount} documents in ipfs_cids collection`);
    } else {
      console.log('ℹ️  No documents needed updating');
    }
    
  } catch (error) {
    console.error('❌ Error updating ipfs_cids collection:', error);
  }
}

async function updateUsersCollection() {
  try {
    console.log('🔄 Checking users collection for consistency...');
    
    // Get all documents from users collection
    const snapshot = await db.collection('users').get();
    
    if (snapshot.empty) {
      console.log('📭 No documents found in users collection');
      return;
    }
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`👤 User document ID: ${doc.id}, UID: ${data.uid || 'N/A'}`);
      
      // Check if document ID matches the uid field
      if (doc.id !== data.uid) {
        console.log(`⚠️  Warning: Document ID (${doc.id}) doesn't match uid field (${data.uid})`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking users collection:', error);
  }
}

async function getFirebaseAuthUIDs() {
  try {
    console.log('🔍 Fetching Firebase Auth UIDs...');
    
    const listUsersResult = await admin.auth().listUsers();
    const authUsers = listUsersResult.users;
    
    console.log('📋 Firebase Auth Users:');
    authUsers.forEach((user) => {
      console.log(`  - UID: ${user.uid}, Email: ${user.email || 'N/A'}`);
    });
    
    return authUsers;
  } catch (error) {
    console.error('❌ Error fetching Firebase Auth users:', error);
    return [];
  }
}

async function main() {
  console.log('🚀 Starting Firestore UID migration...');
  
  // First, get all Firebase Auth UIDs to help with mapping
  await getFirebaseAuthUIDs();
  
  console.log('\n📝 Please update the userIdMapping object in this script with the correct mappings:');
  console.log('const userIdMapping = {');
  console.log('  "demo-victim-123": "actual-firebase-uid-from-above",');
  console.log('  "demo-donor-456": "actual-firebase-uid-from-above",');
  console.log('  // Add more mappings...');
  console.log('};');
  
  // Check current state
  await updateUsersCollection();
  await updateIPFSCIDsCollection();
  
  console.log('🎉 Migration completed!');
  process.exit(0);
}

// Run the migration
main().catch((error) => {
  console.error('💥 Migration failed:', error);
  process.exit(1);
});
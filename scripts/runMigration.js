#!/usr/bin/env node

// Complete migration script for updating Firestore to use Firebase Auth UIDs
// This script will guide you through the entire migration process

const admin = require('firebase-admin');
const readline = require('readline');

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
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function step1_analyzeCurrentState() {
  console.log('🔍 STEP 1: Analyzing current state...\n');
  
  // Get Firebase Auth users
  const listUsersResult = await admin.auth().listUsers();
  const authUsers = listUsersResult.users;
  
  console.log('📋 Firebase Auth Users:');
  authUsers.forEach((user, index) => {
    console.log(`  ${index + 1}. UID: ${user.uid}`);
    console.log(`     Email: ${user.email || 'N/A'}`);
    console.log('');
  });
  
  // Check ipfs_cids collection
  const ipfsSnapshot = await db.collection('ipfs_cids').get();
  const userIds = new Set();
  
  if (!ipfsSnapshot.empty) {
    ipfsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.userId) {
        userIds.add(data.userId);
      }
    });
  }
  
  console.log('📄 Current User IDs in ipfs_cids collection:');
  Array.from(userIds).forEach((userId, index) => {
    console.log(`  ${index + 1}. ${userId}`);
  });
  
  return { authUsers, currentUserIds: Array.from(userIds) };
}

async function step2_createMapping(authUsers, currentUserIds) {
  console.log('\n📝 STEP 2: Creating user ID mapping...\n');
  
  const mapping = {};
  
  for (let i = 0; i < currentUserIds.length; i++) {
    const oldId = currentUserIds[i];
    
    if (oldId.startsWith('demo-') || !oldId.includes('-')) {
      console.log(`\nMapping for: ${oldId}`);
      console.log('Available Firebase Auth UIDs:');
      
      authUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.uid} (${user.email || 'No email'})`);
      });
      
      const answer = await askQuestion(`Enter the number (1-${authUsers.length}) for ${oldId}, or 'skip' to skip: `);
      
      if (answer.toLowerCase() !== 'skip') {
        const selectedIndex = parseInt(answer) - 1;
        if (selectedIndex >= 0 && selectedIndex < authUsers.length) {
          mapping[oldId] = authUsers[selectedIndex].uid;
          console.log(`✅ Mapped ${oldId} → ${authUsers[selectedIndex].uid}`);
        }
      }
    }
  }
  
  return mapping;
}

async function step3_performMigration(mapping) {
  console.log('\n🔄 STEP 3: Performing migration...\n');
  
  console.log('Mapping to be applied:');
  Object.entries(mapping).forEach(([oldId, newId]) => {
    console.log(`  ${oldId} → ${newId}`);
  });
  
  const confirm = await askQuestion('\nProceed with migration? (yes/no): ');
  
  if (confirm.toLowerCase() !== 'yes') {
    console.log('❌ Migration cancelled');
    return;
  }
  
  // Perform the migration
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
    
    if (mapping[oldUserId]) {
      const newUserId = mapping[oldUserId];
      
      console.log(`📝 Updating document ${doc.id}: ${oldUserId} → ${newUserId}`);
      
      batch.update(doc.ref, {
        userId: newUserId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        migrationNote: `Updated from ${oldUserId} on ${new Date().toISOString()}`
      });
      
      updateCount++;
    }
  });
  
  if (updateCount > 0) {
    await batch.commit();
    console.log(`✅ Successfully updated ${updateCount} documents`);
  } else {
    console.log('ℹ️  No documents needed updating');
  }
}

async function step4_verification() {
  console.log('\n✅ STEP 4: Verification...\n');
  
  const snapshot = await db.collection('ipfs_cids').get();
  const userIds = new Set();
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.userId) {
      userIds.add(data.userId);
    }
  });
  
  console.log('📄 Updated User IDs in ipfs_cids collection:');
  Array.from(userIds).forEach((userId, index) => {
    console.log(`  ${index + 1}. ${userId}`);
  });
  
  // Check if all are Firebase Auth UIDs
  const authUsers = await admin.auth().listUsers();
  const authUIDs = authUsers.users.map(u => u.uid);
  
  const nonAuthUIDs = Array.from(userIds).filter(id => !authUIDs.includes(id));
  
  if (nonAuthUIDs.length === 0) {
    console.log('🎉 All user IDs are now Firebase Auth UIDs!');
  } else {
    console.log('⚠️  Some user IDs are still not Firebase Auth UIDs:');
    nonAuthUIDs.forEach(id => console.log(`  - ${id}`));
  }
}

async function main() {
  try {
    console.log('🚀 Firebase Auth UID Migration Tool\n');
    console.log('This tool will help you migrate your ipfs_cids collection to use Firebase Auth UIDs.\n');
    
    const { authUsers, currentUserIds } = await step1_analyzeCurrentState();
    
    if (authUsers.length === 0) {
      console.log('❌ No Firebase Auth users found. Please create users first.');
      return;
    }
    
    if (currentUserIds.length === 0) {
      console.log('ℹ️  No documents found in ipfs_cids collection. Nothing to migrate.');
      return;
    }
    
    const mapping = await step2_createMapping(authUsers, currentUserIds);
    
    if (Object.keys(mapping).length === 0) {
      console.log('ℹ️  No mappings created. Migration cancelled.');
      return;
    }
    
    await step3_performMigration(mapping);
    await step4_verification();
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

main();
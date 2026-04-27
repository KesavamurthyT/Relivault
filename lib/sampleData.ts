// Helper functions to create sample data for testing
import { db } from "../firebase.js"
import { collection, addDoc, setDoc, doc } from "firebase/firestore"

export async function createSampleUser(uid: string, userData: any) {
  try {
    const userDoc = doc(db, "users", uid)
    await setDoc(userDoc, {
      uid,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    console.log(`Sample user created: ${userData.name}`)
  } catch (error) {
    console.error("Error creating sample user:", error)
  }
}

export async function createSampleClaim(claimData: any) {
  try {
    const claimsRef = collection(db, "claims")
    const docRef = await addDoc(claimsRef, {
      ...claimData,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    console.log(`Sample claim created: ${docRef.id}`)
    return docRef.id
  } catch (error) {
    console.error("Error creating sample claim:", error)
  }
}

export async function createSampleDonation(donationData: any) {
  try {
    const donationsRef = collection(db, "donations")
    const docRef = await addDoc(donationsRef, {
      ...donationData,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    console.log(`Sample donation created: ${docRef.id}`)
    return docRef.id
  } catch (error) {
    console.error("Error creating sample donation:", error)
  }
}

// Function to initialize sample data for testing
export async function initializeSampleData() {
  console.log("🚀 Initializing sample data...")
  
  // Sample users (you'll need to replace these UIDs with your actual Firebase Auth UIDs)
  const sampleUsers = [
    {
      uid: "REPLACE_WITH_VICTIM_UID",
      name: "Rajesh Kumar",
      email: "rajesh@example.com",
      phone: "+91 9876543210",
      aadhaar: "1234-5678-9012",
      role: "victim",
      verified: true
    },
    {
      uid: "REPLACE_WITH_DONOR_UID", 
      name: "Priya Sharma",
      email: "priya@example.com",
      phone: "+91 9876543211",
      role: "donor",
      verified: true
    },
    {
      uid: "REPLACE_WITH_NGO_UID",
      name: "Relief NGO",
      email: "ngo@example.com",
      phone: "+91 9876543212",
      role: "ngo",
      verified: true
    },
    {
      uid: "REPLACE_WITH_ADMIN_UID",
      name: "System Admin",
      email: "admin@example.com",
      phone: "+91 9876543213",
      role: "admin",
      verified: true
    }
  ]
  
  // Create sample users
  for (const user of sampleUsers) {
    if (user.uid !== "REPLACE_WITH_VICTIM_UID") { // Skip if UID not replaced
      await createSampleUser(user.uid, user)
    }
  }
  
  // Sample claims
  const sampleClaims = [
    {
      userId: "REPLACE_WITH_VICTIM_UID",
      disasterType: "Flood",
      location: "Kerala, India",
      description: "House damaged due to severe flooding",
      requestedAmount: 25000,
      status: "approved",
      amount: 25000,
      documents: ["aadhaar.pdf", "damage_photo.jpg"],
      transactionHash: "0x1234567890abcdef"
    },
    {
      userId: "REPLACE_WITH_VICTIM_UID",
      disasterType: "Earthquake", 
      location: "Gujarat, India",
      description: "Building collapse, need shelter",
      requestedAmount: 50000,
      status: "pending",
      documents: ["aadhaar.pdf"]
    }
  ]
  
  // Sample donations
  const sampleDonations = [
    {
      donorId: "REPLACE_WITH_DONOR_UID",
      amount: 50000,
      disasterType: "Kerala Floods 2024",
      location: "Kerala, India",
      transactionHash: "0xabcdef1234567890",
      nftTokenId: "123"
    },
    {
      donorId: "REPLACE_WITH_DONOR_UID",
      amount: 75000,
      disasterType: "Gujarat Earthquake 2024", 
      location: "Gujarat, India",
      transactionHash: "0x1234567890abcdef",
      nftTokenId: "124"
    }
  ]
  
  // Create sample claims and donations only if UIDs are replaced
  if (sampleClaims[0].userId !== "REPLACE_WITH_VICTIM_UID") {
    for (const claim of sampleClaims) {
      await createSampleClaim(claim)
    }
  }
  
  if (sampleDonations[0].donorId !== "REPLACE_WITH_DONOR_UID") {
    for (const donation of sampleDonations) {
      await createSampleDonation(donation)
    }
  }
  
  console.log("✅ Sample data initialization completed!")
}
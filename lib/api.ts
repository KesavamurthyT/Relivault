// API functions for the disaster relief system
import { db } from "../firebase.js"
import { collection, addDoc, updateDoc, doc, getDocs, query, where, getDoc, orderBy, limit, setDoc } from "firebase/firestore"
import { ClaimSubmissionData, CIDData, ClaimResult } from "./types"


export async function getUserRole(uid: string): Promise<string> {
  try {
    const userDoc = doc(db, "users", uid)
    const snapshot = await getDoc(userDoc)
    
    if (snapshot.exists()) {
      const userData = snapshot.data()
      return userData.role || "victim" // Default to victim if no role set
    } else {
      return "victim" // Default role for new users
    }
  } catch (error) {
    console.error("Error fetching user role:", error)
    return "victim" // Default fallback
  }
}

export async function createUser(userData: any): Promise<void> {
  try {
    console.log("Creating user:", userData)
    
    const userDoc = doc(db, "users", userData.uid)
    await setDoc(userDoc, {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    console.log("User created successfully")
  } catch (error) {
    console.error("Error creating user:", error)
    throw new Error("Failed to create user")
  }
}

export async function getUserClaims(uid: string): Promise<any[]> {
  try {
    const claimsRef = collection(db, "claims")
    const q = query(claimsRef, where("userId", "==", uid))
    const snapshot = await getDocs(q)
    
    const claims = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    // Sort by createdAt on client side to avoid index requirement
    return claims.sort((a, b) => {
      const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date()
      const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date()
      return bDate.getTime() - aDate.getTime()
    })
  } catch (error) {
    console.error("Error fetching user claims:", error)
    return []
  }
}

export async function getUserProfile(uid: string): Promise<any> {
  try {
    const userDoc = doc(db, "users", uid)
    const snapshot = await getDoc(userDoc)
    
    if (snapshot.exists()) {
      return snapshot.data()
    } else {
      // Return null if user profile doesn't exist
      return null
    }
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

export async function submitClaim(claimData: ClaimSubmissionData): Promise<ClaimResult> {
  try {
    console.log("Submitting claim:", claimData)
    
    const claimsRef = collection(db, "claims")
    const docRef = await addDoc(claimsRef, {
      ...claimData,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    console.log("Claim submitted successfully with ID:", docRef.id)
    return { claimId: docRef.id }
  } catch (error) {
    console.error("Error submitting claim:", error)
    throw new Error("Failed to submit claim")
  }
}

export async function uploadToIPFS(file: File): Promise<string> {
  // Use real IPFS upload via Pinata
  try {
    const { uploadFileToPinata } = await import('./ipfs')
    const cid = await uploadFileToPinata(file)
    console.log("File uploaded to IPFS:", file.name, "CID:", cid)
    return cid
  } catch (error) {
    console.error("Error uploading file to IPFS:", error)
    throw new Error(`Failed to upload file to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function saveAadharToIPFS(aadharNumber: string, userId: string, disasterType?: string, location?: string): Promise<string> {
  // Use real IPFS upload via Pinata
  try {
    const { saveAadharToIPFS: saveAadharToIPFSReal } = await import('./ipfs')
    const cid = await saveAadharToIPFSReal(aadharNumber, userId, disasterType, location)
    console.log("Aadhar number saved to IPFS with CID:", cid)
    return cid
  } catch (error) {
    console.error("Error saving Aadhar to IPFS:", error)
    if (error instanceof Error) {
      throw new Error(`Failed to save Aadhar to IPFS: ${error.message}`)
    } else {
      throw new Error(`Failed to save Aadhar to IPFS: ${String(error)}`)
    }
  }
}

export async function saveCIDToFirestore(cidData: CIDData): Promise<void> {
  try {
    // Save CID to Firestore in a separate collection
    const cidCollection = collection(db, "ipfs_cids")
    await addDoc(cidCollection, {
      ...cidData,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    console.log("CID saved to Firestore successfully:", cidData)
  } catch (error) {
    console.error("Error saving CID to Firestore:", error)
    throw new Error("Failed to save CID to Firestore")
  }
}

export async function getDonorStats(uid: string): Promise<any> {
  try {
    const donationsRef = collection(db, "donations")
    const q = query(donationsRef, where("donorId", "==", uid))
    const snapshot = await getDocs(q)
    
    let totalDonated = 0
    let totalDonations = snapshot.size
    
    snapshot.docs.forEach(doc => {
      const data = doc.data()
      totalDonated += data.amount || 0
    })
    
    return {
      totalDonated,
      totalDonations,
      nftCount: totalDonations, // Assuming 1 NFT per donation
      impactScore: Math.min(95, Math.floor(totalDonated / 1000)), // Simple impact calculation
    }
  } catch (error) {
    console.error("Error fetching donor stats:", error)
    return {
      totalDonated: 0,
      totalDonations: 0,
      nftCount: 0,
      impactScore: 0,
    }
  }
}

export async function getDonorTransactions(uid: string): Promise<any[]> {
  try {
    const donationsRef = collection(db, "donations")
    const q = query(donationsRef, where("donorId", "==", uid))
    const snapshot = await getDocs(q)
    
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
    }))
    
    // Sort by createdAt on client side
    return transactions.sort((a, b) => {
      const aDate = new Date(a.timestamp)
      const bDate = new Date(b.timestamp)
      return bDate.getTime() - aDate.getTime()
    })
  } catch (error) {
    console.error("Error fetching donor transactions:", error)
    return []
  }
}

export async function getPublicStats(): Promise<any> {
  try {
    // Get total donations
    const donationsRef = collection(db, "donations")
    const donationsSnapshot = await getDocs(donationsRef)
    
    let totalDonations = 0
    const uniqueDonors = new Set()
    
    donationsSnapshot.docs.forEach(doc => {
      const data = doc.data()
      totalDonations += data.amount || 0
      if (data.donorId) uniqueDonors.add(data.donorId)
    })
    
    // Get claims stats
    const claimsRef = collection(db, "claims")
    const claimsSnapshot = await getDocs(claimsRef)
    
    let totalDisbursed = 0
    let activeClaims = 0
    const uniqueVictims = new Set()
    
    claimsSnapshot.docs.forEach(doc => {
      const data = doc.data()
      if (data.userId) uniqueVictims.add(data.userId)
      
      if (data.status === "approved" && data.amount) {
        totalDisbursed += data.amount
      }
      
      if (data.status === "pending" || data.status === "under_review") {
        activeClaims++
      }
    })
    
    return {
      totalDonations,
      totalDisbursed,
      totalVictims: uniqueVictims.size,
      activeClaims,
      totalDonors: uniqueDonors.size,
    }
  } catch (error) {
    console.error("Error fetching public stats:", error)
    return {
      totalDonations: 0,
      totalDisbursed: 0,
      totalVictims: 0,
      activeClaims: 0,
      totalDonors: 0,
    }
  }
}

export async function getRecentTransactions(): Promise<any[]> {
  try {
    const transactions: any[] = []
    
    // Get recent donations (without orderBy to avoid index requirement)
    const donationsRef = collection(db, "donations")
    const donationsSnapshot = await getDocs(donationsRef)
    
    donationsSnapshot.docs.forEach(doc => {
      const data = doc.data()
      transactions.push({
        id: doc.id,
        type: "donation",
        amount: data.amount,
        disasterType: data.disasterType,
        location: data.location,
        timestamp: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        transactionHash: data.transactionHash,
      })
    })
    
    // Get recent disbursements (approved claims)
    const claimsRef = collection(db, "claims")
    const claimsQuery = query(claimsRef, where("status", "==", "approved"))
    const claimsSnapshot = await getDocs(claimsQuery)
    
    claimsSnapshot.docs.forEach(doc => {
      const data = doc.data()
      if (data.amount) {
        transactions.push({
          id: doc.id,
          type: "disbursement",
          amount: data.amount,
          disasterType: data.disasterType,
          location: data.location,
          timestamp: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          transactionHash: data.transactionHash,
        })
      }
    })
    
    // Sort by timestamp and return latest 10
    return transactions
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
      
  } catch (error) {
    console.error("Error fetching recent transactions:", error)
    return []
  }
}

export async function getDisasterStats(): Promise<any[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { name: "Floods", value: 850000 },
        { name: "Earthquakes", value: 650000 },
        { name: "Cyclones", value: 450000 },
        { name: "Fires", value: 350000 },
        { name: "Droughts", value: 200000 },
      ])
    }, 500)
  })
}

export async function getPendingClaims(): Promise<any[]> {
  try {
    const claimsRef = collection(db, "claims")
    const q = query(claimsRef, where("status", "in", ["pending", "under_review"]))
    const snapshot = await getDocs(q)
    
    const claims = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    // Sort by createdAt on client side
    return claims.sort((a, b) => {
      const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date()
      const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date()
      return bDate.getTime() - aDate.getTime()
    })
  } catch (error) {
    console.error("Error fetching pending claims:", error)
    return []
  }
}

export async function getNGOStats(uid: string): Promise<any> {
  try {
    const claimsRef = collection(db, "claims")
    const reviewedQuery = query(claimsRef, where("reviewerId", "==", uid))
    const reviewedSnapshot = await getDocs(reviewedQuery)
    
    let approved = 0
    let rejected = 0
    let totalReviewed = reviewedSnapshot.size
    
    reviewedSnapshot.docs.forEach(doc => {
      const data = doc.data()
      if (data.status === "approved") approved++
      if (data.status === "rejected") rejected++
    })
    
    // Get pending claims (not specific to this NGO)
    const pendingQuery = query(claimsRef, where("status", "in", ["pending", "under_review"]))
    const pendingSnapshot = await getDocs(pendingQuery)
    
    return {
      totalReviewed,
      approved,
      rejected,
      pending: pendingSnapshot.size,
    }
  } catch (error) {
    console.error("Error fetching NGO stats:", error)
    return {
      totalReviewed: 0,
      approved: 0,
      rejected: 0,
      pending: 0,
    }
  }
}

export async function reviewClaim(claimId: string, decision: string, notes: string, reviewerId: string): Promise<void> {
  try {
    console.log("Reviewing claim:", { claimId, decision, notes, reviewerId })
    
    const claimDoc = doc(db, "claims", claimId)
    await updateDoc(claimDoc, {
      status: decision,
      reviewNotes: notes,
      reviewerId: reviewerId,
      reviewedAt: new Date(),
      updatedAt: new Date()
    })
    
    console.log("Claim reviewed successfully")
  } catch (error) {
    console.error("Error reviewing claim:", error)
    throw new Error("Failed to review claim")
  }
}

export async function getAdminStats(): Promise<any> {
  try {
    // Get user count
    const usersRef = collection(db, "users")
    const usersSnapshot = await getDocs(usersRef)
    const totalUsers = usersSnapshot.size
    
    // Get claims count
    const claimsRef = collection(db, "claims")
    const claimsSnapshot = await getDocs(claimsRef)
    const totalClaims = claimsSnapshot.size
    
    // Get total donations amount
    const donationsRef = collection(db, "donations")
    const donationsSnapshot = await getDocs(donationsRef)
    
    let totalDonations = 0
    donationsSnapshot.docs.forEach(doc => {
      const data = doc.data()
      totalDonations += data.amount || 0
    })
    
    return {
      totalUsers,
      totalClaims,
      totalDonations,
      systemHealth: 99, // This would be calculated based on actual system metrics
    }
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return {
      totalUsers: 0,
      totalClaims: 0,
      totalDonations: 0,
      systemHealth: 0,
    }
  }
}

export async function getAllUsers(): Promise<any[]> {
  try {
    const usersRef = collection(db, "users")
    const snapshot = await getDocs(usersRef)
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
    }))
  } catch (error) {
    console.error("Error fetching all users:", error)
    return []
  }
}

export async function updateUserRole(userId: string, newRole: string): Promise<void> {
  try {
    console.log("Updating user role:", { userId, newRole })
    
    const userDoc = doc(db, "users", userId)
    await updateDoc(userDoc, {
      role: newRole,
      updatedAt: new Date()
    })
    
    console.log("User role updated successfully")
  } catch (error) {
    console.error("Error updating user role:", error)
    throw new Error("Failed to update user role")
  }
}

export async function getSystemHealth(): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        uptime: 99.9,
        apiResponseTime: 120,
        databasePerformance: 95,
        ipfsAvailability: 99,
      })
    }, 500)
  })
}

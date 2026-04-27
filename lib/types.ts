export interface ClaimFormData {
  disasterType: string
  description: string
  requestedAmount: string
  location: string
  aadharNumber: string
  documents: File[]
}

export interface ClaimSubmissionData {
  userId: string
  disasterType: string
  description: string
  requestedAmount: number
  location: string
  coordinates: { lat: number; lng: number } | null
  documentHashes: string[]
  aadharCID: string | null
  status: string
}

export interface CIDData {
  type: string
  userId: string
  cid: string
  timestamp: string
  claimId: string | null
  createdAt?: Date
  updatedAt?: Date
}

export interface ClaimResult {
  claimId: string
}

// IPFS related types
export interface AadharIPFSData {
  aadharNumber: string
  userId: string
  timestamp: string
  claimType: string
  disasterType?: string
  location?: string
}

export interface IPFSMetadata {
  name: string
  description: string
  image?: string
  attributes?: Array<{
    trait_type: string
    value: string
  }>
}

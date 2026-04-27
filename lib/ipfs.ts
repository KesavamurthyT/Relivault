// lib/ipfs.ts - Securely interacts with the backend API for IPFS operations.

import { AadharIPFSData, IPFSMetadata } from "./types";

/**
 * Securely saves Aadhar data to IPFS by sending it to our own backend API.
 * The backend then communicates with Pinata.
 * @param aadharNumber The user's Aadhar number.
 * @param userId The user's ID.
 * @param disasterType The type of disaster for context.
 * @param location The location for context.
 * @returns The IPFS CID (Content Identifier) of the saved data.
 */
export async function saveAadharToIPFS(aadharNumber: string, userId: string, disasterType?: string, location?: string): Promise<string> {
  try {
    // This fetch call goes to our OWN backend API route (/api/ipfs)
    const response = await fetch('/api/ipfs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'aadhar',
        data: { aadharNumber, userId, disasterType, location },
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to save Aadhar data to IPFS via the backend.');
    }

    console.log(`Aadhar number securely saved to IPFS with CID: ${result.cid}`);
    return result.cid;

  } catch (error) {
    console.error('Error saving Aadhar to IPFS:', error);
    // Re-throw the error to be caught by the calling component (e.g., claim-form)
    if (error instanceof Error) {
      throw new Error(`Failed to save Aadhar to IPFS: ${error.message}`);
    } else {
      throw new Error(`Failed to save Aadhar to IPFS: ${String(error)}`);
    }
  }
}

/**
 * Securely uploads a file to IPFS by sending it to our own backend API.
 * The backend then communicates with Pinata.
 * @param file The file to upload.
 * @returns The IPFS CID (Content Identifier) of the uploaded file.
 */
export async function uploadFileToPinata(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    // Optional: Add metadata if needed. The backend will parse this.
    const metadata = {
      name: file.name,
      description: `File uploaded for disaster relief claim: ${file.name}`,
      attributes: [
        {
          trait_type: "File Type",
          value: file.type
        },
        {
          trait_type: "File Size",
          value: `${(file.size / 1024).toFixed(2)} KB`
        }
      ]
    };
    formData.append('metadata', JSON.stringify(metadata));

    // This fetch call goes to our OWN backend API route (/api/ipfs)
    const response = await fetch('/api/ipfs', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to upload file to IPFS via the backend.');
    }

    console.log(`File securely uploaded to IPFS with CID: ${result.cid}`);
    return result.cid;

  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to upload file to IPFS: ${error.message}`);
    } else {
      throw new Error(`Failed to upload file to IPFS: ${String(error)}`);
    }
  }
}
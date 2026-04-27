import { NextRequest, NextResponse } from 'next/server'

interface IPFSMetadata {
  name: string
  description: string
  image?: string
  attributes?: Array<{
    trait_type: string
    value: string
  }>
}

interface AadharData {
  aadharNumber: string
  userId: string
  timestamp: string
  claimType: string
  disasterType?: string
  location?: string
}

async function uploadToPinata(data: any, metadata?: IPFSMetadata): Promise<string> {
  try {
    // Debug: Check if environment variables are available
    const apiKey = process.env.PINATA_API_KEY
    const secretKey = process.env.PINATA_SECRET_API_KEY
    
    console.log('Debug - API Key available:', !!apiKey)
    console.log('Debug - Secret Key available:', !!secretKey)
    
    if (!apiKey || !secretKey) {
      throw new Error('Pinata API keys are not configured. Please check your environment variables.')
    }

    // Prepare the data for IPFS
    const ipfsData = {
      pinataMetadata: metadata || {
        name: "Disaster Relief Data",
        description: "Data uploaded for disaster relief claim"
      },
      pinataContent: data
    }

    console.log('Debug - Uploading data to Pinata:', ipfsData)

    // Upload to Pinata
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': secretKey
      },
      body: JSON.stringify(ipfsData)
    })

    console.log('Debug - Pinata response status:', response.status)

    if (!response.ok) {
      let errorDetails: string | object = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.log('Debug - Error response data:', errorData);
        errorDetails = errorData.error || errorData;
      } catch (parseError) {
        console.log('Debug - Could not parse error response as JSON.');
        try {
          errorDetails = await response.text();
          console.log('Debug - Error response as text:', errorDetails);
        } catch (textError) {
          console.log('Debug - Could not read error response as text.');
        }
      }
      // Stringify if it's an object, otherwise use as is.
      const errorMessage = typeof errorDetails === 'object' ? JSON.stringify(errorDetails) : errorDetails;
      throw new Error(`Pinata upload failed: ${errorMessage}`);
    }

    const result = await response.json()
    console.log('Successfully uploaded to IPFS:', result)
    
    return result.IpfsHash // This is the CID
  } catch (error) {
    console.error('Error uploading to IPFS:', error)
    if (error instanceof Error) {
      throw new Error(`Failed to upload to IPFS: ${error.message}`)
    } else {
      throw new Error(`Failed to upload to IPFS: ${String(error)}`)
    }
  }
}

async function uploadFileToPinata(file: File, metadata?: IPFSMetadata): Promise<string> {
  try {
    const apiKey = process.env.PINATA_API_KEY;
    const secretKey = process.env.PINATA_SECRET_API_KEY;

    if (!apiKey || !secretKey) {
      throw new Error('Pinata API keys are not configured. Please check your environment variables.');
    }

    const formData = new FormData();
    formData.append('file', file);

    if (metadata) {
      formData.append('pinataMetadata', JSON.stringify(metadata));
    }

    console.log('Debug - Uploading file to Pinata:', file.name);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': secretKey,
      },
      body: formData,
    });

    console.log('Debug - Pinata file upload response status:', response.status);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.log('Debug - File upload error response data:', errorData);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (parseError) {
        console.log('Debug - Could not parse file upload error response.');
      }
      throw new Error(`Pinata file upload failed: ${errorMessage}`);
    }

    const result = await response.json();
    console.log('Successfully uploaded file to IPFS:', result);

    return result.IpfsHash;
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to upload file to IPFS: ${error.message}`);
    } else {
      throw new Error(`Failed to upload file to IPFS: ${String(error)}`);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');

    if (contentType?.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const metadataString = formData.get('metadata') as string;
      let metadata: IPFSMetadata | undefined;

      if (metadataString) {
        try {
          metadata = JSON.parse(metadataString);
        } catch (e) {
          console.error('Failed to parse metadata:', e);
          return NextResponse.json({ success: false, message: 'Invalid metadata format' }, { status: 400 });
        }
      }

      if (!file) {
        return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
      }

      const cid = await uploadFileToPinata(file, metadata);

      return NextResponse.json({
        success: true,
        cid,
        message: 'File uploaded to IPFS successfully'
      });

    } else if (contentType?.includes('application/json')) {
      // Handle JSON data (Aadhar)
      const body = await request.json();
      const { type, data, metadata } = body;

      if (type === 'aadhar') {
        const aadharData: AadharData = {
          aadharNumber: data.aadharNumber,
          userId: data.userId,
          timestamp: new Date().toISOString(),
          claimType: "disaster_relief",
          disasterType: data.disasterType,
          location: data.location
        };

        const ipfsMetadata: IPFSMetadata = {
          name: "Aadhar Verification Data",
          description: "Aadhar number verification data for disaster relief claim",
          attributes: [
            {
              trait_type: "Data Type",
              value: "Aadhar Verification"
            },
            {
              trait_type: "Claim Type",
              value: "Disaster Relief"
            },
            {
              trait_type: "Timestamp",
              value: new Date().toISOString()
            }
          ]
        };

        const cid = await uploadToPinata(aadharData, ipfsMetadata);

        return NextResponse.json({
          success: true,
          cid,
          message: 'Aadhar data uploaded to IPFS successfully'
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Invalid upload type'
        }, { status: 400 });
      }
    } else {
      return NextResponse.json({
        success: false,
        message: 'Unsupported Content-Type'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

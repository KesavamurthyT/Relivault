// Mock blockchain functions - In production, these would use ethers.js
export async function connectWallet(): Promise<string> {
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })
      return accounts[0]
    } catch (error) {
      throw new Error("Failed to connect wallet")
    }
  } else {
    throw new Error("MetaMask not installed")
  }
}

export async function donateToDisaster(disasterType: string, amount: number, message: string): Promise<string> {
  // Mock donation transaction
  console.log("Donating:", { disasterType, amount, message })
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("0x" + Math.random().toString(16).substring(2, 66))
    }, 3000)
  })
}

export async function getActiveDisasters(): Promise<any[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: "flood-kerala-2024", name: "Kerala Floods 2024", active: true },
        { id: "earthquake-turkey-2024", name: "Turkey Earthquake 2024", active: true },
        { id: "cyclone-odisha-2024", name: "Odisha Cyclone 2024", active: true },
      ])
    }, 500)
  })
}

export async function getUserNFTs(userAddress: string): Promise<any[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          tokenId: "123",
          disasterType: "Kerala Floods 2024",
          amount: 50000,
          timestamp: new Date().toISOString(),
          transactionHash: "0xabcdef1234567890",
        },
        {
          tokenId: "124",
          disasterType: "Gujarat Earthquake 2024",
          amount: 75000,
          timestamp: new Date().toISOString(),
          transactionHash: "0x1234567890abcdef",
        },
      ])
    }, 500)
  })
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any
  }
}

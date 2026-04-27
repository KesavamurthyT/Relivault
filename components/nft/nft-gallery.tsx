"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Award, ExternalLink, Download } from "lucide-react"
import { getUserNFTs } from "@/lib/blockchain"

interface NFTGalleryProps {
  userAddress?: string
}

export function NFTGallery({ userAddress }: NFTGalleryProps) {
  const [nfts, setNfts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userAddress) {
      loadUserNFTs()
    }
  }, [userAddress])

  const loadUserNFTs = async () => {
    try {
      const userNFTs = await getUserNFTs(userAddress!)
      setNfts(userNFTs)
    } catch (error) {
      console.error("Error loading NFTs:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-6">Loading NFT collection...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Award className="h-5 w-5 text-purple-600" />
          <span>My NFT Certificates</span>
        </CardTitle>
        <CardDescription>Your donation certificates stored as NFTs on the blockchain</CardDescription>
      </CardHeader>
      <CardContent>
        {nfts.length === 0 ? (
          <div className="text-center py-8">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No NFT certificates yet</p>
            <p className="text-sm text-gray-400 mt-2">Make a donation to receive your first NFT certificate</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nfts.map((nft: any) => (
              <div key={nft.tokenId} className="border rounded-lg overflow-hidden">
                <div className="aspect-square bg-gradient-to-br from-purple-400 to-blue-600 p-6 text-white">
                  <div className="h-full flex flex-col justify-between">
                    <div>
                      <Badge className="bg-white/20 text-white mb-2">Certificate #{nft.tokenId}</Badge>
                      <h3 className="font-bold text-lg mb-2">{nft.disasterType}</h3>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">₹{nft.amount.toLocaleString()}</p>
                      <p className="text-sm opacity-90">Donated</p>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span>{new Date(nft.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction:</span>
                      <a
                        href={`https://mumbai.polygonscan.com/tx/${nft.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View →
                      </a>
                    </div>
                  </div>

                  <div className="flex space-x-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      OpenSea
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

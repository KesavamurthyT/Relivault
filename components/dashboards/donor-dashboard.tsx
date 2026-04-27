"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wallet, Heart, Award, TrendingUp, ExternalLink } from "lucide-react"
import { DonationForm } from "@/components/forms/donation-form"
import { NFTGallery } from "@/components/nft/nft-gallery"
import { getDonorStats, getDonorTransactions } from "@/lib/api";
import { getUserProfile } from "@/services/userService";
import { NavigationArrows } from "@/components/NavigationArrows"
import { useAuth } from "@/contexts/AuthContext"

export function DonorDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalDonated: 0,
    totalDonations: 0,
    nftCount: 0,
    impactScore: 0,
  })
  const [transactions, setTransactions] = useState<any[]>([])
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Use actual Firebase Auth UID
    if (user?.uid) {
      Promise.all([
        getDonorStats(user.uid), 
        getDonorTransactions(user.uid),
        getUserProfile(user.uid)
      ]).then(([statsData, transactionsData, profileData]) => {
        setStats(statsData)
        setTransactions(transactionsData)
        setProfile(profileData)
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [user])

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Donor Dashboard</h1>
          <p className="text-gray-600">Track your contributions and impact</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donated</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">₹{stats.totalDonated.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Donations Made</CardTitle>
              <Heart className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.totalDonations}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">NFT Certificates</CardTitle>
              <Award className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.nftCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impact Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.impactScore}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="donate" className="space-y-6">
          <TabsList>
            <TabsTrigger value="donate">Make Donation</TabsTrigger>
            <TabsTrigger value="history">Transaction History</TabsTrigger>
            <TabsTrigger value="nfts">My NFTs</TabsTrigger>
            <TabsTrigger value="impact">Impact Report</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="donate">
            <DonationForm onSuccess={() => window.location.reload()} />
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Your donation transactions on the blockchain</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No donations yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((tx: any) => (
                      <div key={tx.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold">{tx.disasterType}</h3>
                            <p className="text-sm text-gray-600">{new Date(tx.timestamp).toLocaleDateString()}</p>
                          </div>
                          <Badge className="bg-green-500">₹{tx.amount.toLocaleString()}</Badge>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-600">
                            Transaction: {tx.transactionHash?.slice(0, 10)}...
                          </div>
                          <div className="flex space-x-2">
                            <a
                              href={`https://mumbai.polygonscan.com/tx/${tx.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm flex items-center"
                            >
                              View on Blockchain <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </div>
                        </div>

                        {tx.nftTokenId && (
                          <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                            <p className="text-purple-800 text-sm">🏆 NFT Certificate Minted: #{tx.nftTokenId}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nfts">
            <NFTGallery userAddress="demo-donor-123" />
          </TabsContent>

          <TabsContent value="impact">
            <Card>
              <CardHeader>
                <CardTitle>Impact Report</CardTitle>
                <CardDescription>See how your donations are making a difference</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-2">Families Helped</h3>
                      <p className="text-2xl font-bold text-blue-600">{Math.floor(stats.totalDonated / 5000)}</p>
                      <p className="text-sm text-blue-700">Based on average relief amount</p>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <h3 className="font-semibold text-green-900 mb-2">Disasters Supported</h3>
                      <p className="text-2xl font-bold text-green-600">
                        {new Set(transactions.map((tx: any) => tx.disasterType)).size}
                      </p>
                      <p className="text-sm text-green-700">Different disaster types</p>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h3 className="font-semibold text-yellow-900 mb-2">Transparency Score</h3>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-yellow-200 rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{ width: "95%" }}></div>
                      </div>
                      <span className="text-yellow-800 font-semibold">95%</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">All transactions verified on blockchain</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your registered details</CardDescription>
              </CardHeader>
              <CardContent>
                {profile && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-lg">{(profile as any).displayName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Username</label>
                      <p className="text-lg">{(profile as any).username}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p>{(profile as any).email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p>{(profile as any).phoneNumber}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
      {/* Navigation Arrows */}
      <NavigationArrows prevPage="/ngo-dashboard" nextPage="/" />
    </div>
  )
}

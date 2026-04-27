"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, MapPin, Clock, CheckCircle, AlertCircle, DollarSign } from "lucide-react"
import { ClaimForm } from "@/components/forms/claim-form"
import { getUserClaims } from "@/lib/api"
import { getUserProfile } from "@/services/userService";
import { NavigationArrows } from "@/components/NavigationArrows"
import { useAuth } from "@/contexts/AuthContext"
import { MetaMaskConnector } from "@/components/web3/MetaMaskConnector"
import { toast } from "sonner"

export function VictimDashboard() {
  const { user } = useAuth()
  const [claims, setClaims] = useState<any[]>([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("claims")

  const loadData = async () => {
    if (user?.uid) {
      try {
        const [claimsData, profileData] = await Promise.all([
          getUserClaims(user.uid), 
          getUserProfile(user.uid)
        ])
        setClaims(claimsData)
        setProfile(profileData)
        setLoading(false)
      } catch (error) {
        console.error("Error loading data:", error)
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500"
      case "pending":
        return "bg-yellow-500"
      case "rejected":
        return "bg-red-500"
      case "under_review":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const totalDisbursed = claims
    .filter((claim: any) => claim.status === "approved")
    .reduce((sum: number, claim: any) => sum + (claim.amount || 0), 0)

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Victim Dashboard</h1>
          <p className="text-gray-600">Manage your relief claims and track disbursements</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{claims.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Claims</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {claims.filter((claim: any) => claim.status === "approved").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {claims.filter((claim: any) => claim.status === "pending" || claim.status === "under_review").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Received</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">₹{totalDisbursed.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* MetaMask Connection - Between Stats and Form */}
        <MetaMaskConnector />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="claims">My Claims</TabsTrigger>
            <TabsTrigger value="new-claim">New Claim</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="claims">
            <Card>
              <CardHeader>
                <CardTitle>Relief Claims</CardTitle>
                <CardDescription>Track the status of your submitted claims</CardDescription>
              </CardHeader>
              <CardContent>
                {claims.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No claims submitted yet</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => setActiveTab("new-claim")}
                    >
                      Submit Your First Claim
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {claims.map((claim: any) => (
                      <div key={claim.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold">{claim.disasterType}</h3>
                            <p className="text-sm text-gray-600">
                              Submitted on {new Date(claim.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={getStatusColor(claim.status)}>
                            {claim.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{claim.location}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span>₹{claim.requestedAmount?.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span>{claim.documents?.length || 0} documents</span>
                          </div>
                        </div>

                        {claim.status === "approved" && claim.amount && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <p className="text-green-800 font-medium">
                              ✅ Approved: ₹{claim.amount.toLocaleString()} disbursed
                            </p>
                            {claim.transactionHash && (
                              <a
                                href={`https://mumbai.polygonscan.com/tx/${claim.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 text-sm hover:underline"
                              >
                                View on Blockchain →
                              </a>
                            )}
                          </div>
                        )}

                        {claim.reviewNotes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <strong>Review Notes:</strong> {claim.reviewNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="new-claim">
            <ClaimForm onSuccess={(newClaim: any) => {
              const optimisticClaim = {
                ...newClaim,
                status: "approved",
                amount: newClaim.requestedAmount,
              };
              setClaims([optimisticClaim, ...claims]);
              loadData() // Refresh the data
              setActiveTab("claims") // Switch back to claims tab
              toast.success("Claim submitted successfully and is approved!")
            }} />
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
                    <div>
                      <label className="text-sm font-medium text-gray-500">Verification Status</label>
                      <Badge className={(profile as any).verified ? "bg-green-500" : "bg-yellow-500"}>
                        {(profile as any).verified ? "Verified" : "Pending Verification"}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      {/* Navigation Arrows */}
      <NavigationArrows prevPage="/public-dashboard" nextPage="/ngo-dashboard" />
    </div>
  )
}

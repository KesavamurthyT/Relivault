"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { FileText, CheckCircle, XCircle, Clock, Users, AlertTriangle } from "lucide-react"
import { getPendingClaims, reviewClaim, getNGOStats } from "@/lib/api";
import { getUserProfile } from "@/services/userService";
import { toast } from "sonner"
import { NavigationArrows } from "@/components/NavigationArrows"
import { useAuth } from "@/contexts/AuthContext"

export function NGODashboard() {
  const { user } = useAuth()
  const [pendingClaims, setPendingClaims] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalReviewed: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
  })
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true)
  const [reviewNotes, setReviewNotes] = useState("")
  const [selectedClaim, setSelectedClaim] = useState<any>(null)

  useEffect(() => {
    if (user?.uid) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      if (!user?.uid) return
      const [claimsData, statsData, profileData] = await Promise.all([
        getPendingClaims(), 
        getNGOStats(user.uid),
        getUserProfile(user.uid)
      ]);
      setPendingClaims(claimsData)
      setStats(statsData)
      setProfile(profileData);
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (claimId: string, decision: "approved" | "rejected") => {
    try {
      if (!user?.uid) return
      await reviewClaim(claimId, decision, reviewNotes, user.uid)
      toast.success(`Claim ${decision} successfully`)
      setReviewNotes("")
      setSelectedClaim(null)
      loadData()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const getRiskLevel = (claim: any) => {
    const amount = claim.requestedAmount || 0
    const hasDocuments = claim.documents && claim.documents.length > 0
    const hasLocation = claim.coordinates

    if (amount > 50000 || !hasDocuments || !hasLocation) {
      return { level: "High", color: "bg-red-500" }
    } else if (amount > 20000) {
      return { level: "Medium", color: "bg-yellow-500" }
    } else {
      return { level: "Low", color: "bg-green-500" }
    }
  }

  if (loading) {
    return <div className="p-6">Loading NGO dashboard...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">NGO Review Panel</h1>
          <p className="text-gray-600">Review and verify disaster relief claims</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviewed</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalReviewed}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">Pending Claims</TabsTrigger>
            <TabsTrigger value="reviewed">Reviewed Claims</TabsTrigger>
            <TabsTrigger value="guidelines">Review Guidelines</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Claims Awaiting Review</CardTitle>
                <CardDescription>Review and verify disaster relief claims from victims</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingClaims.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No pending claims to review</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pendingClaims.map((claim: any) => {
                      const risk = getRiskLevel(claim)
                      return (
                        <div key={claim.id} className="border rounded-lg p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-semibold">{claim.disasterType}</h3>
                              <p className="text-gray-600">
                                Submitted by {claim.userName} on {new Date(claim.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Badge className={risk.color}>{risk.level} Risk</Badge>
                              <Badge variant="outline">₹{claim.requestedAmount?.toLocaleString()}</Badge>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <h4 className="font-medium mb-2">Description</h4>
                              <p className="text-sm text-gray-700">{claim.description}</p>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Location</h4>
                              <p className="text-sm text-gray-700">{claim.location}</p>
                              {claim.coordinates && (
                                <p className="text-xs text-gray-500">
                                  GPS: {claim.coordinates.lat}, {claim.coordinates.lng}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mb-4">
                            <h4 className="font-medium mb-2">Documents ({claim.documents?.length || 0})</h4>
                            <div className="flex space-x-2">
                              {claim.documents?.map((doc: string, index: number) => (
                                <Button key={index} size="sm" variant="outline">
                                  <FileText className="h-4 w-4 mr-1" />
                                  Document {index + 1}
                                </Button>
                              ))}
                            </div>
                          </div>

                          {selectedClaim?.id === claim.id ? (
                            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                              <div>
                                <label className="block text-sm font-medium mb-2">Review Notes</label>
                                <Textarea
                                  value={reviewNotes}
                                  onChange={(e) => setReviewNotes(e.target.value)}
                                  placeholder="Add your review comments..."
                                  rows={3}
                                />
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  onClick={() => handleReview(claim.id, "approved")}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button onClick={() => handleReview(claim.id, "rejected")} variant="destructive">
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                                <Button onClick={() => setSelectedClaim(null)} variant="outline">
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button onClick={() => setSelectedClaim(claim)} className="w-full">
                              Review This Claim
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviewed">
            <Card>
              <CardHeader>
                <CardTitle>Recently Reviewed Claims</CardTitle>
                <CardDescription>Claims you have reviewed in the past 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-center py-8">Reviewed claims history will appear here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guidelines">
            <Card>
              <CardHeader>
                <CardTitle>Review Guidelines</CardTitle>
                <CardDescription>Standards for evaluating disaster relief claims</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-green-800 mb-2">✅ Approve Claims When:</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      <li>Valid Aadhaar documentation provided</li>
                      <li>GPS coordinates match disaster-affected area</li>
                      <li>Supporting photos/documents are authentic</li>
                      <li>Requested amount is reasonable for damage claimed</li>
                      <li>No duplicate claims from same individual</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-red-800 mb-2">❌ Reject Claims When:</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      <li>Invalid or suspicious documentation</li>
                      <li>Location doesn't match disaster zone</li>
                      <li>Excessive amount requested</li>
                      <li>Evidence of fraud or misrepresentation</li>
                      <li>Incomplete application</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Risk Assessment:</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      <li>
                        <strong>Low Risk:</strong> {"<"}₹20,000, complete docs, verified location
                      </li>
                      <li>
                        <strong>Medium Risk:</strong> ₹20,000-₹50,000, minor documentation issues
                      </li>
                      <li>
                        <strong>High Risk:</strong> {">"}₹50,000, incomplete docs, unverified location
                      </li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Important Reminder:</p>
                        <p>
                          All approved claims will trigger automatic blockchain disbursement. Please ensure thorough
                          verification before approval as transactions cannot be reversed.
                        </p>
                      </div>
                    </div>
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
      <NavigationArrows prevPage="/victim-dashboard" nextPage="/donor-dashboard" />
    </div>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Heart, Users, BarChart3, Wallet, FileCheck, Globe, MessageCircle } from "lucide-react"
import GetStartedButton from "@/components/Authorize/GetStartedButton"

interface LandingPageProps {
  onShowRoleSelect: () => void
  onViewPublic: () => void
  onViewDashboard: () => void
  userRole: string | null
}

export function LandingPage({ onShowRoleSelect, onViewPublic, onViewDashboard, userRole }: LandingPageProps) {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">DisasterRelief</h1>
            </div>
            <nav className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onViewPublic}>
                Public Dashboard
              </Button>
              <Button variant="ghost" onClick={() => window.location.href = '/events'}>
                Events
              </Button>
              {userRole ? (
                <Button onClick={onViewDashboard}>My Dashboard ({userRole})</Button>
              ) : (
                <GetStartedButton />
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Transparent Disaster Relief
            <span className="text-blue-600"> on Blockchain</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A decentralized platform ensuring transparent, secure, and efficient distribution of disaster relief funds
            using blockchain technology and smart contracts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!userRole && (
              <Button size="lg" onClick={onShowRoleSelect} className="text-lg px-8 py-3">
                Get Started
              </Button>
            )}
            <Button size="lg" variant="outline" onClick={onViewPublic} className="text-lg px-8 py-3 bg-transparent">
              View Public Data
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Platform Features</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Blockchain Security</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  All transactions secured on Polygon blockchain with full transparency and immutability.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Heart className="h-8 w-8 text-red-600 mb-2" />
                <CardTitle>NFT Certificates</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Donors receive unique ERC-721 NFT certificates as proof of their contributions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Multi-Role Access</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Separate dashboards for victims, donors, NGOs, and administrators with role-based permissions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Real-time Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Live dashboard showing fund flows, disbursements, and impact metrics with blockchain verification.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Wallet className="h-8 w-8 text-orange-600 mb-2" />
                <CardTitle>MetaMask Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Seamless Web3 wallet integration for secure donations and fund management.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileCheck className="h-8 w-8 text-teal-600 mb-2" />
                <CardTitle>IPFS Storage</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Decentralized storage for documents and proofs ensuring data integrity and accessibility.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Globe className="h-8 w-8 text-indigo-600 mb-2" />
                <CardTitle>GPS Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Location-based verification system to ensure aid reaches the right beneficiaries.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MessageCircle className="h-8 w-8 text-pink-600 mb-2" />
                <CardTitle>AI Assistant</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Built-in chatbot to help users navigate the platform and get instant support.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="text-xl font-semibold mb-2">Disaster Occurs & Victims Register</h4>
                <p className="text-gray-600">
                  Victims create accounts, submit Aadhaar verification, GPS location, and supporting documents via IPFS.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="text-xl font-semibold mb-2">Donors Contribute Funds</h4>
                <p className="text-gray-600">
                  Donors use MetaMask to send funds to smart contracts and receive NFT certificates as acknowledgment.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="text-xl font-semibold mb-2">Claims Verification</h4>
                <p className="text-gray-600">
                  NGO panels and admins review claims. Low-risk cases get auto-approved, high-risk cases require manual
                  review.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h4 className="text-xl font-semibold mb-2">Automatic Fund Disbursement</h4>
                <p className="text-gray-600">
                  Smart contracts automatically disburse funds to verified victims with full blockchain transparency.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-6 w-6" />
            <span className="text-xl font-bold">DisasterRelief</span>
          </div>
          <p className="text-gray-400 mb-4">
            Transparent, secure, and efficient disaster relief powered by blockchain technology.
          </p>
          <p className="text-sm text-gray-500">
            Built on Polygon Mumbai Testnet • Secured by IPFS • Powered by Smart Contracts
          </p>
        </div>
      </footer>
    </div>
  )
}

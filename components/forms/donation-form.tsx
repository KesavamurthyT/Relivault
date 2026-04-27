"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wallet, Heart, Shield, Award } from "lucide-react"
import { connectWallet, donateToDisaster, getActiveDisasters } from "@/lib/blockchain"
import { toast } from "sonner"

interface DonationFormProps {
  onSuccess: () => void
}

export function DonationForm({ onSuccess }: DonationFormProps) {
  const [loading, setLoading] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [disasters, setDisasters] = useState([])
  const [formData, setFormData] = useState({
    disasterType: "",
    amount: "",
    message: "",
  })

  useEffect(() => {
    checkWalletConnection()
    loadActiveDisasters()
  }, [])

  const checkWalletConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" })
        if (accounts.length > 0) {
          setWalletConnected(true)
          setWalletAddress(accounts[0])
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error)
      }
    }
  }

  const loadActiveDisasters = async () => {
    try {
      const activeDisasters = await getActiveDisasters()
      setDisasters(activeDisasters)
    } catch (error) {
      console.error("Error loading disasters:", error)
    }
  }

  const handleConnectWallet = async () => {
    try {
      const address = await connectWallet()
      setWalletConnected(true)
      setWalletAddress(address)
      toast.success("Wallet connected successfully!")
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!walletConnected) return

    setLoading(true)
    try {
      const txHash = await donateToDisaster(formData.disasterType, Number.parseFloat(formData.amount), formData.message)

      toast.success("Donation successful! NFT certificate will be minted.")
      onSuccess()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-red-600" />
            <span>Make a Donation</span>
          </CardTitle>
          <CardDescription>Support disaster relief efforts and receive an NFT certificate</CardDescription>
        </CardHeader>
        <CardContent>
          {!walletConnected ? (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
              <p className="text-gray-600 mb-4">Connect your MetaMask wallet to make donations on the blockchain</p>
              <Button onClick={handleConnectWallet}>
                <Wallet className="h-4 w-4 mr-2" />
                Connect MetaMask
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-green-800 font-medium">Wallet Connected</p>
                    <p className="text-green-700 text-sm">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleDonate} className="space-y-4">
                <div>
                  <Label htmlFor="disasterType">Select Disaster</Label>
                  <Select
                    value={formData.disasterType}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, disasterType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose disaster to support" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flood-kerala-2024">Kerala Floods 2024</SelectItem>
                      <SelectItem value="earthquake-turkey-2024">Turkey Earthquake 2024</SelectItem>
                      <SelectItem value="cyclone-odisha-2024">Odisha Cyclone 2024</SelectItem>
                      <SelectItem value="wildfire-california-2024">California Wildfires 2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">Donation Amount (MATIC)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="Enter amount in MATIC"
                    value={formData.amount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">Minimum donation: 0.1 MATIC (~₹10)</p>
                </div>

                <div>
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Input
                    id="message"
                    placeholder="Leave a message of support"
                    value={formData.message}
                    onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Award className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">NFT Certificate Reward</p>
                      <p>
                        You'll receive a unique ERC-721 NFT certificate as proof of your donation. This NFT will contain
                        metadata about your contribution and can be viewed in your wallet or on OpenSea.
                      </p>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Processing Donation..." : "Donate Now"}
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Why Donate Through Blockchain?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold">🔒 Complete Transparency</h4>
              <p className="text-gray-600">Every transaction is recorded on the blockchain and publicly verifiable</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">⚡ Direct Impact</h4>
              <p className="text-gray-600">Funds go directly to verified victims through smart contracts</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">🏆 NFT Certificates</h4>
              <p className="text-gray-600">Receive unique digital certificates as proof of your contribution</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">🌍 Global Access</h4>
              <p className="text-gray-600">Support disaster relief efforts from anywhere in the world</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

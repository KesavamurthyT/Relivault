"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, Heart, Shield, Settings } from "lucide-react"

interface RoleSelectorProps {
  onRoleSelect: (role: string) => void
  onBack: () => void
  disabled?: boolean
}

export function RoleSelector({ onRoleSelect, onBack, disabled = false }: RoleSelectorProps) {
  const roles = [
    {
      id: "victim",
      title: "Victim",
      description: "I need disaster relief assistance",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50 hover:bg-blue-100",
      features: [
        "Submit relief claims",
        "Upload supporting documents",
        "Track application status",
        "Receive funds directly",
      ],
    },
    {
      id: "donor",
      title: "Donor",
      description: "I want to donate to disaster relief",
      icon: Heart,
      color: "text-red-600",
      bgColor: "bg-red-50 hover:bg-red-100",
      features: [
        "Make secure donations",
        "Receive NFT certificates",
        "Track donation impact",
        "View transaction history",
      ],
    },
    {
      id: "ngo",
      title: "NGO Panel",
      description: "I review and verify claims",
      icon: Shield,
      color: "text-green-600",
      bgColor: "bg-green-50 hover:bg-green-100",
      features: [
        "Review victim claims",
        "Verify documentation",
        "Approve/reject applications",
        "Monitor disbursements",
      ],
    },
    {
      id: "admin",
      title: "Administrator",
      description: "I manage the platform",
      icon: Settings,
      color: "text-purple-600",
      bgColor: "bg-purple-50 hover:bg-purple-100",
      features: ["System administration", "User management", "Platform analytics", "Blockchain monitoring"],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Role</h1>
          <p className="text-gray-600">Select how you want to use the DisasterRelief platform</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {roles.map((role) => {
            const IconComponent = role.icon
            return (
              <Card
                key={role.id}
                className={`${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} transition-all duration-200 ${role.bgColor} border-2 hover:border-gray-300`}
                onClick={() => !disabled && onRoleSelect(role.id)}
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <IconComponent className={`h-8 w-8 ${role.color}`} />
                    <div>
                      <CardTitle className="text-xl">{role.title}</CardTitle>
                      <CardDescription className="text-gray-600">{role.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {role.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full mt-4 bg-transparent"
                    variant="outline"
                    disabled={disabled}
                  >
                    {disabled ? 'Saving...' : `Continue as ${role.title}`}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">You can switch roles anytime from your dashboard settings</p>
        </div>
      </div>
    </div>
  )
}

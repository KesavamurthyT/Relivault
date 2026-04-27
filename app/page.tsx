"use client"


import { useRouter } from "next/navigation"
import { LandingPage } from "@/components/landing-page"

export default function Home() {
  const router = useRouter()

  const handleShowRoleSelect = () => {
    router.push("/role-select")
  }

  const handleViewPublic = () => {
    router.push("/public-dashboard")
  }

  const handleViewDashboard = () => {
    const role = localStorage.getItem("role")

    switch (role) {
      case "admin":
        router.push("/admin")
        break
      case "donor":
        router.push("/donor")
        break
      case "ngo":
        router.push("/ngo")
        break
      case "victim":
        router.push("/victim")
        break
      default:
        router.push("/public-dashboard")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <LandingPage
        onShowRoleSelect={handleShowRoleSelect}
        onViewPublic={handleViewPublic}
        onViewDashboard={handleViewDashboard}
        userRole={null}
      />
    </div>
  )
}

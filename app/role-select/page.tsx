'use client'

import React, { useState } from 'react'
import { RoleSelector } from '@/components/role-selector'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/firebase'
import { updateUserRole } from '@/services/userService'
import { useRouter } from 'next/navigation'

export default function RoleSelectPage() {
  const [user, loading] = useAuthState(auth)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const handleRoleSelect = async (role) => {
    if (saving) return // Prevent double clicks
    
    console.log("Role selected:", role, "User:", user?.email)
    setSaving(true)
    
    try {
      if (user) {
        console.log("Saving role to Firestore...")
        // Save role to Firestore
        await updateUserRole(user.uid, role)
        console.log("Role saved successfully")
      }
      
      // Always save to localStorage as backup
      if (typeof window !== 'undefined') {
        localStorage.setItem('role', role)
      }
      
      // Redirect to the new signup page
      router.push(`/signup`);
    } catch (error) {
      console.error('Error saving role:', error)
      // Fallback to localStorage and redirect anyway
      if (typeof window !== 'undefined') {
        localStorage.setItem('role', role)
        window.location.href = `/${role}`
      }
    } finally {
      setSaving(false)
    }
  }

  // Show loading state while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <RoleSelector
      onRoleSelect={handleRoleSelect}
      onBack={() => {
        router.push('/')
      }}
      disabled={saving}
    />
  )
}

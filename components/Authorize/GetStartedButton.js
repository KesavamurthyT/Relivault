"use client";
import React from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebase";
import { useRouter } from "next/navigation";
import { createUserProfile, getUserProfile } from "../../services/userService";

function GetStartedButton() {
  const router = useRouter();

  const handleGetStarted = async () => {
    const provider = new GoogleAuthProvider();
    try {
      console.log("Starting Google Sign-In...");
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Sign-in successful:", user.email);

      try {
        console.log("Checking user profile in Firestore...");
        // Check if user profile exists in Firestore
        let userProfile = await getUserProfile(user.uid);
        console.log("User profile:", userProfile);
        
        if (!userProfile) {
          console.log("Creating new user profile...");
          // Create new user profile without role
          userProfile = await createUserProfile(user);
          console.log("User profile created:", userProfile);
        }

        // Check if user has a role
        if (userProfile && userProfile.role) {
          console.log("User has role:", userProfile.role);
          // Redirect to appropriate dashboard based on role
          router.push(`/${userProfile.role}`);
        } else {
          console.log("User has no role, redirecting to role selection");
          // Redirect to role selection for first-time users
          router.push("/role-select");
        }
      } catch (firestoreError) {
        console.error("Firestore error:", firestoreError);
        // If Firestore fails, still redirect to role selection
        router.push("/role-select");
      }
      
    } catch (error) {
      console.error("Error during sign-in:", error);
      alert("Sign-in failed: " + error.message);
    }
  };

  return <button onClick={handleGetStarted}>Get Started</button>;
}

export default GetStartedButton;
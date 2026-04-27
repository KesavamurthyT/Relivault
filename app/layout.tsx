import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { AuthProvider } from "@/contexts/AuthContext"
import { Web3Provider } from "@/contexts/Web3Context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DisasterRelief - Blockchain Relief Platform",
  description: "Transparent disaster relief fund tracking using blockchain technology",
  manifest: "/manifest.json",
  themeColor: "#3B82F6",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DisasterRelief",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="DisasterRelief" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <Web3Provider>
            {children}
            <Toaster position="top-right" />
          </Web3Provider>
        </AuthProvider>
      </body>
    </html>
  )
}

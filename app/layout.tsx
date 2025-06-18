import React from "react"
import { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/components/language-provider"
import { BottomNavigation } from "@/components/bottom-navigation"
import { ErrorBoundary } from "@/components/error-boundary"
import ClientLayout from "@/components/client-layout"
import { Toaster } from "@/components/ui/toaster"
import FloatingCreditNotification from "@/components/floating-credit-notification"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Football App",
  description: "Real-time football match data, predictions, and statistics",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#0f172a" />
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            overscroll-behavior: none;
            overflow: hidden;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
          }
          #app-container {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 60px;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }
        `}} />
      </head>
      <body className={inter.className + " bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white"}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <LanguageProvider>
            <ClientLayout>
              <div id="app-container" className="pb-4">
                <ErrorBoundary>{children}</ErrorBoundary>
              </div>
              <BottomNavigation />
              <Toaster />
              <FloatingCreditNotification />
            </ClientLayout>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

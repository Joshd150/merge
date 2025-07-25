import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"
import { Bot, Webhook, Settings, Sparkles } from "lucide-react"
import { SaveIndicator } from "@/components/save-indicator"
import { ThemeToggle } from "@/components/ui/theme-toggle"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Discord Embed Builder",
  description: "Create beautiful Discord embeds and send them via webhooks",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <nav className="border-b bg-white/90 dark:bg-gray-900/90 backdrop-blur-md sticky top-0 z-50 shadow-sm dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center space-x-8">
                  <Link href="/" className="flex items-center space-x-3 group">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg group-hover:shadow-xl transition-all duration-200">
                      <Webhook className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                        Discord Tools
                      </span>
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Pro</span>
                      </div>
                    </div>
                  </Link>
                  <div className="hidden md:flex space-x-1">
                    <Link
                      href="/"
                      className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                    >
                      Embed Builder
                    </Link>
                    <Link
                      href="/bot"
                      className="text-gray-600 hover:text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-indigo-50 flex items-center gap-2"
                    >
                      <Bot className="w-4 h-4" />
                      Bot Setup
                    </Link>
                    <Link
                      href="/manage"
                      className="text-gray-600 hover:text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-indigo-50 flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Manage Embeds
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <ThemeToggle />
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-green-700 dark:text-green-300">Auto-Save Active</span>
                  </div>
                </div>
              </div>
            </div>
          </nav>
          {children}
          <SaveIndicator />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

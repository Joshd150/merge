"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

export function SaveIndicator() {
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showSaved, setShowSaved] = useState(false)

  useEffect(() => {
    const handleStorageChange = () => {
      setLastSaved(new Date())
      setShowSaved(true)

      // Hide the indicator after 2 seconds
      setTimeout(() => setShowSaved(false), 2000)
    }

    // Listen for localStorage changes
    window.addEventListener("storage", handleStorageChange)

    // Also trigger on any form changes (custom event)
    window.addEventListener("formDataSaved", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("formDataSaved", handleStorageChange)
    }
  }, [])

  if (!showSaved || !lastSaved) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge className="bg-green-600 dark:bg-green-700 text-white shadow-lg animate-in slide-in-from-bottom-2">
        <Check className="w-3 h-3 mr-1" />
        Saved at {lastSaved.toLocaleTimeString()}
      </Badge>
    </div>
  )
}

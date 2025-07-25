"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Download, Upload, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ExportImportProps {
  onImport: (data: any) => void
  currentData: any
}

export function ExportImport({ onImport, currentData }: ExportImportProps) {
  const { toast } = useToast()
  const [importData, setImportData] = useState("")

  const exportData = () => {
    const dataToExport = {
      messageData: currentData.messageData,
      embedData: currentData.embedData,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    }

    const jsonString = JSON.stringify(dataToExport, null, 2)

    // Create and download file
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `discord-embed-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Exported!",
      description: "Your embed configuration has been downloaded",
    })
  }

  const importFromJson = () => {
    try {
      const parsed = JSON.parse(importData)

      if (parsed.messageData && parsed.embedData) {
        onImport(parsed)
        setImportData("")
        toast({
          title: "Imported!",
          description: "Your embed configuration has been loaded",
        })
      } else {
        throw new Error("Invalid format")
      }
    } catch (error) {
      toast({
        title: "Import Error",
        description: "Invalid JSON format or missing required data",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="border-0 shadow-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Export / Import
        </CardTitle>
        <CardDescription className="dark:text-gray-400">
          Save your configurations or load previously saved ones
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={exportData} className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Export Configuration
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Import Configuration</label>
          <Textarea
            placeholder="Paste your exported JSON configuration here..."
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            rows={4}
            className="bg-white/50 dark:bg-gray-700/50"
          />
          <Button
            onClick={importFromJson}
            disabled={!importData.trim()}
            className="w-full bg-transparent dark:bg-gray-700/50"
            variant="outline"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

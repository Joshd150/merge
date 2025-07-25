"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Edit,
  Trash2,
  Save,
  X,
  MessageSquare,
  Calendar,
  Hash,
  ExternalLink,
  Search,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"
import { EmbedPreview } from "@/components/embed-preview"
import { useToast } from "@/hooks/use-toast"

interface EmbedField {
  name: string
  value: string
  inline: boolean
}

interface EmbedData {
  title: string
  description: string
  color: string
  url: string
  thumbnail: string
  image: string
  footer: string
  footerIcon: string
  author: string
  authorIcon: string
  authorUrl: string
  fields: EmbedField[]
  timestamp: boolean
}

interface MessageData {
  content: string
  username: string
  avatarUrl: string
  tts: boolean
}

interface SentMessage {
  id: string
  messageId: string
  channelId: string
  channelName: string
  guildId: string
  guildName: string
  sentAt: string
  messageData: MessageData
  embedData: EmbedData
  botToken: string
  isDeleted?: boolean
  lastChecked?: string
}

export default function ManageEmbedsPage() {
  const { toast } = useToast()
  const [sentMessages, setSentMessages] = useState<SentMessage[]>([])
  const [editingMessage, setEditingMessage] = useState<SentMessage | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterGuild, setFilterGuild] = useState("")
  const [showDeleted, setShowDeleted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  // Load sent messages from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("discord-sent-messages")
    if (saved) {
      try {
        setSentMessages(JSON.parse(saved))
      } catch (error) {
        console.error("Error loading sent messages:", error)
      }
    }
  }, [])

  // Save sent messages to localStorage
  const saveSentMessages = (messages: SentMessage[]) => {
    localStorage.setItem("discord-sent-messages", JSON.stringify(messages))
    setSentMessages(messages)
  }

  // Validate message exists in Discord
  const validateMessage = async (message: SentMessage) => {
    try {
      const response = await fetch("/api/discord/validate-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: message.botToken,
          channelId: message.channelId,
          messageId: message.messageId,
        }),
      })

      return response.ok
    } catch (error) {
      return false
    }
  }

  // Validate all messages
  const validateAllMessages = async () => {
    setIsValidating(true)
    const updatedMessages = [...sentMessages]
    let deletedCount = 0

    for (let i = 0; i < updatedMessages.length; i++) {
      const message = updatedMessages[i]
      if (!message.isDeleted) {
        const exists = await validateMessage(message)
        if (!exists) {
          updatedMessages[i] = {
            ...message,
            isDeleted: true,
            lastChecked: new Date().toISOString(),
          }
          deletedCount++
        } else {
          updatedMessages[i] = {
            ...message,
            lastChecked: new Date().toISOString(),
          }
        }
      }
    }

    saveSentMessages(updatedMessages)
    setIsValidating(false)

    if (deletedCount > 0) {
      toast({
        title: "Validation Complete",
        description: `Found ${deletedCount} deleted message(s). They are now marked as deleted.`,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Validation Complete",
        description: "All messages are still active in Discord",
      })
    }
  }

  // Filter messages based on search, guild filter, and deleted status
  const filteredMessages = sentMessages.filter((message) => {
    const matchesSearch =
      message.embedData.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.embedData.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.messageData.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.channelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.guildName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesGuild = !filterGuild || message.guildId === filterGuild
    const matchesDeletedFilter = showDeleted || !message.isDeleted

    return matchesSearch && matchesGuild && matchesDeletedFilter
  })

  // Get unique guilds for filter dropdown
  const uniqueGuilds = Array.from(new Set(sentMessages.map((m) => ({ id: m.guildId, name: m.guildName })))).filter(
    (guild, index, self) => index === self.findIndex((g) => g.id === guild.id),
  )

  const startEditing = async (message: SentMessage) => {
    // Check if message still exists before editing
    if (!message.isDeleted) {
      const exists = await validateMessage(message)
      if (!exists) {
        // Mark as deleted and update storage
        const updatedMessages = sentMessages.map((m) =>
          m.id === message.id ? { ...m, isDeleted: true, lastChecked: new Date().toISOString() } : m,
        )
        saveSentMessages(updatedMessages)

        toast({
          title: "Message Not Found",
          description: "This message has been deleted from Discord and cannot be edited.",
          variant: "destructive",
        })
        return
      }
    } else {
      toast({
        title: "Cannot Edit",
        description: "This message has been deleted from Discord.",
        variant: "destructive",
      })
      return
    }

    setEditingMessage({ ...message })
  }

  const cancelEditing = () => {
    setEditingMessage(null)
  }

  const updateEditingMessage = (updates: Partial<SentMessage>) => {
    if (editingMessage) {
      setEditingMessage({ ...editingMessage, ...updates })
    }
  }

  const updateEditingEmbed = (updates: Partial<EmbedData>) => {
    if (editingMessage) {
      setEditingMessage({
        ...editingMessage,
        embedData: { ...editingMessage.embedData, ...updates },
      })
    }
  }

  const updateEditingMessageData = (updates: Partial<MessageData>) => {
    if (editingMessage) {
      setEditingMessage({
        ...editingMessage,
        messageData: { ...editingMessage.messageData, ...updates },
      })
    }
  }

  const addField = () => {
    if (editingMessage) {
      updateEditingEmbed({
        fields: [...editingMessage.embedData.fields, { name: "", value: "", inline: false }],
      })
    }
  }

  const removeField = (index: number) => {
    if (editingMessage) {
      updateEditingEmbed({
        fields: editingMessage.embedData.fields.filter((_, i) => i !== index),
      })
    }
  }

  const updateField = (index: number, field: Partial<EmbedField>) => {
    if (editingMessage) {
      updateEditingEmbed({
        fields: editingMessage.embedData.fields.map((f, i) => (i === index ? { ...f, ...field } : f)),
      })
    }
  }

  const saveEditedMessage = async () => {
    if (!editingMessage) return

    setIsSaving(true)
    try {
      const response = await fetch("/api/discord/edit-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: editingMessage.botToken,
          channelId: editingMessage.channelId,
          messageId: editingMessage.messageId,
          messageData: editingMessage.messageData,
          embedData: editingMessage.embedData,
        }),
      })

      if (response.ok) {
        // Update the message in our local storage
        const updatedMessages = sentMessages.map((msg) => (msg.id === editingMessage.id ? editingMessage : msg))
        saveSentMessages(updatedMessages)
        setEditingMessage(null)

        toast({
          title: "Success!",
          description: "Message updated successfully in Discord",
        })
      } else {
        const error = await response.text()
        if (response.status === 404) {
          // Message was deleted, mark it as such
          const updatedMessages = sentMessages.map((m) =>
            m.id === editingMessage.id ? { ...m, isDeleted: true, lastChecked: new Date().toISOString() } : m,
          )
          saveSentMessages(updatedMessages)
          setEditingMessage(null)

          toast({
            title: "Message Not Found",
            description: "This message has been deleted from Discord.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error",
            description: error || "Failed to update message",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update message",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const deleteMessage = async (message: SentMessage) => {
    if (!confirm("Are you sure you want to delete this message? This cannot be undone.")) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/discord/delete-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: message.botToken,
          channelId: message.channelId,
          messageId: message.messageId,
        }),
      })

      if (response.ok) {
        // Remove from local storage
        const updatedMessages = sentMessages.filter((msg) => msg.id !== message.id)
        saveSentMessages(updatedMessages)

        toast({
          title: "Success!",
          description: "Message deleted successfully from Discord",
        })
      } else {
        const error = await response.text()
        if (response.status === 404) {
          // Message was already deleted, just remove from our tracking
          const updatedMessages = sentMessages.filter((msg) => msg.id !== message.id)
          saveSentMessages(updatedMessages)

          toast({
            title: "Message Removed",
            description: "Message was already deleted from Discord. Removed from tracking.",
          })
        } else {
          toast({
            title: "Error",
            description: error || "Failed to delete message",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromTracking = (messageId: string) => {
    if (confirm("Remove this message from tracking? This won't delete the Discord message.")) {
      const updatedMessages = sentMessages.filter((msg) => msg.id !== messageId)
      saveSentMessages(updatedMessages)
      toast({
        title: "Removed",
        description: "Message removed from tracking",
      })
    }
  }

  const clearAllMessages = () => {
    if (
      confirm("Are you sure you want to clear all message history? This will not delete the actual Discord messages.")
    ) {
      localStorage.removeItem("discord-sent-messages")
      setSentMessages([])
      toast({
        title: "Cleared",
        description: "Message history has been cleared",
      })
    }
  }

  const activeMessages = sentMessages.filter((m) => !m.isDeleted).length
  const deletedMessages = sentMessages.filter((m) => m.isDeleted).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent mb-2">
            Manage Sent Embeds
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Edit, delete, and manage your previously sent Discord messages
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!editingMessage ? (
          // Message List View
          <div className="space-y-6">
            {/* Controls */}
            <Card className="border-0 shadow-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Message History</CardTitle>
                    <CardDescription className="mt-1">
                      {filteredMessages.length} of {sentMessages.length} messages shown
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={validateAllMessages}
                      disabled={isValidating}
                      size="sm"
                      variant="outline"
                      className="bg-white/50"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isValidating ? "animate-spin" : ""}`} />
                      {isValidating ? "Validating..." : "Validate All"}
                    </Button>
                    <Button
                      onClick={clearAllMessages}
                      size="sm"
                      variant="outline"
                      className="text-red-600 bg-white/50 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear History
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Search Messages</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Search by title, content, channel..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white/50 dark:bg-gray-700/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Filter by Server</Label>
                    <Select value={filterGuild} onValueChange={setFilterGuild}>
                      <SelectTrigger className="bg-white/50">
                        <SelectValue placeholder="All servers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All servers</SelectItem>
                        {uniqueGuilds.map((guild) => (
                          <SelectItem key={guild.id} value={guild.id}>
                            {guild.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Show Deleted Messages</Label>
                    <div className="flex items-center space-x-2 h-10">
                      <Switch checked={showDeleted} onCheckedChange={setShowDeleted} />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Include deleted</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Messages List */}
            {filteredMessages.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                <CardContent className="text-center py-16">
                  <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <MessageSquare className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No messages found</h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    {sentMessages.length === 0
                      ? "Send some messages from the main page to see them here"
                      : "Try adjusting your search or filter criteria"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredMessages.map((message) => (
                  <Card
                    key={message.id}
                    className={`border-0 shadow-lg transition-all duration-200 hover:shadow-xl ${
                      message.isDeleted
                        ? "bg-red-50/70 backdrop-blur-sm border-l-4 border-l-red-400"
                        : "bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-700/80"
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">
                              {message.embedData.title || message.messageData.content || "Untitled Message"}
                            </CardTitle>
                            {message.isDeleted && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Deleted
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Hash className="w-4 h-4" />
                              {message.channelName}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(message.sentAt).toLocaleString()}
                            </div>
                            <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                              {message.guildName}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {!message.isDeleted ? (
                            <>
                              <Button
                                onClick={() => startEditing(message)}
                                size="sm"
                                variant="outline"
                                className="bg-white/50 hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                onClick={() => deleteMessage(message)}
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 bg-white/50 hover:bg-red-50"
                                disabled={isLoading}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                              <Button
                                onClick={() =>
                                  window.open(
                                    `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.messageId}`,
                                    "_blank",
                                  )
                                }
                                size="sm"
                                variant="outline"
                                className="bg-white/50 hover:bg-green-50"
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View
                              </Button>
                            </>
                          ) : (
                            <Button
                              onClick={() => removeFromTracking(message.id)}
                              size="sm"
                              variant="outline"
                              className="text-gray-600 bg-white/50"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="max-w-md">
                        <EmbedPreview embedData={message.embedData} messageData={message.messageData} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Edit Message View
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* Edit Header */}
              <Card className="border-0 shadow-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Editing Message</CardTitle>
                      <CardDescription className="mt-1">
                        #{editingMessage.channelName} in {editingMessage.guildName}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={cancelEditing} variant="outline" size="sm" className="bg-white/50">
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={saveEditedMessage}
                        disabled={isSaving}
                        size="sm"
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Edit Form */}
              <Card className="border-0 shadow-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Edit Message & Embed</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="message" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-gray-100/50">
                      <TabsTrigger value="message">Message</TabsTrigger>
                      <TabsTrigger value="basic">Basic</TabsTrigger>
                      <TabsTrigger value="media">Media</TabsTrigger>
                      <TabsTrigger value="fields">Fields</TabsTrigger>
                    </TabsList>

                    <TabsContent value="message" className="space-y-4 mt-6">
                      <div className="space-y-2">
                        <Label>Message Content</Label>
                        <Textarea
                          placeholder="Regular message content"
                          value={editingMessage.messageData.content}
                          onChange={(e) => updateEditingMessageData({ content: e.target.value })}
                          rows={6}
                          className="bg-white/50 dark:bg-gray-700/50"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Username Override</Label>
                          <Input
                            placeholder="Custom sender name"
                            value={editingMessage.messageData.username}
                            onChange={(e) => updateEditingMessageData({ username: e.target.value })}
                            className="bg-white/50 dark:bg-gray-700/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Avatar URL</Label>
                          <Input
                            placeholder="https://example.com/avatar.png"
                            value={editingMessage.messageData.avatarUrl}
                            onChange={(e) => updateEditingMessageData({ avatarUrl: e.target.value })}
                            className="bg-white/50 dark:bg-gray-700/50"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={editingMessage.messageData.tts}
                          onCheckedChange={(checked) => updateEditingMessageData({ tts: checked })}
                        />
                        <Label>Text-to-Speech</Label>
                      </div>
                    </TabsContent>

                    <TabsContent value="basic" className="space-y-4 mt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input
                            placeholder="Embed title"
                            value={editingMessage.embedData.title}
                            onChange={(e) => updateEditingEmbed({ title: e.target.value })}
                            className="bg-white/50 dark:bg-gray-700/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={editingMessage.embedData.color}
                              onChange={(e) => updateEditingEmbed({ color: e.target.value })}
                              className="w-16 bg-white/50 dark:bg-gray-700/50"
                            />
                            <Input
                              placeholder="#5865F2"
                              value={editingMessage.embedData.color}
                              onChange={(e) => updateEditingEmbed({ color: e.target.value })}
                              className="bg-white/50 dark:bg-gray-700/50"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          placeholder="Embed description"
                          value={editingMessage.embedData.description}
                          onChange={(e) => updateEditingEmbed({ description: e.target.value })}
                          rows={4}
                          className="bg-white/50 dark:bg-gray-700/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>URL</Label>
                        <Input
                          placeholder="https://example.com"
                          value={editingMessage.embedData.url}
                          onChange={(e) => updateEditingEmbed({ url: e.target.value })}
                          className="bg-white/50 dark:bg-gray-700/50"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="media" className="space-y-4 mt-6">
                      <div className="space-y-2">
                        <Label>Large Image URL</Label>
                        <Input
                          placeholder="https://example.com/image.png"
                          value={editingMessage.embedData.image}
                          onChange={(e) => updateEditingEmbed({ image: e.target.value })}
                          className="bg-white/50 dark:bg-gray-700/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Thumbnail URL</Label>
                        <Input
                          placeholder="https://example.com/thumb.png"
                          value={editingMessage.embedData.thumbnail}
                          onChange={(e) => updateEditingEmbed({ thumbnail: e.target.value })}
                          className="bg-white/50 dark:bg-gray-700/50"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Author Name</Label>
                          <Input
                            placeholder="Author name"
                            value={editingMessage.embedData.author}
                            onChange={(e) => updateEditingEmbed({ author: e.target.value })}
                            className="bg-white/50 dark:bg-gray-700/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Author Icon</Label>
                          <Input
                            placeholder="https://example.com/avatar.png"
                            value={editingMessage.embedData.authorIcon}
                            onChange={(e) => updateEditingEmbed({ authorIcon: e.target.value })}
                            className="bg-white/50 dark:bg-gray-700/50"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="fields" className="space-y-4 mt-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Embed Fields</h3>
                        <Button onClick={addField} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                          <Edit className="w-4 h-4 mr-2" />
                          Add Field
                        </Button>
                      </div>

                      {editingMessage.embedData.fields.map((field, index) => (
                        <Card key={index} className="p-4 bg-white/30">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary">Field {index + 1}</Badge>
                              <Button onClick={() => removeField(index)} size="sm" variant="destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                  placeholder="Field name"
                                  value={field.name}
                                  onChange={(e) => updateField(index, { name: e.target.value })}
                                  className="bg-white/50 dark:bg-gray-700/50"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Value</Label>
                                <Textarea
                                  placeholder="Field value"
                                  value={field.value}
                                  onChange={(e) => updateField(index, { value: e.target.value })}
                                  rows={2}
                                  className="bg-white/50 dark:bg-gray-700/50"
                                />
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={field.inline}
                                onCheckedChange={(checked) => updateField(index, { inline: checked })}
                              />
                              <Label>Display inline</Label>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Preview Panel */}
            <div className="lg:sticky lg:top-24">
              <Card className="border-0 shadow-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Live Preview</CardTitle>
                  <CardDescription>See how your edited message will look</CardDescription>
                </CardHeader>
                <CardContent>
                  <EmbedPreview embedData={editingMessage.embedData} messageData={editingMessage.messageData} />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

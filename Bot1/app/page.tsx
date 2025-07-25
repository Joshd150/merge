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
import { Plus, Trash2, Send, Bot, Hash, ImageIcon, User, Calendar, MessageSquare } from "lucide-react"
import { EmbedPreview } from "@/components/embed-preview"
import { useToast } from "@/hooks/use-toast"
import { ExportImport } from "@/components/export-import"

// Custom hook for localStorage persistence
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error)
    }
  }, [key])

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error)
    }
  }

  return [storedValue, setValue] as const
}

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

interface Guild {
  id: string
  name: string
  icon: string | null
}

interface Channel {
  id: string
  name: string
  type: number
}

export default function DiscordEmbedPortal() {
  const { toast } = useToast()
  const [botToken, setBotToken] = useLocalStorage("discord-bot-token", "")
  const [selectedGuild, setSelectedGuild] = useLocalStorage("discord-selected-guild", "")
  const [selectedChannel, setSelectedChannel] = useLocalStorage("discord-selected-channel", "")
  const [guilds, setGuilds] = useLocalStorage<Guild[]>("discord-guilds", [])
  const [channels, setChannels] = useLocalStorage<Channel[]>("discord-channels", [])
  const [isLoadingGuilds, setIsLoadingGuilds] = useState(false)
  const [isLoadingChannels, setIsLoadingChannels] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const [messageData, setMessageData] = useLocalStorage<MessageData>("discord-message-data", {
    content: "",
    username: "",
    avatarUrl: "",
    tts: false,
  })

  const [embedData, setEmbedData] = useLocalStorage<EmbedData>("discord-embed-data", {
    title: "",
    description: "",
    color: "#5865F2",
    url: "",
    thumbnail: "",
    image: "",
    footer: "",
    footerIcon: "",
    author: "",
    authorIcon: "",
    authorUrl: "",
    fields: [],
    timestamp: false,
  })

  const fetchGuilds = async () => {
    if (!botToken) return

    setIsLoadingGuilds(true)
    try {
      const response = await fetch("/api/discord/guilds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken }),
      })

      if (response.ok) {
        const data = await response.json()
        setGuilds(data.guilds)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch servers. Check your bot token.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to Discord API",
        variant: "destructive",
      })
    } finally {
      setIsLoadingGuilds(false)
    }
  }

  const fetchChannels = async (guildId: string) => {
    if (!botToken || !guildId) return

    setIsLoadingChannels(true)
    try {
      const response = await fetch("/api/discord/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken, guildId }),
      })

      if (response.ok) {
        const data = await response.json()
        setChannels(data.channels.filter((ch: Channel) => ch.type === 0)) // Only text channels
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch channels",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch channels",
        variant: "destructive",
      })
    } finally {
      setIsLoadingChannels(false)
    }
  }

  const addField = () => {
    setEmbedData((prev) => ({
      ...prev,
      fields: [...prev.fields, { name: "", value: "", inline: false }],
    }))
  }

  const removeField = (index: number) => {
    setEmbedData((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }))
  }

  const updateField = (index: number, field: Partial<EmbedField>) => {
    setEmbedData((prev) => ({
      ...prev,
      fields: prev.fields.map((f, i) => (i === index ? { ...f, ...field } : f)),
    }))
  }

  const sendMessage = async () => {
    if (!botToken || !selectedChannel) {
      toast({
        title: "Error",
        description: "Please select a bot token and channel",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    try {
      const response = await fetch("/api/discord/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken,
          channelId: selectedChannel,
          messageData,
          embedData,
        }),
      })

      if (response.ok) {
        const result = await response.json()

        // Track the sent message
        const sentMessage = {
          id: crypto.randomUUID(),
          messageId: result.messageId,
          channelId: selectedChannel,
          channelName: channels.find((c) => c.id === selectedChannel)?.name || "Unknown",
          guildId: selectedGuild,
          guildName: guilds.find((g) => g.id === selectedGuild)?.name || "Unknown",
          sentAt: new Date().toISOString(),
          messageData,
          embedData,
          botToken,
        }

        // Save to localStorage for management
        const existingSentMessages = JSON.parse(localStorage.getItem("discord-sent-messages") || "[]")
        existingSentMessages.push(sentMessage)
        localStorage.setItem("discord-sent-messages", JSON.stringify(existingSentMessages))

        toast({
          title: "Success!",
          description: "Message sent successfully to Discord",
        })
      } else {
        const error = await response.text()
        toast({
          title: "Error",
          description: error || "Failed to send message",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const clearAllData = () => {
    if (confirm("Are you sure you want to clear all saved data? This cannot be undone.")) {
      localStorage.removeItem("discord-bot-token")
      localStorage.removeItem("discord-selected-guild")
      localStorage.removeItem("discord-selected-channel")
      localStorage.removeItem("discord-guilds")
      localStorage.removeItem("discord-channels")
      localStorage.removeItem("discord-message-data")
      localStorage.removeItem("discord-embed-data")

      // Reset to defaults
      setBotToken("")
      setSelectedGuild("")
      setSelectedChannel("")
      setGuilds([])
      setChannels([])
      setMessageData({
        content: "",
        username: "",
        avatarUrl: "",
        tts: false,
      })
      setEmbedData({
        title: "",
        description: "",
        color: "#5865F2",
        url: "",
        thumbnail: "",
        image: "",
        footer: "",
        footerIcon: "",
        author: "",
        authorIcon: "",
        authorUrl: "",
        fields: [],
        timestamp: false,
      })

      toast({
        title: "Data Cleared",
        description: "All saved data has been cleared",
      })
    }
  }

  const handleImport = (importedData: any) => {
    if (importedData.messageData) {
      setMessageData(importedData.messageData)
    }
    if (importedData.embedData) {
      setEmbedData(importedData.embedData)
    }
  }

  useEffect(() => {
    if (selectedGuild) {
      fetchChannels(selectedGuild)
      setSelectedChannel("")
    }
  }, [selectedGuild])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="space-y-6">
            {/* Bot Configuration */}
            <Card className="border-0 shadow-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Bot Configuration
                </CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Configure your Discord bot and select destination
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="botToken">Bot Token</Label>
                  <div className="flex gap-2">
                    <Input
                      id="botToken"
                      type="password"
                      placeholder="Your Discord bot token"
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      className="bg-white/50 dark:bg-gray-700/50"
                    />
                    <Button
                      onClick={fetchGuilds}
                      disabled={!botToken || isLoadingGuilds}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                    >
                      {isLoadingGuilds ? "Loading..." : "Connect"}
                    </Button>
                  </div>
                </div>

                {guilds.length > 0 && (
                  <div className="space-y-2">
                    <Label>Server</Label>
                    <Select value={selectedGuild} onValueChange={setSelectedGuild}>
                      <SelectTrigger className="bg-white/50 dark:bg-gray-700/50">
                        <SelectValue placeholder="Select a server" />
                      </SelectTrigger>
                      <SelectContent>
                        {guilds.map((guild) => (
                          <SelectItem key={guild.id} value={guild.id}>
                            <div className="flex items-center gap-2">
                              {guild.icon && (
                                <img
                                  src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                                  alt=""
                                  className="w-4 h-4 rounded"
                                />
                              )}
                              {guild.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {channels.length > 0 && (
                  <div className="space-y-2">
                    <Label>Channel</Label>
                    <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                      <SelectTrigger className="bg-white/50 dark:bg-gray-700/50">
                        <SelectValue placeholder="Select a channel" />
                      </SelectTrigger>
                      <SelectContent>
                        {channels.map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            <div className="flex items-center gap-2">
                              <Hash className="w-4 h-4" />
                              {channel.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
              <div className="px-6 pb-4">
                <Button
                  onClick={clearAllData}
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 bg-white/50 dark:bg-gray-700/50"
                >
                  Clear All Saved Data
                </Button>
              </div>
            </Card>

            {/* Message Builder */}
            <Card className="border-0 shadow-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Message & Embed Builder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="message" className="w-full">
                  <TabsList className="grid w-full grid-cols-5 bg-gray-100/50 dark:bg-gray-700/50">
                    <TabsTrigger value="message">Message</TabsTrigger>
                    <TabsTrigger value="basic">Basic</TabsTrigger>
                    <TabsTrigger value="media">Media</TabsTrigger>
                    <TabsTrigger value="fields">Fields</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>

                  <TabsContent value="message" className="space-y-4 mt-6">
                    <div className="space-y-2">
                      <Label htmlFor="content">Message Content</Label>
                      <Textarea
                        id="content"
                        placeholder="Regular message content (optional)"
                        value={messageData.content}
                        onChange={(e) => setMessageData((prev) => ({ ...prev, content: e.target.value }))}
                        rows={5}
                        className="bg-white/50 dark:bg-gray-700/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Override Username</Label>
                        <Input
                          id="username"
                          placeholder="Custom sender name"
                          value={messageData.username}
                          onChange={(e) => setMessageData((prev) => ({ ...prev, username: e.target.value }))}
                          className="bg-white/50 dark:bg-gray-700/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="avatarUrl">Override Avatar URL</Label>
                        <Input
                          id="avatarUrl"
                          placeholder="https://example.com/avatar.png"
                          value={messageData.avatarUrl}
                          onChange={(e) => setMessageData((prev) => ({ ...prev, avatarUrl: e.target.value }))}
                          className="bg-white/50 dark:bg-gray-700/50"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="tts"
                        checked={messageData.tts}
                        onCheckedChange={(checked) => setMessageData((prev) => ({ ...prev, tts: checked }))}
                      />
                      <Label htmlFor="tts">Text-to-Speech</Label>
                    </div>
                  </TabsContent>

                  <TabsContent value="basic" className="space-y-4 mt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Embed Title</Label>
                        <Input
                          id="title"
                          placeholder="Embed title"
                          value={embedData.title}
                          onChange={(e) => setEmbedData((prev) => ({ ...prev, title: e.target.value }))}
                          className="bg-white/50 dark:bg-gray-700/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="color">Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="color"
                            type="color"
                            value={embedData.color}
                            onChange={(e) => setEmbedData((prev) => ({ ...prev, color: e.target.value }))}
                            className="w-16 bg-white/50 dark:bg-gray-700/50"
                          />
                          <Input
                            placeholder="#5865F2"
                            value={embedData.color}
                            onChange={(e) => setEmbedData((prev) => ({ ...prev, color: e.target.value }))}
                            className="bg-white/50 dark:bg-gray-700/50"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Embed description"
                        value={embedData.description}
                        onChange={(e) => setEmbedData((prev) => ({ ...prev, description: e.target.value }))}
                        rows={6}
                        className="bg-white/50 dark:bg-gray-700/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="url">Title URL (makes title clickable)</Label>
                      <Input
                        id="url"
                        placeholder="https://example.com"
                        value={embedData.url}
                        onChange={(e) => setEmbedData((prev) => ({ ...prev, url: e.target.value }))}
                        className="bg-white/50 dark:bg-gray-700/50"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="media" className="space-y-4 mt-6">
                    <div className="space-y-2">
                      <Label htmlFor="image" className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Large Image URL
                      </Label>
                      <Input
                        id="image"
                        placeholder="https://example.com/image.png"
                        value={embedData.image}
                        onChange={(e) => setEmbedData((prev) => ({ ...prev, image: e.target.value }))}
                        className="bg-white/50 dark:bg-gray-700/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="thumbnail">Thumbnail URL</Label>
                      <Input
                        id="thumbnail"
                        placeholder="https://example.com/thumb.png"
                        value={embedData.thumbnail}
                        onChange={(e) => setEmbedData((prev) => ({ ...prev, thumbnail: e.target.value }))}
                        className="bg-white/50 dark:bg-gray-700/50"
                      />
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Author Section
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="author">Author Name</Label>
                          <Input
                            id="author"
                            placeholder="Author name"
                            value={embedData.author}
                            onChange={(e) => setEmbedData((prev) => ({ ...prev, author: e.target.value }))}
                            className="bg-white/50 dark:bg-gray-700/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="authorIcon">Author Icon URL</Label>
                          <Input
                            id="authorIcon"
                            placeholder="https://example.com/avatar.png"
                            value={embedData.authorIcon}
                            onChange={(e) => setEmbedData((prev) => ({ ...prev, authorIcon: e.target.value }))}
                            className="bg-white/50 dark:bg-gray-700/50"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="authorUrl">Author URL</Label>
                        <Input
                          id="authorUrl"
                          placeholder="https://example.com"
                          value={embedData.authorUrl}
                          onChange={(e) => setEmbedData((prev) => ({ ...prev, authorUrl: e.target.value }))}
                          className="bg-white/50 dark:bg-gray-700/50"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="fields" className="space-y-4 mt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Embed Fields</h3>
                      <Button onClick={addField} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Field
                      </Button>
                    </div>

                    {embedData.fields.map((field, index) => (
                      <Card key={index} className="p-4 bg-white/30 dark:bg-gray-700/30">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary">Field {index + 1}</Badge>
                            <Button onClick={() => removeField(index)} size="sm" variant="destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Field Name</Label>
                              <Input
                                placeholder="Field name"
                                value={field.name}
                                onChange={(e) => updateField(index, { name: e.target.value })}
                                className="bg-white/50 dark:bg-gray-600/50"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Field Value</Label>
                              <Textarea
                                placeholder="Field value"
                                value={field.value}
                                onChange={(e) => updateField(index, { value: e.target.value })}
                                rows={3}
                                className="bg-white/50 dark:bg-gray-600/50"
                              />
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`inline-${index}`}
                              checked={field.inline}
                              onCheckedChange={(checked) => updateField(index, { inline: checked })}
                            />
                            <Label htmlFor={`inline-${index}`}>Display inline</Label>
                          </div>
                        </div>
                      </Card>
                    ))}

                    {embedData.fields.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No fields added yet. Click "Add Field" to get started.
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Footer Section</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="footer">Footer Text</Label>
                          <Input
                            id="footer"
                            placeholder="Footer text"
                            value={embedData.footer}
                            onChange={(e) => setEmbedData((prev) => ({ ...prev, footer: e.target.value }))}
                            className="bg-white/50 dark:bg-gray-700/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="footerIcon">Footer Icon URL</Label>
                          <Input
                            id="footerIcon"
                            placeholder="https://example.com/icon.png"
                            value={embedData.footerIcon}
                            onChange={(e) => setEmbedData((prev) => ({ ...prev, footerIcon: e.target.value }))}
                            className="bg-white/50 dark:bg-gray-700/50"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="timestamp"
                        checked={embedData.timestamp}
                        onCheckedChange={(checked) => setEmbedData((prev) => ({ ...prev, timestamp: checked }))}
                      />
                      <Label htmlFor="timestamp" className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Add timestamp
                      </Label>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <ExportImport onImport={handleImport} currentData={{ messageData, embedData }} />

            <Button
              onClick={sendMessage}
              disabled={isSending || !botToken || !selectedChannel}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg"
              size="lg"
            >
              {isSending ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send to Discord
                </>
              )}
            </Button>
          </div>

          {/* Preview Panel */}
          <div className="lg:sticky lg:top-4">
            <Card className="border-0 shadow-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">Live Preview</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  See how your message will look in Discord
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmbedPreview embedData={embedData} messageData={messageData} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

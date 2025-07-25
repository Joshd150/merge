import { type NextRequest, NextResponse } from "next/server"

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

export async function POST(request: NextRequest) {
  try {
    const {
      botToken,
      channelId,
      messageData,
      embedData,
    }: {
      botToken: string
      channelId: string
      messageData: MessageData
      embedData: EmbedData
    } = await request.json()

    if (!botToken || !channelId) {
      return NextResponse.json({ error: "Bot token and channel ID are required" }, { status: 400 })
    }

    // Build the message payload
    const payload: any = {}

    // Add regular message content
    if (messageData.content) {
      payload.content = messageData.content
    }

    // Add TTS
    if (messageData.tts) {
      payload.tts = true
    }

    // Build the Discord embed object
    const hasEmbedContent =
      embedData.title ||
      embedData.description ||
      embedData.author ||
      embedData.fields.length > 0 ||
      embedData.image ||
      embedData.footer

    if (hasEmbedContent) {
      const embed: any = {}

      if (embedData.title) embed.title = embedData.title
      if (embedData.description) embed.description = embedData.description
      if (embedData.url) embed.url = embedData.url
      if (embedData.color) {
        // Convert hex color to decimal
        embed.color = Number.parseInt(embedData.color.replace("#", ""), 16)
      }

      if (embedData.thumbnail) {
        embed.thumbnail = { url: embedData.thumbnail }
      }

      if (embedData.image) {
        embed.image = { url: embedData.image }
      }

      if (embedData.author) {
        embed.author = {
          name: embedData.author,
          ...(embedData.authorIcon && { icon_url: embedData.authorIcon }),
          ...(embedData.authorUrl && { url: embedData.authorUrl }),
        }
      }

      if (embedData.footer || embedData.timestamp) {
        embed.footer = {
          ...(embedData.footer && { text: embedData.footer }),
          ...(embedData.footerIcon && { icon_url: embedData.footerIcon }),
        }
      }

      if (embedData.timestamp) {
        embed.timestamp = new Date().toISOString()
      }

      if (embedData.fields.length > 0) {
        embed.fields = embedData.fields
          .filter((field) => field.name && field.value)
          .map((field) => ({
            name: field.name,
            value: field.value,
            inline: field.inline,
          }))
      }

      payload.embeds = [embed]
    }

    // If no content and no embed, return error
    if (!payload.content && !payload.embeds) {
      return NextResponse.json({ error: "Message must have content or embed" }, { status: 400 })
    }

    // Send the message
    const discordResponse = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text()
      console.error("Discord API error:", errorText)
      return NextResponse.json({ error: "Failed to send message to Discord" }, { status: discordResponse.status })
    }

    const result = await discordResponse.json()

    // Track the sent message for management
    const sentMessage = {
      id: crypto.randomUUID(),
      messageId: result.id,
      channelId,
      channelName: "Unknown", // You might want to fetch this
      guildId: "Unknown", // You might want to fetch this
      guildName: "Unknown", // You might want to fetch this
      sentAt: new Date().toISOString(),
      messageData,
      embedData,
      botToken, // Store for editing later
    }

    // Note: In a real implementation, you'd want to fetch channel/guild info
    // For now, we'll handle this on the client side

    return NextResponse.json({
      success: true,
      messageId: result.id,
      sentMessage,
    })
  } catch (error) {
    console.error("Message send error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

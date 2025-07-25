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
      messageId,
      messageData,
      embedData,
    }: {
      botToken: string
      channelId: string
      messageId: string
      messageData: MessageData
      embedData: EmbedData
    } = await request.json()

    if (!botToken || !channelId || !messageId) {
      return NextResponse.json({ error: "Bot token, channel ID, and message ID are required" }, { status: 400 })
    }

    // Build the message payload
    const payload: any = {}

    // Add regular message content
    if (messageData.content) {
      payload.content = messageData.content
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

    // Edit the message using Discord API
    const discordResponse = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text()
      console.error("Discord API error:", errorText)
      return NextResponse.json({ error: "Failed to edit message in Discord" }, { status: discordResponse.status })
    }

    const result = await discordResponse.json()
    return NextResponse.json({ success: true, messageId: result.id })
  } catch (error) {
    console.error("Message edit error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

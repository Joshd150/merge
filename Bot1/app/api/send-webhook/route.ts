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
}

export async function POST(request: NextRequest) {
  try {
    const { webhookUrl, embedData }: { webhookUrl: string; embedData: EmbedData } = await request.json()

    if (!webhookUrl) {
      return NextResponse.json({ error: "Webhook URL is required" }, { status: 400 })
    }

    // Build the Discord embed object
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

    if (embedData.footer) {
      embed.footer = {
        text: embedData.footer,
        ...(embedData.footerIcon && { icon_url: embedData.footerIcon }),
      }
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

    // Send the webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    })

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text()
      console.error("Discord webhook error:", errorText)
      return NextResponse.json({ error: "Failed to send webhook to Discord" }, { status: webhookResponse.status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook send error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

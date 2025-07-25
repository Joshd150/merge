import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const {
      botToken,
      channelId,
      messageId,
    }: {
      botToken: string
      channelId: string
      messageId: string
    } = await request.json()

    if (!botToken || !channelId || !messageId) {
      return NextResponse.json({ error: "Bot token, channel ID, and message ID are required" }, { status: 400 })
    }

    // Try to fetch the message from Discord API
    const discordResponse = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
      method: "GET",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
    })

    if (discordResponse.ok) {
      const message = await discordResponse.json()
      return NextResponse.json({ exists: true, message })
    } else if (discordResponse.status === 404) {
      return NextResponse.json({ exists: false }, { status: 404 })
    } else {
      const errorText = await discordResponse.text()
      console.error("Discord API error:", errorText)
      return NextResponse.json({ error: "Failed to validate message" }, { status: discordResponse.status })
    }
  } catch (error) {
    console.error("Message validation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    // Delete the message using Discord API
    const discordResponse = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text()
      console.error("Discord API error:", errorText)
      return NextResponse.json({ error: "Failed to delete message from Discord" }, { status: discordResponse.status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Message delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

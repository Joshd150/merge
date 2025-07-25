import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { botToken, guildId } = await request.json()

    if (!botToken || !guildId) {
      return NextResponse.json({ error: "Bot token and guild ID are required" }, { status: 400 })
    }

    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Discord API error:", error)
      return NextResponse.json({ error: "Failed to fetch channels" }, { status: response.status })
    }

    const channels = await response.json()
    return NextResponse.json({ channels })
  } catch (error) {
    console.error("Channel fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

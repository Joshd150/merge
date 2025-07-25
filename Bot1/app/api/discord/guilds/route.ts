import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { botToken } = await request.json()

    if (!botToken) {
      return NextResponse.json({ error: "Bot token is required" }, { status: 400 })
    }

    const response = await fetch("https://discord.com/api/v10/users/@me/guilds", {
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Discord API error:", error)
      return NextResponse.json({ error: "Invalid bot token or insufficient permissions" }, { status: response.status })
    }

    const guilds = await response.json()
    return NextResponse.json({ guilds })
  } catch (error) {
    console.error("Guild fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

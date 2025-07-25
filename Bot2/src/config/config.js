import dotenv from "dotenv"
dotenv.config()

export const config = {
  discord: {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
  },
  channels: {
    welcome: process.env.WELCOME_CHANNEL_ID,
    nflNews: process.env.NFL_NEWS_CHANNEL_ID,
    maddenNews: process.env.MADDEN_NEWS_CHANNEL_ID,
    rules: process.env.RULES_CHANNEL_ID,
    teams: process.env.TEAMS_CHANNEL_ID,
    league: process.env.LEAGUE_CHANNEL_ID,
    moderation: process.env.MODERATION_CHANNEL_ID, // Optional: for logging deleted invites
  },
  roles: {
    maddenLeague: process.env.MADDEN_LEAGUE_ROLE_ID,
    active: process.env.ACTIVE_ROLE_ID,
    inactive: process.env.INACTIVE_ROLE_ID,
    autoAssign: process.env.AUTO_ASSIGN_ROLE_ID,
    admin: process.env.ADMIN_ROLE_ID, // Optional: exempt from invite filter
    moderator: process.env.MODERATOR_ROLE_ID, // Optional: exempt from invite filter
  },
  activity: {
    inactiveHours: Number.parseInt(process.env.INACTIVE_HOURS) || 26,
  },
  rss: {
    nflUrl: process.env.NFL_RSS_URL,
    maddenUrl: process.env.MADDEN_RSS_URL,
  },
  welcome: {
    embedsEnabled: process.env.WELCOME_EMBEDS_ENABLED === "true",
  },
  inviteFilter: {
    enabled: process.env.INVITE_FILTER_ENABLED !== "false", // Enabled by default
  },
}

// Validate required configuration
const requiredEnvVars = [
  "DISCORD_TOKEN",
  "CLIENT_ID",
  "GUILD_ID",
  "WELCOME_CHANNEL_ID",
  "MADDEN_LEAGUE_ROLE_ID",
  "ACTIVE_ROLE_ID",
  "INACTIVE_ROLE_ID",
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`)
    process.exit(1)
  }
}

import { logger } from "../utils/logger.js"
import { config } from "../config/config.js"

export function setupEventHandlers(client, modules) {
  const { activityTracker, welcomeSystem, newsFeeds, commandHandler, inviteFilter } = modules

  // Handle slash commands
  client.on("interactionCreate", async (interaction) => {
    await commandHandler.handleInteraction(interaction)
  })

  // Track user activity on messages AND filter invites
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return

    // Filter Discord invites FIRST (before activity tracking)
    await inviteFilter.handleMessage(message)

    // Only track users with Madden League role
    if (message.member && message.member.roles.cache.has(config.roles.maddenLeague)) {
      await activityTracker.updateUserActivity(message.author.id, message.guild.id)
    }
  })

  // Handle new members joining
  client.on("guildMemberAdd", async (member) => {
    await welcomeSystem.handleMemberJoin(member)
  })

  // Handle role updates (for welcome system and role management)
  client.on("guildMemberUpdate", async (oldMember, newMember) => {
    // Check if Madden League role was added
    const hadMaddenRole = oldMember.roles.cache.has(config.roles.maddenLeague)
    const hasMaddenRole = newMember.roles.cache.has(config.roles.maddenLeague)

    if (!hadMaddenRole && hasMaddenRole) {
      // User just got the Madden League role

      // Always assign active role when someone gets Madden League role
      const activeRole = newMember.guild.roles.cache.get(config.roles.active)
      if (activeRole && !newMember.roles.cache.has(config.roles.active)) {
        try {
          await newMember.roles.add(activeRole)
          logger.info(`Auto-assigned active role to ${newMember.user.tag} when they received Madden League role`)
        } catch (error) {
          logger.error(`Failed to assign active role to ${newMember.user.tag}:`, error)
        }
      }

      // Send welcome message only if embeds are enabled
      if (config.welcome.embedsEnabled) {
        await welcomeSystem.sendWelcomeMessage(newMember)
      }

      // Initialize their activity tracking
      await activityTracker.updateUserActivity(newMember.user.id, newMember.guild.id)
    }
  })

  // Error handling
  client.on("error", (error) => {
    logger.error("Discord client error:", error)
  })

  client.on("warn", (warning) => {
    logger.warn("Discord client warning:", warning)
  })

  // Graceful shutdown handling
  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason)
  })

  process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception:", error)
    process.exit(1)
  })
}

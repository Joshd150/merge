import { Client, GatewayIntentBits } from "discord.js"
import { config } from "./config/config.js"
import { ActivityTracker } from "./modules/activityTracker.js"
import { WelcomeSystem } from "./modules/welcomeSystem.js"
import { NewsFeeds } from "./modules/newsFeeds.js"
import { CommandHandler } from "./modules/commandHandler.js"
import { InviteFilter } from "./modules/inviteFilter.js"
import { deployCommands } from "./commands/deployCommands.js"
import { setupEventHandlers } from "./events/eventHandlers.js"
import { logger } from "./utils/logger.js"

class GridironBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildPresences,
      ],
    })

    this.activityTracker = new ActivityTracker(this.client)
    this.welcomeSystem = new WelcomeSystem(this.client)
    this.newsFeeds = new NewsFeeds(this.client)
    this.commandHandler = new CommandHandler(this.client)
    this.inviteFilter = new InviteFilter(this.client)
    this.isShuttingDown = false

    this.setupBot()
  }

  setupBot() {
    setupEventHandlers(this.client, {
      activityTracker: this.activityTracker,
      welcomeSystem: this.welcomeSystem,
      newsFeeds: this.newsFeeds,
      commandHandler: this.commandHandler,
      inviteFilter: this.inviteFilter,
    })

    this.client.once("ready", async () => {
      try {
        logger.info(`🏈 ${this.client.user.tag} is ready for the season!`)

        // Validate guild and roles exist
        await this.validateConfiguration()

        // Initialize modules with persistent storage
        await this.activityTracker.initialize()
        await this.welcomeSystem.initialize()
        await this.newsFeeds.initialize()
        await this.inviteFilter.initialize()

        // Deploy commands and start services
        await deployCommands()
        this.newsFeeds.startNewsFeeds()
        this.activityTracker.startActivityCheck()

        logger.info("🚀 All systems operational!")
      } catch (error) {
        logger.error("Failed to initialize bot:", error)
        process.exit(1)
      }
    })
  }

  async validateConfiguration() {
    const guild = this.client.guilds.cache.get(config.discord.guildId)
    if (!guild) {
      throw new Error(`Guild with ID ${config.discord.guildId} not found`)
    }

    // Validate required roles exist
    const requiredRoles = [
      { id: config.roles.maddenLeague, name: "Madden League" },
      { id: config.roles.active, name: "Active" },
      { id: config.roles.inactive, name: "Inactive" },
    ]

    for (const roleConfig of requiredRoles) {
      const role = guild.roles.cache.get(roleConfig.id)
      if (!role) {
        throw new Error(`Required role "${roleConfig.name}" (${roleConfig.id}) not found in guild`)
      }
    }

    // Validate required channels exist
    const requiredChannels = [{ id: config.channels.welcome, name: "Welcome" }]

    for (const channelConfig of requiredChannels) {
      if (channelConfig.id) {
        const channel = guild.channels.cache.get(channelConfig.id)
        if (!channel) {
          logger.warn(`Channel "${channelConfig.name}" (${channelConfig.id}) not found`)
        }
      }
    }

    logger.info("✅ Configuration validation complete")
  }

  async start() {
    try {
      await this.client.login(config.discord.token)
    } catch (error) {
      logger.error("Failed to start bot:", error)
      process.exit(1)
    }
  }

  async shutdown() {
    if (this.isShuttingDown) return
    this.isShuttingDown = true

    logger.info("🛑 Shutting down bot...")

    try {
      await Promise.all([
        this.activityTracker.shutdown(),
        this.welcomeSystem.shutdown(),
        this.newsFeeds.shutdown(),
        this.inviteFilter.shutdown(),
      ])

      this.client.destroy()
      logger.info("✅ Bot shutdown complete")
    } catch (error) {
      logger.error("Error during shutdown:", error)
    }
  }
}

// Start the bot
const bot = new GridironBot()
bot.start()

// Graceful shutdown handlers
const shutdownHandler = async (signal) => {
  logger.info(`Received ${signal}, shutting down gracefully...`)
  await bot.shutdown()
  process.exit(0)
}

process.on("SIGINT", shutdownHandler)
process.on("SIGTERM", shutdownHandler)

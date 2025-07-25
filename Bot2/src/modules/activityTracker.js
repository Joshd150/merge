import { config } from "../config/config.js"
import { logger } from "../utils/logger.js"
import { DataStore } from "../utils/dataStore.js"
import cron from "node-cron"

export class ActivityTracker {
  constructor(client) {
    this.client = client
    this.dataStore = new DataStore()
    this.activityData = {}
    this.checkInterval = null
    this.isProcessing = false
  }

  async initialize() {
    try {
      // Load existing activity data
      this.activityData = await this.dataStore.load()

      // Ensure data structure exists
      if (!this.activityData.userActivity) {
        this.activityData.userActivity = {}
      }

      // Start auto-save
      this.dataStore.startAutoSave(this.activityData)

      logger.info(
        `Activity tracker initialized with ${Object.keys(this.activityData.userActivity || {}).length} tracked users`,
      )
    } catch (error) {
      logger.error("Failed to initialize activity tracker:", error)
      this.activityData = { userActivity: {}, lastSave: Date.now() }
    }
  }

  async updateUserActivity(userId, guildId) {
    try {
      if (!this.activityData.userActivity) {
        this.activityData.userActivity = {}
      }

      const key = `${guildId}-${userId}`
      this.activityData.userActivity[key] = {
        userId,
        guildId,
        lastActivity: Date.now(),
        lastUpdated: new Date().toISOString(),
      }

      // Check if user needs to be moved from inactive to active immediately
      await this.checkUserRoleUpdate(userId, guildId)
    } catch (error) {
      logger.error("Error updating user activity:", error)
    }
  }

  async checkUserRoleUpdate(userId, guildId) {
    try {
      const guild = this.client.guilds.cache.get(guildId)
      if (!guild) return

      const member = guild.members.cache.get(userId)
      if (!member || !member.roles.cache.has(config.roles.maddenLeague)) return

      const activeRole = guild.roles.cache.get(config.roles.active)
      const inactiveRole = guild.roles.cache.get(config.roles.inactive)

      if (!activeRole || !inactiveRole) return

      // If user is currently inactive but just sent a message, make them active
      if (member.roles.cache.has(config.roles.inactive)) {
        await member.roles.remove(inactiveRole)
        await member.roles.add(activeRole)
        await this.sendActiveDM(member)
        logger.info(`${member.user.tag} moved from inactive to active due to recent activity`)
      }
    } catch (error) {
      logger.error("Error checking user role update:", error)
    }
  }

  async checkInactiveUsers() {
    if (this.isProcessing) {
      logger.debug("Activity check already in progress, skipping...")
      return
    }

    this.isProcessing = true

    try {
      const guild = this.client.guilds.cache.get(config.discord.guildId)
      if (!guild) {
        logger.error("Guild not found for activity check")
        return
      }

      // Ensure we have all members cached
      await guild.members.fetch()

      const maddenRole = guild.roles.cache.get(config.roles.maddenLeague)
      const activeRole = guild.roles.cache.get(config.roles.active)
      const inactiveRole = guild.roles.cache.get(config.roles.inactive)

      if (!maddenRole || !activeRole || !inactiveRole) {
        logger.error("Required roles not found for activity check")
        return
      }

      const now = Date.now()
      const inactiveThreshold = config.activity.inactiveHours * 60 * 60 * 1000 // 26 hours in milliseconds
      let changesCount = 0

      // Check all members with Madden League role
      const leagueMembers = guild.members.cache.filter(
        (member) => member.roles.cache.has(config.roles.maddenLeague) && !member.user.bot,
      )

      logger.info(`Checking activity for ${leagueMembers.size} league members`)

      for (const [memberId, member] of leagueMembers) {
        try {
          const key = `${guild.id}-${memberId}`
          const userData = this.activityData.userActivity[key]

          // If no activity data, consider them as needing active role (new member)
          if (!userData) {
            if (!member.roles.cache.has(config.roles.active)) {
              await member.roles.add(activeRole)
              logger.info(`Added active role to new league member: ${member.user.tag}`)
              changesCount++
            }
            // Initialize their activity data
            await this.updateUserActivity(memberId, guild.id)
            continue
          }

          const timeSinceLastActivity = now - userData.lastActivity
          const isCurrentlyActive = member.roles.cache.has(config.roles.active)
          const isCurrentlyInactive = member.roles.cache.has(config.roles.inactive)

          // User should be inactive (26+ hours since last message)
          if (timeSinceLastActivity >= inactiveThreshold) {
            if (isCurrentlyActive) {
              await member.roles.remove(activeRole)
              await member.roles.add(inactiveRole)
              await this.sendInactiveDM(member)
              logger.info(
                `Moved ${member.user.tag} to inactive (${Math.round(timeSinceLastActivity / (60 * 60 * 1000))}h since last activity)`,
              )
              changesCount++
            }
          }
          // User should be active (less than 26 hours since last message)
          else {
            if (isCurrentlyInactive) {
              await member.roles.remove(inactiveRole)
              await member.roles.add(activeRole)
              await this.sendActiveDM(member)
              logger.info(`Moved ${member.user.tag} back to active`)
              changesCount++
            } else if (!isCurrentlyActive && !isCurrentlyInactive) {
              // Member has no active/inactive role, give them active
              await member.roles.add(activeRole)
              logger.info(`Added active role to ${member.user.tag} (missing role)`)
              changesCount++
            }
          }

          // Add small delay to prevent rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100))
        } catch (memberError) {
          logger.error(`Error processing member ${member.user.tag}:`, memberError)
        }
      }

      if (changesCount > 0) {
        logger.info(`Activity check complete: ${changesCount} role changes made`)
      } else {
        logger.debug("Activity check complete: no changes needed")
      }

      // Cleanup old data periodically
      if (Math.random() < 0.1) {
        // 10% chance each run
        await this.cleanupOldData()
      }
    } catch (error) {
      logger.error("Error during activity check:", error)
    } finally {
      this.isProcessing = false
    }
  }

  async sendInactiveDM(member) {
    try {
      const embed = {
        color: 0xff6b35,
        title: "😴 You've Been Marked as Inactive",
        description: `Hey ${member.user.username}, you haven't been active in the Gridiron Fantasy League server for over ${config.activity.inactiveHours} hours.`,
        fields: [
          {
            name: "🔄 How to Get Back to Active",
            value: "Simply send a message in any channel and you'll automatically be marked as active again!",
            inline: false,
          },
          {
            name: "🏈 Stay Engaged",
            value: "Keep participating in league discussions to maintain your active status.",
            inline: false,
          },
        ],
        footer: {
          text: "Gridiron Fantasy League Bot",
          icon_url: "https://i.imgur.com/hU7ulOM.png",
        },
        timestamp: new Date().toISOString(),
      }

      await member.send({ embeds: [embed] })
      logger.debug(`Sent inactive DM to ${member.user.tag}`)
    } catch (error) {
      logger.debug(`Could not send inactive DM to ${member.user.tag}: ${error.message}`)
    }
  }

  async sendActiveDM(member) {
    try {
      const embed = {
        color: 0x10b981,
        title: "🎉 Welcome Back to Active Status!",
        description: `Great to see you back, ${member.user.username}! You've been marked as active again.`,
        fields: [
          {
            name: "🏈 You're Back in the Game",
            value: "Your active participation keeps our league strong and competitive!",
            inline: false,
          },
          {
            name: "💪 Keep It Up",
            value: "Stay engaged to maintain your active status in the league.",
            inline: false,
          },
        ],
        footer: {
          text: "Gridiron Fantasy League Bot",
          icon_url: "https://i.imgur.com/hU7ulOM.png",
        },
        timestamp: new Date().toISOString(),
      }

      await member.send({ embeds: [embed] })
      logger.debug(`Sent active DM to ${member.user.tag}`)
    } catch (error) {
      logger.debug(`Could not send active DM to ${member.user.tag}: ${error.message}`)
    }
  }

  startActivityCheck() {
    // Check every 30 minutes
    this.checkInterval = cron.schedule("*/30 * * * *", () => {
      this.checkInactiveUsers()
    })

    // Run initial check after 1 minute
    setTimeout(() => {
      this.checkInactiveUsers()
    }, 60000)

    logger.info("Activity checker started (every 30 minutes)")
  }

  async cleanupOldData() {
    try {
      if (!this.activityData.userActivity) return

      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
      let cleanedCount = 0

      for (const [key, userData] of Object.entries(this.activityData.userActivity)) {
        if (userData.lastActivity < thirtyDaysAgo) {
          delete this.activityData.userActivity[key]
          cleanedCount++
        }
      }

      if (cleanedCount > 0) {
        await this.dataStore.save(this.activityData)
        logger.info(`Cleaned up ${cleanedCount} old activity records`)
      }
    } catch (error) {
      logger.error("Error cleaning up old data:", error)
    }
  }

  async shutdown() {
    if (this.checkInterval) {
      this.checkInterval.destroy()
    }
    this.dataStore.stopAutoSave()
    await this.dataStore.save(this.activityData)
    logger.info("Activity tracker shutdown complete")
  }
}

import { logger } from "../utils/logger.js"
import { config } from "../config/config.js"

export class InviteFilter {
  constructor(client) {
    this.client = client
    this.inviteRegex = [
      /discord\.gg\/[a-zA-Z0-9]+/gi,
      /discordapp\.com\/invite\/[a-zA-Z0-9]+/gi,
      /discord\.com\/invite\/[a-zA-Z0-9]+/gi,
      /dsc\.gg\/[a-zA-Z0-9]+/gi,
      /invite\.gg\/[a-zA-Z0-9]+/gi,
    ]
    this.exemptRoles = new Set([config.roles.admin || null, config.roles.moderator || null].filter(Boolean))
  }

  async initialize() {
    logger.info("Invite filter initialized - Discord invites will be automatically deleted")
  }

  hasExemptRole(member) {
    if (!member || !member.roles) return false

    // Check if user has Administrator permission
    if (member.permissions?.has("Administrator")) return true

    // Check if user has any exempt roles
    return Array.from(this.exemptRoles).some((roleId) => member.roles.cache.has(roleId))
  }

  containsInvite(content) {
    return this.inviteRegex.some((regex) => regex.test(content))
  }

  async handleMessage(message) {
    try {
      // Skip if bot message
      if (message.author.bot) return

      // Skip if no content
      if (!message.content) return

      // Skip if user has exempt permissions
      if (this.hasExemptRole(message.member)) return

      // Check if message contains Discord invite
      if (this.containsInvite(message.content)) {
        await this.deleteInviteMessage(message)
      }
    } catch (error) {
      logger.error("Error in invite filter:", error)
    }
  }

  async deleteInviteMessage(message) {
    try {
      // Delete the message
      await message.delete()

      // Log the action
      logger.info(`Deleted Discord invite from ${message.author.tag} in #${message.channel.name}`)

      // Send warning DM to user
      await this.sendWarningDM(message.author, message.guild)

      // Optional: Log to moderation channel
      await this.logToModerationChannel(message)
    } catch (error) {
      logger.error(`Failed to delete invite message from ${message.author.tag}:`, error)
    }
  }

  async sendWarningDM(user, guild) {
    try {
      const embed = {
        color: 0xff6b35,
        title: "⚠️ Discord Invite Removed",
        description: `Your message containing a Discord invite link was automatically removed from **${guild.name}**.`,
        fields: [
          {
            name: "📋 Server Policy",
            value: "No advertising other servers",
            inline: false,
          },
        ],
        footer: {
          text: "Gridiron Football League Bot",
          icon_url: "https://i.imgur.com/hU7ulOM.png",
        },
        timestamp: new Date().toISOString(),
      }

      await user.send({ embeds: [embed] })
      logger.debug(`Sent invite warning DM to ${user.tag}`)
    } catch (error) {
      logger.debug(`Could not send warning DM to ${user.tag}: ${error.message}`)
    }
  }

  async logToModerationChannel(message) {
    try {
      if (!config.channels.moderation) return

      const guild = message.guild
      const modChannel = guild.channels.cache.get(config.channels.moderation)
      if (!modChannel) return

      const embed = {
        color: 0xff6b35,
        title: "🚫 Discord Invite Deleted",
        description: "Automatically removed Discord invite link",
        fields: [
          {
            name: "👤 User",
            value: `${message.author.tag} (${message.author.id})`,
            inline: true,
          },
          {
            name: "📍 Channel",
            value: `<#${message.channel.id}>`,
            inline: true,
          },
          {
            name: "📝 Original Message",
            value: message.content.length > 1000 ? message.content.substring(0, 1000) + "..." : message.content,
            inline: false,
          },
        ],
        footer: {
          text: "Invite Filter",
          icon_url: "https://i.imgur.com/hU7ulOM.png",
        },
        timestamp: new Date().toISOString(),
      }

      await modChannel.send({ embeds: [embed] })
    } catch (error) {
      logger.debug("Could not log to moderation channel:", error.message)
    }
  }

  async shutdown() {
    logger.info("Invite filter shutdown complete")
  }
}

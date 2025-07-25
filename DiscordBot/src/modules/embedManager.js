import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle
} from "discord.js"
import { config } from "../config/config.js"
import { logger } from "../utils/logger.js"
import { DataStore } from "../utils/dataStore.js"

export class EmbedManager {
  constructor(client) {
    this.client = client
    this.dataStore = new DataStore('embedData.json')
    this.embedConfigs = new Map()
    this.activeEmbeds = new Map() // Track active embeds by message ID
  }

  async initialize() {
    try {
      const data = await this.dataStore.load()
      
      // Handle legacy data structure migration
      if (data.embedConfigs && typeof data.embedConfigs === 'object') {
        // New format - embedConfigs is already an object
        for (const [id, config] of Object.entries(data.embedConfigs)) {
          this.embedConfigs.set(id, config)
        }
      } else if (data.embeds && Array.isArray(data.embeds)) {
        // Legacy format - embeds was an array
        for (const config of data.embeds) {
          this.embedConfigs.set(config.id || Date.now().toString(), config)
        }
        logger.info("Migrated legacy embed configurations")
      }


      // Restore active embeds
      if (data.activeEmbeds) {
        for (const [messageId, embedData] of Object.entries(data.activeEmbeds)) {
          this.activeEmbeds.set(messageId, embedData)
        }
      }

      logger.info(`Embed manager initialized with ${this.embedConfigs.size} configurations`)
    } catch (error) {
      logger.error("Failed to initialize embed manager:", error)
    }
  }

  async saveData() {
    try {
      const data = {
        embedConfigs: Object.fromEntries(this.embedConfigs),
        activeEmbeds: Object.fromEntries(this.activeEmbeds),
        lastSave: Date.now()
      }
      await this.dataStore.save(data)
    } catch (error) {
      logger.error("Failed to save embed data:", error)
    }
  }

  createEmbedConfig(configData) {
    const config = {
      id: configData.id || Date.now().toString(),
      title: configData.title || "Custom Embed",
      description: configData.description || "",
      color: configData.color || "#5865F2",
      emoji: configData.emoji || "📝",
      channelId: configData.channelId,
      targetChannelId: configData.targetChannelId,
      responseTitle: configData.responseTitle || "Response",
      fields: configData.fields || [],
      createdAt: new Date().toISOString()
    }

    this.embedConfigs.set(config.id, config)
    this.saveData()
    return config
  }

  async sendCustomEmbed(configId, channelId) {
    try {
      const config = this.embedConfigs.get(configId)
      if (!config) {
        throw new Error(`Embed configuration ${configId} not found`)
      }

      const guild = this.client.guilds.cache.get(config.discord?.guildId || config.guildId || process.env.GUILD_ID)
      if (!guild) {
        throw new Error("Guild not found")
      }

      const channel = guild.channels.cache.get(channelId || config.channelId)
      if (!channel) {
        throw new Error("Channel not found")
      }

      const embed = new EmbedBuilder()
        .setTitle(config.title)
        .setDescription(config.description)
        .setColor(config.color)
        .setFooter({
          text: config.emoji ? "Click the reaction below to respond" : "Interactive embed",
          iconURL: guild.iconURL()
        })
        .setTimestamp()

      const message = await channel.send({ embeds: [embed] })
      
      // Only add reaction if emoji is configured
      if (config.emoji && config.emoji.trim()) {
        await message.react(config.emoji)
        
        // Store the active embed only if it has reactions
        this.activeEmbeds.set(message.id, {
          configId: configId,
          channelId: channel.id,
          guildId: guild.id,
          createdAt: new Date().toISOString()
        })
      }


      await this.saveData()
      
      logger.info(`Sent custom embed ${configId} to channel ${channel.name}`)
      return message
    } catch (error) {
      logger.error("Error sending custom embed:", error)
      throw error
    }
  }

  async handleReaction(reaction, user) {
    try {
      if (user.bot) return

      const messageId = reaction.message.id
      const activeEmbed = this.activeEmbeds.get(messageId)
      
      if (!activeEmbed) return

      const config = this.embedConfigs.get(activeEmbed.configId)
      if (!config || !config.emoji) return

      // Check if the reaction matches the configured emoji
      if (reaction.emoji.name !== config.emoji && reaction.emoji.toString() !== config.emoji) {
        return
      }

      // Remove the user's reaction to keep it at 1
      await reaction.users.remove(user.id)

      // Create and show modal via DM
      await this.sendModalDM(user, config, reaction.message.guild)
      
    } catch (error) {
      logger.error("Error handling reaction:", error)
    }
  }

  async sendModalDM(user, config, guild) {
    try {
      const button = new ButtonBuilder()
        .setCustomId(`show_modal_${config.id}`)
        .setLabel(`Open ${config.title}`)
        .setStyle(ButtonStyle.Primary)
        .setEmoji(config.emoji)

      const row = new ActionRowBuilder().addComponents(button)

      const embed = new EmbedBuilder()
        .setTitle("📝 Form Ready")
        .setDescription(`Click the button below to open the **${config.title}** form.`)
        .setColor(config.color)
        .setFooter({
          text: `From ${guild.name}`,
          iconURL: guild.iconURL()
        })

      const dmChannel = await user.createDM()
      await dmChannel.send({
        embeds: [embed],
        components: [row]
      })

      logger.debug(`Sent modal DM to ${user.tag} for config ${config.id}`)
    } catch (error) {
      logger.error("Error sending modal DM:", error)
    }
  }

  async handleButtonInteraction(interaction) {
    try {
      const customId = interaction.customId
      
      if (customId.startsWith('show_modal_')) {
        const configId = customId.replace('show_modal_', '')
        const config = this.embedConfigs.get(configId)
        
        if (!config) {
          await interaction.reply({
            content: "❌ Form configuration not found.",
            ephemeral: true
          })
          return
        }

        const modal = new ModalBuilder()
          .setCustomId(`embed_modal_${config.id}`)
          .setTitle(config.title.substring(0, 45))

        const components = []
        
        for (let i = 0; i < Math.min(config.fields.length, 5); i++) {
          const field = config.fields[i]
          const textInput = new TextInputBuilder()
            .setCustomId(`field_${i}`)
            .setLabel(field.label.substring(0, 45))
            .setStyle(field.multiline ? TextInputStyle.Paragraph : TextInputStyle.Short)
            .setRequired(field.required || false)
            .setMaxLength(field.maxLength || (field.multiline ? 4000 : 1000))

          if (field.placeholder) {
            textInput.setPlaceholder(field.placeholder.substring(0, 100))
          }

          const actionRow = new ActionRowBuilder().addComponents(textInput)
          components.push(actionRow)
        }

        modal.addComponents(...components)
        await interaction.showModal(modal)
      }
    } catch (error) {
      logger.error("Error handling button interaction:", error)
    }
  }

  async handleModalSubmit(interaction) {
    try {
      const customId = interaction.customId
      const configId = customId.replace('embed_modal_', '')
      const config = this.embedConfigs.get(configId)

      if (!config) {
        await interaction.reply({
          content: "❌ Form configuration not found.",
          ephemeral: true
        })
        return
      }

      // Collect responses
      const responses = {}
      for (let i = 0; i < config.fields.length && i < 5; i++) {
        try {
          const fieldValue = interaction.fields.getTextInputValue(`field_${i}`)
          responses[config.fields[i].label] = fieldValue
        } catch (error) {
          // Field might not exist if there are more than 5 fields
          break
        }
      }

      // Send response to target channel
      await this.sendResponse(config, responses, interaction.user, interaction.guild || this.client.guilds.cache.get(config.guildId))

      await interaction.reply({
        content: "✅ Your response has been submitted successfully!",
        ephemeral: true
      })

    } catch (error) {
      logger.error("Error handling modal submit:", error)
      await interaction.reply({
        content: "❌ An error occurred while processing your response.",
        ephemeral: true
      })
    }
  }

  async sendResponse(config, responses, user, guild) {
    try {
      const targetChannel = guild.channels.cache.get(config.targetChannelId)
      if (!targetChannel) {
        logger.error(`Target channel ${config.targetChannelId} not found`)
        return
      }

      const embed = new EmbedBuilder()
        .setTitle(config.responseTitle)
        .setColor(config.color)
        .setAuthor({
          name: user.displayName || user.username,
          iconURL: user.displayAvatarURL()
        })
        .setTimestamp()
        .setFooter({
          text: `User ID: ${user.id}`,
          iconURL: guild.iconURL()
        })

      // Add response fields
      for (const [label, value] of Object.entries(responses)) {
        embed.addFields({
          name: label,
          value: value || "No response",
          inline: false
        })
      }

      await targetChannel.send({ embeds: [embed] })
      logger.info(`Sent response from ${user.tag} to ${targetChannel.name}`)
      
    } catch (error) {
      logger.error("Error sending response:", error)
    }
  }

  getEmbedConfigs() {
    return Array.from(this.embedConfigs.values())
  }

  getEmbedConfig(id) {
    return this.embedConfigs.get(id)
  }

  updateEmbedConfig(id, updates) {
    const config = this.embedConfigs.get(id)
    if (!config) return null

    const updatedConfig = { ...config, ...updates }
    this.embedConfigs.set(id, updatedConfig)
    this.saveData()
    return updatedConfig
  }

  deleteEmbedConfig(id) {
    const deleted = this.embedConfigs.delete(id)
    if (deleted) {
      this.saveData()
    }
    return deleted
  }

  async shutdown() {
    await this.saveData()
    logger.info("Embed manager shutdown complete")
  }
}
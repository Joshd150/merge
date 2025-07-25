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
      emoji: configData.emoji || "", // Can be empty for display-only embeds
      buttonLabel: configData.buttonLabel || "Open Form", // Custom button text
      channelId: configData.channelId,
      targetChannelId: configData.targetChannelId,
      responseTitle: configData.responseTitle || "Response",
      fields: configData.fields || [],
      interactionType: configData.interactionType || "button", // "button", "reaction", or "none"
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

      const guild = this.client.guilds.cache.get(config.guildId || process.env.GUILD_ID)
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
        .setTimestamp()

      // Determine footer text based on interaction type
      let footerText = "Information embed"
      if (config.fields && config.fields.length > 0) {
        if (config.interactionType === "button") {
          footerText = "Click the button below to respond"
        } else if (config.interactionType === "reaction" && config.emoji) {
          footerText = "Click the reaction to respond"
        }
      }

      embed.setFooter({
        text: footerText,
        iconURL: guild.iconURL()
      })

      const components = []

      // Add button if this is an interactive form with button interaction
      if (config.fields && config.fields.length > 0 && config.interactionType === "button") {
        const button = new ButtonBuilder()
          .setCustomId(`form_button_${config.id}`)
          .setLabel(config.buttonLabel || "Open Form")
          .setStyle(ButtonStyle.Primary)

        // Add emoji to button if provided
        if (config.emoji && config.emoji.trim()) {
          button.setEmoji(config.emoji)
        }

        const row = new ActionRowBuilder().addComponents(button)
        components.push(row)
      }

      const messageOptions = { embeds: [embed] }
      if (components.length > 0) {
        messageOptions.components = components
      }

      const message = await channel.send(messageOptions)

      // Add emoji reaction if using reaction method
      if (config.fields && config.fields.length > 0 && config.interactionType === "reaction" && config.emoji && config.emoji.trim()) {
        await message.react(config.emoji)
        
        // Store the active embed for reaction handling
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

  /**
   * Handle button interactions - DIRECT MODAL POPUP
   * This is the recommended method for seamless user experience
   */
  async handleButtonInteraction(interaction) {
    try {
      const customId = interaction.customId
      
      // Handle form button clicks - DIRECT MODAL POPUP
      if (customId.startsWith('form_button_')) {
        const configId = customId.replace('form_button_', '')
        const config = this.embedConfigs.get(configId)
        
        if (!config) {
          await interaction.reply({
            content: "❌ Form configuration not found.",
            flags: 64 // EPHEMERAL
          })
          return
        }

        // Create and show modal DIRECTLY - no intermediate steps
        const modal = await this.createModal(config)
        await interaction.showModal(modal)
        
        logger.debug(`Showed modal directly to ${interaction.user.tag} for config ${config.id}`)
        return
      }

      // Legacy support for old button format
      if (customId.startsWith('show_modal_')) {
        const configId = customId.replace('show_modal_', '')
        const config = this.embedConfigs.get(configId)
        
        if (!config) {
          await interaction.reply({
            content: "❌ Form configuration not found.",
            flags: 64 // EPHEMERAL
          })
          return
        }

        const modal = await this.createModal(config)
        await interaction.showModal(modal)
      }
    } catch (error) {
      logger.error("Error handling button interaction:", error)
      await interaction.reply({
        content: "❌ An error occurred while opening the form.",
        flags: 64 // EPHEMERAL
      }).catch(() => {}) // Ignore if already replied
    }
  }

  /**
   * Handle emoji reactions - WORKAROUND FOR DIRECT MODAL
   * Note: This is a limitation of Discord's API - reactions can't directly show modals
   */
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

      // Remove the user's reaction to keep it clean
      await reaction.users.remove(user.id)

      // WORKAROUND: Create a temporary button that triggers the modal
      // This is the closest we can get to "direct" modal from reactions
      const button = new ButtonBuilder()
        .setCustomId(`form_button_${config.id}`)
        .setLabel(`Open ${config.title}`)
        .setStyle(ButtonStyle.Primary)
        .setEmoji(config.emoji)

      const row = new ActionRowBuilder().addComponents(button)

      const embed = new EmbedBuilder()
        .setTitle("📝 Form Ready")
        .setDescription(`Click the button to open **${config.title}**`)
        .setColor(config.color)

      // Send temporary message that auto-deletes
      const tempMessage = await reaction.message.channel.send({
        content: `<@${user.id}>`,
        embeds: [embed],
        components: [row]
      })

      // Auto-delete after 30 seconds
      setTimeout(async () => {
        try {
          await tempMessage.delete()
        } catch (error) {
          logger.debug("Could not delete temporary message:", error.message)
        }
      }, 30000)

      logger.debug(`Created temporary button for ${user.tag} to access form ${config.id}`)
      
    } catch (error) {
      logger.error("Error handling reaction:", error)
    }
  }

  /**
   * Create modal form from configuration
   */
  async createModal(config) {
    const modal = new ModalBuilder()
      .setCustomId(`embed_modal_${config.id}`)
      .setTitle(config.title.substring(0, 45)) // Discord limit

    const components = []
    
    // Create text inputs for each field (max 5 per modal)
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
    return modal
  }

  /**
   * Handle modal form submissions
   */
  async handleModalSubmit(interaction) {
    try {
      const customId = interaction.customId
      const configId = customId.replace('embed_modal_', '')
      const config = this.embedConfigs.get(configId)

      if (!config) {
        await interaction.reply({
          content: "❌ Form configuration not found.",
          flags: 64 // EPHEMERAL
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
      await this.sendResponse(config, responses, interaction.user, interaction.guild)

      await interaction.reply({
        content: "✅ Your response has been submitted successfully!",
        flags: 64 // EPHEMERAL
      })

    } catch (error) {
      logger.error("Error handling modal submit:", error)
      await interaction.reply({
        content: "❌ An error occurred while processing your response.",
        flags: 64 // EPHEMERAL
      }).catch(() => {}) // Ignore if already replied
    }
  }

  /**
   * Send form response to target channel with server nickname
   */
  async sendResponse(config, responses, user, guild) {
    try {
      if (!guild) {
        logger.error("Guild not found for sending response")
        return
      }
      
      const targetChannel = guild.channels.cache.get(config.targetChannelId)
      if (!targetChannel) {
        logger.error(`Target channel ${config.targetChannelId} not found`)
        return
      }

      // Get the member to access their server nickname
      const member = guild.members.cache.get(user.id)
      const displayName = member ? (member.nickname || member.displayName || user.username) : user.username

      const embed = new EmbedBuilder()
        .setTitle(config.responseTitle)
        .setColor(config.color)
        .setAuthor({
          name: displayName,
          iconURL: user.displayAvatarURL()
        })
        .setTimestamp()
        .setFooter({
          text: `Submitted by ${displayName} • User ID: ${user.id}`,
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
      logger.info(`Sent response from ${displayName} (${user.tag}) to ${targetChannel.name}`)
      
    } catch (error) {
      logger.error("Error sending response:", error)
    }
  }

  // Configuration management methods
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
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
      
      // Load existing embed configurations
      if (data.embedConfigs) {
        for (const [id, config] of Object.entries(data.embedConfigs)) {
          this.embedConfigs.set(id, config)
        }
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

      const guild = this.client.guilds.cache.get(config.discord?.guildId || process.env.GUILD_ID)
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
          text: "Click the reaction below to respond",
          iconURL: guild.iconURL()
        })
        .setTimestamp()

      const message = await channel.send({ embeds: [embed] })
      await message.react(config.emoji)

      // Store the active embed
      this.activeEmbeds.set(message.id, {
        configId: configId,
        channelId: channel.id,
        guildId: guild.id,
        createdAt: new Date().toISOString()
      })

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
      if (!config) return

      // Check if the reaction matches the configured emoji
      if (reaction.emoji.name !== config.emoji && reaction.emoji.toString() !== config.emoji) {
        return
      }

      // Remove the user's reaction to keep it at 1
      await reaction.users.remove(user.id)

      // Create and show modal
      await this.showModal(user, config, reaction.message.guild)
      
    } catch (error) {
      logger.error("Error handling reaction:", error)
    }
  }

  async showModal(user, config, guild) {
    try {
      const modal = new ModalBuilder()
        .setCustomId(`embed_modal_${config.id}`)
        .setTitle(config.title.substring(0, 45)) // Discord modal title limit

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

      // Find the user's interaction context (this is tricky with reactions)
      // We'll need to handle this in the interaction handler
      const interaction = await this.createInteractionContext(user, guild, config)
      if (interaction) {
        await interaction.showModal(modal)
      }
      
    } catch (error) {
      logger.error("Error showing modal:", error)
    }
  }

  async createInteractionContext(user, guild, config) {
    // This is a workaround since reactions don't provide interaction context
    // We'll send a temporary message with a button that triggers the modal
    try {
      const channel = await user.createDM()
      
      const button = new ButtonBuilder()
        .setCustomId(`show_modal_${config.id}`)
        .setLabel(`Open ${config.title}`)
        .setStyle(ButtonStyle.Primary)
        .setEmoji(config.emoji)

      const row = new ActionRowBuilder().addComponents(button)

      const embed = new EmbedBuilder()
        .setTitle("📝 Form Ready")
        .setDescription(`Click the button below to open the ${config.title} form.`)
        .setColor(config.color)

      await channel.send({
        embeds: [embed],
        components: [row]
      })

      return null // We'll handle the actual modal in the button interaction
    } catch (error) {
      logger.error("Error creating interaction context:", error)
      return null
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
        const fieldValue = interaction.fields.getTextInputValue(`field_${i}`)
        responses[config.fields[i].label] = fieldValue
      }

      // Send response to target channel
      await this.sendResponse(config, responses, interaction.user, interaction.guild)

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
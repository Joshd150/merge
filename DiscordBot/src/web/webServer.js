import express from "express"
import cors from "cors"
import path from "path"
import { fileURLToPath } from "url"
import { logger } from "../utils/logger.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export class WebServer {
  constructor(client, embedManager) {
    this.client = client
    this.embedManager = embedManager
    this.app = express()
    this.server = null
    this.port = process.env.WEB_PORT || 3000
    
    this.setupMiddleware()
    this.setupRoutes()
  }

  setupMiddleware() {
    this.app.use(cors())
    this.app.use(express.json())
    this.app.use(express.static(path.join(__dirname, 'public')))
  }

  setupRoutes() {
    // Serve the embed builder interface
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'))
    })

    // API Routes
    this.app.get('/api/guilds', async (req, res) => {
      try {
        const guilds = this.client.guilds.cache.map(guild => ({
          id: guild.id,
          name: guild.name,
          icon: guild.iconURL()
        }))
        res.json(guilds)
      } catch (error) {
        logger.error('Error fetching guilds:', error)
        res.status(500).json({ error: 'Failed to fetch guilds' })
      }
    })

    this.app.get('/api/guilds/:guildId/channels', async (req, res) => {
      try {
        const { guildId } = req.params
        const guild = this.client.guilds.cache.get(guildId)
        
        if (!guild) {
          return res.status(404).json({ error: 'Guild not found' })
        }

        const channels = guild.channels.cache
          .filter(channel => channel.type === 0) // Text channels only
          .map(channel => ({
            id: channel.id,
            name: channel.name
          }))

        res.json(channels)
      } catch (error) {
        logger.error('Error fetching channels:', error)
        res.status(500).json({ error: 'Failed to fetch channels' })
      }
    })

    // Get all embed configurations
    this.app.get('/api/embeds', (req, res) => {
      try {
        const configs = this.embedManager.getEmbedConfigs()
        res.json(configs)
      } catch (error) {
        logger.error('Error fetching embed configs:', error)
        res.status(500).json({ error: 'Failed to fetch embed configurations' })
      }
    })

    // Get specific embed configuration
    this.app.get('/api/embeds/:id', (req, res) => {
      try {
        const { id } = req.params
        const config = this.embedManager.getEmbedConfig(id)
        
        if (!config) {
          return res.status(404).json({ error: 'Embed configuration not found' })
        }

        res.json(config)
      } catch (error) {
        logger.error('Error fetching embed config:', error)
        res.status(500).json({ error: 'Failed to fetch embed configuration' })
      }
    })

    // Create new embed configuration
    this.app.post('/api/embeds', (req, res) => {
      try {
        const config = this.embedManager.createEmbedConfig(req.body)
        res.status(201).json(config)
      } catch (error) {
        logger.error('Error creating embed config:', error)
        res.status(500).json({ error: 'Failed to create embed configuration' })
      }
    })

    // Update embed configuration
    this.app.put('/api/embeds/:id', (req, res) => {
      try {
        const { id } = req.params
        const config = this.embedManager.updateEmbedConfig(id, req.body)
        
        if (!config) {
          return res.status(404).json({ error: 'Embed configuration not found' })
        }

        res.json(config)
      } catch (error) {
        logger.error('Error updating embed config:', error)
        res.status(500).json({ error: 'Failed to update embed configuration' })
      }
    })

    // Delete embed configuration
    this.app.delete('/api/embeds/:id', (req, res) => {
      try {
        const { id } = req.params
        const deleted = this.embedManager.deleteEmbedConfig(id)
        
        if (!deleted) {
          return res.status(404).json({ error: 'Embed configuration not found' })
        }

        res.json({ success: true })
      } catch (error) {
        logger.error('Error deleting embed config:', error)
        res.status(500).json({ error: 'Failed to delete embed configuration' })
      }
    })

    // Send embed to channel
    this.app.post('/api/embeds/:id/send', async (req, res) => {
      try {
        const { id } = req.params
        const { channelId } = req.body

        const message = await this.embedManager.sendCustomEmbed(id, channelId)
        
        res.json({
          success: true,
          messageId: message.id,
          channelId: message.channel.id
        })
      } catch (error) {
        logger.error('Error sending embed:', error)
        res.status(500).json({ error: error.message || 'Failed to send embed' })
      }
    })

    // Discord API proxy endpoints (from Bot1)
    this.app.post('/api/discord/guilds', async (req, res) => {
      try {
        const { botToken } = req.body

        if (!botToken) {
          return res.status(400).json({ error: "Bot token is required" })
        }

        const response = await fetch("https://discord.com/api/v10/users/@me/guilds", {
          headers: {
            Authorization: `Bot ${botToken}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          const error = await response.text()
          logger.error("Discord API error:", error)
          return res.status(response.status).json({ error: "Invalid bot token or insufficient permissions" })
        }

        const guilds = await response.json()
        res.json({ guilds })
      } catch (error) {
        logger.error("Guild fetch error:", error)
        res.status(500).json({ error: "Internal server error" })
      }
    })

    this.app.post('/api/discord/channels', async (req, res) => {
      try {
        const { botToken, guildId } = req.body

        if (!botToken || !guildId) {
          return res.status(400).json({ error: "Bot token and guild ID are required" })
        }

        const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
          headers: {
            Authorization: `Bot ${botToken}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          const error = await response.text()
          logger.error("Discord API error:", error)
          return res.status(response.status).json({ error: "Failed to fetch channels" })
        }

        const channels = await response.json()
        res.json({ channels })
      } catch (error) {
        logger.error("Channel fetch error:", error)
        res.status(500).json({ error: "Internal server error" })
      }
    })
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, (err) => {
        if (err) {
          reject(err)
        } else {
          logger.info(`🌐 Web server started on port ${this.port}`)
          logger.info(`🔗 Access embed builder at: http://localhost:${this.port}`)
          resolve()
        }
      })
    })
  }

  async shutdown() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          logger.info("Web server shutdown complete")
          resolve()
        })
      })
    }
  }
}
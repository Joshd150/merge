import Parser from "rss-parser"
import cron from "node-cron"
import { config } from "../config/config.js"
import { logger } from "../utils/logger.js"

export class NewsFeeds {
  constructor(client) {
    this.client = client
    this.parser = new Parser({
      timeout: 10000, // 10 second timeout
      maxRedirects: 5,
    })
    this.nflInterval = null
    this.maddenInterval = null
    this.postedArticles = new Map() // Use Map with timestamps for cleanup
    this.startTime = Date.now()
    this.maxCacheSize = 1000 // Limit cache size
  }

  async initialize() {
    logger.info("News feeds system initialized - will only post articles published after bot start")
  }

  async fetchAndPostNFLNews() {
    try {
      if (!config.channels.nflNews || !config.rss.nflUrl) {
        logger.debug("NFL news channel or RSS URL not configured")
        return
      }

      const guild = this.client.guilds.cache.get(config.discord.guildId)
      if (!guild) return

      const channel = guild.channels.cache.get(config.channels.nflNews)
      if (!channel) {
        logger.warn("NFL news channel not found")
        return
      }

      const feed = await this.parser.parseURL(config.rss.nflUrl)

      // Only process articles published after bot started
      const newArticles = feed.items.filter((article) => {
        const articleTime = new Date(article.pubDate).getTime()
        const articleId = `nfl-${article.link}`
        return articleTime > this.startTime && !this.postedArticles.has(articleId)
      })

      for (const article of newArticles) {
        const articleId = `nfl-${article.link}`

        try {
          const embed = {
            color: 0x013369,
            title: article.title.substring(0, 256),
            url: article.link,
            description: article.contentSnippet ? article.contentSnippet.substring(0, 300) + "..." : "",
            fields: [
              {
                name: "📰 Source",
                value: "ESPN NFL",
                inline: true,
              },
              {
                name: "📅 Published",
                value: new Date(article.pubDate).toLocaleDateString(),
                inline: true,
              },
            ],
            footer: {
              text: "NFL News Feed",
              icon_url: "https://i.imgur.com/hU7ulOM.png",
            },
            timestamp: new Date(article.pubDate).toISOString(),
          }

          await channel.send({ embeds: [embed] })
          this.postedArticles.set(articleId, Date.now())
          logger.info("Posted new NFL news article")

          // Add delay to prevent rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1000))
        } catch (postError) {
          logger.error(`Error posting NFL article: ${postError.message}`)
        }
      }

      this.cleanupArticleCache()
    } catch (error) {
      logger.error("Error fetching NFL news:", error)
    }
  }

  async fetchAndPostMaddenNews() {
    try {
      if (!config.channels.maddenNews || !config.rss.maddenUrl) {
        logger.debug("Madden news channel or RSS URL not configured")
        return
      }

      const guild = this.client.guilds.cache.get(config.discord.guildId)
      if (!guild) return

      const channel = guild.channels.cache.get(config.channels.maddenNews)
      if (!channel) {
        logger.warn("Madden news channel not found")
        return
      }

      const feed = await this.parser.parseURL(config.rss.maddenUrl)

      // Only process articles published after bot started
      const newArticles = feed.items.filter((article) => {
        const articleTime = new Date(article.pubDate).getTime()
        const articleId = `madden-${article.link}`
        return articleTime > this.startTime && !this.postedArticles.has(articleId)
      })

      for (const article of newArticles) {
        const articleId = `madden-${article.link}`

        try {
          const embed = {
            color: 0xea580c,
            title: article.title.substring(0, 256),
            url: article.link,
            description: article.contentSnippet ? article.contentSnippet.substring(0, 300) + "..." : "",
            fields: [
              {
                name: "📰 Source",
                value: "EA Sports",
                inline: true,
              },
              {
                name: "📅 Published",
                value: new Date(article.pubDate).toLocaleDateString(),
                inline: true,
              },
            ],
            footer: {
              text: "Madden News Feed",
              icon_url: "https://i.imgur.com/hU7ulOM.png",
            },
            timestamp: new Date(article.pubDate).toISOString(),
          }

          await channel.send({ embeds: [embed] })
          this.postedArticles.set(articleId, Date.now())
          logger.info("Posted new Madden news article")

          // Add delay to prevent rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1000))
        } catch (postError) {
          logger.error(`Error posting Madden article: ${postError.message}`)
        }
      }

      this.cleanupArticleCache()
    } catch (error) {
      logger.error("Error fetching Madden news:", error)
    }
  }

  cleanupArticleCache() {
    // Remove articles older than 7 days from cache
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    let cleanedCount = 0

    for (const [articleId, timestamp] of this.postedArticles.entries()) {
      if (timestamp < sevenDaysAgo) {
        this.postedArticles.delete(articleId)
        cleanedCount++
      }
    }

    // If cache is still too large, remove oldest entries
    if (this.postedArticles.size > this.maxCacheSize) {
      const entries = Array.from(this.postedArticles.entries()).sort((a, b) => a[1] - b[1]) // Sort by timestamp

      const toRemove = entries.slice(0, entries.length - this.maxCacheSize)
      for (const [articleId] of toRemove) {
        this.postedArticles.delete(articleId)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`Cleaned up ${cleanedCount} old article cache entries`)
    }
  }

  startNewsFeeds() {
    // Check for news every 15 minutes
    this.nflInterval = cron.schedule("*/15 * * * *", () => {
      this.fetchAndPostNFLNews()
    })

    this.maddenInterval = cron.schedule("*/15 * * * *", () => {
      this.fetchAndPostMaddenNews()
    })

    logger.info("News feeds started (every 15 minutes) - only posting articles published after bot start")
  }

  async shutdown() {
    if (this.nflInterval) {
      this.nflInterval.destroy()
    }
    if (this.maddenInterval) {
      this.maddenInterval.destroy()
    }
    logger.info("News feeds shutdown complete")
  }
}

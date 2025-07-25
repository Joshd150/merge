import fs from "fs/promises"
import path from "path"
import { logger } from "./logger.js"

export class DataStore {
  constructor() {
    this.dataDir = "data"
    this.dataFile = path.join(this.dataDir, "botData.json")
    this.backupFile = path.join(this.dataDir, "botData.backup.json")
    this.saveInterval = null
    this.isSaving = false
  }

  async ensureDataDir() {
    try {
      await fs.access(this.dataDir)
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true })
      logger.info("Created data directory")
    }
  }

  async load() {
    try {
      await this.ensureDataDir()

      // Try to load main file first
      try {
        const data = await fs.readFile(this.dataFile, "utf8")
        const parsed = JSON.parse(data)
        logger.info("Loaded bot data from storage")
        return parsed
      } catch (mainError) {
        // If main file fails, try backup
        try {
          const backupData = await fs.readFile(this.backupFile, "utf8")
          const parsed = JSON.parse(backupData)
          logger.warn("Loaded bot data from backup file")
          return parsed
        } catch (backupError) {
          throw mainError // Throw original error if backup also fails
        }
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        logger.info("No existing data file found, starting fresh")
        return { userActivity: {}, lastSave: Date.now() }
      }
      logger.error("Error loading data:", error)
      return { userActivity: {}, lastSave: Date.now() }
    }
  }

  async save(data) {
    if (this.isSaving) {
      logger.debug("Save already in progress, skipping...")
      return
    }

    this.isSaving = true

    try {
      await this.ensureDataDir()

      // Create backup of existing file
      try {
        await fs.copyFile(this.dataFile, this.backupFile)
      } catch (error) {
        // Backup creation failed, but continue with save
        logger.debug("Could not create backup:", error.message)
      }

      data.lastSave = Date.now()
      const jsonData = JSON.stringify(data, null, 2)

      // Write to temporary file first, then rename (atomic operation)
      const tempFile = this.dataFile + ".tmp"
      await fs.writeFile(tempFile, jsonData)
      await fs.rename(tempFile, this.dataFile)

      logger.debug("Bot data saved to storage")
    } catch (error) {
      logger.error("Error saving data:", error)
    } finally {
      this.isSaving = false
    }
  }

  startAutoSave(data) {
    // Auto-save every 5 minutes
    this.saveInterval = setInterval(
      () => {
        this.save(data)
      },
      5 * 60 * 1000,
    )

    logger.info("Auto-save started (every 5 minutes)")
  }

  stopAutoSave() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval)
      this.saveInterval = null
      logger.info("Auto-save stopped")
    }
  }
}

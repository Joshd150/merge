import fs from "fs/promises"
import path from "path"
import { logger } from "./logger.js"

export class DataStore {
  constructor(filename = "botData.json") {
    this.dataDir = "data"
    this.dataFile = path.join(this.dataDir, filename)
    this.backupFile = path.join(this.dataDir, filename.replace('.json', '.backup.json'))
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

      // Try to load from multiple possible locations including Bot1 and Bot2 data
      const possibleFiles = [
        this.dataFile,                    // Current location
        this.backupFile,                  // Current backup
        '../Bot1/data/botData.json',      // Bot1 data
        '../Bot1/data/botData.backup.json', // Bot1 backup
        '../Bot2/data/botData.json',      // Bot2 data
        '../Bot2/data/botData.backup.json', // Bot2 backup
        'botData.json',                   // Root level
        'data.json',                      // Alternative name
        './data/botData.json',            // Relative path
        './Bot1/data/botData.json',       // Local Bot1
        './Bot2/data/botData.json'        // Local Bot2
      ]

      // Try to load main file first
      try {
        const data = await fs.readFile(this.dataFile, "utf8")
        const parsed = JSON.parse(data)
        logger.info("Loaded bot data from storage")
        return parsed
      } catch (mainError) {
        // If main file fails, try all possible locations
        for (const filePath of possibleFiles.slice(1)) {
          try {
            logger.debug(`Attempting to load data from: ${filePath}`)
            const data = await fs.readFile(filePath, "utf8")
            const parsed = JSON.parse(data)
            logger.info(`Loaded bot data from legacy location: ${filePath}`)
            
            // Save to current location for future use
            await this.save(parsed)
            return parsed
          } catch (error) {
            logger.debug(`Could not load from ${filePath}: ${error.message}`)
            // Continue to next file
            continue
          }
        }
        
        // If no files found, throw original error
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
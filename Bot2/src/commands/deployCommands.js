import { REST, Routes } from "discord.js"
import { config } from "../config/config.js"
import { leagueCommands } from "./leagueCommands.js"
import { faqCommands } from "./faqCommands.js"
import { logger } from "../utils/logger.js"

// Combine all commands
const allCommands = [...leagueCommands, ...faqCommands]
const commands = allCommands.map((command) => command.data.toJSON())

const rest = new REST().setToken(config.discord.token)

export async function deployCommands() {
  try {
    logger.info(`Started refreshing ${commands.length} application (/) commands.`)

    await rest.put(Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId), {
      body: commands,
    })

    logger.info(`Successfully reloaded ${commands.length} application (/) commands.`)
  } catch (error) {
    logger.error("Error deploying commands:", error)
  }
}

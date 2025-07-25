import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from "discord.js"
import { logger } from "../utils/logger.js"

export const embedCommands = [
  {
    data: new SlashCommandBuilder()
      .setName("embed-builder")
      .setDescription("Get the link to the embed builder web interface")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
      try {
        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle("🎮 Discord Embed Builder")
          .setDescription("Use the web interface to create custom interactive embeds with modal forms.")
          .addFields(
            {
              name: "🌐 Web Interface",
              value: `Access the embed builder at:\n**http://localhost:${process.env.WEB_PORT || 3000}**`,
              inline: false,
            },
            {
              name: "✨ Features",
              value: "• Custom embed design\n• Interactive modal forms\n• Reaction-based triggers\n• Response collection\n• Full customization",
              inline: false,
            },
            {
              name: "🔧 How to Use",
              value: "1. Open the web interface\n2. Design your embed\n3. Configure form fields\n4. Send to Discord\n5. Users react to open forms",
              inline: false,
            }
          )
          .setFooter({
            text: "Gridiron Fantasy League Bot",
            iconURL: "https://i.imgur.com/hU7ulOM.png",
          })
          .setTimestamp()

        await interaction.reply({ embeds: [embed], ephemeral: true })
        logger.debug(`Embed builder command executed by ${interaction.user.tag}`)
      } catch (error) {
        logger.error("Error in embed-builder command:", error)
        await interaction.reply({
          content: "❌ An error occurred while displaying the embed builder information.",
          ephemeral: true,
        })
      }
    },
  },
]
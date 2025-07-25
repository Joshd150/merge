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
              value: "• Custom embed design with colors and emojis\n• Interactive modal forms with custom fields\n• Reaction-based triggers (auto-managed)\n• Response collection to any channel\n• Full customization and persistence",
              inline: false,
            },
            {
              name: "🔧 How to Use",
              value: "1. Open the web interface\n2. Design your embed and form fields\n3. Configure channels and responses\n4. Send to Discord\n5. Users react with emoji to open forms\n6. Responses automatically sent to your channel",
              inline: false,
            },
            {
              name: "📝 Example Use Cases",
              value: "• Force Win Requests\n• Team Applications\n• Bug Reports\n• Feedback Forms\n• Event Signups\n• Custom Tickets",
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
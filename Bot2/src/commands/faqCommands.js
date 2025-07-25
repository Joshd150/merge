import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import { logger } from "../utils/logger.js"

// FAQ Template Function - Use this to create new FAQ commands easily
function createFAQCommand(commandName, title, description, fields, color = 0x1e40af) {
  return {
    data: new SlashCommandBuilder().setName(commandName).setDescription(description),
    async execute(interaction) {
      try {
        const embed = new EmbedBuilder()
          .setColor(color)
          .setTitle(title)
          .setDescription(description)
          .setFooter({
            text: "Gridiron Football League Bot",
            iconURL: "https://i.imgur.com/hU7ulOM.png",
          })
          .setTimestamp()

        // Add fields if provided
        if (fields && fields.length > 0) {
          embed.addFields(fields)
        }

        await interaction.reply({ embeds: [embed] })
        logger.debug(`FAQ command ${commandName} executed by ${interaction.user.tag}`)
      } catch (error) {
        logger.error(`Error in FAQ command ${commandName}:`, error)
        await interaction.reply({
          content: "❌ An error occurred while displaying the FAQ information.",
          ephemeral: true,
        })
      }
    },
  }
}

// FAQ Commands - Your custom commands
const faqCommandsList = [
  // Sim Times
  createFAQCommand(
    "sim",
    "🕐 Sim Times",
    "Current sim times for the league.",
    [
      {
        name: "⏰ First Sim",
        value: "First Sim: 5:00 PM CST (3:00 PM PST / 4:00 PM MST / 6:00 PM EST)",
        inline: false,
      },
      {
        name: "⏰ Second Sim",
        value: "Second Sim: 10:00 PM CST (8:00 PM PST / 9:00 PM MST / 11:00 PM EST)",
        inline: false,
      },
    ],
    0x10b981,
  ),

  // Rules
  createFAQCommand(
    "rules",
    "📋 League Rules",
    "Overview of league rules. See full details in the rules channel.",
    [
      {
        name: "League Rules",
        value: "Find complete rules here: <#1396330333351317661>",
        inline: false,
      },
    ],
    0x3b82f6,
  ),

  // Open Teams
  createFAQCommand(
    "open",
    "🏈 Open Teams",
    "Check what teams are open and available.",
    [
      {
        name: "Teams Channel",
        value: "<#1396425684259180644>",
        inline: false,
      },
    ],
    0xf59e0b,
  ),

  // Legend Claim Info
  createFAQCommand(
    "legend",
    "🌟 Legend Visits & Claims",
    "How to use legend visits for stat boosts and post your claim.",
    [
      {
        name: "Legend Claims Info",
        value: "Learn how Legend Visits work and post claims here: <#1396747175882391583>",
        inline: false,
      },
    ],
    0x8b5cf6,
  ),

  // Claims Info (Player of the Week, GOTW, Streams)
  createFAQCommand(
    "claims",
    "🏅 Player, Game & Stream Claims",
    "How Player of the Week, Game of the Week, and stream claims work.",
    [
      {
        name: "Claims Info",
        value: "Claim your rewards here: <#1396829870792769687>",
        inline: false,
      },
    ],
    0xf87171,
  ),

  // Recruiting Info
  createFAQCommand(
    "recruit",
    "➕ Recruiting Rewards",
    "Get rewards for recruiting new members. See how to claim.",
    [
      {
        name: "Recruiting Channel",
        value: "Post your recruit claim here: <#1396693206220935199>",
        inline: false,
      },
    ],
    0x22c55e,
  ),

  // Dev Upgrade Info
  createFAQCommand(
    "devinfo",
    "📈 Dev Upgrade Info",
    "How Dev Upgrades work and how to submit requests.",
    [
      {
        name: "Dev Info & Submit",
        value: "See dev info and submit here: <#1396356326925533194>",
        inline: false,
      },
    ],
    0x0ea5e9,
  ),

  // How to Join the League
  createFAQCommand(
    "join",
    "🔰 How to Join the League",
    "Read this before you get started in the league.",
    [
      {
        name: "Join Info",
        value: "Welcome and start here: <#1396330333351317660>",
        inline: false,
      },
    ],
    0xa21caf,
  ),
]

// Help Command - Now PUBLIC (not ephemeral)
const helpCommand = {
  data: new SlashCommandBuilder().setName("help").setDescription("Shows all available Gridiron FAQ commands"),
  async execute(interaction) {
    try {
      const embed = new EmbedBuilder()
        .setColor(0x1e40af)
        .setTitle("🤖 Gridiron Bot FAQ Commands")
        .setDescription("Use these slash commands to get league info and quick links.")
        .addFields(
          {
            name: "/sim",
            value: "Sim times info",
            inline: true,
          },
          {
            name: "/rules",
            value: "League rules overview",
            inline: true,
          },
          {
            name: "/open",
            value: "See which teams are open",
            inline: true,
          },
          {
            name: "/legend",
            value: "Legend visit claim instructions",
            inline: true,
          },
          {
            name: "/claims",
            value: "Player/Game/Stream claims info",
            inline: true,
          },
          {
            name: "/recruit",
            value: "Recruiting rewards info",
            inline: true,
          },
          {
            name: "/devinfo",
            value: "Dev upgrade info",
            inline: true,
          },
          {
            name: "/join",
            value: "How to join and get started",
            inline: true,
          },
          {
            name: "/help",
            value: "Shows this list of commands",
            inline: true,
          },
        )
        .setFooter({
          text: "Gridiron Football League Bot",
          iconURL: "https://i.imgur.com/hU7ulOM.png",
        })
        .setTimestamp()

      // Removed ephemeral: true - now it's public!
      await interaction.reply({ embeds: [embed] })
      logger.debug(`Help command executed by ${interaction.user.tag}`)
    } catch (error) {
      logger.error("Error in help command:", error)
      await interaction.reply({
        content: "❌ An error occurred while displaying the help information.",
        ephemeral: true,
      })
    }
  },
}

// Export all FAQ commands including help
export const faqCommands = [...faqCommandsList, helpCommand]

// Template for creating new FAQ commands:
/*
// Copy this template to add new FAQ commands:

createFAQCommand(
  "command-name",           // The slash command name (no spaces, lowercase)
  "📋 Command Title",       // The embed title with emoji
  "Brief description",      // Command description and embed description
  [                         // Array of fields (optional)
    {
      name: "Field Title",
      value: "Field content here",
      inline: false         // true for side-by-side fields
    },
    {
      name: "Another Field",
      value: "More content",
      inline: false
    }
  ],
  0x1e40af                 // Hex color code (optional, defaults to blue)
),

*/

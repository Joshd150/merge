"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Bot, Copy, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function DiscordBotPage() {
  const { toast } = useToast()
  const [botToken, setBotToken] = useState("")
  const [guildId, setGuildId] = useState("")
  const [channelId, setChannelId] = useState("")

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
    })
  }

  const botCode = `const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const commands = [
    new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Send a custom embed')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('Embed title')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Embed description')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Embed color (hex)')
                .setRequired(false)),
    
    new SlashCommandBuilder()
        .setName('webhook')
        .setDescription('Create a webhook for this channel')
];

client.once('ready', async () => {
    console.log(\`Logged in as \${client.user.tag}!\`);
    
    // Register slash commands
    const rest = new REST({ version: '10' }).setToken('${botToken || "YOUR_BOT_TOKEN"}');
    
    try {
        await rest.put(
            Routes.applicationGuildCommands('${botToken ? "YOUR_CLIENT_ID" : "YOUR_CLIENT_ID"}', '${guildId || "YOUR_GUILD_ID"}'),
            { body: commands },
        );
        console.log('Successfully registered application commands.');
    } catch (error) {
        console.error(error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'embed') {
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const color = interaction.options.getString('color') || '#5865F2';

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setTimestamp()
            .setFooter({ text: 'Created with Discord Bot', iconURL: client.user.displayAvatarURL() });

        await interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === 'webhook') {
        try {
            const webhook = await interaction.channel.createWebhook({
                name: 'Embed Bot Webhook',
                avatar: client.user.displayAvatarURL(),
            });

            await interaction.reply({
                content: \`Webhook created! URL: \${webhook.url}\`,
                ephemeral: true
            });
        } catch (error) {
            await interaction.reply({
                content: 'Failed to create webhook. Make sure I have the "Manage Webhooks" permission.',
                ephemeral: true
            });
        }
    }
});

client.login('${botToken || "YOUR_BOT_TOKEN"}');`

  const packageJson = `{
  "name": "discord-embed-bot",
  "version": "1.0.0",
  "description": "A Discord bot for creating embeds and webhooks",
  "main": "bot.js",
  "scripts": {
    "start": "node bot.js",
    "dev": "nodemon bot.js"
  },
  "dependencies": {
    "discord.js": "^14.14.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Bot className="w-10 h-10 text-indigo-600" />
            Discord Bot Setup
          </h1>
          <p className="text-gray-600">Set up your Discord bot to work with embeds and webhooks</p>
        </div>

        <div className="space-y-6">
          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Bot Configuration</CardTitle>
              <CardDescription>Enter your bot details to generate customized code</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="token">Bot Token</Label>
                  <Input
                    id="token"
                    type="password"
                    placeholder="Your bot token"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guild">Guild ID</Label>
                  <Input
                    id="guild"
                    placeholder="Your server ID"
                    value={guildId}
                    onChange={(e) => setGuildId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="channel">Channel ID</Label>
                  <Input
                    id="channel"
                    placeholder="Channel ID (optional)"
                    value={channelId}
                    onChange={(e) => setChannelId(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Setup Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Setup Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge className="mt-1">1</Badge>
                  <div>
                    <p className="font-medium">Create a Discord Application</p>
                    <p className="text-sm text-gray-600">
                      Go to{" "}
                      <a
                        href="https://discord.com/developers/applications"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        Discord Developer Portal
                        <ExternalLink className="w-3 h-3" />
                      </a>{" "}
                      and create a new application
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge className="mt-1">2</Badge>
                  <div>
                    <p className="font-medium">Create a Bot</p>
                    <p className="text-sm text-gray-600">
                      Go to the "Bot" section and create a bot. Copy the token and paste it above.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge className="mt-1">3</Badge>
                  <div>
                    <p className="font-medium">Set Bot Permissions</p>
                    <p className="text-sm text-gray-600">
                      Required permissions: Send Messages, Use Slash Commands, Manage Webhooks, Embed Links
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge className="mt-1">4</Badge>
                  <div>
                    <p className="font-medium">Invite Bot to Server</p>
                    <p className="text-sm text-gray-600">
                      Use the OAuth2 URL generator to create an invite link with the required permissions
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bot Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Bot Code (bot.js)
                <Button onClick={() => copyToClipboard(botCode)} size="sm" variant="outline">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </CardTitle>
              <CardDescription>Save this as bot.js in your project directory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-100">
                  <code>{botCode}</code>
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Package.json */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Package Configuration (package.json)
                <Button onClick={() => copyToClipboard(packageJson)} size="sm" variant="outline">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-100">
                  <code>{packageJson}</code>
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Running Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Running the Bot</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="bg-gray-100 rounded p-3">
                  <code className="text-sm">npm install</code>
                </div>
                <div className="bg-gray-100 rounded p-3">
                  <code className="text-sm">npm start</code>
                </div>
                <p className="text-sm text-gray-600">
                  The bot will register slash commands and be ready to use. Try <code>/embed</code> or{" "}
                  <code>/webhook</code> commands in your Discord server!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

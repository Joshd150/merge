# 🏈 Gridiron Discord Bot

A comprehensive Discord bot for managing fantasy football leagues with advanced features including activity tracking, custom embed forms, news feeds, and more.

## ✨ Features

### 🎮 Custom Embed Builder
- **Web Interface**: Create interactive embeds with custom forms
- **Reaction Triggers**: Users click emojis to open modal forms
- **Fully Customizable**: Colors, titles, fields, channels
- **Auto-Managed Reactions**: Emoji count stays at 1
- **Response Collection**: Submissions sent as embeds to designated channels

### 🏈 League Management
- **Activity Tracking**: Automatic active/inactive role management
- **Welcome System**: Automated welcome messages and role assignment
- **Member Statistics**: Track league participation and engagement
- **FAQ Commands**: Quick access to league information

### 📰 News Feeds
- **NFL News**: Automatic ESPN NFL news posting
- **Madden News**: EA Sports Madden updates
- **Smart Filtering**: Only posts new articles after bot startup

### 🛡️ Moderation
- **Invite Filter**: Automatically removes Discord invite links
- **Role Protection**: Exempt admins and moderators
- **Logging**: Optional moderation channel logging

## 🚀 Quick Start

1. **Clone and Install**
   ```bash
   cd DiscordBot
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Discord bot token and IDs
   ```

3. **Start the Bot**
   ```bash
   npm start
   ```

4. **Access Web Interface**
   - Open `http://localhost:3000`
   - Use `/embed-builder` command in Discord for quick access

## 🔧 Configuration

### Required Environment Variables
- `DISCORD_TOKEN` - Your bot token
- `CLIENT_ID` - Your bot's client ID
- `GUILD_ID` - Your Discord server ID
- `WELCOME_CHANNEL_ID` - Welcome messages channel
- `MADDEN_LEAGUE_ROLE_ID` - Main league member role
- `ACTIVE_ROLE_ID` - Active member role
- `INACTIVE_ROLE_ID` - Inactive member role

### Optional Configuration
- Channel IDs for news feeds, rules, teams, etc.
- RSS feed URLs for news
- Activity tracking settings
- Feature toggles

## 📝 Slash Commands

### League Management
- `/active` - Show active league members
- `/inactive` - Show inactive league members  
- `/league-stats` - Display league statistics
- `/force-active <user>` - Manually activate a user (Admin)
- `/test-rss <feed>` - Test RSS feeds (Admin)

### FAQ Commands
- `/sim` - Sim times information
- `/rules` - League rules overview
- `/open` - Available teams
- `/legend` - Legend visits info
- `/claims` - Claim rewards info
- `/recruit` - Recruiting rewards
- `/devinfo` - Dev upgrade info
- `/join` - How to join guide
- `/help` - Show all commands

### Embed Builder
- `/embed-builder` - Get web interface link

## 🎯 Custom Embed Forms

### Multiple Forms Example

**Form 1: Force Win Request**
- **Send To**: #general-chat
- **Responses To**: #admin-requests
1. **Create Form**: Title "Force Win Request", emoji "⚡"
2. **Add Field**: "Your Team:" (required, single-line)
3. **Configure**: Response title "Force Win Requested"
4. **Deploy**: Send embed to #general-chat
5. **Usage**: Users in #general-chat react ⚡ → responses go to #admin-requests

**Form 2: Bug Report**
- **Send To**: #bug-reports
- **Responses To**: #dev-team
1. **Create Form**: Title "Bug Report", emoji "🐛"
2. **Add Fields**: "Bug Description:", "Steps to Reproduce:"
3. **Configure**: Response title "New Bug Report"
4. **Deploy**: Send embed to #bug-reports
5. **Usage**: Users in #bug-reports react 🐛 → responses go to #dev-team

### Form Features
- **Field Types**: Single-line or multiline text
- **Validation**: Required/optional fields, max length limits
- **Customization**: Placeholders, labels, response formatting
- **Persistence**: All configurations saved automatically

## 🗂️ Data Storage

- **Activity Data**: `data/botData.json`
- **Embed Configs**: `data/embedData.json`
- **Auto-Backup**: Automatic backup files created
- **Auto-Save**: Data saved every 5 minutes

## 🔒 Permissions

### Bot Permissions Required
- Send Messages
- Manage Messages
- Manage Roles
- Read Message History
- Use Slash Commands
- Add Reactions
- Embed Links

### User Permissions
- **Embed Builder**: Manage Messages permission
- **Admin Commands**: Administrator permission
- **General Commands**: No special permissions needed

## 🌐 Web Interface

The web interface provides a user-friendly way to create custom embed forms:

- **Live Preview**: See exactly how embeds will look
- **Form Builder**: Drag-and-drop field creation
- **Configuration Management**: Save, edit, delete configurations
- **One-Click Deploy**: Send embeds directly to Discord

## 📊 Monitoring

- **Comprehensive Logging**: All actions logged with timestamps
- **Error Handling**: Graceful error recovery
- **Health Checks**: RSS feed testing and validation
- **Uptime Tracking**: Bot uptime in statistics

## 🔄 Activity Tracking

- **Automatic Role Management**: Active/Inactive based on message activity
- **Configurable Threshold**: Default 26 hours (customizable)
- **Instant Updates**: Real-time role changes on activity
- **DM Notifications**: Users notified of status changes

## 🛠️ Development

### File Structure
```
DiscordBot/
├── src/
│   ├── bot.js              # Main bot file
│   ├── config/
│   │   └── config.js       # Configuration management
│   ├── commands/           # Slash commands
│   ├── modules/            # Core functionality modules
│   ├── events/             # Event handlers
│   ├── utils/              # Utilities (logger, data store)
│   └── web/                # Web server and interface
├── data/                   # Data storage
└── package.json
```

### Adding New Features
1. Create module in `src/modules/`
2. Add to bot initialization in `src/bot.js`
3. Register event handlers in `src/events/eventHandlers.js`
4. Add commands in `src/commands/`

## 🆘 Support

- Check logs for error details
- Verify environment variables are set correctly
- Ensure bot has required permissions
- Test RSS feeds with `/test-rss` command
- Use web interface for embed troubleshooting

## 📄 License

This project is for the Gridiron Fantasy League Discord server.
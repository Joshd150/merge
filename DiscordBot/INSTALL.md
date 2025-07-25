# 🚀 Discord Bot Installation Guide

## 📋 Prerequisites

- **Node.js** (version 16 or higher)
- **Discord Bot Token** and permissions
- **Discord Server** with admin access

## 🔧 Step 1: Install Dependencies

```bash
cd DiscordBot
npm install
```

## ⚙️ Step 2: Configure Environment

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit the .env file with your Discord information:**
   ```bash
   nano .env
   # or use any text editor
   ```

3. **Required Configuration:**
   ```env
   # Discord Bot Configuration
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   GUILD_ID=your_guild_id_here

   # Essential Channel IDs
   WELCOME_CHANNEL_ID=your_welcome_channel_id
   
   # Essential Role IDs
   MADDEN_LEAGUE_ROLE_ID=your_madden_league_role_id
   ACTIVE_ROLE_ID=your_active_role_id
   INACTIVE_ROLE_ID=your_inactive_role_id
   ```

## 🤖 Step 3: Discord Bot Setup

### Create Discord Application:
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name your application
4. Go to "Bot" section
5. Click "Add Bot"
6. Copy the **Token** → paste in `DISCORD_TOKEN`
7. Copy the **Application ID** → paste in `CLIENT_ID`

### Get Server ID:
1. Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode)
2. Right-click your server → "Copy Server ID" → paste in `GUILD_ID`

### Get Channel IDs:
1. Right-click any channel → "Copy Channel ID"
2. Paste in appropriate environment variables

### Get Role IDs:
1. Go to Server Settings → Roles
2. Right-click any role → "Copy Role ID"
3. Paste in appropriate environment variables

### Bot Permissions:
Invite your bot with these permissions:
- ✅ Send Messages
- ✅ Manage Messages  
- ✅ Manage Roles
- ✅ Read Message History
- ✅ Use Slash Commands
- ✅ Add Reactions
- ✅ Embed Links
- ✅ Manage Webhooks

**Invite URL:**
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=268528720&scope=bot%20applications.commands
```
*(Replace YOUR_CLIENT_ID with your actual client ID)*

## 🚀 Step 4: Start the Bot

```bash
npm start
```

**You should see:**
```
🏈 YourBot#1234 is ready for the season!
✅ Configuration validation complete
Activity tracker initialized with X tracked users
🌐 Web server started on port 3000
🔗 Access embed builder at: http://localhost:3000
🚀 All systems operational!
```

## 🌐 Step 5: Access Web Interface

1. **Open browser**: `http://localhost:3000`
2. **Or use Discord command**: `/embed-builder` (gives you the link)
3. **Create your first form**:
   - Design embed appearance
   - Add form fields
   - Configure channels
   - Send to Discord!

## 🔍 Step 6: Test Everything

### Test Slash Commands:
- `/help` - Shows all available commands
- `/sim` - Shows sim times
- `/league-stats` - Shows bot statistics
- `/embed-builder` - Gets web interface link

### Test Custom Forms:
1. Create a test form in web interface
2. Send to a test channel
3. React with the emoji
4. Fill out the modal form
5. Check if response appears in target channel

## 🛠️ Development Mode

For development with auto-restart:
```bash
npm run dev
```

## 📊 Monitoring

- **Logs**: All activity logged to console
- **Data Storage**: `data/` folder (auto-created)
- **Web Interface**: Real-time form management
- **Discord Commands**: Live statistics and status

## ❗ Troubleshooting

### Bot Won't Start:
- ✅ Check all required environment variables are set
- ✅ Verify bot token is correct
- ✅ Ensure bot is invited to server with proper permissions

### Commands Not Working:
- ✅ Bot needs "Use Slash Commands" permission
- ✅ Wait a few minutes for commands to register
- ✅ Check bot has access to the channels

### Web Interface Issues:
- ✅ Check port 3000 is available
- ✅ Verify bot is running
- ✅ Check browser console for errors

### Forms Not Working:
- ✅ Bot needs "Add Reactions" and "Manage Messages" permissions
- ✅ Verify target channels exist and bot has access
- ✅ Check embed configuration in web interface

## 🎯 Quick Start Example

1. **Install**: `npm install`
2. **Configure**: Edit `.env` with your Discord info
3. **Start**: `npm start`
4. **Create Form**: Go to `http://localhost:3000`
5. **Test**: React to your embed in Discord!

Your unified Discord bot is now ready! 🎉
# 🔄 Data Migration Guide

## Automatic Data Loading

The unified bot automatically loads data from multiple sources:

### ✅ **Supported Data Sources**
- `DiscordBot/data/botData.json` (current location)
- `Bot2/data/botData.json` (legacy Bot2 data)
- `Bot2/data/botData.backup.json` (Bot2 backup)
- Any other `botData.json` files in parent directories

### 🔄 **What Gets Migrated**

**Activity Data:**
- User activity tracking from Bot2
- All timestamps and role assignments
- Automatic format conversion if needed

**Embed Configurations:**
- Custom embed forms and settings
- Active embed tracking
- Field configurations and channel mappings

### 📊 **Migration Process**

1. **Automatic Detection**: Bot scans for existing data files
2. **Smart Loading**: Loads from the most recent/complete source
3. **Format Migration**: Converts old formats to new structure
4. **Data Preservation**: Saves migrated data to new location
5. **Backup Creation**: Creates backup of original data

### 🚀 **No Manual Work Required**

Just start the bot - it handles everything automatically:

```bash
cd DiscordBot
npm start
```

**You'll see logs like:**
```
[INFO] Loaded bot data from legacy location: ../Bot2/data/botData.json
[INFO] Activity tracker initialized with 42 tracked users
[INFO] Migrated legacy embed configurations
[INFO] Embed manager initialized with 3 configurations
```

### 🔍 **Verification**

After migration, check:
- **Activity tracking**: `/league-stats` command shows user counts
- **Embed forms**: Web interface shows all saved configurations
- **Data location**: New data saved in `DiscordBot/data/`

### 📁 **Data Locations**

**New Structure:**
```
DiscordBot/
├── data/
│   ├── botData.json        # Activity tracking data
│   ├── botData.backup.json # Automatic backup
│   ├── embedData.json      # Embed configurations
│   └── embedData.backup.json # Embed backup
```

**Legacy Locations (auto-detected):**
```
Bot2/data/botData.json
Bot2/data/botData.backup.json
```

The bot preserves all your existing data while upgrading to the new unified system!
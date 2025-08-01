# 🏈 Welcome Message Template

## 📝 How to Customize Welcome Messages

Edit the welcome messages in: `DiscordBot/src/modules/welcomeSystem.js`

## 🎯 **Public Welcome Message** (Posted in Welcome Channel)

**Location**: Lines 25-65 in `welcomeSystem.js`

```javascript
const embed = {
  color: 0x1e40af,                    // Blue color (hex)
  title: '🏈 Welcome to the Gridiron Football League!',
  description: `Hey ${member.user.username}! Welcome to the league!`,
  thumbnail: {
    url: member.user.displayAvatarURL({ dynamic: true })
  },
  fields: [
    {
      name: '📋 Get Started',
      value: `• Check out <#${config.channels.rules}> for league rules\n• Browse <#${config.channels.teams}> to see available teams\n• Visit <#${config.channels.league}> for league info`,
      inline: false
    },
    {
      name: '🆘 Need Help?',
      value: 'Feel free to ask questions or ping the commissioners.',
      inline: false
    }
  ],
  image: {
    url: 'https://i.imgur.com/djqdRAq.png'    // Large banner image
  },
  footer: {
    text: 'Gridiron Fantasy League',
    icon_url: guild.iconURL({ dynamic: true })
  },
  timestamp: new Date().toISOString()
};

// The message that appears with the embed
const welcomeMessage = await welcomeChannel.send({ 
  content: `🎉 Everyone welcome ${member} to the league!`,  // Pings the new member
  embeds: [embed] 
});
```

## 💬 **Private Welcome DM** (Sent to New Member)

**Location**: Lines 75-110 in `welcomeSystem.js`

```javascript
const embed = {
  color: 0x10b981,                    // Green color
  title: '🏈 Welcome to Gridiron Fantasy League!',
  description: `Welcome to Gridiron Fantasy League, ${member.user.username}!`,
  fields: [
    {
      name: '🎯 What\'s Next?',
      value: '• Review league rules and settings\n• Make sure you know the Sim Times\n• Click through all the channels',
      inline: false
    },
    {
      name: '📱 Turn on @ Notifications',
      value: 'We sim twice a day and your games will ping you when its time to schedule your game.',
      inline: false
    },
    {
      name: '🏆 Dev Upgrades',
      value: 'Review all the rules and settings to maximize your team like the Dev Upgrades.',
      inline: false
    }
  ],
  footer: {
    text: 'Good luck this season!',
    icon_url: 'https://i.imgur.com/djqdRAq.png'
  }
};
```

## 🎨 **Customization Options**

### **Colors** (hex codes):
- `0x1e40af` - Blue
- `0x10b981` - Green  
- `0xff6b35` - Orange
- `0x8b5cf6` - Purple
- `0xf59e0b` - Yellow

### **Channel References**:
- `<#${config.channels.rules}>` - Links to rules channel
- `<#${config.channels.teams}>` - Links to teams channel
- `<#${config.channels.league}>` - Links to league channel

### **Member References**:
- `${member}` - Pings the new member
- `${member.user.username}` - Shows their Discord username
- `${member.displayName}` - Shows their server nickname

### **Images**:
- **Thumbnail**: Small image (top right)
- **Image**: Large banner image (bottom)
- **Footer Icon**: Small icon next to footer text

## 🔧 **To Edit Welcome Messages**:

1. Open `DiscordBot/src/modules/welcomeSystem.js`
2. Find the embed objects (around lines 25 and 75)
3. Edit the text, colors, fields, and images
4. Save the file
5. Restart the bot: `npm start`

## 📋 **Example Customizations**:

**Change Title**:
```javascript
title: '🎮 Welcome to Our Madden League!',
```

**Add New Field**:
```javascript
{
  name: '🏆 Season Info',
  value: 'Season 5 is now active! Check the schedule.',
  inline: false
}
```

**Change Colors**:
```javascript
color: 0x8b5cf6,  // Purple theme
```

**Custom Images**:
```javascript
image: {
  url: 'https://your-custom-image-url.com/banner.png'
}
```

The template is ready for you to customize!
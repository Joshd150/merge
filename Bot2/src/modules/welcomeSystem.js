import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

export class WelcomeSystem {
  constructor(client) {
    this.client = client;
  }

  async initialize() {
    logger.info(`Welcome system initialized - notifications ${config.welcome.embedsEnabled ? 'enabled' : 'disabled'}`);
  }

  async sendWelcomeMessage(member) {
    try {
      const guild = member.guild;
      const welcomeChannel = guild.channels.cache.get(config.channels.welcome);
      
      if (!welcomeChannel) {
        logger.error('Welcome channel not found');
        return;
      }

      const embed = {
        color: 0x1e40af,
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
          url: 'https://i.imgur.com/djqdRAq.png'
        },
        footer: {
          text: 'Gridiron Fantasy League',
          icon_url: guild.iconURL({ dynamic: true })
        },
        timestamp: new Date().toISOString()
      };

      const welcomeMessage = await welcomeChannel.send({ 
        content: `🎉 Everyone welcome ${member} to the league!`,
        embeds: [embed] 
      });
      
      await welcomeMessage.react('🏈');
      
      // Send welcome DM
      await this.sendWelcomeDM(member);
      
      logger.info(`Sent welcome message for ${member.user.tag}`);
    } catch (error) {
      logger.error(`Failed to send welcome message for ${member.user.tag}:`, error);
    }
  }

  async sendWelcomeDM(member) {
    try {
      const embed = {
        color: 0x10b981,
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

      await member.send({ embeds: [embed] });
    } catch (error) {
      logger.error(`Failed to send welcome DM to ${member.user.tag}:`, error);
    }
  }

  async handleMemberJoin(member) {
    try {
      // Auto-assign role if configured
      if (config.roles.autoAssign) {
        const autoRole = member.guild.roles.cache.get(config.roles.autoAssign);
        if (autoRole) {
          await member.roles.add(autoRole);
          logger.info(`Auto-assigned role to ${member.user.tag}`);
        }
      }
    } catch (error) {
      logger.error(`Failed to auto-assign role to ${member.user.tag}:`, error);
    }
  }

  async shutdown() {
    logger.info('Welcome system shutdown complete');
  }
}
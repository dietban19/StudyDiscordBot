import { Client, GatewayIntentBits, REST, Routes, Events } from 'discord.js';
import { DISCORD } from '../config.js';
import { log } from '../utils/log.js';

export class DiscordBot {
  /**
   * @param {{ commands: any[], onSignin: Function, onWhoami: Function, getUserId: Function }} deps
   */
  constructor({ commands, onSignin, onWhoami, getUserId }) {
    this.client = new Client({ intents: [GatewayIntentBits.Guilds] });
    this.rest = new REST({ version: '10' }).setToken(DISCORD.TOKEN);
    this.commands = commands;
    this.onSignin = onSignin;
    this.onWhoami = onWhoami;
    this.getUserId = getUserId;
  }

  async start() {
    this.client.once(Events.ClientReady, async () => {
      log.info(`Logged in as ${this.client.user.tag}`);

      // Ensure application is fetched so id is available
      await this.client.application?.fetch();
      const appId = this.client.application?.id;

      // Register GLOBAL commands; swap to guild-level during dev if preferred
      const guildId = '1432007716053717055';
      await this.rest.put(Routes.applicationGuildCommands(appId, guildId), {
        body: this.commands,
      });
      //   await this.rest.put(Routes.applicationCommands(appId), {
      //     body: this.commands,
      //   });
      log.info('Slash commands synced.');
    });

    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      if (interaction.commandName === 'signin') {
        await this.onSignin(interaction);
        return;
      }
      if (interaction.commandName === 'whoami') {
        await this.onWhoami(interaction);
        return;
      }
      if (interaction.commandName === 'getuserid') {
        await this.getUserId(interaction);
        return;
      }
    });

    await this.client.login(DISCORD.TOKEN);
  }

  async getChannel(channelId) {
    try {
      return await this.client.channels.fetch(channelId);
    } catch {
      return null;
    }
  }
}

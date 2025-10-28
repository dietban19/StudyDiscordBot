import { DiscordBot } from './discord/DiscordBot.js';
import { commands } from './discord/commands.js';
import { UserService } from './services/UserService.js';
import { DeadlineService } from './services/DeadlineService.js';
import { ReminderScheduler } from './services/ReminderScheduler.js';
import { UserSessionStore } from './stores/UserSessionStore.js';
import { nowLocal } from './utils/time.js';
import { log } from './utils/log.js';
import { UPDATE_LINK } from './config.js';
import { MessageFlags } from 'discord.js';
import jwt from 'jsonwebtoken';
export async function startApp() {
  const userService = new UserService();
  const deadlineService = new DeadlineService();
  const sessions = new UserSessionStore();

  // Command handlers use DI for easy testing
  const onSignin = async (interaction) => {
    console.log('WHO AM I : ');
    console.log(interaction.options);
    const email = interaction.options.getString('email');
    await interaction.deferReply({ ephemeral: true });

    try {
      const user = await userService.findUserByEmail(email);
      if (!user) {
        console.log(interaction);
        await interaction.followUp({
          content: `No user found with email \`${email}\`.`,
          ephemeral: true,
        });
        return;
      }

      sessions.set(interaction.user.id, user.id);
      await userService.updateDiscordLink(
        user.id,
        interaction.user.id,
        interaction.user.tag,
      );

      await interaction.followUp({
        content: `Signed in successfully. Your Firestore user ID: \`${user.id}\``,
        ephemeral: true,
      });

      log.info(
        `[${nowLocal().toISO()}] ${
          interaction.user.tag
        } signed in as ${email} (${user.id})`,
      );
    } catch (err) {
      log.error('Error during signin:', err);
      await interaction.followUp({
        content: 'Error occurred during sign-in.',
        ephemeral: true,
      });
    }
  };

  const onWhoami = async (interaction) => {
    const userId = sessions.get(interaction.user.id);
    await interaction.reply({
      content: userId
        ? `You are signed in as Firestore user \`${userId}\`.`
        : 'You are not signed in yet. Use `/signin <email>` first.',
      ephemeral: true,
    });
  };

  function makeLink(discordId, tag) {
    const token = jwt.sign({ discordId, tag }, process.env.TOKEN_ENC_KEY, {
      expiresIn: '10m',
    });
    return `${UPDATE_LINK}link-discord?token=${token}`;
  }
  const getUserId = async (interaction) => {
    // 1. Get the user object from the interaction
    const user = interaction.user;
    const link = makeLink(interaction.user.id, interaction.user.tag);
    console.log(link);
    // 2. Get the ID from the user object
    const discordId = user.id;

    // 3. Send the ID in the reply
    await interaction.reply({
      content: `Link your Discord to your StudyTracker account here:\n${link}\nThis link expires in 10 minutes.`,
      flags: MessageFlags.Ephemeral, // Makes the reply visible only to the user
    });
  };
  const bot = new DiscordBot({ commands, onSignin, onWhoami, getUserId });
  const scheduler = new ReminderScheduler({
    bot,
    deadlineService,
    sessionStore: sessions,
  });

  await bot.start();
  scheduler.start();

  log.info(`Ready. Update link: ${UPDATE_LINK}`);
}

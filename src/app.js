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
import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
// -------------------------------------------------
// Restore sessions from Firestore
// -------------------------------------------------
async function restoreSessionsFromFirestore(sessions) {
  const db = admin.firestore();
  const snapshot = await db.collection('users').get();
  let count = 0;
  console.log('\n\nSESSIONS: ', sessions);
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.discord?.id) {
      sessions.set(data.discord.id, doc.id);
      count++;
    }
  });

  log.info(`[startup] Restored ${count} linked Discord users from Firestore.`);
}

// -------------------------------------------------
// Optional live sync with Firestore
// // -------------------------------------------------
function watchFirestoreForChanges(sessions) {
  const db = admin.firestore();
  db.collection('users').onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const data = change.doc.data();
      const discordId = data.discord?.id;
      if (!discordId) return;

      if (change.type === 'added' || change.type === 'modified') {
        sessions.set(discordId, change.doc.id);
        log.info(`[sync] Linked or updated Discord user ${discordId}`);
      } else if (change.type === 'removed') {
        sessions.delete(discordId);
        log.info(`[sync] Removed Discord user ${discordId}`);
      }
    });
  });
}
export async function startApp() {
  const userService = new UserService();
  const deadlineService = new DeadlineService();
  const sessions = new UserSessionStore();
  await restoreSessionsFromFirestore(sessions);
  watchFirestoreForChanges(sessions);
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

  function makeLink(discordId, tag, avatarUrl) {
    const token = jwt.sign(
      { discordId, tag, avatar: avatarUrl },
      process.env.TOKEN_ENC_KEY,
      {
        expiresIn: '10m',
      },
    );

    return `${UPDATE_LINK}link-discord?token=${token}`;
  }
  const getUserId = async (interaction) => {
    const user = interaction.user;
    const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 256 });
    const link = makeLink(user.id, user.tag, avatarUrl);
    console.log(link);
    await interaction.reply({
      content: `Link your Discord to your StudyTracker account here:\n${link}\nThis link expires in 10 minutes.`,
      flags: MessageFlags.Ephemeral,
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

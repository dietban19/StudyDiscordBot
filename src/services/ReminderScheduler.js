import cron from 'node-cron';
import {
  TZ,
  FOUR_HOURLY_MINUTE,
  HOURLY_MINUTE,
  UPDATE_LINK,
  DISCORD,
} from '../config.js';
import { nowLocal, fmtLocal } from '../utils/time.js';
import { log } from '../utils/log.js';

export class ReminderScheduler {
  /**
   * @param {{ bot: import('../discord/DiscordBot.js').DiscordBot, deadlineService: any, sessionStore: any }} deps
   */
  constructor({ bot, deadlineService, sessionStore }) {
    this.bot = bot;
    this.deadlineService = deadlineService;
    this.sessions = sessionStore;
  }

  start() {
    // 3 days before, once at 12:00
    cron.schedule(
      '0 12 * * *',
      () => this.runWindow('Deadline(s) in 3 days.', 3),
      { timezone: TZ },
    );

    // 2 days before, every 4 hours
    cron.schedule(
      `${FOUR_HOURLY_MINUTE} */4 * * *`,
      () => this.runWindow('Deadline(s) in 2 days.', 2),
      { timezone: TZ },
    );

    // 1 day before, hourly
    cron.schedule(
      `${HOURLY_MINUTE} * * * *`,
      () => this.runWindow('Deadline(s) tomorrow.', 1),
      { timezone: TZ },
    );

    // Today, every 30 minutes
    cron.schedule(
      '0,30 * * * *',
      // '* * * * *',
      // '*/10 * * * * *',
      () => this.runWindow('Deadline(s) today.', 0),
      { timezone: TZ },
    );

    log.info('Scheduler started: 3d@12:00, 2d@*/4h, 1d@hourly, 0d@0,30');
  }

  async runWindow(title, daysAhead) {
    const channel = await this.bot.getChannel(DISCORD.CHANNEL_ID);
    if (!channel) {
      log.warn('Channel not found:', DISCORD.CHANNEL_ID);
      return;
    }

    const base = nowLocal();
    const target = base.plus({ days: daysAhead }).toJSDate();

    if (this.sessions.size() === 0) {
      log.info(`[${base.toISO()}] No signed-in users for window: ${title}`);
      return;
    }

    for (const [discordId, userId] of this.sessions.entries()) {
      const deadlines = await this.deadlineService.fetchDeadlinesForUserOnDate(
        userId,
        target,
      );
      if (deadlines.length === 0) continue;

      const lines = deadlines
        .map(
          (d) => `**${d.courseName}:** ${d.title}  → due ${fmtLocal(d.dueAt)}`,
        )
        .join('\n');

      const separator = '───────────────────────────────';
      const msg = [
        separator,
        `**${title}**`,
        separator,
        '',
        ...deadlines.map(
          (d) => `• **${d.courseName}:** ${d.title} — due ${fmtLocal(d.dueAt)}`,
        ),
        '',
        `_Update deadlines →_ <${UPDATE_LINK}>`,
        separator,
      ].join('\n');

      await channel.send(msg);
      log.info(
        `[${base.toISO()}] Posted ${title} for user ${userId} (${
          deadlines.length
        } items)`,
      );
    }
  }
}

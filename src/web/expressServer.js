import express from 'express';
import { HTTP } from '../config.js';
import { log } from '../utils/log.js';

export function createExpressServer() {
  const app = express();

  app.get('/', (_req, res) => {
    res.send('Firestore + Discord sign-in + reminders server is running.');
  });

  const server = app.listen(HTTP.PORT, () => {
    log.info(`Express server running on port ${HTTP.PORT}`);
  });

  return { app, server };
}

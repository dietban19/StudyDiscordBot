import { createExpressServer } from './web/expressServer.js';
import { startApp } from './app.js';
import { log } from './utils/log.js';

const { server } = createExpressServer();

startApp().catch((err) => {
  log.error('Failed to start app:', err);
  process.exit(1);
});

// Graceful shutdown
const close = () => {
  log.info('Shutting down...');
  server?.close?.(() => process.exit(0));
};
process.on('SIGINT', close);
process.on('SIGTERM', close);

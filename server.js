const config = require('./config/env');
const db = require('./config/db');
const { initDatabase } = require('./services/setupService');
const { createApp } = require('./app');

async function start() {
  await initDatabase();
  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`[server] ${config.nodeEnv} modunda çalışıyor: ${config.baseUrl} (port ${config.port})`);
  });

  const shutdown = (signal) => {
    console.log(`[server] ${signal} alındı, kapatılıyor...`);
    server.close(async () => {
      await db.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  console.error('[server] Sunucu başlatılamadı:', err.message);
  process.exit(1);
});

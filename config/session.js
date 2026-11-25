/**
 * Oturum yönetimi: express-session + PostgreSQL tabanlı session store (connect-pg-simple).
 * "session" tablosu sql/schema.sql içinde oluşturulur.
 */
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const config = require('./env');
const { getPool } = require('./db');

const EIGHT_HOURS = 1000 * 60 * 60 * 8;

function createSessionMiddleware() {
  return session({
    store: new PgSession({
      pool: getPool(),
      tableName: 'session',
      createTableIfMissing: false,
      pruneSessionInterval: config.isTest ? false : 60 * 15
    }),
    name: 'onid.sid',
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    proxy: config.isProduction,
    cookie: {
      httpOnly: true,
      secure: config.isProduction, // HTTPS (Render) üzerinde zorunlu
      sameSite: 'lax',
      maxAge: EIGHT_HOURS
    }
  });
}

module.exports = { createSessionMiddleware };

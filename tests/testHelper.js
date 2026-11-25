/**
 * Test yardımcıları: test ortamını yalnızca izole TEST_DATABASE_URL'e yönlendirir,
 * canlı veritabanına karşı güvenlik kilidi uygular, CSRF belirtecini çıkarır ve admin oturumu açar.
 */
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
require('dotenv').config();

const originalDbUrl = (process.env.DATABASE_URL || '').trim();
const testDbUrl = (process.env.TEST_DATABASE_URL || '').trim();

if (!testDbUrl) {
  throw new Error(
    'GUVENLIK KILIDI: Testleri calistirmak icin ayri bir TEST_DATABASE_URL zorunludur. Canli DATABASE_URL kullanilamaz.'
  );
}

if (originalDbUrl && testDbUrl === originalDbUrl) {
  throw new Error(
    'GUVENLIK KILIDI: TEST_DATABASE_URL, DATABASE_URL ile ayni olamaz.'
  );
}

let parsedTestDbName = '';
try {
  parsedTestDbName = new URL(testDbUrl).pathname.replace(/^\//, '').toLowerCase();
} catch {
  throw new Error('GUVENLIK KILIDI: TEST_DATABASE_URL gecerli bir PostgreSQL URL degil.');
}

if (!parsedTestDbName || !parsedTestDbName.includes('test')) {
  throw new Error(
    `GUVENLIK KILIDI: TEST_DATABASE_URL veritabani adi ("${parsedTestDbName}") "test" ifadesini icermelidir.`
  );
}

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = testDbUrl;
process.env.SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
process.env.ADMIN_USER = process.env.TEST_ADMIN_USER || 'test_admin';
process.env.ADMIN_PASS =
  process.env.TEST_ADMIN_PASS || `Test_${crypto.randomBytes(12).toString('hex')}!9a`;
process.env.UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'onid-uploads-'));

const db = require('../config/db');
const { initDatabase } = require('../services/setupService');
const { createApp } = require('../app');

function extractCsrf(html) {
  const match =
    html.match(/name="_csrf"\s+value="([^"]+)"/) ||
    html.match(/\?_csrf=([a-f0-9]+)/i);
  return match ? match[1] : '';
}

async function resetDatabase() {
  if (
    process.env.NODE_ENV !== 'test' ||
    !process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL
  ) {
    throw new Error('GUVENLIK KILIDI: resetDatabase() yalnizca izole test veritabaninda calisabilir.');
  }
  await initDatabase({ log: () => {}, warn: () => {}, error: console.error });
  await db.query('TRUNCATE TABLE projects, inquiries, admins, app_meta, "session" RESTART IDENTITY CASCADE');
  await initDatabase({ log: () => {}, warn: () => {}, error: console.error });
}

async function loginAsAdmin(agent) {
  const loginGet = await agent.get('/login');
  const csrf = extractCsrf(loginGet.text);
  const res = await agent
    .post('/login')
    .type('form')
    .send({
      _csrf: csrf,
      username: process.env.ADMIN_USER,
      password: process.env.ADMIN_PASS
    });
  return { res, csrf };
}

// 1x1 geçerli PNG dosyası (magic bytes doğrulamasından geçer)
const VALID_PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

module.exports = {
  db,
  createApp,
  extractCsrf,
  resetDatabase,
  loginAsAdmin,
  VALID_PNG_BUFFER
};

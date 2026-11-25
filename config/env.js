/**
 * Ortam değişkenlerini tek yerden okur ve doğrular.
 * Hiçbir gizli bilgi kaynak koda yazılmaz; hepsi .env veya barındırma paneli üzerinden gelir.
 */
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test';
const port = parseInt(process.env.PORT, 10) || 3000;

let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32) {
  if (isProduction) {
    throw new Error('SESSION_SECRET zorunludur ve en az 32 karakter olmalıdır (openssl rand -hex 32).');
  }
  // Geliştirme/test ortamında geçici anahtar üretilir; sunucu yeniden başlayınca oturumlar geçersiz olur.
  sessionSecret = crypto.randomBytes(32).toString('hex');
  if (!isTest) {
    console.warn('[env] SESSION_SECRET tanımlı değil veya kısa. Geçici anahtar üretildi.');
  }
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl && isProduction) {
  throw new Error('DATABASE_URL zorunludur (yerel PostgreSQL veya Supabase bağlantı adresi).');
}

const baseUrl = (process.env.BASE_URL || `http://localhost:${port}`).replace(/\/+$/, '');

module.exports = {
  nodeEnv,
  isProduction,
  isTest,
  port,
  baseUrl,
  sessionSecret,
  databaseUrl,
  dbSsl: (process.env.DB_SSL || '').toLowerCase(),
  admin: {
    username: (process.env.ADMIN_USER || '').trim(),
    password: process.env.ADMIN_PASS || ''
  },
  upload: {
    // Yerel yükleme klasörü. Render gibi geçici dosya sistemlerinde SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY önerilir.
    dir: process.env.UPLOAD_DIR || path.join(__dirname, '..', 'public', 'uploads'),
    maxFileSizeBytes: 5 * 1024 * 1024,
    supabaseUrl: (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, ''),
    supabaseServiceRoleKey: (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim(),
    supabaseBucket: (process.env.SUPABASE_STORAGE_BUCKET || 'project-images').trim()
  },
  maxFeaturedProjects: 3
};

/**
 * PostgreSQL bağlantı havuzu (node-postgres).
 * Yerel PostgreSQL ve Supabase PostgreSQL aynı DATABASE_URL değişkeniyle desteklenir.
 */
const { Pool } = require('pg');
const config = require('./env');

function shouldUseSsl(url) {
  if (config.dbSsl === 'false') return false;
  if (config.dbSsl === 'true') return true;
  return /supabase\.(co|com)|pooler\.supabase|sslmode=require/i.test(url || '');
}

/** URL içindeki sslmode parametresi, kendi ssl ayarımızı ezmesin diye temizlenir. */
function stripSslMode(url) {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete('sslmode');
    return parsed.toString();
  } catch (err) {
    return url;
  }
}

let pool = null;

function getPool() {
  if (pool) return pool;
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL tanımlı değil. .env dosyasını kontrol edin.');
  }
  pool = new Pool({
    connectionString: stripSslMode(config.databaseUrl),
    // Supabase sertifika zinciri için rejectUnauthorized=false yaygın kullanımdır (README'ye bakınız).
    ssl: shouldUseSsl(config.databaseUrl) ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 8000
  });
  pool.on('error', (err) => {
    console.error('[db] Beklenmeyen havuz hatası:', err.message);
  });
  return pool;
}

/** Her zaman parametreli sorgu kullanın: query('SELECT * FROM projects WHERE id = $1', [id]) */
function query(text, params) {
  return getPool().query(text, params);
}

async function close() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { getPool, query, close };

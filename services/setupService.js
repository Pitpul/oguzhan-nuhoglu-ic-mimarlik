/**
 * Sunucu açılışında çalışan kurulum adımları:
 * bağlantı kontrolü → şema (idempotent) → seed (bir kez) → admin hesabı.
 * Tabloları ASLA silmez veya sıfırlamaz.
 */
const fs = require('fs/promises');
const path = require('path');
const { getPool } = require('../config/db');
const seedProjects = require('../sql/seedProjects');
const projectService = require('./projectService');
const projectRepository = require('../repositories/projectRepository');
const authService = require('./authService');
const { slugify } = require('../utils/slugify');

const SEED_KEY = 'seed_projects_v1';

async function checkConnection() {
  await getPool().query('SELECT 1');
}

async function applySchema() {
  const schemaPath = process.env.SCHEMA_PATH || path.join(__dirname, '..', 'sql', 'schema.sql');
  const sql = await fs.readFile(schemaPath, 'utf8');
  await getPool().query(sql);
}

/**
 * Örnek projeleri YALNIZCA BİR KEZ ekler. app_meta tablosundaki anahtar atomik olarak talep edilir;
 * admin tüm projeleri silse bile sonraki açılışlarda yeniden eklenmez.
 */
async function seedProjectsOnce(log) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const claim = await client.query(
      "INSERT INTO app_meta (key, value) VALUES ($1, 'done') ON CONFLICT (key) DO NOTHING RETURNING key",
      [SEED_KEY]
    );
    if (claim.rowCount === 0) {
      await client.query('COMMIT');
      return 0;
    }
    const existing = await client.query('SELECT COUNT(*)::int AS count FROM projects');
    if (existing.rows[0].count > 0) {
      await client.query('COMMIT');
      return 0;
    }
    const usedSlugs = new Set();
    for (const p of seedProjects) {
      let slug = slugify(p.title);
      while (usedSlugs.has(slug)) slug += '-2';
      usedSlugs.add(slug);
      await client.query(
        `INSERT INTO projects (title, slug, category, category_label, location, area, year, description,
                               materials, architect, image_url, is_featured)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [p.title, slug, p.category, projectService.categoryLabel(p.category), p.location, p.area, p.year,
         p.description, p.materials, p.architect, p.image_url, p.is_featured]
      );
    }
    await client.query('COMMIT');
    log.log(`[seed] ${seedProjects.length} örnek proje eklendi.`);
    return seedProjects.length;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function initDatabase(log = console) {
  try {
    await checkConnection();
  } catch (err) {
    log.error(`[db] PostgreSQL bağlantısı kurulamadı (${err.code || err.message}). DATABASE_URL değerini ve veritabanı sunucusunu kontrol edin.`);
    throw err;
  }
  await applySchema();
  await seedProjectsOnce(log);
  await authService.ensureAdmin(log);
  // Eski kayıtlarda slug yoksa tamamla (güvenlik ağı).
  const all = await projectRepository.findAll();
  for (const p of all.filter((x) => !x.slug)) {
    await getPool().query('UPDATE projects SET slug = $1 WHERE id = $2', [`${slugify(p.title)}-${p.id}`, p.id]);
  }
  log.log('[db] Veritabanı hazır.');
}

module.exports = { initDatabase, seedProjectsOnce, applySchema, SEED_KEY };

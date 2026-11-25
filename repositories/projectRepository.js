const { query } = require('../config/db');

const COLUMNS = `id, title, slug, category, category_label, location, area, year, description, materials,
  architect, image_url, is_featured, created_at, updated_at`;

/** Projeleri listeler. Arama ve kategori filtresi parametreli sorguyla uygulanır. */
async function findAll({ category, search } = {}) {
  const conditions = [];
  const params = [];
  if (category) {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }
  if (search) {
    params.push(`%${search.replace(/[%_\\]/g, '\\$&')}%`);
    conditions.push(`(title ILIKE $${params.length} OR location ILIKE $${params.length})`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await query(`SELECT ${COLUMNS} FROM projects ${where} ORDER BY created_at DESC, id DESC`, params);
  return rows;
}

async function findFeatured(limit = 3) {
  const { rows } = await query(
    `SELECT ${COLUMNS} FROM projects WHERE is_featured = TRUE ORDER BY created_at DESC, id DESC LIMIT $1`,
    [limit]
  );
  return rows;
}

async function findById(id) {
  const { rows } = await query(`SELECT ${COLUMNS} FROM projects WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function findBySlug(slug) {
  const { rows } = await query(`SELECT ${COLUMNS} FROM projects WHERE slug = $1`, [slug]);
  return rows[0] || null;
}

async function slugExists(slug, excludeId = null) {
  const { rows } = await query('SELECT 1 FROM projects WHERE slug = $1 AND ($2::int IS NULL OR id <> $2)', [
    slug,
    excludeId
  ]);
  return rows.length > 0;
}

async function countFeatured(excludeId = null) {
  const { rows } = await query(
    'SELECT COUNT(*)::int AS count FROM projects WHERE is_featured = TRUE AND ($1::int IS NULL OR id <> $1)',
    [excludeId]
  );
  return rows[0].count;
}

async function countAll() {
  const { rows } = await query('SELECT COUNT(*)::int AS count FROM projects');
  return rows[0].count;
}

async function countByCategory() {
  const { rows } = await query('SELECT category, COUNT(*)::int AS count FROM projects GROUP BY category');
  return rows;
}

async function countImageUsage(imageUrl, excludeId = null) {
  const { rows } = await query(
    'SELECT COUNT(*)::int AS count FROM projects WHERE image_url = $1 AND ($2::int IS NULL OR id <> $2)',
    [imageUrl, excludeId]
  );
  return rows[0].count;
}

async function create(data) {
  const { rows } = await query(
    `INSERT INTO projects
      (title, slug, category, category_label, location, area, year, description, materials, architect, image_url, is_featured)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING ${COLUMNS}`,
    [
      data.title,
      data.slug,
      data.category,
      data.category_label,
      data.location,
      data.area,
      data.year,
      data.description,
      data.materials,
      data.architect,
      data.image_url,
      data.is_featured
    ]
  );
  return rows[0];
}

async function update(id, data) {
  const { rows } = await query(
    `UPDATE projects SET
       title = $1, slug = $2, category = $3, category_label = $4, location = $5, area = $6, year = $7,
       description = $8, materials = $9, architect = $10, image_url = $11, is_featured = $12,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $13
     RETURNING ${COLUMNS}`,
    [
      data.title,
      data.slug,
      data.category,
      data.category_label,
      data.location,
      data.area,
      data.year,
      data.description,
      data.materials,
      data.architect,
      data.image_url,
      data.is_featured,
      id
    ]
  );
  return rows[0] || null;
}

async function remove(id) {
  const { rowCount } = await query('DELETE FROM projects WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = {
  findAll,
  findFeatured,
  findById,
  findBySlug,
  slugExists,
  countFeatured,
  countAll,
  countByCategory,
  countImageUsage,
  create,
  update,
  remove
};

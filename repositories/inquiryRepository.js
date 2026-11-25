const { query } = require('../config/db');

const COLUMNS = `id, full_name, email, phone, project_type, message, kvkk_accepted, status, admin_notes,
  created_at, updated_at`;

async function findAll({ status, search } = {}) {
  const conditions = [];
  const params = [];
  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  if (search) {
    params.push(`%${search.replace(/[%_\\]/g, '\\$&')}%`);
    const p = `$${params.length}`;
    conditions.push(`(full_name ILIKE ${p} OR email ILIKE ${p} OR phone ILIKE ${p} OR message ILIKE ${p})`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await query(`SELECT ${COLUMNS} FROM inquiries ${where} ORDER BY created_at DESC, id DESC`, params);
  return rows;
}

async function findRecent(limit = 5) {
  const { rows } = await query(`SELECT ${COLUMNS} FROM inquiries ORDER BY created_at DESC, id DESC LIMIT $1`, [limit]);
  return rows;
}

async function findById(id) {
  const { rows } = await query(`SELECT ${COLUMNS} FROM inquiries WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function create(data) {
  const { rows } = await query(
    `INSERT INTO inquiries (full_name, email, phone, project_type, message, kvkk_accepted, status, admin_notes)
     VALUES ($1,$2,$3,$4,$5,$6,'Yeni Talep','')
     RETURNING ${COLUMNS}`,
    [data.full_name, data.email, data.phone, data.project_type, data.message, data.kvkk_accepted]
  );
  return rows[0];
}

async function updateStatusAndNotes(id, { status, admin_notes }) {
  const { rows } = await query(
    `UPDATE inquiries SET status = $1, admin_notes = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 RETURNING ${COLUMNS}`,
    [status, admin_notes, id]
  );
  return rows[0] || null;
}

async function remove(id) {
  const { rowCount } = await query('DELETE FROM inquiries WHERE id = $1', [id]);
  return rowCount > 0;
}

async function countByStatus() {
  const { rows } = await query('SELECT status, COUNT(*)::int AS count FROM inquiries GROUP BY status');
  return rows;
}

module.exports = { findAll, findRecent, findById, create, updateStatusAndNotes, remove, countByStatus };

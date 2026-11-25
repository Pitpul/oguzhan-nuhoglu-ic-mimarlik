const { query } = require('../config/db');

async function findByUsername(username) {
  const { rows } = await query('SELECT id, username, password_hash FROM admins WHERE username = $1', [username]);
  return rows[0] || null;
}

async function count() {
  const { rows } = await query('SELECT COUNT(*)::int AS count FROM admins');
  return rows[0].count;
}

async function create(username, passwordHash) {
  const { rows } = await query(
    'INSERT INTO admins (username, password_hash) VALUES ($1, $2) RETURNING id, username',
    [username, passwordHash]
  );
  return rows[0];
}

module.exports = { findByUsername, count, create };

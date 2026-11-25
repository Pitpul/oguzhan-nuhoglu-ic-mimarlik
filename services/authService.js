const bcrypt = require('bcrypt');
const config = require('../config/env');
const adminRepository = require('../repositories/adminRepository');

const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 10;
const WEAK_PASSWORDS = new Set(['admin', 'password', '1234567890', 'admin12345', 'admin123456', 'changeme123']);

// Kullanıcı bulunamadığında da bcrypt çalıştırılır (zamanlama farkından kullanıcı adı sızmasın).
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_ROUNDS);

/** Başarılıysa { id, username }, değilse null döner. */
async function authenticate(username, password) {
  const admin = await adminRepository.findByUsername(username);
  const hash = admin ? admin.password_hash : DUMMY_HASH;
  const match = await bcrypt.compare(password, hash);
  if (!admin || !match) return null;
  return { id: admin.id, username: admin.username };
}

function isStrongPassword(password) {
  return (
    typeof password === 'string' &&
    password.length >= MIN_PASSWORD_LENGTH &&
    !WEAK_PASSWORDS.has(password.toLowerCase())
  );
}

/**
 * .env'deki ADMIN_USER yoksa oluşturur. Mevcut bir adminin şifresini ASLA değiştirmez.
 * @returns {Promise<'created'|'exists'|'skipped'>}
 */
async function ensureAdmin(log = console) {
  const { username, password } = config.admin;
  if (!username || !password) {
    const total = await adminRepository.count();
    if (total === 0) {
      log.warn('[admin] ADMIN_USER / ADMIN_PASS tanımlı değil ve hiç admin yok. Yönetim paneline giriş yapılamaz.');
    }
    return 'skipped';
  }
  if (await adminRepository.findByUsername(username)) return 'exists';
  if (!isStrongPassword(password)) {
    log.error(`[admin] ADMIN_PASS en az ${MIN_PASSWORD_LENGTH} karakter olmalı ve tahmin edilmesi kolay olmamalı. Admin oluşturulmadı.`);
    return 'skipped';
  }
  await adminRepository.create(username, await bcrypt.hash(password, BCRYPT_ROUNDS));
  log.log(`[admin] Yönetici hesabı oluşturuldu: ${username}`);
  return 'created';
}

module.exports = { authenticate, ensureAdmin, isStrongPassword };

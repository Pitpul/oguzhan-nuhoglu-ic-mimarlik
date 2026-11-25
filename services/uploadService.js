/**
 * Görsel depolama katmanı.
 *
 * - SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY tanımlıysa (üretim ortamı / Render.com),
 *   dosyayı sunucu tarafında güvenli biçimde Supabase Storage bucket'ına yükler.
 * - Tanımlı değilse yerel klasöre (public/uploads) yazar.
 * Her iki modda da dosyanın gerçek içeriği (magic bytes) doğrulanır.
 */
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const config = require('../config/env');
const { AppError } = require('../utils/errors');

const LOCAL_URL_PREFIX = '/uploads/';
const SAFE_FILE_NAME = /^[A-Za-z0-9._-]+$/;

function isSupabaseStorageConfigured() {
  return Boolean(
    !config.isTest &&
      config.upload.supabaseUrl &&
      config.upload.supabaseServiceRoleKey &&
      config.upload.supabaseBucket
  );
}

function getSupabasePublicPrefix() {
  if (!config.upload.supabaseUrl) return null;
  return `${config.upload.supabaseUrl}/storage/v1/object/public/${config.upload.supabaseBucket}/`;
}

/** Dosyanın GERÇEK içeriğine (magic bytes) bakarak türünü belirler. */
function detectImageType(buffer) {
  if (!buffer || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { ext: 'jpg', mime: 'image/jpeg' };
  const pngSig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (pngSig.every((b, i) => buffer[i] === b)) return { ext: 'png', mime: 'image/png' };
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return { ext: 'webp', mime: 'image/webp' };
  }
  return null;
}

/**
 * Multer'dan gelen (bellekteki) dosyayı doğrular ve kaydeder.
 * @returns {Promise<string>} Veritabanına yazılacak görsel adresi
 */
async function saveImage(file) {
  const type = detectImageType(file && file.buffer);
  if (!type) {
    throw new AppError('Yüklenen dosya geçerli bir görsel değil. Yalnızca JPG, PNG veya WEBP kabul edilir.', 400);
  }
  const fileName = `proje-${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${type.ext}`;

  if (isSupabaseStorageConfigured()) {
    const uploadUrl = `${config.upload.supabaseUrl}/storage/v1/object/${config.upload.supabaseBucket}/${fileName}`;
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.upload.supabaseServiceRoleKey}`,
        apikey: config.upload.supabaseServiceRoleKey,
        'Content-Type': type.mime,
        'x-upsert': 'false'
      },
      body: file.buffer
    });
    if (!response.ok) {
      console.error('[upload] Supabase Storage yükleme hatası:', response.status);
      throw new AppError('Görsel bulut depolamaya yüklenirken bir hata oluştu.', 500);
    }
    return `${getSupabasePublicPrefix()}${fileName}`;
  }

  await fs.mkdir(config.upload.dir, { recursive: true });
  await fs.writeFile(path.join(config.upload.dir, fileName), file.buffer, { flag: 'wx' });
  return `${LOCAL_URL_PREFIX}${fileName}`;
}

function isLocalImage(imageUrl) {
  if (typeof imageUrl !== 'string' || !imageUrl.startsWith(LOCAL_URL_PREFIX)) return false;
  return SAFE_FILE_NAME.test(imageUrl.slice(LOCAL_URL_PREFIX.length));
}

function isSupabaseImage(imageUrl) {
  const prefix = getSupabasePublicPrefix();
  if (!prefix || typeof imageUrl !== 'string' || !imageUrl.startsWith(prefix)) return false;
  return SAFE_FILE_NAME.test(imageUrl.slice(prefix.length));
}

function isManagedImage(imageUrl) {
  return isLocalImage(imageUrl) || isSupabaseImage(imageUrl);
}

/** Yalnızca uygulama tarafından yüklenmiş (yerel veya Supabase Storage) dosyaları siler; harici URL'lere dokunmaz. */
async function deleteImage(imageUrl) {
  if (isLocalImage(imageUrl)) {
    const fileName = imageUrl.slice(LOCAL_URL_PREFIX.length);
    try {
      await fs.unlink(path.join(config.upload.dir, fileName));
      return true;
    } catch (err) {
      if (err.code !== 'ENOENT') console.error('[upload] Yerel dosya silinemedi:', err.message);
      return false;
    }
  }

  if (isSupabaseImage(imageUrl) && isSupabaseStorageConfigured()) {
    const prefix = getSupabasePublicPrefix();
    const fileName = imageUrl.slice(prefix.length);
    try {
      const delUrl = `${config.upload.supabaseUrl}/storage/v1/object/${config.upload.supabaseBucket}/${fileName}`;
      const res = await fetch(delUrl, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${config.upload.supabaseServiceRoleKey}`,
          apikey: config.upload.supabaseServiceRoleKey
        }
      });
      return res.ok;
    } catch (err) {
      console.error('[upload] Supabase Storage dosya silinemedi:', err.message);
      return false;
    }
  }

  return false;
}

module.exports = { detectImageType, saveImage, deleteImage, isLocalImage, isManagedImage };

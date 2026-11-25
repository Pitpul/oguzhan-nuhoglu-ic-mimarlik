/**
 * Görsel yükleme (multer). Dosya bellekte tutulur; gerçek içerik (magic bytes) kontrolü ve
 * diske yazma işlemi uploadService tarafından yapılır (depolama katmanı değiştirilebilir kalsın diye).
 */
const multer = require('multer');
const path = require('path');
const config = require('../config/env');

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.upload.maxFileSizeBytes, files: 1 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME.has(file.mimetype)) {
      const err = new Error('INVALID_FILE_TYPE');
      err.code = 'INVALID_FILE_TYPE';
      return cb(err);
    }
    return cb(null, true);
  }
});

function friendlyMessage(err) {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return `Görsel boyutu en fazla ${Math.round(config.upload.maxFileSizeBytes / 1024 / 1024)} MB olabilir.`;
  }
  if (err.code === 'INVALID_FILE_TYPE') return 'Yalnızca JPG, PNG veya WEBP görselleri yüklenebilir.';
  if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') return 'Yalnızca tek bir görsel yükleyebilirsiniz.';
  return 'Görsel yüklenirken bir hata oluştu.';
}

/**
 * Hata olursa isteği durdurmaz; req.uploadError'a anlamlı mesaj yazar ki
 * controller formu kullanıcının girdiği değerlerle birlikte yeniden gösterebilsin.
 */
function handleImageUpload(req, res, next) {
  upload.single('image_file')(req, res, (err) => {
    if (err) {
      req.uploadError = friendlyMessage(err);
      req.body = req.body || {};
      req.file = undefined;
    }
    next();
  });
}

module.exports = { handleImageUpload };

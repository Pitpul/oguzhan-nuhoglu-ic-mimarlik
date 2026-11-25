const config = require('../config/env');
const { wantsJson } = require('./validationMiddleware');

function notFoundHandler(req, res) {
  res.status(404);
  if (wantsJson(req)) return res.json({ success: false, message: 'Aradığınız kaynak bulunamadı.' });
  return res.render('errors/404', { meta: { title: 'Sayfa Bulunamadı', noindex: true }, currentPage: '' });
}

/** Merkezi hata yönetimi: hassas ayrıntılar (stack, yol, SQL) kullanıcıya asla gösterilmez. */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const status = err.status || err.statusCode || 500;
  const isCsrf = err.code === 'EBADCSRFTOKEN';

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl} →`, err.stack || err);
  } else if (!config.isTest) {
    console.warn(`[warn] ${req.method} ${req.originalUrl} → ${status} ${err.message}`);
  }

  let message = 'Beklenmedik bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
  let title = 'Bir Sorun Oluştu';
  if (isCsrf) {
    message = 'Güvenlik doğrulaması başarısız oldu. Sayfayı yenileyip işlemi tekrar deneyin.';
    title = 'Doğrulama Hatası';
  } else if (status < 500 && err.expose) {
    message = err.message;
  }

  res.status(status >= 400 && status < 600 ? status : 500);
  if (wantsJson(req)) return res.json({ success: false, message });
  return res.render('errors/500', {
    meta: { title, noindex: true },
    errorStatus: res.statusCode,
    errorTitle: title,
    errorMessage: message,
    currentPage: ''
  });
}

module.exports = { notFoundHandler, errorHandler };

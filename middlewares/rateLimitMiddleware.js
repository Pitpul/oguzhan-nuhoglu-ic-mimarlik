const rateLimit = require('express-rate-limit');
const { wantsJson } = require('./validationMiddleware');

function buildHandler(message) {
  return (req, res) => {
    if (wantsJson(req)) return res.status(429).json({ success: false, message });
    return res.status(429).render('errors/500', {
      meta: { title: 'Çok Fazla İstek', noindex: true },
      errorStatus: 429,
      errorTitle: 'Çok Fazla İstek',
      errorMessage: message,
      currentPage: ''
    });
  };
}

/** Form ve giriş endpoint'leri için IP bazlı hız sınırları. */
function createLimiters(options = {}) {
  const contactMax = options.contactMax || 5;
  const loginMax = options.loginMax || 10;
  return {
    contact: rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: contactMax,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      handler: buildHandler('Kısa sürede çok fazla talep gönderdiniz. Lütfen biraz sonra tekrar deneyin.')
    }),
    login: rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: loginMax,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      skipSuccessfulRequests: true,
      handler: buildHandler('Çok fazla başarısız giriş denemesi yapıldı. Lütfen 15 dakika sonra tekrar deneyin.')
    })
  };
}

module.exports = { createLimiters };

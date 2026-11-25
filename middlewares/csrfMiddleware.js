/**
 * CSRF koruması (senkronizör token deseni).
 * Token oturumda saklanır; yalnızca bir formda gerçekten kullanıldığında (csrfToken() çağrısıyla)
 * üretilir, böylece formu olmayan sayfalar gereksiz oturum oluşturmaz.
 *
 * Token şu yerlerden okunur: `x-csrf-token` başlığı (fetch), `?_csrf=` sorgu parametresi
 * (multipart formlar — gövde multer tarafından sonra ayrıştırıldığı için) veya `_csrf` form alanı.
 */
const crypto = require('crypto');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function getOrCreateToken(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  return req.session.csrfToken;
}

function tokensMatch(expected, supplied) {
  if (typeof expected !== 'string' || typeof supplied !== 'string') return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function csrfProtection(req, res, next) {
  res.locals.csrfToken = () => getOrCreateToken(req);
  res.locals.csrfField = () => `<input type="hidden" name="_csrf" value="${getOrCreateToken(req)}">`;

  if (SAFE_METHODS.has(req.method)) return next();

  const supplied = req.get('x-csrf-token') || (req.query && req.query._csrf) || (req.body && req.body._csrf);
  if (!tokensMatch(req.session && req.session.csrfToken, supplied)) {
    const err = new Error('Geçersiz veya eksik CSRF belirteci.');
    err.status = 403;
    err.code = 'EBADCSRFTOKEN';
    err.expose = true;
    return next(err);
  }
  return next();
}

module.exports = { csrfProtection, tokensMatch };

/** Yönetim rotalarını yalnızca giriş yapmış admin'e açar. */
function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) {
    res.locals.admin = req.session.admin;
    res.set('Cache-Control', 'no-store'); // Çıkış sonrası geri tuşuyla panel görünmesin
    return next();
  }
  const wantsJson = req.xhr || (req.get('accept') || '').includes('application/json');
  if (wantsJson) return res.status(401).json({ success: false, message: 'Oturum açmanız gerekiyor.' });
  return res.redirect('/login');
}

/** Giriş yapmış kullanıcı /login sayfasını görmesin. */
function redirectIfAuthenticated(req, res, next) {
  if (req.session && req.session.admin) return res.redirect('/admin');
  return next();
}

module.exports = { requireAdmin, redirectIfAuthenticated };

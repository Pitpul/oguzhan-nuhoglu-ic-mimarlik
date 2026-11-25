/** Oturum tabanlı tek seferlik (flash) mesajlar. */
function setFlash(req, type, message) {
  if (req.session) req.session.flash = { type, message };
}

/** Flash mesajını şablonlara aktarır ve oturumdan siler. */
function flashMiddleware(req, res, next) {
  res.locals.flash = null;
  if (req.session && req.session.flash) {
    res.locals.flash = req.session.flash;
    delete req.session.flash;
  }
  next();
}

module.exports = { setFlash, flashMiddleware };

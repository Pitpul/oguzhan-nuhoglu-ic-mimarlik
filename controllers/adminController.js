const authService = require('../services/authService');
const projectService = require('../services/projectService');
const inquiryService = require('../services/inquiryService');
const { projectCategories } = require('../config/site');

function loginPage(req, res) {
  res.render('admin/login', {
    meta: { title: 'Yönetim Paneli Girişi', noindex: true },
    error: null,
    username: ''
  });
}

function renderLoginError(req, res, message, status = 401) {
  const username = (req.body && typeof req.body.username === 'string' ? req.body.username : '').slice(0, 100);
  return res.status(status).render('admin/login', {
    meta: { title: 'Yönetim Paneli Girişi', noindex: true },
    error: message,
    username
  });
}

/** validateBody middleware'i boş alan durumunda bunu çağırır. */
function loginInvalid(req, res) {
  return renderLoginError(req, res, 'Kullanıcı adı ve şifre gereklidir.', 400);
}

async function login(req, res, next) {
  const { username, password } = req.validated;
  const admin = await authService.authenticate(username, password);
  if (!admin) {
    // Hangi alanın yanlış olduğunu veya sistem bilgisini ifşa etmeyen genel mesaj
    return renderLoginError(req, res, 'Kullanıcı adı veya şifre hatalı.');
  }
  // Session fixation'a karşı oturum kimliğini yenile
  return req.session.regenerate((err) => {
    if (err) return next(err);
    req.session.admin = { id: admin.id, username: admin.username };
    return req.session.save((saveErr) => {
      if (saveErr) return next(saveErr);
      return res.redirect('/admin');
    });
  });
}

function logout(req, res) {
  req.session.destroy(() => {
    // Hata olsa bile çerez temizlenir ve kullanıcı login'e yönlendirilir.
    res.clearCookie('onid.sid');
    res.redirect('/login');
  });
}

async function dashboard(req, res) {
  const [projectStats, inquiryStats] = await Promise.all([
    projectService.getDashboardStats(),
    inquiryService.getDashboardStats()
  ]);
  const categoryCounts = projectCategories.map((c) => ({
    label: c.label,
    count: (projectStats.byCategory.find((r) => r.category === c.value) || { count: 0 }).count
  }));
  res.render('admin/dashboard', {
    meta: { title: 'Dashboard | Yönetim Paneli', noindex: true },
    adminPage: 'dashboard',
    projectStats,
    inquiryStats,
    categoryCounts
  });
}

module.exports = { loginPage, loginInvalid, login, logout, dashboard };

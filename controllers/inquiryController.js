const inquiryService = require('../services/inquiryService');
const { setFlash } = require('../utils/flash');
const { inquiryStatuses, site } = require('../config/site');
const { wantsJson } = require('../middlewares/validationMiddleware');
const { ValidationError } = require('../utils/errors');

const SUCCESS_MESSAGE =
  'Talebiniz başarıyla alındı. Ekibimiz en kısa sürede sizinle iletişime geçecektir.';

function renderContact(res, { values = {}, errors = {}, status = 200 } = {}) {
  return res.status(status).render('pages/iletisim', {
    currentPage: 'contact',
    meta: {
      title: `İletişim & Keşif Talebi | ${site.name}`,
      description: 'Projeniz için teklif ve keşif talebi oluşturun; İstanbul-Maltepe ofisimizle iletişime geçin.',
      path: '/iletisim'
    },
    form: { values, errors }
  });
}

function contactPage(req, res) {
  renderContact(res);
}

/** Doğrulama başarısız olduğunda (JS kapalı kullanıcılar için) formu hatalarla yeniden gösterir. */
function renderInvalid(req, res) {
  return renderContact(res, { ...req.validation, status: 400 });
}

async function create(req, res) {
  // Honeypot: botlar gizli alanı doldurur. Başarılıymış gibi yanıt verip kaydetmeyiz.
  if (req.body && req.body.website) {
    if (wantsJson(req)) return res.status(201).json({ success: true, message: SUCCESS_MESSAGE });
    setFlash(req, 'success', SUCCESS_MESSAGE);
    return res.redirect('/iletisim');
  }

  try {
    await inquiryService.createInquiry(req.body);
  } catch (err) {
    if (err instanceof ValidationError) {
      if (wantsJson(req)) return res.status(400).json({ success: false, message: err.message, errors: err.fieldErrors });
      return renderContact(res, { values: err.values, errors: err.fieldErrors, status: 400 });
    }
    throw err;
  }

  if (wantsJson(req)) return res.status(201).json({ success: true, message: SUCCESS_MESSAGE });
  setFlash(req, 'success', SUCCESS_MESSAGE);
  return res.redirect('/iletisim');
}

// ---------------------------------------------------------------------------
// Admin (mini CRM)
// ---------------------------------------------------------------------------

async function adminList(req, res) {
  const search = (req.query.q || '').toString().trim().slice(0, 100);
  const status = inquiryStatuses.includes(req.query.status) ? req.query.status : '';
  const inquiries = await inquiryService.list({ search, status });
  res.render('admin/inquiries', {
    meta: { title: 'Müşteri Talepleri | Yönetim Paneli', noindex: true },
    adminPage: 'inquiries',
    inquiries,
    filters: { q: search, status },
    statuses: inquiryStatuses
  });
}

async function adminUpdate(req, res) {
  try {
    await inquiryService.updateInquiry(parseInt(req.params.id, 10), req.body);
    if (wantsJson(req)) return res.json({ success: true, message: 'Talep güncellendi.' });
    setFlash(req, 'success', 'Talep durumu ve notunuz kaydedildi.');
  } catch (err) {
    if (err instanceof ValidationError) {
      if (wantsJson(req)) return res.status(400).json({ success: false, message: err.message });
      setFlash(req, 'error', err.message);
    } else {
      throw err;
    }
  }
  let redirectTarget = '/admin/talepler';
  try {
    const ref = req.get('referer');
    if (ref) {
      const parsed = new URL(ref, 'http://localhost');
      if (parsed.pathname === '/admin/talepler') {
        redirectTarget = `${parsed.pathname}${parsed.search}`;
      }
    }
  } catch (_) {
    // Geçersiz referer başlığı yoksayılır
  }
  return res.redirect(redirectTarget);
}

async function adminDelete(req, res) {
  await inquiryService.deleteInquiry(parseInt(req.params.id, 10));
  setFlash(req, 'success', 'Talep silindi.');
  res.redirect('/admin/talepler');
}

module.exports = { contactPage, create, renderInvalid, adminList, adminUpdate, adminDelete };

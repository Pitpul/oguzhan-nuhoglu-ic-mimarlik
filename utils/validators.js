/**
 * Saf doğrulama fonksiyonları (veritabanına veya Express'e bağımlı değildir; kolayca test edilir).
 * Her fonksiyon { values, errors } döner. errors boşsa veri geçerlidir.
 * Not: Frontend doğrulaması yalnızca kullanıcı deneyimi içindir; asıl doğrulama burasıdır.
 */
const { projectCategories, inquiryStatuses, projectTypes } = require('../config/site');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Rakam, boşluk, +, -, (, ) ve tek bir baştaki + ; 10-15 rakam
const PHONE_ALLOWED_REGEX = /^\+?[0-9\s()\-]+$/;

const MAX = {
  fullName: 120,
  email: 254,
  message: 2000,
  title: 150,
  location: 255,
  area: 100,
  description: 5000,
  materials: 2000,
  architect: 255,
  imageUrl: 2000,
  adminNotes: 3000
};

/** Baştaki/sondaki boşlukları ve kontrol karakterlerini temizler. */
function clean(value) {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

function isChecked(value) {
  return ['on', 'true', '1', 'yes', true].includes(value);
}

function isValidEmail(email) {
  return typeof email === 'string' && email.length <= MAX.email && EMAIL_REGEX.test(email);
}

function isValidPhone(phone) {
  if (typeof phone !== 'string' || !PHONE_ALLOWED_REGEX.test(phone)) return false;
  if (phone.indexOf('+') > 0) return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

function isValidImageUrl(url) {
  if (!url) return true;
  if (url.length > MAX.imageUrl) return false;
  if (/^\/uploads\/[A-Za-z0-9._-]+$/.test(url)) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch (err) {
    return false;
  }
}

function validateInquiry(body = {}) {
  const errors = {};
  const values = {
    full_name: clean(body.full_name),
    email: clean(body.email).toLowerCase(),
    phone: clean(body.phone),
    project_type: clean(body.project_type) || projectTypes[0],
    message: clean(body.message),
    kvkk_accepted: isChecked(body.kvkk_accepted)
  };

  if (values.full_name.length < 2) errors.full_name = 'Ad soyad alanı boş bırakılamaz.';
  else if (values.full_name.length > MAX.fullName) errors.full_name = `Ad soyad en fazla ${MAX.fullName} karakter olabilir.`;

  if (!isValidEmail(values.email)) errors.email = 'Lütfen geçerli bir e-posta adresi giriniz.';

  if (!isValidPhone(values.phone)) errors.phone = 'Lütfen geçerli bir telefon numarası giriniz (örn. +90 532 000 00 00).';

  if (!projectTypes.includes(values.project_type)) errors.project_type = 'Lütfen listeden bir proje türü seçiniz.';

  if (values.message.length > MAX.message) errors.message = `Mesaj en fazla ${MAX.message} karakter olabilir.`;

  if (!values.kvkk_accepted) errors.kvkk_accepted = 'Devam edebilmek için KVKK Aydınlatma Metni onayı zorunludur.';

  return { values, errors };
}

function validateProject(body = {}) {
  const errors = {};
  const currentYear = new Date().getFullYear();
  const values = {
    title: clean(body.title),
    category: clean(body.category),
    location: clean(body.location),
    area: clean(body.area),
    year: clean(body.year),
    description: clean(body.description),
    materials: clean(body.materials),
    architect: clean(body.architect),
    image_url: clean(body.image_url),
    is_featured: isChecked(body.is_featured)
  };

  if (values.title.length < 2 || values.title.length > MAX.title) errors.title = `Proje başlığı 2-${MAX.title} karakter olmalıdır.`;
  if (!projectCategories.some((c) => c.value === values.category)) errors.category = 'Geçerli bir kategori seçiniz.';
  if (!values.location || values.location.length > MAX.location) errors.location = 'Lokasyon zorunludur.';
  if (!values.area || values.area.length > MAX.area) errors.area = 'Alan bilgisi zorunludur (örn. 450 m²).';
  if (!/^\d{4}$/.test(values.year) || Number(values.year) < 1950 || Number(values.year) > currentYear + 5) {
    errors.year = 'Yıl 4 haneli geçerli bir değer olmalıdır.';
  }
  if (values.description.length < 10 || values.description.length > MAX.description) {
    errors.description = `Açıklama 10-${MAX.description} karakter olmalıdır.`;
  }
  if (values.materials.length > MAX.materials) errors.materials = `Malzemeler en fazla ${MAX.materials} karakter olabilir.`;
  if (values.architect.length > MAX.architect) errors.architect = `Mimar alanı en fazla ${MAX.architect} karakter olabilir.`;
  if (!isValidImageUrl(values.image_url)) errors.image_url = 'Görsel adresi geçerli bir http(s) bağlantısı olmalıdır.';

  return { values, errors };
}

function validateInquiryUpdate(body = {}) {
  const errors = {};
  const values = {
    status: clean(body.status),
    admin_notes: clean(body.admin_notes)
  };
  if (!inquiryStatuses.includes(values.status)) errors.status = 'Geçersiz talep durumu.';
  if (values.admin_notes.length > MAX.adminNotes) errors.admin_notes = `Not en fazla ${MAX.adminNotes} karakter olabilir.`;
  return { values, errors };
}

function validateLogin(body = {}) {
  const errors = {};
  const values = { username: clean(body.username), password: typeof body.password === 'string' ? body.password : '' };
  if (!values.username || values.username.length > 100) errors.username = 'Kullanıcı adı gereklidir.';
  if (!values.password || values.password.length > 200) errors.password = 'Şifre gereklidir.';
  return { values, errors };
}

module.exports = {
  MAX,
  clean,
  isChecked,
  isValidEmail,
  isValidPhone,
  isValidImageUrl,
  validateInquiry,
  validateProject,
  validateInquiryUpdate,
  validateLogin
};

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validateInquiry,
  validateProject,
  validateInquiryUpdate,
  validateLogin
} = require('../utils/validators');
const { detectImageType } = require('../services/uploadService');
const { slugify } = require('../utils/slugify');
const { VALID_PNG_BUFFER } = require('./testHelper');

test('validateInquiry: geçerli veriyi kabul eder ve temizler', () => {
  const { values, errors } = validateInquiry({
    full_name: '  Ahmet Yılmaz  ',
    email: '  AHMET@Example.com ',
    phone: '+90 532 111 22 33',
    project_type: 'Konut / Villa İç Mimarisi',
    message: 'Bodrum taş villa projesi için keşif talebi.',
    kvkk_accepted: 'on'
  });

  assert.equal(Object.keys(errors).length, 0);
  assert.equal(values.full_name, 'Ahmet Yılmaz');
  assert.equal(values.email, 'ahmet@example.com');
  assert.equal(values.kvkk_accepted, true);
});

test('validateInquiry: eksik ad soyad, hatalı e-posta, hatalı telefon ve onaysız KVKK reddedilir', () => {
  const { errors } = validateInquiry({
    full_name: 'A',
    email: 'gecersiz-email',
    phone: '12345',
    project_type: 'Bilinmeyen Tür',
    message: 'x'.repeat(2005),
    kvkk_accepted: false
  });

  assert.ok(errors.full_name);
  assert.ok(errors.email);
  assert.ok(errors.phone);
  assert.ok(errors.project_type);
  assert.ok(errors.message);
  assert.ok(errors.kvkk_accepted);
});

test('validateProject: geçerli proje verisini doğrular', () => {
  const { values, errors } = validateProject({
    title: 'Kandilli Sahil Rezidansı',
    category: 'konut',
    location: 'Kandilli, İstanbul',
    area: '520 m²',
    year: '2025',
    description: 'Doğal taş ve ham meşe detaylarla kurgulanan boğaz manzaralı yaşam alanı.',
    materials: 'Traverten, Meşe, Pirinç',
    architect: 'Oğuzhan Nuhoğlu',
    image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
    is_featured: 'true'
  });

  assert.equal(Object.keys(errors).length, 0);
  assert.equal(values.category, 'konut');
  assert.equal(values.is_featured, true);
});

test('validateProject: hatalı kategori, yıl, kısa açıklama ve güvensiz görsel URL reddedilir', () => {
  const { errors } = validateProject({
    title: 'A',
    category: 'gecersiz',
    location: '',
    area: '',
    year: '2099',
    description: 'Kısa',
    image_url: 'javascript:alert(1)'
  });

  assert.ok(errors.title);
  assert.ok(errors.category);
  assert.ok(errors.location);
  assert.ok(errors.area);
  assert.ok(errors.year);
  assert.ok(errors.description);
  assert.ok(errors.image_url);
});

test('validateInquiryUpdate & validateLogin: durum ve giriş doğrulamaları çalışır', () => {
  const okUpdate = validateInquiryUpdate({ status: 'Keşif Planlandı', admin_notes: 'Perşembe 15:00' });
  assert.equal(Object.keys(okUpdate.errors).length, 0);

  const badUpdate = validateInquiryUpdate({ status: 'Geçersiz Durum', admin_notes: '' });
  assert.ok(badUpdate.errors.status);

  const badLogin = validateLogin({ username: '', password: '' });
  assert.ok(badLogin.errors.username);
  assert.ok(badLogin.errors.password);
});

test('detectImageType: gerçek magic byte kontrolü yapar, sahte uzantılı dosyayı reddeder', () => {
  const pngType = detectImageType(VALID_PNG_BUFFER);
  assert.deepEqual(pngType, { ext: 'png', mime: 'image/png' });

  const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1]);
  assert.deepEqual(detectImageType(jpegBuffer), { ext: 'jpg', mime: 'image/jpeg' });

  const fakeImage = Buffer.from('<?php system($_GET["cmd"]); ?>');
  assert.equal(detectImageType(fakeImage), null);
});

test('slugify: Türkçe karakterleri temiz URL formatına dönüştürür', () => {
  assert.equal(slugify('Nişantaşı Çağdaş Villa & Loft'), 'nisantasi-cagdas-villa-ve-loft');
});

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const {
  db,
  createApp,
  extractCsrf,
  resetDatabase,
  loginAsAdmin,
  VALID_PNG_BUFFER
} = require('./testHelper');
const { initDatabase } = require('../services/setupService');

const app = createApp({ contactMax: 50, loginMax: 50 });

test.before(async () => {
  await resetDatabase();
});

test.after(async () => {
  await db.close();
});

test('Veritabanı kurulumu ve seed işlemi idempotent çalışır (tekrar açılışta veri çoğalmaz)', async () => {
  const firstCount = await db.query('SELECT COUNT(*)::int AS count FROM projects');
  assert.equal(firstCount.rows[0].count, 6);

  // Sunucu ikinci kez başlatıldığında seed tekrar eklenmemeli
  await initDatabase({ log: () => {}, warn: () => {}, error: console.error });
  const secondCount = await db.query('SELECT COUNT(*)::int AS count FROM projects');
  assert.equal(secondCount.rows[0].count, 6);
});

test('Public sayfalar (Ana Sayfa, Hakkımızda, Hizmetler, Projeler, Detay, SEO) 200 döner', async () => {
  const homeRes = await request(app).get('/');
  assert.equal(homeRes.status, 200);
  assert.match(homeRes.text, /Oğuzhan Nuhoğlu/);
  assert.match(homeRes.text, /\/media\/hero\.mp4/);
  assert.match(homeRes.text, /\/media\/hero-mobile\.mp4/);
  assert.match(homeRes.text, /\/media\/hero-poster\.jpg/);
  assert.match(homeRes.text, /\/media\/logo\.jpg/);
  assert.match(homeRes.text, /data-scroll-stack/);
  assert.match(homeRes.text, /data-layer-section/);
  assert.match(homeRes.text, /data-layer-inner/);
  assert.match(homeRes.text, /data-parallax-media/);
  assert.match(homeRes.text, /Abdi İpekçi Cad\. No: 42\/6 Şişli, İstanbul/);

  // Video ve poster dosyalarının gerçek HTTP 200 ve doğru MIME tipi ile sunulduğunu doğrula
  const videoHead = await request(app).head('/media/hero.mp4');
  assert.equal(videoHead.status, 200);
  assert.match(videoHead.headers['content-type'], /video\/mp4/);

  const mobileVideoHead = await request(app).head('/media/hero-mobile.mp4');
  assert.equal(mobileVideoHead.status, 200);
  assert.match(mobileVideoHead.headers['content-type'], /video\/mp4/);

  const posterHead = await request(app).head('/media/hero-poster.jpg');
  assert.equal(posterHead.status, 200);
  assert.match(posterHead.headers['content-type'], /image\/jpeg/);

  const aboutRes = await request(app).get('/hakkimizda');
  assert.equal(aboutRes.status, 200);
  assert.match(aboutRes.text, /Mimari Anlayış/);

  const servicesRes = await request(app).get('/hizmetler');
  assert.equal(servicesRes.status, 200);
  assert.match(servicesRes.text, /Sıkça Sorulan Sorular/);

  const projectsRes = await request(app).get('/projeler');
  assert.equal(projectsRes.status, 200);
  assert.match(projectsRes.text, /Bosphorus Horizon Penthouse/);
  assert.match(projectsRes.text, /Bodrum Taş Villa/);

  const detailRes = await request(app).get('/projeler/bosphorus-horizon-penthouse');
  assert.equal(detailRes.status, 200);
  assert.match(detailRes.text, /Honlu Traverten/);

  // ID ile erişim slug adresine 301 yönlendirir
  const idRedirect = await request(app).get('/projeler/1');
  assert.equal(idRedirect.status, 301);
  assert.equal(idRedirect.headers.location, '/projeler/bosphorus-horizon-penthouse');

  // Eski .html adresleri 301 yönlendirir
  const legacyRedirect = await request(app).get('/projeler.html');
  assert.equal(legacyRedirect.status, 301);
  assert.equal(legacyRedirect.headers.location, '/projeler');

  // SEO rotaları
  const sitemapRes = await request(app).get('/sitemap.xml');
  assert.equal(sitemapRes.status, 200);
  assert.match(sitemapRes.text, /<urlset/);

  const robotsRes = await request(app).get('/robots.txt');
  assert.equal(robotsRes.status, 200);
  assert.match(robotsRes.text, /Disallow: \/admin/);

  // Health check rotası
  const healthRes = await request(app).get('/healthz');
  assert.equal(healthRes.status, 200);
  assert.deepEqual(healthRes.body, { status: 'ok' });

  // 404 sayfası
  const notFound = await request(app).get('/projeler/olmayan-proje-999');
  assert.equal(notFound.status, 404);
});

test('Yetkisiz erişim engellenir ve hatalı giriş 401 döner', async () => {
  const unauthGet = await request(app).get('/admin');
  assert.equal(unauthGet.status, 302);
  assert.equal(unauthGet.headers.location, '/login');

  const agent = request.agent(app);
  const loginPage = await agent.get('/login');
  const csrf = extractCsrf(loginPage.text);

  const badLogin = await agent
    .post('/login')
    .type('form')
    .send({ _csrf: csrf, username: process.env.ADMIN_USER, password: 'YanlisSifre123!' });
  assert.equal(badLogin.status, 401);
  assert.match(badLogin.text, /Kullanıcı adı veya şifre hatalı/);
});

test('Admin proje CRUD, görsel yükleme ve maksimum 3 öne çıkan proje kuralı çalışır', async () => {
  const agent = request.agent(app);
  const { res: loginRes } = await loginAsAdmin(agent);
  assert.equal(loginRes.status, 302);
  assert.equal(loginRes.headers.location, '/admin');

  const dashRes = await agent.get('/admin');
  assert.equal(dashRes.status, 200);
  assert.match(dashRes.text, /Dashboard/);

  // 1) Zaten 3 öne çıkan proje varken 4. öne çıkan proje eklemeye çalışmak 400 dönmeli
  const newFormRes = await agent.get('/admin/projeler/yeni');
  const csrf = extractCsrf(newFormRes.text);

  const fourthFeaturedRes = await agent
    .post(`/admin/projeler?_csrf=${csrf}`)
    .field('title', 'Dördüncü Öne Çıkan Denemesi')
    .field('category', 'konut')
    .field('location', 'Çeşme, İzmir')
    .field('area', '400 m²')
    .field('year', '2025')
    .field('description', 'Öne çıkan proje limiti testi için açıklama metni.')
    .field('image_url', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c')
    .field('is_featured', 'on');
  assert.equal(fourthFeaturedRes.status, 400);
  assert.match(fourthFeaturedRes.text, /en fazla 3 proje öne çıkarılabilir/);

  // 2) Dosya yükleyerek (gerçek PNG magic bytes) yeni proje oluşturma (Create)
  const createRes = await agent
    .post(`/admin/projeler?_csrf=${csrf}`)
    .field('title', 'Alaçatı Taş Konak')
    .field('category', 'konut')
    .field('location', 'Alaçatı, İzmir')
    .field('area', '510 m²')
    .field('year', '2025')
    .field('description', 'Yerel bazalt taşı ve doğal keten dokularla tasarlanan yazlık konak.')
    .field('materials', 'Bazalt Taşı, Ham Meşe, Keten')
    .field('architect', 'Oğuzhan Nuhoğlu')
    .attach('image_file', VALID_PNG_BUFFER, { filename: 'alacati.png', contentType: 'image/png' });

  assert.equal(createRes.status, 302);
  assert.equal(createRes.headers.location, '/admin/projeler');

  const createdRow = await db.query("SELECT * FROM projects WHERE slug = 'alacati-tas-konak'");
  assert.equal(createdRow.rows.length, 1);
  const createdProject = createdRow.rows[0];
  assert.match(createdProject.image_url, /^\/uploads\/proje-.*\.png$/);

  // 3) Projeyi düzenleme (Update)
  const editRes = await agent
    .post(`/admin/projeler/${createdProject.id}/guncelle?_csrf=${csrf}`)
    .field('title', 'Alaçatı Taş Konak — Güncel')
    .field('category', 'konut')
    .field('location', 'Alaçatı, İzmir')
    .field('area', '540 m²')
    .field('year', '2025')
    .field('description', 'Güncellenmiş proje açıklaması ve genişletilmiş teras alanı.')
    .field('materials', 'Bazalt Taşı, Ham Meşe')
    .field('architect', 'Oğuzhan Nuhoğlu');

  assert.equal(editRes.status, 302);
  const updatedRow = await db.query('SELECT * FROM projects WHERE id = $1', [createdProject.id]);
  assert.equal(updatedRow.rows[0].title, 'Alaçatı Taş Konak — Güncel');
  assert.equal(updatedRow.rows[0].area, '540 m²');

  // 3.5) Mevcut öne çıkan bir projenin öne çıkarmasını kaldırıp yeni projeyi öne çıkarma ve geri alma
  const unfeatureOne = await agent
    .post('/admin/projeler/1/one-cikar')
    .type('form')
    .send({ _csrf: csrf });
  assert.equal(unfeatureOne.status, 302);

  const featureCreated = await agent
    .post(`/admin/projeler/${createdProject.id}/one-cikar`)
    .type('form')
    .send({ _csrf: csrf });
  assert.equal(featureCreated.status, 302);
  const featCheck = await db.query('SELECT is_featured FROM projects WHERE id = $1', [createdProject.id]);
  assert.equal(featCheck.rows[0].is_featured, true);

  // Tekrar kaldır ve 1. projeyi eski haline getir
  await agent.post(`/admin/projeler/${createdProject.id}/one-cikar`).type('form').send({ _csrf: csrf });
  await agent.post('/admin/projeler/1/one-cikar').type('form').send({ _csrf: csrf });

  // 4) Projeyi silme (Delete)
  const deleteRes = await agent
    .post(`/admin/projeler/${createdProject.id}/sil`)
    .type('form')
    .send({ _csrf: csrf });
  assert.equal(deleteRes.status, 302);

  const afterDelete = await db.query('SELECT * FROM projects WHERE id = $1', [createdProject.id]);
  assert.equal(afterDelete.rows.length, 0);

  // 5) Çıkış (Logout)
  const logoutRes = await agent.post('/logout').type('form').send({ _csrf: csrf });
  assert.equal(logoutRes.status, 302);
  assert.equal(logoutRes.headers.location, '/login');

  const afterLogout = await agent.get('/admin');
  assert.equal(afterLogout.status, 302);
});

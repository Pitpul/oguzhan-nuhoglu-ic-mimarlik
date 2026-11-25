const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const {
  db,
  createApp,
  extractCsrf,
  resetDatabase,
  loginAsAdmin
} = require('./testHelper');

const app = createApp({ contactMax: 4, loginMax: 20 });

test.before(async () => {
  await resetDatabase();
});

test.after(async () => {
  await db.close();
});

test('İletişim ve KVKK sayfaları açılır, CSRF olmadan gönderim 403 reddedilir', async () => {
  const contactPage = await request(app).get('/iletisim');
  assert.equal(contactPage.status, 200);
  assert.match(contactPage.text, /KVKK Aydınlatma Metni/);

  const kvkkPage = await request(app).get('/kvkk');
  assert.equal(kvkkPage.status, 200);
  assert.match(kvkkPage.text, /6698 sayılı/);

  const noCsrf = await request(app)
    .post('/iletisim')
    .set('Accept', 'application/json')
    .send({ full_name: 'Test', email: 'test@example.com', phone: '+905321112233', kvkk_accepted: true });
  assert.equal(noCsrf.status, 403);
});

test('POST /iletisim: geçersiz veriyi 400 ile reddeder, geçerli talebi PostgreSQL inquiries tablosuna kaydeder', async () => {
  const agent = request.agent(app);
  const page = await agent.get('/iletisim');
  const csrf = extractCsrf(page.text);

  // 1) KVKK onaysız ve hatalı e-posta ile gönderim
  const badRes = await agent
    .post('/iletisim')
    .set('Accept', 'application/json')
    .set('x-csrf-token', csrf)
    .send({
      full_name: 'Selin Karahan',
      email: 'hatali-email',
      phone: '123',
      project_type: 'Konut / Villa İç Mimarisi',
      message: 'Merhaba',
      kvkk_accepted: false
    });
  assert.equal(badRes.status, 400);
  assert.equal(badRes.body.success, false);
  assert.ok(badRes.body.errors.email);
  assert.ok(badRes.body.errors.phone);
  assert.ok(badRes.body.errors.kvkk_accepted);

  // 2) Geçerli talep gönderimi
  const validRes = await agent
    .post('/iletisim')
    .set('Accept', 'application/json')
    .set('x-csrf-token', csrf)
    .send({
      full_name: 'Selin Karahan',
      email: 'selin.karahan@example.com',
      phone: '+90 532 418 92 10',
      project_type: 'Konut / Villa İç Mimarisi',
      message: 'Yalıkavak taş villa projemiz için iç mimari keşif randevusu rica ediyoruz.',
      kvkk_accepted: true
    });
  assert.equal(validRes.status, 201);
  assert.equal(validRes.body.success, true);

  const { rows } = await db.query('SELECT * FROM inquiries WHERE email = $1', ['selin.karahan@example.com']);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].full_name, 'Selin Karahan');
  assert.equal(rows[0].status, 'Yeni Talep');
  assert.equal(rows[0].kvkk_accepted, true);
});

test('Admin Mini CRM: müşteri taleplerini listeler, durum + özel not günceller ve siler', async () => {
  const agent = request.agent(app);
  await loginAsAdmin(agent);

  const listRes = await agent.get('/admin/talepler');
  assert.equal(listRes.status, 200);
  assert.match(listRes.text, /Selin Karahan/);
  const csrf = extractCsrf(listRes.text);

  const { rows } = await db.query('SELECT id FROM inquiries LIMIT 1');
  const inquiryId = rows[0].id;

  // Durum ve iç mimar özel notu güncelleme (Update)
  const updateRes = await agent
    .post(`/admin/talepler/${inquiryId}/guncelle`)
    .set('Accept', 'application/json')
    .set('x-csrf-token', csrf)
    .send({
      status: 'Keşif Planlandı',
      admin_notes: 'Cuma 14:30 Nişantaşı atölyede moodboard sunumu yapılacak.'
    });
  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.body.success, true);

  const updated = await db.query('SELECT status, admin_notes FROM inquiries WHERE id = $1', [inquiryId]);
  assert.equal(updated.rows[0].status, 'Keşif Planlandı');
  assert.equal(updated.rows[0].admin_notes, 'Cuma 14:30 Nişantaşı atölyede moodboard sunumu yapılacak.');

  // Açık yönlendirme (Open Redirect) koruması: sahte harici Referer başlığı dış siteye yönlendirmemeli
  const openRedirectAttempt = await agent
    .post(`/admin/talepler/${inquiryId}/guncelle`)
    .set('Referer', 'https://evil.example.com/?/admin/talepler')
    .type('form')
    .send({
      _csrf: csrf,
      status: 'Teklif Sunuldu',
      admin_notes: 'Teklif iletildi.'
    });
  assert.equal(openRedirectAttempt.status, 302);
  assert.equal(openRedirectAttempt.headers.location, '/admin/talepler');

  // Talebi silme (Delete)
  const delRes = await agent
    .post(`/admin/talepler/${inquiryId}/sil`)
    .type('form')
    .send({ _csrf: csrf });
  assert.equal(delRes.status, 302);

  const afterDel = await db.query('SELECT 1 FROM inquiries WHERE id = $1', [inquiryId]);
  assert.equal(afterDel.rows.length, 0);
});

test('Rate limiting: iletişim formuna art arda aşırı istek gönderildiğinde 429 döner', async () => {
  const agent = request.agent(app);
  const page = await agent.get('/iletisim');
  const csrf = extractCsrf(page.text);

  let lastStatus = 200;
  for (let i = 0; i < 5; i += 1) {
    const res = await agent
      .post('/iletisim')
      .set('Accept', 'application/json')
      .set('x-csrf-token', csrf)
      .send({
        full_name: `Test Kullanıcı ${i}`,
        email: `test${i}@example.com`,
        phone: '+90 532 000 00 00',
        project_type: 'Konut / Villa İç Mimarisi',
        message: 'Rate limit testi',
        kvkk_accepted: true
      });
    lastStatus = res.status;
  }
  assert.equal(lastStatus, 429);
});

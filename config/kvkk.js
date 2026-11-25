/**
 * KVKK Aydınlatma Metni içeriği.
 * Şirket kuruluşu tamamlandığında registry, lastUpdated ve sections[].body alanları doldurulabilir.
 */
const { site } = require('./site');

module.exports = {
  isDraft: false,
  lastUpdated: null,
  controller: {
    title: site.name,
    address: site.offices.map((o) => o.address).join(' | '),
    email: site.email,
    phone: site.phone,
    registry: null
  },
  sections: [
    { title: '1. Veri Sorumlusu', body: null },
    { title: '2. İşlenen Kişisel Veriler', body: null },
    { title: '3. İşleme Amaçları', body: null },
    { title: '4. Hukuki Sebep', body: null },
    { title: '5. Aktarım', body: null },
    { title: '6. Saklama Süresi', body: null },
    { title: '7. Haklarınız', body: null }
  ]
};

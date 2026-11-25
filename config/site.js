/**
 * Kurumsal bilgiler ve site genelindeki sabitler — TEK MERKEZ.
 * İletişim bilgisi değişirse yalnızca bu dosya güncellenir; tüm sayfalar etkilenir.
 */
const config = require('./env');

const site = {
  name: 'Oğuzhan Nuhoğlu İç Mimarlık',
  shortName: 'Oğuzhan Nuhoğlu',
  subtitle: 'İç Mimarlık',
  tagline: 'Lüks Yaşam Alanları & Mimari Sanat',
  logo: '/media/logo.jpg',
  favicon: '/media/favicon.png',
  heroVideo: '/media/hero.mp4',
  heroVideoMobile: '/media/hero-mobile.mp4',
  heroPoster: '/media/hero-poster.jpg',
  defaultOgImage:
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&h=630&q=80',
  email: 'oguzhannuhoglu@gmail.com',
  phone: '+90 533 259 44 01',
  phoneHref: '+905332594401',
  offices: [
    {
      key: 'maltepe',
      name: 'Stüdyo',
      address: 'İstanbul-Maltepe'
    }
  ],
  baseUrl: config.baseUrl
};

const projectCategories = [
  { value: 'konut', label: 'Konut & Villa' },
  { value: 'penthouse', label: 'Penthouse & Loft' },
  { value: 'ticari', label: 'Ticari & Ofis' }
];

const inquiryStatuses = ['Yeni Talep', 'Arandı', 'Keşif Planlandı', 'Teklif Sunuldu', 'Tamamlandı'];

const projectTypes = [
  'Konut / Villa İç Mimarisi',
  'Penthouse / Loft Tasarımı',
  'Ticari / Ofis Alanı Tasarımı',
  '3D Modelleme & Görselleştirme',
  'Anahtar Teslim Şantiye Uygulaması',
  'Diğer'
];

const services = [
  { anchor: 'konut', title: 'Konut ve Villa Tasarımı', text: 'Villa, rezidans ve konutlar için yaşam tarzınıza özel, işlevsel ve zamansız iç mimari çözümler.' },
  { anchor: 'konut', title: 'İç Mekân Konsept Tasarımı', text: 'Mekânın ışığını, oranlarını ve malzeme dilini bütüncül bir konsept altında kurguluyoruz.' },
  { anchor: 'konut', title: 'Penthouse ve Loft Tasarımı', text: 'Çatı katları ve açık plan loft hacimlerinde sakin, rafine yaşam kurguları.' },
  { anchor: 'ticari', title: 'Ticari Mekân Tasarımı', text: 'Mağaza, restoran ve konsept mekânlarda marka kimliğini mekâna taşıyan tasarımlar.' },
  { anchor: 'ticari', title: 'Ofis Tasarımı', text: 'Çalışma düzenini, akustiği ve kurumsal kimliği buluşturan ofis ve yönetim alanları.' },
  { anchor: '3d', title: '3D Görselleştirme', text: 'Uygulama öncesinde mekânı ışık, doku ve detaylarıyla birlikte deneyimlemenizi sağlayan sunumlar.' },
  { anchor: 'anahtar-teslim', title: 'Uygulama ve Proje Yönetimi', text: 'Şantiye koordinasyonu, imalat takibi ve uygulama sürecinin tek elden yönetimi.' },
  { anchor: 'anahtar-teslim', title: 'Malzeme ve Aydınlatma Danışmanlığı', text: 'Doğal malzeme seçimi, mimari aydınlatma kurgusu ve tedarik yönlendirmesi.' }
];

module.exports = { site, projectCategories, inquiryStatuses, projectTypes, services };

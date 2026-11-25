/**
 * Seed projeleri — arşivlenen Stitch HTML dosyalarındaki (archive/stitch-original/projeler.stitch.html)
 * 6 örnek projeden aktarılmıştır. Başlık, kategori, lokasyon, alan, yıl, açıklama, malzeme ve mimar
 * bilgileri orijinal içerikten birebir alınmıştır.
 *
 * Yalnızca görseller değiştirilmiştir: orijinal googleusercontent.com bağlantıları kırık olduğundan
 * Unsplash (ücretsiz lisans) iç mimari/mimari fotoğraflarıyla değiştirilmiştir.
 *
 * Öne çıkanlar: orijinal ana sayfada gösterilen 3 proje (Bosphorus Horizon Penthouse,
 * Kandilli Minimal Loft, Levent Executive Headquarters).
 */
const u = (id, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

module.exports = [
  {
    title: 'Bosphorus Horizon Penthouse',
    category: 'penthouse',
    category_label: 'Penthouse & Loft',
    location: 'Boğazkesen, İstanbul',
    area: '620 m²',
    year: '2025',
    description:
      'Panoramik Boğaz ve Tarihi Yarımada silüetine karşı konumlanan bu çatı rezidansı; ham traverten, doğal keten dokular ve heykelsi asma şöminesiyle ışığın gün boyu dans ettiği sakin bir vaha yaratır. İç ve dış mekan arasındaki sınırlar tavandan tabana kavisli giyotin cam panellerle eritilmiştir.',
    materials: 'Honlu Traverten, Doku Verilmiş İtalyan Sıva, Ham Keten, Yanık Bronz Şömine Gövdesi, Masif Amerikan Ceviz',
    architect: 'Oğuzhan Nuhoğlu & İç Mimari Atölyesi',
    image_url: u('1600585154340-be6161a56a0c'),
    is_featured: true
  },
  {
    title: 'Bodrum Taş Villa',
    category: 'konut',
    category_label: 'Konut & Villa',
    location: 'Yalıkavak, Bodrum',
    area: '750 m²',
    year: '2024',
    description:
      'Yalıkavak yamaçlarında yerel doğal taş işçiliği ve çağdaş brüt beton geometrilerin harmanlandığı özel bir rezidans. Akdeniz günışığını içeri alan devasa cam cepheler ve sonsuzluk havuzuyla bütünleşen açık konsept yaşam hacmi.',
    materials: 'Yerel Bodrum Doğal Taşı, Fırçalanmış Meşe, Mikrobeton Zemin, Isı Yalıtımlı Alüminyum Doğrama, Keten Perdeler',
    architect: 'Oğuzhan Nuhoğlu & Proje Ekibi',
    image_url: u('1600596542815-ffad4c1539a9'),
    is_featured: false
  },
  {
    title: 'Bebek Yalı Dairesi',
    category: 'konut',
    category_label: 'Konut & Villa',
    location: 'Bebek Sahili, İstanbul',
    area: '450 m²',
    year: '2024',
    description:
      'Tarihi Boğaziçi sahil şeridinde yer alan 19. yüzyıl tescilli yalı dairesi, özgün ahşap kaset tavanları ve taş kemerleri korunarak çağdaş bir sessiz lüks mabedine dönüştürülmüştür.',
    materials: 'Restorasyon Meşe Tavan Kasetleri, Carrara Mermer Şömine, Balıksırtı Masif Parke, Patinalı Pirinç Armatürler',
    architect: 'Oğuzhan Nuhoğlu & Tarihi Yapı Konservasyon Ekibi',
    image_url: u('1600607687939-ce8a6c25118c'),
    is_featured: false
  },
  {
    title: 'Levent Executive Headquarters',
    category: 'ticari',
    category_label: 'Ticari & Ofis',
    location: 'Levent, İstanbul',
    area: '1.200 m²',
    year: '2025',
    description:
      'Finans merkezinin zirvesinde tasarlanan üst düzey yönetim ofisi; kurumsal kimliğin prestijini akustik ceviz paneller, heykelsi traverten masa ve sıcak galeri aydınlatmasıyla temsil eder.',
    materials: 'Akustik Oluklu Ceviz Ahşap, Monolitik Traverten, Doğal Nubuk Deri, Mat Pirinç Profiller',
    architect: 'Oğuzhan Nuhoğlu Proje Grubu',
    image_url: u('1497366216548-37526070297c'),
    is_featured: true
  },
  {
    title: 'Nişantaşı Concept Store',
    category: 'ticari',
    category_label: 'Ticari & Ofis',
    location: 'Abdi İpekçi, Nişantaşı',
    area: '280 m²',
    year: '2025',
    description:
      "Abdi İpekçi Caddesi'nde konumlanan monokromatik butik mağaza; heykelsi el sıvası nişleri, ham kireçtaşı kaideleri ve sıcak mimari ışık kanallarıyla ziyaretçiyi içine çeken bir galeri deneyimi sunar.",
    materials: 'Ham Kireçtaşı Kaideler, Organik Kireç Sıva Nişler, Eskitme Pirinç Askı Sistemleri, Terrazzo Zemin',
    architect: 'Oğuzhan Nuhoğlu Mimarlık',
    image_url: u('1600585154526-990dced4db0d'),
    is_featured: false
  },
  {
    title: 'Kandilli Minimal Loft',
    category: 'penthouse',
    category_label: 'Penthouse & Loft',
    location: 'Kandilli, İstanbul',
    area: '380 m²',
    year: '2023',
    description:
      'Tarihi Kandilli korusunun eteklerinde yer alan loft & mimari atölye; ham meşe çalışma masaları, çift katlı galeri boşluğu ve strüktürel kütüphanesiyle yaratıcı üretkenlik ve dingin yaşamı bir araya getirir.',
    materials: 'Geri Dönüştürülmüş Meşe Kirişler, Doğal Kireçtaşı Raf Sistemleri, Çelik Profil Doğramalar, Pirinç Lambader Detayları',
    architect: 'Oğuzhan Nuhoğlu & Ortakları',
    image_url: u('1600566753376-12c8ab7fb75b'),
    is_featured: true
  }
];

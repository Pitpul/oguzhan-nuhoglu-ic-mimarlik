# Oğuzhan Nuhoğlu İç Mimarlık — Full-Stack Web Uygulaması & Mini CRM

**Oğuzhan Nuhoğlu İç Mimarlık** (Nişantaşı & Bodrum) için geliştirilmiş; kurumsal vitrin web sitesi, dinamik proje portfolyosu ve şifreli **İç Mimar Yönetim Paneli / Mini CRM** sisteminden oluşan tam yığın (Full-Stack) web uygulamasıdır.

---

## 1. Teknoloji Yığını

- **Backend:** Node.js, Express.js (CommonJS, katmanlı MVC mimarisi)
- **View Engine:** EJS (`views/partials`, `views/pages`, `views/admin`, `views/errors`)
- **Veritabanı:** PostgreSQL (`pg` / `node-postgres` bağlantı havuzu — yerel PostgreSQL ve Supabase PostgreSQL uyumlu)
- **Kimlik Doğrulama & Oturum:** `express-session`, `connect-pg-simple` (PostgreSQL tabanlı oturum saklama), `bcrypt` (12 round şifre özetleme)
- **Güvenlik:** `helmet` (Content-Security-Policy dahil), Senkronizör Token tabanlı CSRF koruması, `express-rate-limit` (giriş ve iletişim formu hız sınırlandırması), parametreli SQL sorguları, gerçek dosya içeriği (magic bytes) doğrulamalı `multer` yükleme katmanı
- **Frontend & Tasarım:** Google Stitch tasarımlarından dönüştürülmüş editoryal lüks tasarım sistemi (`#F5EDE0` Açık Fildişi, `#FAF7F2` Kemik, `#1A1917` Antrasit, `#9E7B56` Bronz; `Cormorant Garamond` & `Plus Jakarta Sans`), Tailwind CSS CLI ile derlenmiş yerel production CSS (`public/css/style.css`, CDN bağımlılığı yoktur)
- **Test:** Node.js yerleşik test çalıştırıcısı (`node --test`) + `supertest`

---

## 2. Klasör Mimarisi

```text
oguzhan-nuhoglu-ic-mimarlik/
├── archive/                  # Orijinal Google Stitch HTML tasarımları ve ham medya yedekleri
├── config/
│   ├── db.js                 # PostgreSQL bağlantı havuzu (Pool) ve SSL yönetimi
│   ├── env.js                # Ortam değişkenleri doğrulama ve merkezi yapılandırma
│   ├── kvkk.js               # KVKK Aydınlatma Metni yapılandırılabilir taslak verisi
│   ├── session.js            # express-session + connect-pg-simple oturum ayarları
│   └── site.js               # Kurumsal iletişim bilgileri, kategoriler ve hizmet tanımları
├── controllers/
│   ├── adminController.js    # Admin giriş/çıkış ve Dashboard özet istatistikleri
│   ├── inquiryController.js  # İletişim formu kayıt ve Mini CRM talep yönetimi
│   ├── pageController.js     # Ana sayfa, Hakkımızda, Hizmetler, KVKK, Sitemap, Robots.txt
│   └── projectController.js  # Portfolyo listeleme, proje detay ve Admin proje CRUD
├── middlewares/
│   ├── authMiddleware.js     # requireAdmin ve redirectIfAuthenticated
│   ├── csrfMiddleware.js     # Session tabanlı CSRF token üretimi ve doğrulaması
│   ├── errorMiddleware.js    # 404 ve merkezi 500 hata yakalayıcı (hassas veri sızdırmaz)
│   ├── rateLimitMiddleware.js# Login ve iletişim formu için IP bazlı hız sınırlayıcı
│   ├── uploadMiddleware.js   # Multer bellek yükleme ve dosya boyutu/uzantı kontrolü
│   └── validationMiddleware.js
├── repositories/
│   ├── adminRepository.js    # admins tablosu parametreli SQL sorguları
│   ├── inquiryRepository.js  # inquiries tablosu parametreli SQL sorguları
│   └── projectRepository.js  # projects tablosu parametreli SQL sorguları
├── routes/
│   ├── adminRoutes.js        # /login, /logout, /admin, /admin/projeler/*, /admin/talepler/*
│   ├── indexRoutes.js        # /, /hakkimizda, /hizmetler, /kvkk, /sitemap.xml, /robots.txt
│   ├── inquiryRoutes.js      # /iletisim (GET, POST), /api/inquiries (POST)
│   └── projectRoutes.js      # /projeler, /projeler/:slug
├── services/
│   ├── authService.js        # bcrypt doğrulama ve ilk kurulum admin hesabı oluşturma
│   ├── inquiryService.js     # Müşteri talebi iş kuralları ve CRM istatistikleri
│   ├── projectService.js     # Proje CRUD, slug üretimi, maks. 3 öne çıkan proje kuralı
│   ├── setupService.js       # Açılışta şema kurulumu, tek seferlik seed ve admin kontrolü
│   └── uploadService.js      # Magic-byte görsel doğrulama, yerel kayıt ve yetim dosya temizliği
├── sql/
│   ├── schema.sql            # PostgreSQL tablo ve indeks tanımları (idempotent)
│   └── seedProjects.js       # Orijinal tasarımlardan aktarılan 6 seçkin mimari proje
├── src/
│   └── tailwind.css          # Tailwind kaynak stil dosyası
├── views/
│   ├── partials/             # head, navbar, footer, contact-form, kvkk-modal, project-card
│   ├── pages/                # index, hakkimizda, hizmetler, projeler, proje-detay, iletisim, kvkk
│   ├── admin/                # login, dashboard, projects, project-form, inquiries
│   └── errors/               # 404, 500
├── public/
│   ├── css/style.css         # Derlenmiş ve küçültülmüş production CSS
│   ├── js/                   # main.js, portfolio.js, contact.js, admin.js
│   ├── media/                # logo.jpg, hero.mp4, favicon.png
│   └── uploads/              # Admin panelinden yüklenen proje görselleri
├── tests/
│   ├── validation.test.js    # Doğrulama, slug ve görsel magic-byte birim testleri
│   ├── project.test.js       # Veritabanı seed, public sayfalar ve Admin proje CRUD testleri
│   └── inquiry.test.js       # İletişim formu, CSRF, rate-limit ve Mini CRM testleri
├── app.js                    # Express uygulama fabrikası
├── server.js                 # Sunucu giriş noktası
├── .env.example              # Örnek ortam değişkenleri şablonu
├── .gitignore
└── package.json
```

---

## 3. Gereksinimler ve Yerel Kurulum

### Gereksinimler
- **Node.js** `>= 18`
- **PostgreSQL** `>= 14` (Yerel PostgreSQL veya Supabase PostgreSQL)

### Adım Adım Yerel Kurulum

1. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

2. **Ortam değişkenlerini yapılandırın:**
   `.env.example` dosyasını `.env` olarak kopyalayın ve kendi değerlerinizi girin:
   ```bash
   cp .env.example .env
   ```

3. **CSS dosyasını derleyin (değişiklik yaptıysanız):**
   ```bash
   npm run build
   ```

4. **Uygulamayı başlatın:**
   ```bash
   npm start
   ```
   Geliştirme sırasında otomatik yeniden başlatma için:
   ```bash
   npm run dev
   ```
   Sunucu ilk açılışta:
   - PostgreSQL bağlantısını kontrol eder,
   - `sql/schema.sql` içindeki tabloları (`projects`, `inquiries`, `admins`, `app_meta`, `session`) ve indeksleri oluşturur (mevcut tabloları **silmez**),
   - `projects` tablosu boşsa ve daha önce seed çalıştırılmamışsa 6 örnek projeyi **yalnızca bir kez** ekler,
   - `.env` içindeki `ADMIN_USER` ve `ADMIN_PASS` ile yönetici hesabını `bcrypt` ile şifreleyerek oluşturur (sonraki açılışlarda mevcut şifreyi değiştirmez).

5. **Tarayıcıda açın:**
   - **Vitrin Web Sitesi:** `http://localhost:3000`
   - **Yönetim Paneli / Mini CRM:** `http://localhost:3000/admin` (Giriş: `/login`)

---

## 4. Ortam Değişkenleri (`.env`)

| Değişken | Zorunlu | Açıklama |
| :--- | :--- | :--- |
| `NODE_ENV` | Evet | `development`, `production` veya `test` |
| `PORT` | Hayır | Sunucu portu (varsayılan: `3000`) |
| `BASE_URL` | Evet | Sitenin tam kök adresi (örn. `http://localhost:3000` veya `https://oguzhannuhoglu.com`) |
| `DATABASE_URL` | Evet | PostgreSQL bağlantı dizesi (yerel veya Supabase) |
| `DB_SSL` | Hayır | `true` / `false`. Boş bırakılırsa Supabase adreslerinde SSL otomatik etkinleşir |
| `TEST_DATABASE_URL` | Hayır | `npm test` çalıştırılırken kullanılacak ayrı test veritabanı adresi |
| `SESSION_SECRET` | Evet | En az 32 karakterli gizli anahtar (`openssl rand -hex 32` ile üretilebilir) |
| `ADMIN_USER` | İlk kurulumda | İlk açılışta oluşturulacak yönetici kullanıcı adı |
| `ADMIN_PASS` | İlk kurulumda | İlk açılışta oluşturulacak yönetici şifresi (en az 10 karakter, güçlü şifre) |

---

## 5. Supabase PostgreSQL Bağlantısı

1. [Supabase](https://supabase.com/) üzerinde yeni bir proje oluşturun.
2. **Project Settings → Database → Connection string** bölümünden **Transaction Pooler (port 6543)** veya **Session Pooler (port 5432)** URI adresini kopyalayın.
3. `.env` dosyanızdaki `DATABASE_URL` değişkenine yapıştırın:
   ```env
   DATABASE_URL=postgresql://postgres.[PROJE_REF]:[VERITABANI_SIFRENIZ]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   DB_SSL=true
   ```
4. Uygulamayı başlattığınızda tablolar, indeksler, 6 örnek proje ve admin kullanıcısı Supabase üzerinde otomatik oluşturulur.

---

## 6. Render.com Üzerinde Canlı Yayın (Deployment)

1. Projeyi GitHub deponuza yükleyin (`.env` ve `public/uploads/*` dosyaları `.gitignore` tarafından hariç tutulur).
2. [Render.com](https://render.com/) üzerinde **New → Web Service** seçin ve GitHub deponuzu bağlayın.
3. Ayarları aşağıdaki gibi yapılandırın:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. **Environment Variables** bölümüne aşağıdaki değişkenleri ekleyin:
   - `NODE_ENV` = `production`
   - `BASE_URL` = `https://<render-servis-adiniz>.onrender.com` (veya özel alan adınız)
   - `DATABASE_URL` = Supabase PostgreSQL bağlantı adresiniz
   - `DB_SSL` = `true`
   - `SESSION_SECRET` = 64 karakterli rastgele hex anahtar
   - `ADMIN_USER` = Yönetici kullanıcı adınız
   - `ADMIN_PASS` = En az 10 karakterli güçlü yönetici şifreniz

> **Önemli Not (Dosya Yükleme & Kalıcı Depolama):**
> Render.com'un ücretsiz/standart web servislerinde yerel dosya sistemi **geçicidir (ephemeral)**; yeni bir deploy yapıldığında veya konteyner yeniden başlatıldığında `public/uploads/` klasörüne yüklenen yerel dosyalar silinir.
> - Canlı ortamda görsellerin kalıcı olması için proje eklerken **Harici Görsel URL** alanını kullanabilir, Render Persistent Disk bağlayabilir veya `services/uploadService.js` içindeki `saveImage` / `deleteImage` metodlarını **Supabase Storage / S3** API'sine bağlayabilirsiniz (`uploadService.js` bu geçiş için izole bir adaptör olarak tasarlanmıştır).

---

## 7. Testleri Çalıştırma

Birim ve entegrasyon testlerini çalıştırmak için:

```bash
npm test
```

> **Not:** Entegrasyon testleri (`tests/project.test.js` ve `tests/inquiry.test.js`), `.env` içindeki `TEST_DATABASE_URL` (tanımlı değilse `DATABASE_URL`) veritabanına bağlanarak gerçek SQL sorgularını, CSRF korumasını, dosya yüklemeyi ve Mini CRM akışını test eder.

---

## 8. Güvenlik ve Hukuki Notlar

- **KVKK Aydınlatma Metni:** `config/kvkk.js` ve `/kvkk` sayfasında yer alan aydınlatma metni **taslak** niteliğindedir ve `DOLDURULACAK` olarak işaretlenmiş alanlar içerir. Canlı yayına çıkmadan önce gerçek veri sorumlusu unvanı, MERSİS/VERBİS bilgileri, saklama süreleri ve hukuki sebepler yetkili bir **hukuk danışmanı** tarafından incelenerek güncellenmelidir.
- **Şifre ve Gizli Anahtarlar:** Hiçbir şifre veya bağlantı bilgisi kaynak kodda sabitlenmemiştir. `.env` dosyasını asla Git deposuna eklemeyin.

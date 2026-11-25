const projectService = require('../services/projectService');
const { query } = require('../config/db');
const { absUrl } = require('../utils/viewHelpers');
const { site } = require('../config/site');
const kvkk = require('../config/kvkk');

const emptyForm = { values: {}, errors: {} };

async function home(req, res) {
  const featuredProjects = await projectService.listFeatured();
  res.render('pages/index', {
    currentPage: 'home',
    meta: {
      title: `${site.name} | ${site.tagline}`,
      description:
        'İstanbul-Maltepe stüdyomuzda lüks konut, villa, penthouse ve ticari alanlar için zamansız iç mimari tasarım ve uygulama.',
      path: '/',
      jsonLd: true
    },
    featuredProjects,
    form: emptyForm
  });
}

async function about(req, res) {
  const projects = await projectService.listPublic();
  res.render('pages/hakkimizda', {
    currentPage: 'about',
    meta: {
      title: `Hakkımızda | ${site.name}`,
      description:
        'Oğuzhan Nuhoğlu İç Mimarlık stüdyo felsefesi, tasarım ilkeleri ve çalışma yöntemi. Mekânı ışığın, dokunun ve insan deneyiminin ahengi olarak ele alıyoruz.',
      path: '/hakkimizda',
      image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&h=630&q=80'
    },
    projectCount: projects.length
  });
}

function services(req, res) {
  res.render('pages/hizmetler', {
    currentPage: 'services',
    meta: {
      title: `Hizmetlerimiz | ${site.name}`,
      description:
        'Konut ve villa iç mimarisi, ticari alan ve ofis tasarımı, 3D görselleştirme, uygulama ve proje yönetimi, malzeme ve aydınlatma danışmanlığı.',
      path: '/hizmetler',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&h=630&q=80'
    }
  });
}

function kvkkPage(req, res) {
  res.render('pages/kvkk', {
    currentPage: 'kvkk',
    meta: {
      title: `KVKK Aydınlatma Metni | ${site.name}`,
      description: 'Kişisel verilerin korunması kanunu kapsamında aydınlatma metni.',
      path: '/kvkk'
    },
    kvkk
  });
}

async function sitemap(req, res) {
  const projects = await projectService.listPublic();
  const staticPaths = ['/', '/hakkimizda', '/hizmetler', '/projeler', '/iletisim', '/kvkk'];
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const urls = [
    ...staticPaths.map((p) => `<url><loc>${esc(absUrl(p))}</loc></url>`),
    ...projects.map((p) => {
      const lastmod = p.updated_at ? `<lastmod>${new Date(p.updated_at).toISOString()}</lastmod>` : '';
      return `<url><loc>${esc(absUrl(`/projeler/${p.slug}`))}</loc>${lastmod}</url>`;
    })
  ];
  res
    .type('application/xml')
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`);
}

function robots(req, res) {
  res
    .type('text/plain')
    .send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /login\n\nSitemap: ${absUrl('/sitemap.xml')}\n`);
}

/** Render.com health check rotası — hassas ortam değişkeni veya bağlantı bilgisi sızdırmaz. */
async function healthz(req, res) {
  try {
    await query('SELECT 1');
    return res.status(200).json({ status: 'ok' });
  } catch (_) {
    return res.status(503).json({ status: 'unavailable' });
  }
}

module.exports = { home, about, services, kvkkPage, sitemap, robots, healthz };

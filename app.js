require('./config/env'); // ortam değişkenlerini en başta yükle/doğrula
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const config = require('./config/env');
const { site, projectCategories, inquiryStatuses, projectTypes, services } = require('./config/site');
const kvkk = require('./config/kvkk');
const pkg = require('./package.json');
const { createSessionMiddleware } = require('./config/session');
const { csrfProtection } = require('./middlewares/csrfMiddleware');
const { createLimiters } = require('./middlewares/rateLimitMiddleware');
const { notFoundHandler, errorHandler } = require('./middlewares/errorMiddleware');
const { flashMiddleware } = require('./utils/flash');
const viewHelpers = require('./utils/viewHelpers');
const indexRoutes = require('./routes/indexRoutes');
const projectRoutes = require('./routes/projectRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');
const adminRoutes = require('./routes/adminRoutes');

/**
 * Express uygulamasını oluşturur (sunucuyu başlatmaz; testler bu fonksiyonu kullanır).
 * @param {{ contactMax?: number, loginMax?: number }} options
 */
function createApp(options = {}) {
  const app = express();
  const limiters = createLimiters(options);

  app.disable('x-powered-by');
  // Render/Heroku gibi bir ters proxy arkasında gerçek IP ve HTTPS algılaması için
  if (config.isProduction) app.set('trust proxy', 1);

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'"],
          'style-src': ["'self'", 'https://fonts.googleapis.com'],
          'font-src': ["'self'", 'https://fonts.gstatic.com'],
          // Admin harici görsel URL'si girebildiği için https: görsellere izin verilir
          'img-src': ["'self'", 'data:', 'https:'],
          'media-src': ["'self'"],
          'connect-src': ["'self'"],
          'form-action': ["'self'"],
          'frame-ancestors': ["'none'"],
          'object-src': ["'none'"],
          'upgrade-insecure-requests': config.isProduction ? [] : null
        }
      },
      crossOriginEmbedderPolicy: false
    })
  );

  const staticOptions = { maxAge: config.isProduction ? '7d' : 0, index: false };
  app.use('/uploads', express.static(config.upload.dir, { ...staticOptions, dotfiles: 'deny' }));
  app.use(express.static(path.join(__dirname, 'public'), staticOptions));

  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(express.json({ limit: '100kb' }));

  app.use(createSessionMiddleware());
  app.use(flashMiddleware);
  app.use(csrfProtection);

  // Tüm şablonlarda kullanılabilen ortak veriler
  app.use((req, res, next) => {
    res.locals.site = site;
    res.locals.kvkk = kvkk;
    res.locals.assetVersion = pkg.version || '1.0.0';
    res.locals.projectCategories = projectCategories;
    res.locals.inquiryStatuses = inquiryStatuses;
    res.locals.projectTypes = projectTypes;
    res.locals.services = services;
    res.locals.currentPath = req.path;
    res.locals.admin = req.session && req.session.admin ? req.session.admin : null;
    Object.assign(res.locals, viewHelpers);
    next();
  });

  app.use(indexRoutes);
  app.use(projectRoutes);
  app.use(inquiryRoutes(limiters));
  app.use(adminRoutes(limiters));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

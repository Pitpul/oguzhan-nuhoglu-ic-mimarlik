const express = require('express');
const pageController = require('../controllers/pageController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(pageController.home));
router.get('/hakkimizda', asyncHandler(pageController.about));
router.get('/hizmetler', pageController.services);
router.get('/kvkk', pageController.kvkkPage);
router.get('/sitemap.xml', asyncHandler(pageController.sitemap));
router.get('/robots.txt', pageController.robots);
router.get(['/healthz', '/health'], asyncHandler(pageController.healthz));
router.get('/favicon.ico', (req, res) => res.redirect(301, '/media/favicon.png'));

// Eski statik sayfa adresleri kalıcı olarak yeni temiz adreslere yönlendirilir.
router.get('/index.html', (req, res) => res.redirect(301, '/'));
router.get('/hakkimizda.html', (req, res) => res.redirect(301, '/hakkimizda'));
router.get('/hizmetler.html', (req, res) => res.redirect(301, '/hizmetler'));
router.get('/projeler.html', (req, res) => res.redirect(301, '/projeler'));

module.exports = router;

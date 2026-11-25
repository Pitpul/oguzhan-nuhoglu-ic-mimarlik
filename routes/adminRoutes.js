const express = require('express');
const adminController = require('../controllers/adminController');
const projectController = require('../controllers/projectController');
const inquiryController = require('../controllers/inquiryController');
const asyncHandler = require('../utils/asyncHandler');
const { requireAdmin, redirectIfAuthenticated } = require('../middlewares/authMiddleware');
const { handleImageUpload } = require('../middlewares/uploadMiddleware');
const { validateBody } = require('../middlewares/validationMiddleware');
const { validateLogin } = require('../utils/validators');

module.exports = function adminRoutes(limiters) {
  const router = express.Router();

  // --- Kimlik doğrulama ---
  router.get('/login', redirectIfAuthenticated, adminController.loginPage);
  router.post(
    '/login',
    limiters.login,
    validateBody(validateLogin, adminController.loginInvalid),
    asyncHandler(adminController.login)
  );
  router.post('/logout', adminController.logout);

  // --- Bundan sonraki tüm /admin rotaları oturum gerektirir ---
  router.use('/admin', requireAdmin);

  router.get('/admin', asyncHandler(adminController.dashboard));

  // Proje yönetimi (CRUD)
  router.get('/admin/projeler', asyncHandler(projectController.adminList));
  router.get('/admin/projeler/yeni', asyncHandler(projectController.newForm));
  router.post('/admin/projeler', handleImageUpload, asyncHandler(projectController.adminCreate));
  router.get('/admin/projeler/:id(\\d+)/duzenle', asyncHandler(projectController.editForm));
  router.post('/admin/projeler/:id(\\d+)/guncelle', handleImageUpload, asyncHandler(projectController.adminUpdate));
  router.post('/admin/projeler/:id(\\d+)/one-cikar', asyncHandler(projectController.adminToggleFeatured));
  router.post('/admin/projeler/:id(\\d+)/sil', asyncHandler(projectController.adminDelete));

  // Müşteri talepleri (mini CRM)
  router.get('/admin/talepler', asyncHandler(inquiryController.adminList));
  router.post('/admin/talepler/:id(\\d+)/guncelle', asyncHandler(inquiryController.adminUpdate));
  router.post('/admin/talepler/:id(\\d+)/sil', asyncHandler(inquiryController.adminDelete));

  return router;
};

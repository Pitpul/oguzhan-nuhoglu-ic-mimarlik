const express = require('express');
const inquiryController = require('../controllers/inquiryController');
const asyncHandler = require('../utils/asyncHandler');

/** @param {{ contact: import('express').RequestHandler }} limiters */
module.exports = function inquiryRoutes(limiters) {
  const router = express.Router();

  router.get('/iletisim', inquiryController.contactPage);
  // Doğrulama sorumluluğu tek merkezde (inquiryService.createInquiry) yürütülür
  router.post(['/iletisim', '/api/inquiries'], limiters.contact, asyncHandler(inquiryController.create));

  return router;
};

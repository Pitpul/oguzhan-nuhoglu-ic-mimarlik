const express = require('express');
const projectController = require('../controllers/projectController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/projeler', asyncHandler(projectController.list));
router.get('/projeler/:slug', asyncHandler(projectController.detail));

module.exports = router;

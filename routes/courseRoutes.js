// courseRoutes.js
const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

// PUT SPECIFIC ROUTES FIRST
router.get('/:id/handout/download', courseController.downloadPDF); // This should come first

module.exports = router;
const express = require('express');
const router = express.Router();
const lectureController = require('../controllers/lectureController');

router.get('/courses/:course_title/lectures/:id/pdf', lectureController.downloadPDF);

module.exports = router;
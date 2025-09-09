const express = require('express');
const router = express.Router();
const lectureController = require('../controllers/lectureController');
const fs = require('fs');
const path = require('path');

router.get('/lectures/:id/pdf', lectureController.downloadLecturePDF);
router.get('/lectures/pdf', lectureController.generateLecturesPdf);
router.get('/lectures/:id/questions/pdf', lectureController.downloadQuestionPDF);

// const dataDir = "/data/uploads/uploads/questions/question-1757425380428-964074225.png";
// router.get("/files", (req, res) => {
//   fs.readdir(dataDir, (err, files) => {
//     if (err) return res.status(500).json({ error: err.message });
//     res.json({ files });
//   });
// });

module.exports = router;
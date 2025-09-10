const express = require('express');
const router = express.Router();
const lectureController = require('../controllers/lectureController');
const fs = require('fs');
const path = require('path');

router.get('/lectures/:id/pdf', lectureController.downloadLecturePDF);
router.get('/lectures/pdf', lectureController.generateLecturesPdf);
router.get('/lectures/:id/questions/pdf', lectureController.downloadQuestionPDF);

const dataDir = "/data/uploads/questions";
router.get("/files", (req, res) => {
  fs.readdir(dataDir, (err, files) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ files });
  });
});


// Delete a single file

// Delete all files in folder
// router.delete("/files", (req, res) => {
//   fs.readdir(dataDir, (err, files) => {
//     if (err) return res.status(500).json({ error: err.message });

//     if (files.length === 0) return res.json({ message: "No files to delete" });

//     let deleted = [];
//     let errors = [];

//     files.forEach((file) => {
//       const filePath = path.join(dataDir, file);
//       fs.unlink(filePath, (err) => {
//         if (err) {
//           errors.push({ file, error: err.message });
//         } else {
//           deleted.push(file);
//         }

//         // Send response after processing all files
//         if (deleted.length + errors.length === files.length) {
//           res.json({ deleted, errors });
//         }
//       });
//     });
//   });
// });


module.exports = router;
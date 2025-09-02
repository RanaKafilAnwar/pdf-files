const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const questionController = require('../controllers/questionController');
const Course = require('../models/Course');
const { uploadHandout, handleUploadErrors, uploadQuestionImage, uploadOptionImage, handleImageUploadErrors } = require('../middleware/upload');

router.post('/courses/create', uploadHandout, handleUploadErrors, courseController.create);
router.post('/courses/:id/update', uploadHandout, handleUploadErrors, courseController.update);
router.post('/courses/:id/delete', courseController.deleteCourse);

// Questions
router.post('/questions/create', uploadQuestionImage, handleImageUploadErrors, questionController.createQuestion);
router.post('/questions/:id/update', uploadQuestionImage, handleImageUploadErrors, questionController.updateQuestion);
router.delete('/questions/:id/delete', questionController.deleteQuestion);

// Options
router.post('/questions/:question_id/options/create', uploadOptionImage, handleImageUploadErrors, questionController.createOption);
router.post('/options/:id/update', uploadOptionImage, handleImageUploadErrors, questionController.updateOption);
router.delete('/options/:id/delete', questionController.deleteOption);

module.exports = router;
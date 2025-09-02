const Course = require('../models/Course');
const Lecture = require('../models/Lecture');
const Question = require('../models/Question');
const path = require('path');
const fs = require('fs');


const create = async (req, res) => {
  try {
    const { title, slug } = req.body;
    const existingCourse = await Course.findByTitle(req.user.userId, req.body.title);
    if (existingCourse) {
      return res.status(400).json({ message: 'Course already exists' });
    }

    const handoutData = req.file ? {
      handout_pdf: req.file.path,   // full path in /data/uploads/...
      handout_original_filename: req.file.originalname
    } : {};


    const course = await Course.create({
      title,
      user_id: req.user.userId,
      slug,
      ...handoutData
    });

    res.status(201).redirect('/admin/courses');
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const update = async (req, res) => {
  try {
    const updateData = {
      title: req.body.title,
      slug: req.body.slug
    };

    if (req.file) {
      // ✅ Save path WITH 'public'
      updateData.handout_pdf = req.file.path;
      updateData.handout_original_filename = req.file.originalname;

      // Delete old file if exists
      const course = await Course.findById(req.params.id);
      if (course.handout_pdf && fs.existsSync(course.handout_pdf)) {
        fs.unlinkSync(course.handout_pdf);
      }
    }

    await Course.update(req.params.id, updateData);
    res.status(200).redirect('/admin/courses/' + req.params.id);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    // Delete associated PDF file if exists
    if (course.handout_pdf && fs.existsSync(course.handout_pdf)) {
      fs.unlinkSync(course.handout_pdf);
    }

    // Rest of your delete logic...
    const lectures = await Lecture.findByCourseId(req.params.id);
    if (lectures.length > 0) {
      lectures.forEach(async (lecture) => {
        await Question.deleteByLectureId(lecture.id);
      });
    }

    await Course.delete(req.params.id);
    await Lecture.deleteByCourseId(req.params.id);
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const downloadPDF = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course || !course.handout_pdf) {
      return res.status(404).send('Handout not found');
    }

    // Build absolute path correctly
    const filePath = course.handout_pdf; // already absolute (/data/uploads/..)
    const fileName = course.handout_original_filename || `${course.slug}-handout.pdf`;

    if (!fs.existsSync(filePath)) {
      console.error('File not found at path:', filePath);
      return res.status(404).send('File not found');
    }

    res.download(filePath, fileName);
  } catch (err) {
    console.error('Error serving handout:', err);
    res.status(500).send('Server error while downloading handout');
  }
};


module.exports = { create, update, deleteCourse, downloadPDF };
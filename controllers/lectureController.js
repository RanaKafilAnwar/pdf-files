const Lecture = require('../models/Lecture');
const Course = require('../models/Course');
const pdf = require('html-pdf');
const path = require('path');

const downloadPDF = async (req, res) => {
    try {
        const lecture = await Lecture.findById(req.params.id);
        if (!lecture) {
            return res.status(404).json({ message: 'Lecture not found' });
        }

        const questions = await Lecture.getQuestionsWithDetails(req.params.id);
        const course = await Course.findById(lecture.course_id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Render the EJS template to HTML
        const html = await new Promise((resolve, reject) => {
            res.render('pdf/lecture-questions', {
                lecture,
                questions,
                course,
                layout: false
            }, (err, html) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(html);
                }
            });
        });

        if (!html || typeof html !== 'string' || html.trim().length === 0) {
            throw new Error('Generated HTML is empty');
        }

        // PDF options
        const options = {
            format: 'A4',
            border: {
                top: '10mm',
                right: '10mm',
                bottom: '10mm',
                left: '10mm'
            },
            header: {
                height: '15mm',
                contents: `<div style="text-align: center; font-size: 14px;">${course.title} - ${lecture.title}</div>`
            },
            footer: {
                height: '15mm',
                contents: {
                    default: `<div style="text-align: center; font-size: 14px; color: #666;">Page {{page}} of {{pages}}</div>`
                }
            }
        };

        // Generate PDF
        const pdfStream = await new Promise((resolve, reject) => {
            pdf.create(html, options).toStream((err, stream) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(stream);
                }
            });
        });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${lecture.title}-questions.pdf"`);
        pdfStream.pipe(res);

    } catch (err) {
        console.error('PDF generation error:', err);
        if (!res.headersSent) {
            res.status(500).json({ 
                message: 'Failed to generate PDF',
                error: err.message 
            });
        }
    }
};

module.exports = { downloadPDF };
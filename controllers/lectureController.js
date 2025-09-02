const Lecture = require('../models/Lecture');
const Course = require('../models/Course');
const puppeteer = require('puppeteer');
const ejs = require('ejs');
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

    // Render HTML from EJS template
    const templatePath = path.join(__dirname, '../views/pdf/lecture-questions.ejs');
    const html = await ejs.renderFile(templatePath, {
      lecture,
      questions,
      course,
    });

    // Launch Puppeteer (works on Railway with no-sandbox)
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    // Load HTML into page
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generate PDF with header & footer
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size:14px; text-align:center; width:100%; margin-top:5px;">
          ${course.title} - ${lecture.title}
        </div>`,
      footerTemplate: `
        <div style="font-size:14px; color:#666; text-align:center; width:100%;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>`,
    });

    await browser.close();

    // Send PDF back to client
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${lecture.title}-questions.pdf"`
    );
    res.send(pdfBuffer);

  } catch (err) {
    console.error('PDF generation error:', err);
    if (!res.headersSent) {
      res.status(500).json({
        message: 'Failed to generate PDF',
        error: err.message,
      });
    }
  }
};

module.exports = { downloadPDF };

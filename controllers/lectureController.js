const Lecture = require('../models/Lecture');
const Course = require('../models/Course');
const { PDFDocument, rgb, StandardFonts, degrees } = require('pdf-lib');
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

        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        let page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        
        // Load fonts
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        // Set initial positions
        let yPosition = height - 50;
        const margin = 50;
        const lineHeight = 20;
        const sectionSpacing = 30;
        
        // Function to add watermark to a page
        const addWatermark = (page) => {
            page.drawText('Quizzify', {
                x: width / 2 - 100,
                y: height / 3,
                size: 100,
                font: font,
                color: rgb(0.9, 0.9, 0.9),
                rotate: degrees(45),
                opacity: 0.8,
            });
        };

        // Add watermark to first page FIRST (so it's in the background)
        addWatermark(page);
        
        // Add header (this will appear on top of watermark)
        page.drawText(`${course.title} - ${lecture.title}`, {
            x: margin,
            y: yPosition,
            size: 16,
            font: fontBold,
            color: rgb(0, 0, 0),
        });
        
        yPosition -= 40;
        
        // Add questions
        for (let index = 0; index < questions.length; index++) {
            const question = questions[index];
            
            // Check if we need a new page
            if (yPosition < margin + 100) {
                page = pdfDoc.addPage();
                yPosition = height - 50;
                
                // Add watermark to new page FIRST
                addWatermark(page);
                
                // Add header to new page
                page.drawText(`${course.title} - ${lecture.title}`, {
                    x: margin,
                    y: yPosition,
                    size: 16,
                    font: fontBold,
                    color: rgb(0, 0, 0),
                });
                
                yPosition -= 40;
            }
            
            // Question number and text
            page.drawText(`${index + 1}. ${question.question_text}`, {
                x: margin,
                y: yPosition,
                size: 12,
                font: fontBold,
                color: rgb(0, 0, 0),
            });
            
            yPosition -= lineHeight;
            
            // Options
            for (let optIndex = 0; optIndex < question.options.length; optIndex++) {
                const option = question.options[optIndex];
                const prefix = String.fromCharCode(65 + optIndex); // A, B, C, D
                
                // Draw option text
                page.drawText(`   ${prefix}. ${option.option_text}`, {
                    x: margin + 20,
                    y: yPosition,
                    size: 11,
                    font: font,
                    color: option.is_correct ? rgb(0, 0.5, 0) : rgb(0, 0, 0),
                });
                
                // Draw checkmark for correct answers (using text that is supported)
                if (option.is_correct) {
                    // Calculate the width of the option text to position the checkmark
                    const optionText = `   ${prefix}. ${option.option_text}`;
                    const textWidth = font.widthOfTextAtSize(optionText, 11);
                    
                    // Draw "(Correct)" instead of checkmark
                    page.drawText(' (Correct)', {
                        x: margin + 20 + textWidth,
                        y: yPosition,
                        size: 11,
                        font: font,
                        color: rgb(0, 0.5, 0),
                    });
                }
                
                yPosition -= lineHeight;
                
                // Check if we need a new page within options
                if (yPosition < margin + 30) {
                    page = pdfDoc.addPage();
                    yPosition = height - 50;
                    
                    // Add watermark to new page FIRST
                    addWatermark(page);
                    
                    // Add header to new page
                    page.drawText(`${course.title} - ${lecture.title}`, {
                        x: margin,
                        y: yPosition,
                        size: 16,
                        font: fontBold,
                        color: rgb(0, 0, 0),
                    });
                    
                    yPosition -= 40;
                }
            }
            
            // Explanation if available
            if (question.explanation) {
                // Check if we need a new page before adding explanation
                if (yPosition < margin + 30) {
                    page = pdfDoc.addPage();
                    yPosition = height - 50;
                    
                    // Add watermark to new page FIRST
                    addWatermark(page);
                    
                    // Add header to new page
                    page.drawText(`${course.title} - ${lecture.title}`, {
                        x: margin,
                        y: yPosition,
                        size: 16,
                        font: fontBold,
                        color: rgb(0, 0, 0),
                    });
                    
                    yPosition -= 40;
                }
                
                page.drawText(`   Explanation: ${question.explanation}`, {
                    x: margin + 20,
                    y: yPosition,
                    size: 10,
                    font: font,
                    color: rgb(0.4, 0.4, 0.4),
                });
                
                yPosition -= lineHeight;
            }
            
            yPosition -= sectionSpacing;
        }
        
        // Add page numbers to all pages
        const pages = pdfDoc.getPages();
        for (let index = 0; index < pages.length; index++) {
            const currentPage = pages[index];
            currentPage.drawText(`Page ${index + 1} of ${pages.length}`, {
                x: width - 100,
                y: 30,
                size: 10,
                font: font,
                color: rgb(0.4, 0.4, 0.4),
            });
        }
        
        // Serialize the PDF to bytes
        const pdfBytes = await pdfDoc.save();
        
        // Send PDF back to client
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${lecture.title}-questions.pdf"`);
        res.setHeader('Content-Length', pdfBytes.length);
        // 🔑 Add this so browser JS can read the header
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        res.send(Buffer.from(pdfBytes));

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
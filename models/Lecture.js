const db = require('../config/db');
const fs = require('fs');
const pdf = require('pdf-parse'); // You'll need to install this package
const path = require('path');

class Lecture {
    static async create({ title, courseId, handoutPath, startPage, endPage }) {
        const [result] = await db.query(
            'INSERT INTO lectures (title, course_id, handout_path, start_page, end_page) VALUES (?, ?, ?, ?, ?)',
            [title, courseId, handoutPath, startPage, endPage]
        );
        return this.findById(result.insertId);
    }

    static async delete(id) {
        const [result] = await db.query(
            'DELETE FROM lectures WHERE id = ?', 
            [id]
        );
        return result.affectedRows;
    }

    static async update(id, { title, courseId, handoutPath, startPage, endPage }) {
    const [result] = await db.query(
        'UPDATE lectures SET title = ?, course_id = ?, handout_path = ?, start_page = ?, end_page = ? WHERE id = ?', 
        [title, courseId, handoutPath, startPage, endPage, id]
    );
    return result.affectedRows;
}


    static async extractLectureContent(lectureId) {
        const lecture = await this.findById(lectureId);
        if (!lecture || !lecture.handout_path) return null;

        const fullPath = path.join('public', lecture.handout_path);
        if (!fs.existsSync(fullPath)) return null;

        try {
            const dataBuffer = fs.readFileSync(fullPath);
            const data = await pdf(dataBuffer);
            
            // Extract pages for this lecture
            const allPages = data.text.split(/\f/); // Split by form feed character (page break)
            const lecturePages = allPages.slice(lecture.start_page - 1, lecture.end_page);
            
            return {
                content: lecturePages.join('\n\n[PAGE BREAK]\n\n'), // Mark page breaks
                totalPages: allPages.length,
                currentPages: lecturePages.length
            };
        } catch (err) {
            console.error('Error extracting PDF content:', err);
            return null;
        }
    }

    static async getLectureWithContent(lectureId) {
        const lecture = await this.findById(lectureId);
        if (!lecture) return null;

        const content = await this.extractLectureContent(lectureId);
        return {
            ...lecture,
            content
        };
    }

    static async updateHandoutInfo(id, { handoutPath, startPage, endPage }) {
        const [result] = await db.query(
            'UPDATE lectures SET handout_path = ?, start_page = ?, end_page = ? WHERE id = ?',
            [handoutPath, startPage, endPage, id]
        );
        return result.affectedRows;
    }

    static async getAll() {
        const [rows] = await db.query('SELECT * FROM lectures');
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query(
            'SELECT * FROM lectures WHERE id = ?', 
            [id]
        );
        return rows[0];
    }

    static async findByCourseId(courseId) {
        const [rows] = await db.query(
            'SELECT * FROM lectures WHERE course_id = ?', 
            [courseId]
        );
        return rows;
    }

    static async deleteByCourseId(courseId) {
        const [result] = await db.query(
            'DELETE FROM lectures WHERE course_id = ?', 
            [courseId]
        );
        return result.affectedRows;
    }

    static async getQuizAttemptCount(lectureId) {
        const [rows] = await db.query(
            "SELECT COUNT(*) AS attempt_count FROM quiz_results WHERE quiz_id = ?",
            [lectureId]
        );
        return rows.length ? rows[0].attempt_count : 0;
    }
    
    static async updateQuizProgressBasedOnAttempts(lectureId) {
        const attemptCount = await this.getQuizAttemptCount(lectureId);
        let progress = (attemptCount >= 5) ? 100.00 : (attemptCount / 5) * 100;
    
        await db.query(
            "UPDATE lectures SET lecture_progress = ? WHERE id = ?",
            [progress, lectureId]
        );
    
        return progress;
    }
    
    static async updateLectureTotalQuestions(lectureId, totalQuestions) {
        const [result] = await db.query(
            'UPDATE lectures SET total_questions = ? WHERE id = ?', 
            [totalQuestions, lectureId]
        );
        return result.affectedRows;
    }

    static async getQuestionsWithDetails(lectureId) {
        // Get all questions with their options and answers
        const [questions] = await db.query(`
            SELECT 
                q.id AS question_id, 
                q.question_text, 
                q.question_type,
                q.question_image,
                a.correct_answer,
                a.max_length
            FROM questions q
            LEFT JOIN answers a ON q.id = a.question_id
            WHERE q.lecture_id = ?`,
            [lectureId]
        );

        // Get all options for these questions
        const [options] = await db.query(`
            SELECT 
                id, 
                question_id, 
                option_text, 
                option_image, 
                is_correct 
            FROM options 
            WHERE question_id IN (
                SELECT id FROM questions WHERE lecture_id = ?
            )`,
            [lectureId]
        );

        // Organize the data
        const questionsMap = new Map();

        questions.forEach(question => {
            questionsMap.set(question.question_id, {
                id: question.question_id,
                question_text: question.question_text,
                question_type: question.question_type,
                question_image: question.question_image,
                correct_answer: question.correct_answer,
                max_length: question.max_length,
                options: []
            });
        });

        options.forEach(option => {
            if (questionsMap.has(option.question_id)) {
                questionsMap.get(option.question_id).options.push({
                    id: option.id,
                    option_text: option.option_text,
                    option_image: option.option_image,
                    is_correct: option.is_correct
                });
            }
        });

        return Array.from(questionsMap.values());
    }

    static async getLectureWithFullDetails(lectureId) {
        const lecture = await this.findById(lectureId);
        if (!lecture) return null;

        const questions = await this.getQuestionsWithDetails(lectureId);
        return {
            ...lecture,
            questions
        };
    }
}

module.exports = Lecture;
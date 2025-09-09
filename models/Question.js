const db = require('../config/db');

class Question {
    static async getAll() {
        const [rows] = await db.query('SELECT * FROM questions');
        return rows;
    }

    static async findByIds(ids) {
        if (!ids.length) return [];
        const [rows] = await db.query(`SELECT * FROM questions WHERE id IN (?)`, [ids]);
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query(`SELECT * FROM questions WHERE id = ?`, [id]);
        return rows[0];
    }
    
    static async findByLectureId(lectureId) {
        const [rows] = await db.query('SELECT * FROM questions WHERE lecture_id = ?', [lectureId]);
        return rows;
    }

    static async create({ question_text, lecture_id, question_type = 'multiple_choice', question_image = null }) {
        const [result] = await db.query(
            'INSERT INTO questions (question_text, lecture_id, question_type, question_image) VALUES (?, ?, ?, ?)',
            [question_text, lecture_id, question_type, question_image]
        );
        const [question] = await db.query('SELECT * FROM questions WHERE id = ?', [result.insertId]);
        return question[0];
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM questions WHERE id = ?', [id]);
        return result.affectedRows;
    }

    static async deleteByLectureId(lectureId) {
        const [result] = await db.query('DELETE FROM questions WHERE lecture_id = ?', [lectureId]);
        return result.affectedRows;
    }

    static async update(id, { question_text, question_image }) {
        const [result] = await db.query(
            'UPDATE questions SET question_text = ?, question_image = ? WHERE id = ?',
            [question_text, question_image || null, id]
        );
        return result.affectedRows;
    }

    // Additional methods for question types
    static async setCorrectAnswer(question_id, correct_answer, max_length = null) {
        // First delete any existing answer for this question
        await db.query('DELETE FROM answers WHERE question_id = ?', [question_id]);
        
        // Insert new correct answer
        const [result] = await db.query(
            'INSERT INTO answers (question_id, correct_answer, max_length) VALUES (?, ?, ?)',
            [question_id, correct_answer, max_length]
        );
        return result.insertId;
    }

    static async getCorrectAnswer(question_id) {
        const [rows] = await db.query('SELECT * FROM answers WHERE question_id = ?', [question_id]);
        return rows[0] || null;
    }
}

module.exports = Question;
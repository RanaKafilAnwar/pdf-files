const db = require('../config/db');

class Option {
    static async create({ option_text = null, question_id, is_correct = false, option_image = null }) {
        const [result] = await db.query(
            'INSERT INTO options (option_text, question_id, is_correct, option_image) VALUES (?, ?, ?, ?)',
            [option_text, question_id, is_correct, option_image]
        );
        const [option] = await db.query('SELECT * FROM options WHERE id = ?', [result.insertId]);
        return option[0];
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM options WHERE id = ?', [id]);
        return result.affectedRows;
    }

    static async update(id, { option_text = null, is_correct = false, option_image = null }) {
        const [result] = await db.query(
            'UPDATE options SET option_text = ?, is_correct = ?, option_image = ? WHERE id = ?',
            [option_text, is_correct, option_image, id]
        );
        return result.affectedRows;
    }

    static async findByIds(ids) {
        if (!ids.length) return [];
        const [rows] = await db.query(`SELECT * FROM options WHERE id IN (?)`, [ids]);
        return rows;
    }

    static async findByQuestionId(question_id) {
        const [rows] = await db.query('SELECT * FROM options WHERE question_id = ?', [question_id]);
        return rows;
    }

    static async getAll() {
        const [rows] = await db.query('SELECT * FROM options');
        return rows;
    }

    static async deleteByQuestionId(question_id) {
        const [result] = await db.query('DELETE FROM options WHERE question_id = ?', [question_id]);
        return result.affectedRows;
    }

    static async findByLectureId(lectureId) {
        const [rows] = await db.query(
            'SELECT o.* FROM options o JOIN questions q ON o.question_id = q.id WHERE q.lecture_id = ?',
            [lectureId]
        );
        return rows;
    }

    // New method to get correct options for a question
    static async getCorrectOptions(question_id) {
        const [rows] = await db.query(
            'SELECT * FROM options WHERE question_id = ? AND is_correct = 1',
            [question_id]
        );
        return rows;
    }
}

module.exports = Option;
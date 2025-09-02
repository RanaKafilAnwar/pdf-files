const db = require('../config/db');

class Answer {
    /**
     * Create a new answer for a question
     * @param {number} question_id - ID of the question
     * @param {string} correct_answer - The correct answer text
     * @param {number|null} max_length - Optional max length for student answers
     * @returns {Promise<Object>} Created answer object
     */
    static async create(question_id, correct_answer, max_length = null) {
        const [result] = await db.query(
            'INSERT INTO answers (question_id, correct_answer, max_length) VALUES (?, ?, ?)',
            [question_id, correct_answer, max_length]
        );
        return this.findById(result.insertId);
    }

    /**
     * Find answer by ID
     * @param {number} id - Answer ID
     * @returns {Promise<Object|null>} Answer object or null if not found
     */
    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM answers WHERE id = ?', [id]);
        return rows[0] || null;
    }

    /**
     * Find answer by question ID
     * @param {number} question_id - Question ID
     * @returns {Promise<Object|null>} Answer object or null if not found
     */
    static async findByQuestionId(question_id) {
        const [rows] = await db.query('SELECT * FROM answers WHERE question_id = ?', [question_id]);
        return rows[0] || null;
    }

    /**
     * Update an existing answer
     * @param {number} id - Answer ID
     * @param {string} correct_answer - Updated correct answer text
     * @param {number|null} max_length - Updated max length
     * @returns {Promise<number>} Number of affected rows
     */
    static async update(id, correct_answer, max_length = null) {
        const [result] = await db.query(
            'UPDATE answers SET correct_answer = ?, max_length = ? WHERE id = ?',
            [correct_answer, max_length, id]
        );
        return result.affectedRows;
    }

    /**
     * Delete an answer
     * @param {number} id - Answer ID
     * @returns {Promise<number>} Number of affected rows
     */
    static async delete(id) {
        const [result] = await db.query('DELETE FROM answers WHERE id = ?', [id]);
        return result.affectedRows;
    }

    /**
     * Delete answer by question ID
     * @param {number} question_id - Question ID
     * @returns {Promise<number>} Number of affected rows
     */
    static async deleteByQuestionId(question_id) {
        const [result] = await db.query('DELETE FROM answers WHERE question_id = ?', [question_id]);
        return result.affectedRows;
    }

    /**
     * Validate a student's answer against the correct answer
     * @param {number} question_id - Question ID
     * @param {string} student_answer - Student's answer text
     * @returns {Promise<{isCorrect: boolean, feedback?: string}>} Validation result
     */
    static async validateAnswer(question_id, student_answer) {
        const correctAnswer = await this.findByQuestionId(question_id);
        if (!correctAnswer) {
            throw new Error('No correct answer found for this question');
        }

        // Basic case-insensitive comparison
        const isCorrect = student_answer.trim().toLowerCase() === correctAnswer.correct_answer.trim().toLowerCase();
        
        return {
            isCorrect,
            ...(!isCorrect && { feedback: `The correct answer is: ${correctAnswer.correct_answer}` })
        };
    }

    /**
     * Check if answer exceeds max length (if specified)
     * @param {number} question_id - Question ID
     * @param {string} student_answer - Student's answer text
     * @returns {Promise<{valid: boolean, message?: string}>} Validation result
     */
    static async checkAnswerLength(question_id, student_answer) {
        const answerSpec = await this.findByQuestionId(question_id);
        if (!answerSpec?.max_length) {
            return { valid: true };
        }

        const valid = student_answer.length <= answerSpec.max_length;
        return {
            valid,
            ...(!valid && { message: `Answer must be ${answerSpec.max_length} characters or less` })
        };
    }
}

module.exports = Answer;
const Question = require('../models/Question');
const Option = require('../models/Option');
const Answer = require('../models/Answer');
const Lecture = require('../models/Lecture');
const path = require('path');
const fs = require('fs');

const createQuestion = async (req, res) => {
    try {
        const { question_text, lecture_id, question_type } = req.body;
        let question_image = null;
        if (req.file) {
            question_image = `/uploads/questions/${path.basename(req.file.path)}`
        }
        // Create the question
        const question = await Question.create({
            question_text,
            lecture_id,
            question_type,
            question_image
        });

        // If it's a short/long answer question, create the answer
        if (question_type === 'short_answer' || question_type === 'long_answer') {
            const { correct_answer, max_length } = req.body;
            await Answer.create(question.id, correct_answer, max_length);
        }

        // Update lecture question count
        const questions = await Question.findByLectureId(lecture_id);
        await Lecture.updateLectureTotalQuestions(lecture_id, questions.length);
        const questionIndex = questions.findIndex(q => q.id === question.id) + 1;

        res.status(201).json({
            success: true,
            question: {
                id: question.id,
                index: questionIndex,
                question_text: question.question_text,
                question_type: question.question_type,
                question_image: "https://pdf-files-production.up.railway.app" + question.question_image
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updateQuestion = async (req, res) => {
    try {
        const { question_text, remove_image } = req.body;
        let question_image = null;
        const question = await Question.findById(req.params.id);

        if (req.file) {
            question_image = `/uploads/questions/${path.basename(req.file.path)}`;
            // Delete old file from /data/
            if (question && question.question_image) {
                const oldPath = path.join('/data', question.question_image);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
        } else if (remove_image === "true") {
            // ✅ remove image requested
            if (question && question.question_image) {
                const oldPath = path.join('/data', question.question_image);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            question_image = null;
        } else {
            question_image = question.question_image
        }

        await Question.update(req.params.id, {
            question_text,
            question_image
        });

        res.status(201).json({
            success: true,
            newText: question_text,
            question_image: "https://pdf-files-production.up.railway.app" + question_image
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.body.id);
        if (question && question.question_image) {
            const oldPath = path.join('/data', question.question_image);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        await Question.delete(req.body.id);
        await Option.deleteByQuestionId(req.body.id);
        await Answer.deleteByQuestionId(req.body.id); // Also delete associated answer if exists
        res.status(200).json({
            success: true,
            message: "Question deleted successfully"
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


const createOption = async (req, res) => {
    try {
        const { option_text, is_correct = false } = req.body;
        const question_id = req.params.question_id;
        let option_image = null;

        if (req.file) {
            option_image = `/uploads/options/${path.basename(req.file.path)}`
        }
        const option = await Option.create({
            option_text,
            question_id,
            is_correct,
            option_image
        });

        res.status(201).json({
            success: true,
            option: {
                id: option.id,
                option_text: option.option_text,
                is_correct: option.is_correct,
                question_id: option.question_id,
                option_image: "https://pdf-files-production.up.railway.app" + option.option_image
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const updateOption = async (req, res) => {
    try {
        const { option_text, is_correct } = req.body;

        const option = await Option.findById(req.params.id);

        if (req.file) {
            option_image = `/uploads/options/${path.basename(req.file.path)}`;
            // Delete old file from /data/
            if (option && option.option_image) {
                const oldPath = path.join('/data', option.option_image);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
        } else {
            option_image = option.option_image
        }

        await Option.update(req.params.id, {
            option_text,
            is_correct,
            option_image
        });
        res.status(200).json({
            success: true,
            option_text,
            is_correct,
            option_image: "https://pdf-files-production.up.railway.app" + option_image
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const deleteOption = async (req, res) => {
    try {
        const option = await Option.findById(req.params.id);

        if (option && option.option_image) {
            const oldPath = path.join('/data/uploads', option.option_image);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        await Option.delete(req.params.option_id);
        res.status(200).json({
            success: true,
            message: "Option deleted successfully"
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const updateAnswer = async (req, res) => {
    try {
        const { question_id, correct_answer, max_length } = req.body;

        // Check if answer exists
        const existingAnswer = await Answer.findByQuestionId(question_id);

        if (existingAnswer) {
            await Answer.update(existingAnswer.id, correct_answer, max_length);
        } else {
            await Answer.create(question_id, correct_answer, max_length);
        }

        res.status(200).json({
            success: true,
            message: "Answer updated successfully"
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const validateAnswer = async (req, res) => {
    try {
        const { question_id, student_answer } = req.body;
        const result = await Answer.validateAnswer(question_id, student_answer);

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = {
    createQuestion,
    updateQuestion,
    deleteQuestion,
    createOption,
    updateOption,
    deleteOption,
    updateAnswer,
    validateAnswer
};
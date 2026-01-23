import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
    explanation: { type: String }
});

const QuizSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    title: { type: String, required: true },
    questions: [QuestionSchema],
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    attemptedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Quiz', QuizSchema);

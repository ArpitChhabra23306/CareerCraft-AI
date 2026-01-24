import mongoose from 'mongoose';

const QuizResultSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    percentage: { type: Number, required: true },
    quizTitle: { type: String, default: 'General Quiz' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('QuizResult', QuizResultSchema);

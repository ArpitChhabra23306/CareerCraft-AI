import Document from '../models/Document.js';
import FlashcardDeck from '../models/FlashcardDeck.js';
import Quiz from '../models/Quiz.js';
import InterviewSession from '../models/InterviewSession.js';

export const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const [docs, flashcards, quizzes, interviews] = await Promise.all([
            Document.countDocuments({ user: userId }),
            FlashcardDeck.countDocuments({ user: userId }),
            Quiz.countDocuments({ user: userId }),
            InterviewSession.countDocuments({ user: userId })
        ]);

        res.json({
            documents: docs,
            flashcards: flashcards,
            quizzes: quizzes,
            interviews: interviews
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

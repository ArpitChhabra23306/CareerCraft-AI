import QuizResult from '../models/QuizResult.js';

export const getQuizHistory = async (req, res) => {
    try {
        const history = await QuizResult.find({ user: req.user.id })
            .sort({ createdAt: -1 }) // Newest first
            .limit(10); // Limit to last 10 for dashboard graph to stay clean

        // If we want a graph of scores over time, we might want to return them in chronological order
        // so let's reverse the array before sending or let frontend handle it.
        // Frontend handling is fine, but for charts usually you want old -> new.
        // Let's keep it simplest: newest first is good for lists, for charts we reverse.

        res.json(history);
    } catch (err) {
        console.error("Get Quiz History Error:", err);
        res.status(500).json({ error: err.message });
    }
};

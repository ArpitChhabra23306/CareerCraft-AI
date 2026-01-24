import User from '../models/User.js';

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Import necessary models for stats
import Document from '../models/Document.js';
import QuizResult from '../models/QuizResult.js';

export const getUserStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Count Documents
        const documentCount = await Document.countDocuments({ user: userId });

        // Count Quizzes Taken
        const quizCount = await QuizResult.countDocuments({ user: userId });

        // Count Flashcards (Need to check model name, assuming 'Flashcard' or 'Deck')
        // For now return 0 if model not confirmed, or check logic.
        // Let's return basics.

        res.json({
            documents: documentCount,
            flashcards: 0, // Placeholder until model confirmed
            quizzes: quizCount,
            interviews: 0 // Placeholder
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const updateProfile = async (req, res) => {
    const { bio, avatar, theme } = req.body;

    try {
        let user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (bio !== undefined) user.bio = bio;
        if (avatar !== undefined) user.avatar = avatar;
        if (theme !== undefined) user.theme = theme;

        await user.save();

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

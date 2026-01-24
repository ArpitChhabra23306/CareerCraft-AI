import express from 'express';
import { verifyToken as auth } from '../middleware/authMiddleware.js';
import { getQuizHistory } from '../controllers/quizController.js';

const router = express.Router();

// @route   GET api/quiz/history
// @desc    Get detailed quiz history
// @access  Private
router.get('/history', auth, getQuizHistory);

export default router;

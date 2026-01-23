import express from 'express';
import { chatWithDocument, generateDocumentSummary, createFlashcards, createQuiz, getDecks, getQuizzes } from '../controllers/aiController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/chat', verifyToken, chatWithDocument);
router.post('/summary', verifyToken, generateDocumentSummary);
router.get('/flashcards', verifyToken, getDecks);
router.post('/flashcards', verifyToken, createFlashcards);
router.get('/quiz', verifyToken, getQuizzes);
router.post('/quiz', verifyToken, createQuiz);

export default router;

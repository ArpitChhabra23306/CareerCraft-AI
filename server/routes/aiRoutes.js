import express from 'express';
import { chatWithDocument, generateDocumentSummary, createFlashcards, createQuiz, getDecks, getQuizzes, updateQuizScore, generateText } from '../controllers/aiController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { checkChatLimit, checkQuizLimit, checkFlashcardLimit } from '../middleware/usageMiddleware.js';

const router = express.Router();

router.post('/chat', verifyToken, checkChatLimit, chatWithDocument);
router.post('/summary', verifyToken, checkChatLimit, generateDocumentSummary);
router.post('/generate', verifyToken, checkChatLimit, generateText);
router.get('/flashcards', verifyToken, getDecks);
router.post('/flashcards', verifyToken, checkFlashcardLimit, createFlashcards);
router.get('/quiz', verifyToken, getQuizzes);
router.post('/quiz', verifyToken, checkQuizLimit, createQuiz);
router.put('/quiz/:id/score', verifyToken, updateQuizScore);

export default router;

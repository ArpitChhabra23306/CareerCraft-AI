import express from 'express';
import { startInterview, sendInterviewMessage, getSession, getUserSessions } from '../controllers/interviewController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/start', verifyToken, startInterview);
router.post('/message', verifyToken, sendInterviewMessage);
router.get('/:id', verifyToken, getSession);
router.get('/', verifyToken, getUserSessions); // Get all sessions for user

export default router;

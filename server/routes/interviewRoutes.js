import express from 'express';
import { startInterview, sendInterviewMessage, getSession, getUserSessions } from '../controllers/interviewController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { checkInterviewLimit } from '../middleware/usageMiddleware.js';

const router = express.Router();

router.post('/start', verifyToken, checkInterviewLimit, startInterview);
router.post('/message', verifyToken, sendInterviewMessage);
router.get('/:id', verifyToken, getSession);
router.get('/', verifyToken, getUserSessions);

export default router;

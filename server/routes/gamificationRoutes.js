import express from 'express';
import { getLeaderboard, getGamificationStats, claimDailyLoginBonus } from '../controllers/gamificationController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get global leaderboard (Top 100)
router.get('/leaderboard', getLeaderboard);

// Get current user's gamification stats (requires auth)
router.get('/stats', verifyToken, getGamificationStats);

// Claim daily login XP bonus (requires auth)
router.post('/daily-login', verifyToken, claimDailyLoginBonus);

export default router;

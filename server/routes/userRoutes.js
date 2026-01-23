import express from 'express';
import { getDashboardStats } from '../controllers/userController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', verifyToken, getDashboardStats);

export default router;

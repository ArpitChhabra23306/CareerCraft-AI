import express from 'express';
import { verifyToken as auth } from '../middleware/authMiddleware.js';
import { getProfile, updateProfile, getUserStats } from '../controllers/userController.js';

const router = express.Router();

// @route   GET api/user
// @desc    Get current user profile
// @access  Private
router.get('/', auth, getProfile);

// @route   GET api/user/stats
// @desc    Get user learning statistics
// @access  Private
router.get('/stats', auth, getUserStats);

// @route   PUT api/user
// @desc    Update user profile
// @access  Private
router.put('/', auth, updateProfile);

export default router;

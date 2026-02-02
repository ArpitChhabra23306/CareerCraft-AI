import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
    getSubscriptionStatus,
    createOrder,
    verifyPayment,
    cancelSubscription,
    reactivateSubscription,
    handleWebhook,
    getPlans
} from '../controllers/subscriptionController.js';

const router = express.Router();

// Public routes
router.get('/plans', getPlans);

// Protected routes
router.get('/status', verifyToken, getSubscriptionStatus);
router.post('/create-order', verifyToken, createOrder);
router.post('/verify-payment', verifyToken, verifyPayment);
router.post('/cancel', verifyToken, cancelSubscription);
router.post('/reactivate', verifyToken, reactivateSubscription);

// Webhook (no auth - verified by signature)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

export default router;

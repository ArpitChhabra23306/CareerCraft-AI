import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';

// Lazy initialize Razorpay (after dotenv loads)
let razorpay = null;
const getRazorpay = () => {
    if (!razorpay) {
        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
    }
    return razorpay;
};

// Plan configurations
export const PLANS = {
    free: {
        name: 'Free',
        price: 0,
        limits: {
            documents: 3,
            aiChatQueries: 50,
            quizzesPerDay: 2,
            flashcardDecks: 5,
            interviewsPerMonth: 0
        }
    },
    pro: {
        name: 'Pro',
        price: 29900, // ₹299 in paise
        limits: {
            documents: -1, // unlimited
            aiChatQueries: 500,
            quizzesPerDay: -1,
            flashcardDecks: -1,
            interviewsPerMonth: 5
        }
    },
    enterprise: {
        name: 'Enterprise',
        price: 99900, // ₹999 in paise
        limits: {
            documents: -1,
            aiChatQueries: -1,
            quizzesPerDay: -1,
            flashcardDecks: -1,
            interviewsPerMonth: -1
        }
    }
};

/**
 * Get subscription status and usage
 */
export const getSubscriptionStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('subscription usage');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const plan = user.subscription?.plan || 'free';
        const planConfig = PLANS[plan];

        res.json({
            subscription: {
                plan,
                planName: planConfig.name,
                status: user.subscription?.status || 'active',
                currentPeriodEnd: user.subscription?.currentPeriodEnd,
                cancelAtPeriodEnd: user.subscription?.cancelAtPeriodEnd || false
            },
            usage: user.usage || {},
            limits: planConfig.limits,
            plans: PLANS
        });
    } catch (error) {
        console.error('[Subscription] Error getting status:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Create Razorpay order for subscription
 */
export const createOrder = async (req, res) => {
    try {
        const { plan } = req.body;
        const userId = req.user.id;

        if (!plan || !PLANS[plan]) {
            return res.status(400).json({ message: 'Invalid plan' });
        }

        if (plan === 'free') {
            return res.status(400).json({ message: 'Cannot purchase free plan' });
        }

        const planConfig = PLANS[plan];

        // Create Razorpay order (receipt max 40 chars)
        const shortId = userId.slice(-8);
        const order = await getRazorpay().orders.create({
            amount: planConfig.price,
            currency: 'INR',
            receipt: `rcpt_${shortId}_${Date.now().toString(36)}`,
            notes: {
                userId,
                plan
            }
        });

        // Store order ID temporarily
        await User.findByIdAndUpdate(userId, {
            'subscription.razorpayOrderId': order.id
        });

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            planName: planConfig.name
        });
    } catch (error) {
        console.error('[Subscription] Error creating order:', error);
        res.status(500).json({ message: 'Failed to create order' });
    }
};

/**
 * Verify payment and activate subscription
 */
export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;
        const userId = req.user.id;

        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: 'Invalid payment signature' });
        }

        // Calculate subscription period (1 month)
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        // Activate subscription
        await User.findByIdAndUpdate(userId, {
            'subscription.plan': plan,
            'subscription.status': 'active',
            'subscription.razorpayOrderId': razorpay_order_id,
            'subscription.currentPeriodStart': now,
            'subscription.currentPeriodEnd': periodEnd,
            'subscription.cancelAtPeriodEnd': false,
            // Reset usage for new subscription
            'usage.aiChatQueries': 0,
            'usage.quizzesToday': 0,
            'usage.interviewsThisMonth': 0,
            'usage.usageResetDate': now
        });

        console.log(`[Subscription] User ${userId} upgraded to ${plan} plan`);

        res.json({
            success: true,
            message: `Successfully upgraded to ${PLANS[plan].name} plan!`,
            plan,
            currentPeriodEnd: periodEnd
        });
    } catch (error) {
        console.error('[Subscription] Error verifying payment:', error);
        res.status(500).json({ message: 'Payment verification failed' });
    }
};

/**
 * Cancel subscription (at period end)
 */
export const cancelSubscription = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user || user.subscription?.plan === 'free') {
            return res.status(400).json({ message: 'No active subscription to cancel' });
        }

        await User.findByIdAndUpdate(userId, {
            'subscription.cancelAtPeriodEnd': true
        });

        res.json({
            success: true,
            message: 'Subscription will be cancelled at the end of the billing period',
            currentPeriodEnd: user.subscription.currentPeriodEnd
        });
    } catch (error) {
        console.error('[Subscription] Error cancelling:', error);
        res.status(500).json({ message: 'Failed to cancel subscription' });
    }
};

/**
 * Reactivate cancelled subscription
 */
export const reactivateSubscription = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user || !user.subscription?.cancelAtPeriodEnd) {
            return res.status(400).json({ message: 'No cancelled subscription to reactivate' });
        }

        await User.findByIdAndUpdate(userId, {
            'subscription.cancelAtPeriodEnd': false
        });

        res.json({
            success: true,
            message: 'Subscription reactivated successfully'
        });
    } catch (error) {
        console.error('[Subscription] Error reactivating:', error);
        res.status(500).json({ message: 'Failed to reactivate subscription' });
    }
};

/**
 * Webhook handler for Razorpay events
 */
export const handleWebhook = async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        // Verify webhook signature if secret is configured
        if (webhookSecret) {
            const signature = req.headers['x-razorpay-signature'];
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(JSON.stringify(req.body))
                .digest('hex');

            if (signature !== expectedSignature) {
                return res.status(400).json({ message: 'Invalid webhook signature' });
            }
        }

        const event = req.body.event;
        const payload = req.body.payload;

        console.log(`[Webhook] Received event: ${event}`);

        switch (event) {
            case 'payment.captured':
                // Payment successful - already handled in verifyPayment
                break;

            case 'payment.failed':
                // Handle failed payment
                const orderId = payload.payment.entity.order_id;
                await User.findOneAndUpdate(
                    { 'subscription.razorpayOrderId': orderId },
                    { 'subscription.status': 'past_due' }
                );
                break;

            default:
                console.log(`[Webhook] Unhandled event: ${event}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('[Webhook] Error:', error);
        res.status(500).json({ message: 'Webhook processing failed' });
    }
};

/**
 * Get all plans (public)
 */
export const getPlans = async (req, res) => {
    res.json({ plans: PLANS });
};

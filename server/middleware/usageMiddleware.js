import User from '../models/User.js';
import { PLANS } from '../controllers/subscriptionController.js';

/**
 * Get user's plan limits
 */
const getPlanLimits = (plan) => {
    return PLANS[plan]?.limits || PLANS.free.limits;
};

/**
 * Check if limit is exceeded (-1 means unlimited)
 */
const isLimitExceeded = (current, limit) => {
    if (limit === -1) return false; // Unlimited
    return current >= limit;
};

/**
 * Reset usage if it's a new month
 */
const resetMonthlyUsageIfNeeded = async (user) => {
    const now = new Date();
    const resetDate = new Date(user.usage?.usageResetDate || now);

    // Check if we're in a new month
    if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
        user.usage = {
            ...user.usage,
            aiChatQueries: 0,
            interviewsThisMonth: 0,
            usageResetDate: now
        };
        await user.save();
        return true;
    }
    return false;
};

/**
 * Reset daily quiz count if it's a new day
 */
const resetDailyQuizIfNeeded = async (user) => {
    const now = new Date();
    const lastQuizDate = user.usage?.lastQuizDate ? new Date(user.usage.lastQuizDate) : null;

    if (!lastQuizDate ||
        now.getDate() !== lastQuizDate.getDate() ||
        now.getMonth() !== lastQuizDate.getMonth() ||
        now.getFullYear() !== lastQuizDate.getFullYear()) {
        user.usage.quizzesToday = 0;
        user.usage.lastQuizDate = now;
        await user.save();
        return true;
    }
    return false;
};

/**
 * Middleware: Check document upload limit
 */
export const checkDocumentLimit = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await resetMonthlyUsageIfNeeded(user);

        const plan = user.subscription?.plan || 'free';
        const limits = getPlanLimits(plan);
        const currentDocs = user.usage?.documentsUploaded || 0;

        if (isLimitExceeded(currentDocs, limits.documents)) {
            return res.status(403).json({
                message: 'Document upload limit reached',
                upgradeRequired: true,
                currentPlan: plan,
                limit: limits.documents,
                usage: currentDocs
            });
        }

        // Attach user to request for later use
        req.userDoc = user;
        next();
    } catch (error) {
        console.error('[UsageMiddleware] Document limit check error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Middleware: Check AI chat query limit
 */
export const checkChatLimit = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await resetMonthlyUsageIfNeeded(user);

        const plan = user.subscription?.plan || 'free';
        const limits = getPlanLimits(plan);
        const currentQueries = user.usage?.aiChatQueries || 0;

        if (isLimitExceeded(currentQueries, limits.aiChatQueries)) {
            return res.status(403).json({
                message: 'Monthly AI chat limit reached',
                upgradeRequired: true,
                currentPlan: plan,
                limit: limits.aiChatQueries,
                usage: currentQueries
            });
        }

        req.userDoc = user;
        next();
    } catch (error) {
        console.error('[UsageMiddleware] Chat limit check error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Middleware: Check quiz generation limit
 */
export const checkQuizLimit = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await resetDailyQuizIfNeeded(user);

        const plan = user.subscription?.plan || 'free';
        const limits = getPlanLimits(plan);
        const quizzesToday = user.usage?.quizzesToday || 0;

        if (isLimitExceeded(quizzesToday, limits.quizzesPerDay)) {
            return res.status(403).json({
                message: 'Daily quiz limit reached',
                upgradeRequired: true,
                currentPlan: plan,
                limit: limits.quizzesPerDay,
                usage: quizzesToday
            });
        }

        req.userDoc = user;
        next();
    } catch (error) {
        console.error('[UsageMiddleware] Quiz limit check error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Middleware: Check flashcard deck limit
 */
export const checkFlashcardLimit = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const plan = user.subscription?.plan || 'free';
        const limits = getPlanLimits(plan);
        const currentDecks = user.usage?.flashcardDecks || 0;

        if (isLimitExceeded(currentDecks, limits.flashcardDecks)) {
            return res.status(403).json({
                message: 'Flashcard deck limit reached',
                upgradeRequired: true,
                currentPlan: plan,
                limit: limits.flashcardDecks,
                usage: currentDecks
            });
        }

        req.userDoc = user;
        next();
    } catch (error) {
        console.error('[UsageMiddleware] Flashcard limit check error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Middleware: Check mock interview limit
 */
export const checkInterviewLimit = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await resetMonthlyUsageIfNeeded(user);

        const plan = user.subscription?.plan || 'free';
        const limits = getPlanLimits(plan);
        const interviewsThisMonth = user.usage?.interviewsThisMonth || 0;

        // Free users can't access interviews at all
        if (limits.interviewsPerMonth === 0) {
            return res.status(403).json({
                message: 'Mock interviews require Pro or Enterprise plan',
                upgradeRequired: true,
                currentPlan: plan,
                limit: 0,
                usage: interviewsThisMonth
            });
        }

        if (isLimitExceeded(interviewsThisMonth, limits.interviewsPerMonth)) {
            return res.status(403).json({
                message: 'Monthly interview limit reached',
                upgradeRequired: true,
                currentPlan: plan,
                limit: limits.interviewsPerMonth,
                usage: interviewsThisMonth
            });
        }

        req.userDoc = user;
        next();
    } catch (error) {
        console.error('[UsageMiddleware] Interview limit check error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Increment usage after successful action
 */
export const incrementUsage = async (userId, field) => {
    const updateField = `usage.${field}`;
    await User.findByIdAndUpdate(userId, {
        $inc: { [updateField]: 1 }
    });
};

import User from '../models/User.js';

// XP Award Values
export const XP_VALUES = {
    DAILY_LOGIN: 10,
    UPLOAD_DOCUMENT: 25,
    COMPLETE_QUIZ: 50,
    REVIEW_FLASHCARDS: 30,
    FINISH_INTERVIEW: 75,
    DOCUMENT_CHAT: 5,
    DOCUMENT_CHAT_DAILY_CAP: 25
};

// Streak Bonus Milestones
const STREAK_BONUSES = {
    7: 50,
    30: 200,
    100: 500
};

/**
 * Check if two dates are the same day
 */
const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
};

/**
 * Check if date1 is exactly one day before date2
 */
const isYesterday = (date1, date2) => {
    if (!date1 || !date2) return false;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays === 1;
};

/**
 * Award XP to a user
 * @param {string} userId - The user's ID
 * @param {number} amount - Amount of XP to award
 * @param {string} reason - Reason for XP award (for logging)
 * @returns {Object} - { xpAwarded, totalXP, bonusXP }
 */
export const awardXP = async (userId, amount, reason = 'activity') => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        let bonusXP = 0;
        user.xp += amount;

        await user.save();
        console.log(`[Gamification] User ${userId} awarded ${amount} XP for ${reason}. Total: ${user.xp}`);

        return { xpAwarded: amount, totalXP: user.xp, bonusXP };
    } catch (error) {
        console.error('[Gamification] Error awarding XP:', error.message);
        throw error;
    }
};

/**
 * Update user's streak based on activity
 * @param {string} userId - The user's ID
 * @returns {Object} - { currentStreak, longestStreak, streakBonusAwarded }
 */
export const updateStreak = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        const now = new Date();
        let streakBonusAwarded = 0;

        // Reset daily chat XP if it's a new day
        if (!isSameDay(user.lastActivityDate, now)) {
            user.dailyChatXP = 0;
        }

        // If already logged activity today, no streak change
        if (isSameDay(user.lastActivityDate, now)) {
            return {
                currentStreak: user.currentStreak,
                longestStreak: user.longestStreak,
                streakBonusAwarded: 0
            };
        }

        // Check if activity was yesterday (streak continues)
        if (isYesterday(user.lastActivityDate, now)) {
            user.currentStreak += 1;
        } else if (!user.lastActivityDate) {
            // First activity ever
            user.currentStreak = 1;
        } else {
            // Streak broken - reset to 1
            user.currentStreak = 1;
        }

        // Update longest streak if current exceeds it
        if (user.currentStreak > user.longestStreak) {
            user.longestStreak = user.currentStreak;
        }

        // Check for streak bonuses
        if (STREAK_BONUSES[user.currentStreak]) {
            const bonus = STREAK_BONUSES[user.currentStreak];
            user.xp += bonus;
            streakBonusAwarded = bonus;
            console.log(`[Gamification] User ${userId} earned streak bonus: +${bonus} XP for ${user.currentStreak}-day streak!`);
        }

        user.lastActivityDate = now;
        await user.save();

        return {
            currentStreak: user.currentStreak,
            longestStreak: user.longestStreak,
            streakBonusAwarded
        };
    } catch (error) {
        console.error('[Gamification] Error updating streak:', error.message);
        throw error;
    }
};

/**
 * Award XP for document chat (with daily cap)
 * @param {string} userId - The user's ID
 * @returns {Object} - { xpAwarded, capped }
 */
export const awardDocumentChatXP = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        const now = new Date();

        // Reset daily chat XP if it's a new day
        if (!isSameDay(user.lastActivityDate, now) && !isSameDay(user.lastLoginDate, now)) {
            user.dailyChatXP = 0;
        }

        // Check if already at daily cap
        if (user.dailyChatXP >= XP_VALUES.DOCUMENT_CHAT_DAILY_CAP) {
            return { xpAwarded: 0, capped: true };
        }

        // Award XP
        const xpToAward = Math.min(
            XP_VALUES.DOCUMENT_CHAT,
            XP_VALUES.DOCUMENT_CHAT_DAILY_CAP - user.dailyChatXP
        );

        user.xp += xpToAward;
        user.dailyChatXP += xpToAward;
        await user.save();

        console.log(`[Gamification] User ${userId} awarded ${xpToAward} XP for document chat. Daily total: ${user.dailyChatXP}/${XP_VALUES.DOCUMENT_CHAT_DAILY_CAP}`);

        return { xpAwarded: xpToAward, capped: user.dailyChatXP >= XP_VALUES.DOCUMENT_CHAT_DAILY_CAP };
    } catch (error) {
        console.error('[Gamification] Error awarding document chat XP:', error.message);
        throw error;
    }
};

/**
 * Claim daily login bonus
 * @param {string} userId - The user's ID
 * @returns {Object} - { success, xpAwarded, alreadyClaimed }
 */
export const claimDailyLogin = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        const now = new Date();

        // Check if already claimed today
        if (user.lastLoginDate && isSameDay(user.lastLoginDate, now) && user.dailyLoginClaimed) {
            return { success: false, xpAwarded: 0, alreadyClaimed: true };
        }

        // Reset flag if it's a new day
        if (!isSameDay(user.lastLoginDate, now)) {
            user.dailyLoginClaimed = false;
            user.dailyChatXP = 0; // Also reset daily chat XP
        }

        // Claim daily login XP
        user.xp += XP_VALUES.DAILY_LOGIN;
        user.dailyLoginClaimed = true;
        user.lastLoginDate = now;
        await user.save();

        console.log(`[Gamification] User ${userId} claimed daily login: +${XP_VALUES.DAILY_LOGIN} XP`);

        return { success: true, xpAwarded: XP_VALUES.DAILY_LOGIN, alreadyClaimed: false };
    } catch (error) {
        console.error('[Gamification] Error claiming daily login:', error.message);
        throw error;
    }
};

/**
 * Get user's rank in the leaderboard
 * @param {string} userId - The user's ID
 * @returns {number} - The user's rank (1-indexed)
 */
export const getUserRank = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        // Count users with more XP
        const usersAhead = await User.countDocuments({ xp: { $gt: user.xp } });
        return usersAhead + 1;
    } catch (error) {
        console.error('[Gamification] Error getting user rank:', error.message);
        throw error;
    }
};


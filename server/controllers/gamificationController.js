import User from '../models/User.js';
import { claimDailyLogin, getUserRank, XP_VALUES } from '../services/gamificationService.js';

/**
 * Get global leaderboard (Top 100 users by XP)
 */
export const getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await User.find({})
            .select('username avatar xp currentStreak longestStreak')
            .sort({ xp: -1 })
            .limit(100);

        // Add rank to each user
        const rankedLeaderboard = leaderboard.map((user, index) => ({
            rank: index + 1,
            _id: user._id,
            username: user.username,
            avatar: user.avatar,
            xp: user.xp,
            currentStreak: user.currentStreak
        }));

        res.json(rankedLeaderboard);
    } catch (err) {
        console.error('Leaderboard Error:', err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * Get current user's gamification stats
 */
export const getGamificationStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId)
            .select('xp currentStreak longestStreak lastActivityDate dailyLoginClaimed');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get user's rank
        const rank = await getUserRank(userId);

        // Get total user count for context
        const totalUsers = await User.countDocuments({});

        res.json({
            xp: user.xp,
            currentStreak: user.currentStreak,
            longestStreak: user.longestStreak,
            lastActivityDate: user.lastActivityDate,
            dailyLoginClaimed: user.dailyLoginClaimed,
            rank,
            totalUsers,
            xpValues: XP_VALUES // Send XP values so frontend knows rewards
        });
    } catch (err) {
        console.error('Get Gamification Stats Error:', err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * Claim daily login XP bonus
 */
export const claimDailyLoginBonus = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await claimDailyLogin(userId);

        if (result.alreadyClaimed) {
            return res.status(200).json({
                success: false,
                message: 'Daily login already claimed today',
                xpAwarded: 0
            });
        }

        res.json({
            success: true,
            message: `You earned +${result.xpAwarded} XP for logging in today!`,
            xpAwarded: result.xpAwarded
        });
    } catch (err) {
        console.error('Claim Daily Login Error:', err);
        res.status(500).json({ error: err.message });
    }
};

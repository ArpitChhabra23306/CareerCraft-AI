import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Star, TrendingUp, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const GamificationCard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dailyLoginClaimed, setDailyLoginClaimed] = useState(false);
    const [claimingLogin, setClaimingLogin] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/gamification/stats');
            setStats(res.data);
            setDailyLoginClaimed(res.data.dailyLoginClaimed);
        } catch (err) {
            console.error('Failed to fetch gamification stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const claimDailyLogin = async () => {
        if (claimingLogin || dailyLoginClaimed) return;

        setClaimingLogin(true);
        try {
            const res = await api.post('/gamification/daily-login');
            if (res.data.success) {
                setDailyLoginClaimed(true);
                // Refresh stats to get updated XP
                fetchStats();
            }
        } catch (err) {
            console.error('Failed to claim daily login:', err);
        } finally {
            setClaimingLogin(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden"
        >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

            {/* Header */}
            <div className="flex items-center justify-between mb-4 relative z-10">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Award size={24} />
                    Your Progress
                </h2>
                <Link
                    to="/leaderboard"
                    className="text-white/80 hover:text-white text-sm flex items-center gap-1 transition-colors"
                >
                    <Trophy size={16} />
                    Leaderboard
                </Link>
            </div>

            {/* XP Display */}
            <div className="relative z-10 mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                    <Star size={24} className="text-yellow-300" />
                    <span className="text-4xl font-bold">{stats.xp?.toLocaleString() || 0}</span>
                    <span className="text-white/80 text-lg">XP</span>
                </div>
                <div className="flex items-center gap-2 text-white/70 text-sm">
                    <TrendingUp size={14} />
                    Rank #{stats.rank} of {stats.totalUsers?.toLocaleString()} users
                </div>
            </div>

            {/* Streak Display */}
            <div className="relative z-10 flex items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${stats.currentStreak > 0 ? 'bg-orange-500/30' : 'bg-white/10'}`}>
                        <Flame size={20} className={stats.currentStreak > 0 ? 'text-orange-300' : 'text-white/50'} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{stats.currentStreak || 0}</p>
                        <p className="text-xs text-white/70">Day Streak</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-yellow-500/30">
                        <Trophy size={20} className="text-yellow-300" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{stats.longestStreak || 0}</p>
                        <p className="text-xs text-white/70">Best Streak</p>
                    </div>
                </div>
            </div>

            {/* Daily Login Button */}
            {!dailyLoginClaimed && (
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={claimDailyLogin}
                    disabled={claimingLogin}
                    className="relative z-10 w-full bg-white text-indigo-600 font-semibold py-3 px-4 rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Star size={18} />
                    {claimingLogin ? 'Claiming...' : 'Claim Daily Login (+10 XP)'}
                </motion.button>
            )}

            {dailyLoginClaimed && (
                <div className="relative z-10 bg-white/20 text-center py-3 px-4 rounded-xl text-white/90">
                    ✓ Daily login claimed! Come back tomorrow.
                </div>
            )}

            {/* XP Guide */}
            <div className="relative z-10 mt-4 pt-4 border-t border-white/20">
                <p className="text-xs text-white/60 mb-2">Earn more XP:</p>
                <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-white/20 px-2 py-1 rounded-full">📄 Upload +25</span>
                    <span className="bg-white/20 px-2 py-1 rounded-full">📝 Quiz +50</span>
                    <span className="bg-white/20 px-2 py-1 rounded-full">🃏 Flashcards +30</span>
                    <span className="bg-white/20 px-2 py-1 rounded-full">🎤 Interview +75</span>
                </div>
            </div>
        </motion.div>
    );
};

export default GamificationCard;

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
            <div className="p-6 rounded-[20px] bg-[#111] dark:bg-[#eee]">
                <div className="animate-pulse space-y-4">
                    <div className="h-5 w-28 bg-white/10 dark:bg-[#111]/10 rounded"></div>
                    <div className="h-8 w-20 bg-white/10 dark:bg-[#111]/10 rounded"></div>
                    <div className="h-3 w-full bg-white/10 dark:bg-[#111]/10 rounded"></div>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-6 rounded-[20px] bg-[#111] dark:bg-[#eee] text-white dark:text-[#111] relative overflow-hidden"
        >
            {/* Subtle radial glow */}
            <div className="absolute inset-0 opacity-20" style={{
                background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.08), transparent 60%)',
            }} />

            {/* Header */}
            <div className="flex items-center justify-between mb-5 relative z-10">
                <h2 className="text-[15px] font-semibold flex items-center gap-2">
                    <Award size={18} strokeWidth={1.5} />
                    Your Progress
                </h2>
                <Link
                    to="/leaderboard"
                    className="text-white/50 dark:text-[#111]/50 hover:text-white/80 dark:hover:text-[#111]/80 text-[12px] flex items-center gap-1 transition-colors"
                >
                    <Trophy size={14} strokeWidth={1.5} />
                    Leaderboard
                </Link>
            </div>

            {/* XP Display */}
            <div className="relative z-10 mb-5">
                <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-bold tracking-tight">{stats.xp?.toLocaleString() || 0}</span>
                    <span className="text-white/40 dark:text-[#111]/40 text-[13px] font-medium">XP</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/40 dark:text-[#111]/40 text-[12px]">
                    <TrendingUp size={12} strokeWidth={1.5} />
                    Rank #{stats.rank} of {stats.totalUsers?.toLocaleString()} users
                </div>
            </div>

            {/* Streak Display */}
            <div className="relative z-10 flex items-center gap-6 mb-5">
                <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stats.currentStreak > 0 ? 'bg-white/15 dark:bg-[#111]/15' : 'bg-white/5 dark:bg-[#111]/5'}`}>
                        <Flame size={16} strokeWidth={1.5} className={stats.currentStreak > 0 ? 'text-white/80 dark:text-[#111]/80' : 'text-white/30 dark:text-[#111]/30'} />
                    </div>
                    <div>
                        <p className="text-xl font-bold leading-none">{stats.currentStreak || 0}</p>
                        <p className="text-[10px] text-white/40 dark:text-[#111]/40 mt-0.5 uppercase tracking-wider">Day Streak</p>
                    </div>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white/10 dark:bg-[#111]/10 flex items-center justify-center">
                        <Trophy size={16} strokeWidth={1.5} className="text-white/70 dark:text-[#111]/70" />
                    </div>
                    <div>
                        <p className="text-xl font-bold leading-none">{stats.longestStreak || 0}</p>
                        <p className="text-[10px] text-white/40 dark:text-[#111]/40 mt-0.5 uppercase tracking-wider">Best Streak</p>
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
                    className="relative z-10 w-full bg-white dark:bg-[#111] text-[#111] dark:text-[#eee] font-semibold py-2.5 px-4 rounded-xl text-[13px] transition-all duration-300 hover:bg-[#f0f0f0] dark:hover:bg-[#222] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Star size={14} strokeWidth={1.5} />
                    {claimingLogin ? 'Claiming...' : 'Claim Daily Login (+10 XP)'}
                </motion.button>
            )}

            {dailyLoginClaimed && (
                <div className="relative z-10 bg-white/10 dark:bg-[#111]/10 text-center py-2.5 px-4 rounded-xl text-white/70 dark:text-[#111]/70 text-[13px]">
                    ✓ Daily login claimed! Come back tomorrow.
                </div>
            )}

            {/* XP Guide */}
            <div className="relative z-10 mt-4 pt-4 border-t border-white/10 dark:border-[#111]/10">
                <p className="text-[10px] text-white/30 dark:text-[#111]/30 mb-2 uppercase tracking-wider">Earn more XP:</p>
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                    <span className="bg-white/10 dark:bg-[#111]/10 px-2 py-1 rounded-full text-white/50 dark:text-[#111]/50">📄 Upload +25</span>
                    <span className="bg-white/10 dark:bg-[#111]/10 px-2 py-1 rounded-full text-white/50 dark:text-[#111]/50">📝 Quiz +50</span>
                    <span className="bg-white/10 dark:bg-[#111]/10 px-2 py-1 rounded-full text-white/50 dark:text-[#111]/50">🃏 Cards +30</span>
                    <span className="bg-white/10 dark:bg-[#111]/10 px-2 py-1 rounded-full text-white/50 dark:text-[#111]/50">🎤 Interview +75</span>
                </div>
            </div>
        </motion.div>
    );
};

export default GamificationCard;

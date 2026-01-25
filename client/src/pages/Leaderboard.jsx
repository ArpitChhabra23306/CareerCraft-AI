import { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Flame, Star, Crown, User } from 'lucide-react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const Leaderboard = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [userStats, setUserStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [leaderboardRes, statsRes] = await Promise.all([
                api.get('/gamification/leaderboard'),
                api.get('/gamification/stats')
            ]);
            setLeaderboard(leaderboardRes.data);
            setUserStats(statsRes.data);
        } catch (err) {
            console.error('Failed to fetch leaderboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (rank) => {
        if (rank === 1) return <Crown size={24} className="text-yellow-400" />;
        if (rank === 2) return <Medal size={24} className="text-gray-400" />;
        if (rank === 3) return <Medal size={24} className="text-amber-600" />;
        return <span className="text-lg font-bold text-gray-500 w-6 text-center">{rank}</span>;
    };

    const getRankBgClass = (rank) => {
        if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800';
        if (rank === 2) return 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border-gray-200 dark:border-gray-700';
        if (rank === 3) return 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800';
        return 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800';
    };

    // Check if current user is in leaderboard
    const userInLeaderboard = leaderboard.some(u => u._id === user?._id);

    if (loading) {
        return (
            <div className="space-y-8 animate-fade-in">
                <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="space-y-3">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <motion.h1
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3"
                >
                    <Trophy className="text-yellow-500" />
                    Global Leaderboard
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-500 dark:text-gray-400 mt-1"
                >
                    Top 100 learners ranked by XP
                </motion.p>
            </div>

            {/* User's Current Rank Card */}
            {userStats && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 rounded-2xl shadow-lg text-white"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/70 text-sm">Your Rank</p>
                            <p className="text-4xl font-bold">#{userStats.rank}</p>
                            <p className="text-white/80 mt-1">of {userStats.totalUsers?.toLocaleString()} users</p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                                <Star className="text-yellow-300" size={20} />
                                <span className="text-2xl font-bold">{userStats.xp?.toLocaleString()} XP</span>
                            </div>
                            <div className="flex items-center gap-2 justify-end mt-2">
                                <Flame className={userStats.currentStreak > 0 ? 'text-orange-300' : 'text-white/50'} size={16} />
                                <span className="text-white/80">{userStats.currentStreak} day streak</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Leaderboard Table */}
            <div className="space-y-3">
                {leaderboard.map((entry, index) => {
                    const isCurrentUser = entry._id === user?._id;

                    return (
                        <motion.div
                            key={entry._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className={`p-4 rounded-xl border transition-all ${getRankBgClass(entry.rank)} ${isCurrentUser ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                {/* Rank */}
                                <div className="w-10 flex justify-center">
                                    {getRankIcon(entry.rank)}
                                </div>

                                {/* Avatar */}
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${entry.avatar
                                    ? ''
                                    : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                                    }`}>
                                    {entry.avatar ? (
                                        <img
                                            src={entry.avatar}
                                            alt={entry.username}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <User size={20} className="text-white" />
                                    )}
                                </div>

                                {/* Username */}
                                <div className="flex-1">
                                    <p className={`font-semibold ${isCurrentUser
                                        ? 'text-indigo-600 dark:text-indigo-400'
                                        : 'text-gray-800 dark:text-white'
                                        }`}>
                                        {entry.username}
                                        {isCurrentUser && (
                                            <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                                                You
                                            </span>
                                        )}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                        <Flame size={14} className={entry.currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'} />
                                        {entry.currentStreak} day streak
                                    </div>
                                </div>

                                {/* XP */}
                                <div className="text-right">
                                    <p className="text-xl font-bold text-gray-800 dark:text-white">
                                        {entry.xp?.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">XP</p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* User not in top 100 notice */}
            {!userInLeaderboard && userStats && userStats.rank > 100 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-6 text-gray-500 dark:text-gray-400"
                >
                    <p>Keep earning XP to climb into the top 100!</p>
                    <p className="text-sm mt-1">
                        You need approximately {Math.max(0, (leaderboard[99]?.xp || 0) - (userStats.xp || 0) + 1).toLocaleString()} more XP to reach rank 100.
                    </p>
                </motion.div>
            )}

            {/* Empty state */}
            {leaderboard.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Trophy size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No users on the leaderboard yet. Be the first!</p>
                </div>
            )}
        </div>
    );
};

export default Leaderboard;

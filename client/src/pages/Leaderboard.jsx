import { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Flame, Star, Crown, User, Sparkles, TrendingUp } from 'lucide-react';
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
        if (rank === 1) return <Crown size={20} className="text-yellow-400" />;
        if (rank === 2) return <Medal size={20} className="text-gray-300" />;
        if (rank === 3) return <Medal size={20} className="text-amber-600" />;
        return <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{rank}</span>;
    };

    // Check if current user is in leaderboard
    const userInLeaderboard = leaderboard.some(u => u._id === user?._id);

    // Get top 3 for podium (only if we have at least 3 users)
    const showPodium = leaderboard.length >= 3;
    const top3 = showPodium ? leaderboard.slice(0, 3) : [];
    const restOfLeaderboard = showPodium ? leaderboard.slice(3) : leaderboard;

    if (loading) {
        return (
            <div className="space-y-8 animate-fade-in">
                <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="grid grid-cols-3 gap-4 h-48">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                    ))}
                </div>
                <div className="space-y-3">
                    {[...Array(7)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3"
                    >
                        <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-xl">
                            <Trophy className="text-yellow-500" size={28} />
                        </div>
                        Global Leaderboard
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-500 dark:text-gray-400 mt-2"
                    >
                        Top learners competing for XP glory
                    </motion.p>
                </div>

                {/* User's Quick Stats */}
                {userStats && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-3 rounded-2xl shadow-lg"
                    >
                        <div className="text-center">
                            <p className="text-2xl font-bold">#{userStats.rank}</p>
                            <p className="text-xs text-white/70">Your Rank</p>
                        </div>
                        <div className="w-px h-10 bg-white/20"></div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">{userStats.xp?.toLocaleString()}</p>
                            <p className="text-xs text-white/70">Total XP</p>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Top 3 Podium - only show with 3+ users */}
            {showPodium && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-3 gap-4 items-end"
                >
                    {/* 2nd Place */}
                    <div className="flex flex-col items-center">
                        <div className="relative mb-3">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center shadow-lg border-4 border-gray-300 dark:border-gray-500">
                                {top3[1]?.avatar ? (
                                    <img src={top3[1].avatar} alt={top3[1].username} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <User size={32} className="text-gray-600 dark:text-gray-300" />
                                )}
                            </div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-400 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                                2
                            </div>
                        </div>
                        <div className="bg-gradient-to-t from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-800 w-full pt-4 pb-6 rounded-t-2xl text-center border border-gray-200 dark:border-gray-600">
                            <p className="font-bold text-gray-800 dark:text-white truncate px-2">{top3[1]?.username}</p>
                            <p className="text-gray-600 dark:text-gray-300 font-semibold">{top3[1]?.xp?.toLocaleString()} XP</p>
                            <div className="flex items-center justify-center gap-1 mt-1">
                                <Flame size={12} className={top3[1]?.currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'} />
                                <span className="text-xs text-gray-500">{top3[1]?.currentStreak}d</span>
                            </div>
                        </div>
                    </div>

                    {/* 1st Place */}
                    <div className="flex flex-col items-center">
                        <div className="relative mb-3">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                                <Crown size={32} className="text-yellow-400 drop-shadow-lg" />
                            </div>
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center shadow-xl border-4 border-yellow-400 ring-4 ring-yellow-200/50">
                                {top3[0]?.avatar ? (
                                    <img src={top3[0].avatar} alt={top3[0].username} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <User size={40} className="text-yellow-800" />
                                )}
                            </div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-yellow-900 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                                1
                            </div>
                        </div>
                        <div className="bg-gradient-to-t from-yellow-100 to-yellow-50 dark:from-yellow-900/40 dark:to-yellow-900/20 w-full pt-4 pb-8 rounded-t-2xl text-center border-2 border-yellow-300 dark:border-yellow-700 shadow-lg relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-200/30 to-transparent"></div>
                            <p className="font-bold text-gray-800 dark:text-white text-lg truncate px-2 relative z-10">{top3[0]?.username}</p>
                            <p className="text-yellow-700 dark:text-yellow-300 font-bold text-lg relative z-10">{top3[0]?.xp?.toLocaleString()} XP</p>
                            <div className="flex items-center justify-center gap-1 mt-1 relative z-10">
                                <Flame size={14} className={top3[0]?.currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'} />
                                <span className="text-sm text-gray-600 dark:text-gray-300">{top3[0]?.currentStreak} day streak</span>
                            </div>
                        </div>
                    </div>

                    {/* 3rd Place */}
                    <div className="flex flex-col items-center">
                        <div className="relative mb-3">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg border-4 border-amber-500">
                                {top3[2]?.avatar ? (
                                    <img src={top3[2].avatar} alt={top3[2].username} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <User size={32} className="text-amber-900" />
                                )}
                            </div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                                3
                            </div>
                        </div>
                        <div className="bg-gradient-to-t from-amber-100 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/20 w-full pt-4 pb-4 rounded-t-2xl text-center border border-amber-300 dark:border-amber-700">
                            <p className="font-bold text-gray-800 dark:text-white truncate px-2">{top3[2]?.username}</p>
                            <p className="text-amber-700 dark:text-amber-300 font-semibold">{top3[2]?.xp?.toLocaleString()} XP</p>
                            <div className="flex items-center justify-center gap-1 mt-1">
                                <Flame size={12} className={top3[2]?.currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'} />
                                <span className="text-xs text-gray-500">{top3[2]?.currentStreak}d</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Rest of Leaderboard (or all users if < 3 total) */}
            {restOfLeaderboard.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300">Rankings</h3>
                        <span className="text-sm text-gray-500">{leaderboard.length} users</span>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                        {restOfLeaderboard.map((entry, index) => {
                            const isCurrentUser = entry._id === user?._id;

                            return (
                                <motion.div
                                    key={entry._id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.02 }}
                                    className={`px-6 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isCurrentUser ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                                        }`}
                                >
                                    {/* Rank */}
                                    <div className="w-8 text-center font-bold text-gray-400 dark:text-gray-500">
                                        {entry.rank}
                                    </div>

                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                                        {entry.avatar ? (
                                            <img src={entry.avatar} alt={entry.username} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <User size={18} className="text-white" />
                                        )}
                                    </div>

                                    {/* Username */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-medium truncate ${isCurrentUser ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-800 dark:text-white'
                                            }`}>
                                            {entry.username}
                                            {isCurrentUser && (
                                                <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                                                    You
                                                </span>
                                            )}
                                        </p>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                            <Flame size={12} className={entry.currentStreak > 0 ? 'text-orange-500' : 'text-gray-300'} />
                                            <span>{entry.currentStreak}d</span>
                                        </div>
                                    </div>

                                    {/* XP */}
                                    <div className="text-right">
                                        <p className="font-bold text-gray-800 dark:text-white">
                                            {entry.xp?.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-400">XP</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* User not in top 100 notice */}
            {!userInLeaderboard && userStats && userStats.rank > 100 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 text-center border border-indigo-100 dark:border-indigo-800"
                >
                    <TrendingUp className="mx-auto text-indigo-500 mb-3" size={32} />
                    <p className="text-gray-700 dark:text-gray-300 font-medium">Keep earning XP to climb into the top 100!</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        You need approximately <span className="font-semibold text-indigo-600 dark:text-indigo-400">{Math.max(0, (leaderboard[99]?.xp || 0) - (userStats.xp || 0) + 1).toLocaleString()}</span> more XP to reach rank 100.
                    </p>
                </motion.div>
            )}

            {/* Empty state */}
            {leaderboard.length === 0 && (
                <div className="text-center py-16">
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trophy size={40} className="text-yellow-500" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">No users on the leaderboard yet</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Be the first to earn XP and claim the top spot!</p>
                </div>
            )}
        </div>
    );
};

export default Leaderboard;


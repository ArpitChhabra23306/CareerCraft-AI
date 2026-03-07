import { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, Crown, User, TrendingUp } from 'lucide-react';
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

    const userInLeaderboard = leaderboard.some(u => u._id === user?._id);
    const showPodium = leaderboard.length >= 3;
    const top3 = showPodium ? leaderboard.slice(0, 3) : [];
    const restOfLeaderboard = showPodium ? leaderboard.slice(3) : leaderboard;

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="h-7 w-48 bg-[#E3DAC6] dark:bg-[#2A2F3A] rounded-xl animate-pulse"></div>
                <div className="grid grid-cols-3 gap-4 h-48">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-[#F2EEE4] dark:bg-[#0F1115] rounded-[20px] animate-pulse border border-[#E3DAC6] dark:border-[#2A2F3A]"></div>
                    ))}
                </div>
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-14 bg-[#F2EEE4] dark:bg-[#0F1115] rounded-xl animate-pulse border border-[#E3DAC6] dark:border-[#2A2F3A]"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl font-bold text-[#0F1115] dark:text-[#F5F2EA] tracking-[-0.03em]"
                    >
                        Global Leaderboard
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-[#8D8474] text-[13px] mt-1"
                    >
                        Top learners competing for XP glory
                    </motion.p>
                </div>

                {userStats && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-5 bg-[#0F1115] dark:bg-[#F5F2EA] text-white dark:text-[#0F1115] px-6 py-3 rounded-[14px]"
                    >
                        <div className="text-center">
                            <p className="text-lg font-bold">#{userStats.rank}</p>
                            <p className="text-[10px] text-white/50 dark:text-[#0F1115]/50 uppercase tracking-wider font-medium">Rank</p>
                        </div>
                        <div className="w-px h-8 bg-[#F5F2EA]/10 dark:bg-[#0F1115]/10"></div>
                        <div className="text-center">
                            <p className="text-lg font-bold">{userStats.xp?.toLocaleString()}</p>
                            <p className="text-[10px] text-white/50 dark:text-[#0F1115]/50 uppercase tracking-wider font-medium">XP</p>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Top 3 Podium */}
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
                            <div className="w-18 h-18 rounded-full bg-[#E3DAC6] dark:bg-[#2A2F3A] flex items-center justify-center border-2 border-[#D6CCB5] dark:border-[#2A2F3A] w-[72px] h-[72px]">
                                {top3[1]?.avatar ? (
                                    <img src={top3[1].avatar} alt={top3[1].username} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <User size={28} className="text-[#8D8474]" strokeWidth={1.5} />
                                )}
                            </div>
                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-[#8D8474] text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px]">
                                2
                            </div>
                        </div>
                        <div className="bg-[#F2EEE4] dark:bg-[#0F1115] w-full pt-4 pb-5 rounded-t-[16px] text-center border border-[#E3DAC6] dark:border-[#2A2F3A]">
                            <p className="font-semibold text-[#0F1115] dark:text-[#F5F2EA] truncate px-2 text-[13px]">{top3[1]?.username}</p>
                            <p className="text-[#7C7365] text-[12px] font-medium">{top3[1]?.xp?.toLocaleString()} XP</p>
                            <div className="flex items-center justify-center gap-1 mt-1">
                                <Flame size={10} className={top3[1]?.currentStreak > 0 ? 'text-[#7C7365]' : 'text-[#B8B1A3] dark:text-[#444]'} strokeWidth={1.5} />
                                <span className="text-[10px] text-[#A79F90] dark:text-[#A79F90]">{top3[1]?.currentStreak}d</span>
                            </div>
                        </div>
                    </div>

                    {/* 1st Place */}
                    <div className="flex flex-col items-center">
                        <div className="relative mb-3">
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                                <Crown size={24} className="text-[#7C7365]" strokeWidth={1.5} />
                            </div>
                            <div className="w-[88px] h-[88px] rounded-full bg-[#0F1115] dark:bg-[#F5F2EA] flex items-center justify-center border-2 border-[#0F1115] dark:border-[#F5F2EA]">
                                {top3[0]?.avatar ? (
                                    <img src={top3[0].avatar} alt={top3[0].username} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <User size={34} className="text-white dark:text-[#0F1115]" strokeWidth={1.5} />
                                )}
                            </div>
                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-[#0F1115] dark:bg-[#F5F2EA] text-white dark:text-[#0F1115] w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px]">
                                1
                            </div>
                        </div>
                        <div className="bg-[#0F1115] dark:bg-[#F5F2EA] w-full pt-4 pb-7 rounded-t-[16px] text-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10" style={{
                                background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.2), transparent 60%)',
                            }} />
                            <p className="font-bold text-white dark:text-[#0F1115] text-[15px] truncate px-2 relative z-10">{top3[0]?.username}</p>
                            <p className="text-white/60 dark:text-[#0F1115]/60 text-[13px] font-bold relative z-10">{top3[0]?.xp?.toLocaleString()} XP</p>
                            <div className="flex items-center justify-center gap-1 mt-1 relative z-10">
                                <Flame size={11} className="text-white/40 dark:text-[#0F1115]/40" strokeWidth={1.5} />
                                <span className="text-[10px] text-white/40 dark:text-[#0F1115]/40">{top3[0]?.currentStreak} day streak</span>
                            </div>
                        </div>
                    </div>

                    {/* 3rd Place */}
                    <div className="flex flex-col items-center">
                        <div className="relative mb-3">
                            <div className="w-[72px] h-[72px] rounded-full bg-[#E3DAC6] dark:bg-[#2A2F3A] flex items-center justify-center border-2 border-[#D6CCB5] dark:border-[#2A2F3A]">
                                {top3[2]?.avatar ? (
                                    <img src={top3[2].avatar} alt={top3[2].username} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <User size={28} className="text-[#8D8474]" strokeWidth={1.5} />
                                )}
                            </div>
                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-[#A79F90] dark:bg-[#A79F90] text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px]">
                                3
                            </div>
                        </div>
                        <div className="bg-[#F2EEE4] dark:bg-[#0F1115] w-full pt-4 pb-4 rounded-t-[16px] text-center border border-[#E3DAC6] dark:border-[#2A2F3A]">
                            <p className="font-semibold text-[#0F1115] dark:text-[#F5F2EA] truncate px-2 text-[13px]">{top3[2]?.username}</p>
                            <p className="text-[#7C7365] text-[12px] font-medium">{top3[2]?.xp?.toLocaleString()} XP</p>
                            <div className="flex items-center justify-center gap-1 mt-1">
                                <Flame size={10} className={top3[2]?.currentStreak > 0 ? 'text-[#7C7365]' : 'text-[#B8B1A3] dark:text-[#444]'} strokeWidth={1.5} />
                                <span className="text-[10px] text-[#A79F90] dark:text-[#A79F90]">{top3[2]?.currentStreak}d</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Rest of Leaderboard */}
            {restOfLeaderboard.length > 0 && (
                <div className="rounded-[20px] bg-[#F2EEE4] dark:bg-[#0F1115] border border-[#E3DAC6] dark:border-[#2A2F3A] overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#E3DAC6] dark:border-[#2A2F3A] flex items-center justify-between">
                        <h3 className="font-semibold text-[14px] text-[#0F1115] dark:text-[#F5F2EA]">Rankings</h3>
                        <span className="text-[12px] text-[#8D8474]">{leaderboard.length} users</span>
                    </div>
                    <div className="divide-y divide-[#E3DAC6] dark:divide-[#2A2F3A]">
                        {restOfLeaderboard.map((entry, index) => {
                            const isCurrentUser = entry._id === user?._id;

                            return (
                                <motion.div
                                    key={entry._id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.02 }}
                                    className={`px-6 py-3.5 flex items-center gap-4 hover:bg-[#F5F2EA] dark:hover:bg-[#1F2430] transition-colors duration-300 ${isCurrentUser ? 'bg-[#EEE7D8] dark:bg-[#1F2430]' : ''}`}
                                >
                                    <div className="w-7 text-center font-bold text-[#A79F90] dark:text-[#8D8474] text-[12px]">
                                        {entry.rank}
                                    </div>

                                    <div className="w-9 h-9 rounded-xl bg-[#E3DAC6] dark:bg-[#2A2F3A] border border-[#D6CCB5] dark:border-[#2A2F3A] flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {entry.avatar ? (
                                            <img src={entry.avatar} alt={entry.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={16} className="text-[#8D8474]" strokeWidth={1.5} />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className={`font-medium text-[13px] truncate ${isCurrentUser ? 'text-[#0F1115] dark:text-[#F5F2EA]' : 'text-[#0F1115] dark:text-[#F5F2EA]'}`}>
                                            {entry.username}
                                            {isCurrentUser && (
                                                <span className="ml-2 text-[10px] bg-[#0F1115] dark:bg-[#F5F2EA] text-white dark:text-[#0F1115] px-2 py-0.5 rounded-lg font-semibold">
                                                    You
                                                </span>
                                            )}
                                        </p>
                                        <div className="flex items-center gap-1.5 text-[11px] text-[#A79F90] dark:text-[#A79F90]">
                                            <Flame size={10} className={entry.currentStreak > 0 ? 'text-[#7C7365]' : 'text-[#B8B1A3] dark:text-[#444]'} strokeWidth={1.5} />
                                            <span>{entry.currentStreak}d</span>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="font-bold text-[#0F1115] dark:text-[#F5F2EA] text-[13px]">
                                            {entry.xp?.toLocaleString()}
                                        </p>
                                        <p className="text-[10px] text-[#A79F90] dark:text-[#A79F90] uppercase tracking-wider font-medium">XP</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* User not in top 100 */}
            {!userInLeaderboard && userStats && userStats.rank > 100 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-[20px] bg-[#F2EEE4] dark:bg-[#0F1115] border border-[#E3DAC6] dark:border-[#2A2F3A] p-6 text-center"
                >
                    <div className="w-12 h-12 mx-auto rounded-xl bg-[#E3DAC6] dark:bg-[#2A2F3A] flex items-center justify-center mb-3">
                        <TrendingUp className="text-[#7C7365]" size={20} strokeWidth={1.5} />
                    </div>
                    <p className="text-[#0F1115] dark:text-[#F5F2EA] text-[14px] font-medium">Keep earning XP to climb into the top 100!</p>
                    <p className="text-[12px] text-[#8D8474] mt-1">
                        You need approximately <span className="font-semibold text-[#0F1115] dark:text-[#F5F2EA]">{Math.max(0, (leaderboard[99]?.xp || 0) - (userStats.xp || 0) + 1).toLocaleString()}</span> more XP.
                    </p>
                </motion.div>
            )}

            {/* Empty state */}
            {leaderboard.length === 0 && (
                <div className="text-center py-20">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E3DAC6] dark:bg-[#2A2F3A] border border-[#D6CCB5] dark:border-[#2A2F3A] flex items-center justify-center mb-4">
                        <Trophy size={24} className="text-[#7C7365]" strokeWidth={1.5} />
                    </div>
                    <p className="text-[#0F1115] dark:text-[#F5F2EA] text-[14px] font-medium">No users on the leaderboard yet</p>
                    <p className="text-[#8D8474] text-[12px] mt-1">Be the first to earn XP and claim the top spot!</p>
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
